import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rate-limit';

// Lazy initialization to avoid build-time errors
let supabase: SupabaseClient | null = null;
let openai: OpenAI | null = null;

function getSupabase() {
  if (!supabase && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
  }
  return supabase;
}

function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

interface SearchResult {
  panels: Array<{
    id: string;
    chapter_number: number;
    chapter_title?: string;
    page_number: number;
    panel_number: number;
    image_url: string;
    dialogue: string | null;
    characters: string[];
    similarity?: number;
  }>;
  sbs: Array<{
    id: string;
    volume: number;
    question: string;
    answer: string;
    similarity?: number;
  }>;
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = getClientIP(request);
  const rl = checkRateLimit(`search:${ip}`, RATE_LIMITS.search);
  const rlHeaders = {
    'X-RateLimit-Limit': String(RATE_LIMITS.search.max),
    'X-RateLimit-Remaining': String(rl.remaining),
    'X-RateLimit-Reset': String(rl.resetAt),
  };

  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests. Slow down, nakama.', retryAfter: Math.ceil((rl.resetAt - Date.now()) / 1000) },
      { status: 429, headers: { ...rlHeaders, 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const { query, method = 'semantic', limit = 20 } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      console.warn('Supabase not configured, returning mock data');
      return getMockResults(query);
    }

    let results: SearchResult;

    if (method === 'semantic') {
      // Semantic search using embeddings
      results = await semanticSearch(query, limit);
    } else {
      // Full-text search (faster, no API cost)
      results = await fullTextSearch(query, limit);
    }

    return NextResponse.json({
      success: true,
      query,
      method,
      results,
      timestamp: new Date().toISOString(),
    }, { headers: rlHeaders });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Semantic search using OpenAI embeddings + pgvector cosine similarity
 */
async function semanticSearch(query: string, limit: number): Promise<SearchResult> {
  const openaiClient = getOpenAI();
  const supabaseClient = getSupabase();

  if (!openaiClient || !supabaseClient) {
    throw new Error('OpenAI or Supabase not configured');
  }

  // Generate embedding for the query
  const embeddingResponse = await openaiClient.embeddings.create({
    model: 'text-embedding-ada-002',
    input: query,
  });

  const queryEmbedding = embeddingResponse.data[0].embedding;

  // Search panels using vector similarity
  const { data: panels, error: panelsError } = await supabaseClient.rpc('search_panels', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7, // Only return results with >70% similarity
    match_count: limit,
  });

  if (panelsError) {
    console.error('Panel search error:', panelsError);
    throw panelsError;
  }

  // Search SBS entries
  const { data: sbs, error: sbsError } = await supabaseClient.rpc('search_sbs', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: Math.floor(limit / 4), // Fewer SBS results
  });

  if (sbsError) {
    console.error('SBS search error:', sbsError);
    throw sbsError;
  }

  return {
    panels: panels || [],
    sbs: sbs || [],
  };
}

/**
 * Full-text search (no embeddings required)
 */
async function fullTextSearch(query: string, limit: number): Promise<SearchResult> {
  const supabaseClient = getSupabase();

  if (!supabaseClient) {
    throw new Error('Supabase not configured');
  }

  // Search panels by dialogue
  const { data: panelsData, error: panelsError } = await supabaseClient
    .from('panels')
    .select(`
      id,
      page_number,
      panel_number,
      image_url,
      dialogue,
      characters,
      chapters!inner (
        number,
        title
      )
    `)
    .or(`dialogue.ilike.%${query}%,ocr_text.ilike.%${query}%`)
    .limit(limit);

  if (panelsError) {
    console.error('Panel search error:', panelsError);
    throw panelsError;
  }

  // Format panels
  const panels = panelsData?.map((panel: any) => ({
    id: panel.id,
    chapter_number: panel.chapters.number,
    chapter_title: panel.chapters.title,
    page_number: panel.page_number,
    panel_number: panel.panel_number,
    image_url: panel.image_url,
    dialogue: panel.dialogue,
    characters: panel.characters || [],
  })) || [];

  // Search SBS entries
  const { data: sbsData, error: sbsError } = await supabaseClient
    .from('sbs_entries')
    .select('id, volume, question, answer')
    .or(`question.ilike.%${query}%,answer.ilike.%${query}%`)
    .limit(Math.floor(limit / 4));

  if (sbsError) {
    console.error('SBS search error:', sbsError);
    throw sbsError;
  }

  return {
    panels,
    sbs: sbsData || [],
  };
}

/**
 * Mock results for development/testing
 */
function getMockResults(query: string) {
  const mockResults: SearchResult = {
    panels: [
      {
        id: '1',
        chapter_number: 388,
        chapter_title: 'Gear Second',
        page_number: 12,
        panel_number: 3,
        image_url: '/placeholder-panel.png',
        dialogue: 'Gear Second!',
        characters: ['Monkey D. Luffy'],
      },
      {
        id: '2',
        chapter_number: 389,
        chapter_title: 'My Crewmates Are My Power',
        page_number: 5,
        panel_number: 2,
        image_url: '/placeholder-panel.png',
        dialogue: 'This is the power I gained to protect my crew!',
        characters: ['Monkey D. Luffy'],
      },
    ],
    sbs: [
      {
        id: '1',
        volume: 40,
        question: 'How does Gear Second work?',
        answer: 'Luffy pumps his blood at high speed, giving him enhanced speed and power!',
      },
    ],
  };

  return NextResponse.json({
    success: true,
    query,
    method: 'mock',
    results: mockResults,
    timestamp: new Date().toISOString(),
    warning: 'Using mock data - Supabase not configured',
  });
}
