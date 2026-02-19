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

// LLM model to use (configurable)
const LLM_MODEL = process.env.LLM_MODEL || 'gpt-4-turbo-preview';

interface Panel {
  id: string;
  chapter_number: number;
  chapter_title?: string;
  page_number: number;
  panel_number: number;
  dialogue: string | null;
  characters: string[];
  similarity?: number;
}

interface SBSEntry {
  id: string;
  volume: number;
  question: string;
  answer: string;
  similarity?: number;
}

export async function POST(request: NextRequest) {
  // Rate limiting — stricter for expensive LLM calls
  const ip = getClientIP(request);
  const rl = checkRateLimit(`ask:${ip}`, RATE_LIMITS.ask);
  const rlHeaders = {
    'X-RateLimit-Limit': String(RATE_LIMITS.ask.max),
    'X-RateLimit-Remaining': String(rl.remaining),
    'X-RateLimit-Reset': String(rl.resetAt),
  };

  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many AI requests. The Oracle needs a moment to think.', retryAfter: Math.ceil((rl.resetAt - Date.now()) / 1000) },
      { status: 429, headers: { ...rlHeaders, 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  try {
    const { question, user_tier = 'free' } = await request.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // Pro tier check
    if (user_tier === 'free') {
      return NextResponse.json(
        { 
          error: 'Pro subscription required',
          message: 'LLM-powered answers are only available for Pro users. Upgrade to access AI answers with manga citations!',
          upgrade_url: '/pricing'
        },
        { status: 403 }
      );
    }

    // Validate environment
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      throw new Error('Supabase not configured');
    }

    // Step 1: Retrieve relevant panels and SBS entries
    const context = await retrieveContext(question);

    // Step 2: Generate answer using LLM
    const answer = await generateAnswer(question, context);

    return NextResponse.json({
      success: true,
      question,
      answer: answer.text,
      citations: answer.citations,
      model: LLM_MODEL,
      timestamp: new Date().toISOString(),
    }, { headers: rlHeaders });
  } catch (error) {
    console.error('Ask endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to generate answer', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Retrieve relevant context from manga panels and SBS entries
 */
async function retrieveContext(question: string) {
  const openaiClient = getOpenAI();
  const supabaseClient = getSupabase();

  if (!openaiClient || !supabaseClient) {
    throw new Error('OpenAI or Supabase not configured');
  }

  // Generate embedding for the question
  const embeddingResponse = await openaiClient.embeddings.create({
    model: 'text-embedding-ada-002',
    input: question,
  });

  const queryEmbedding = embeddingResponse.data[0].embedding;

  // Search panels
  const { data: panels, error: panelsError } = await supabaseClient.rpc('search_panels', {
    query_embedding: queryEmbedding,
    match_threshold: 0.65,
    match_count: 10,
  });

  if (panelsError) {
    console.error('Panel retrieval error:', panelsError);
    throw panelsError;
  }

  // Search SBS entries
  const { data: sbs, error: sbsError } = await supabaseClient.rpc('search_sbs', {
    query_embedding: queryEmbedding,
    match_threshold: 0.65,
    match_count: 5,
  });

  if (sbsError) {
    console.error('SBS retrieval error:', sbsError);
    throw sbsError;
  }

  return {
    panels: (panels || []) as Panel[],
    sbs: (sbs || []) as SBSEntry[],
  };
}

/**
 * Generate answer using LLM with retrieved context
 */
async function generateAnswer(question: string, context: { panels: Panel[]; sbs: SBSEntry[] }) {
  // Build context string from retrieved data
  const panelContext = context.panels
    .map((p, i) => 
      `[Panel ${i + 1}] Chapter ${p.chapter_number}${p.chapter_title ? ` "${p.chapter_title}"` : ''}, Page ${p.page_number}, Panel ${p.panel_number}\n` +
      `Characters: ${p.characters?.join(', ') || 'Unknown'}\n` +
      `Dialogue: "${p.dialogue || 'No dialogue'}"\n` +
      `(Similarity: ${((p.similarity || 0) * 100).toFixed(1)}%)`
    )
    .join('\n\n');

  const sbsContext = context.sbs
    .map((s, i) => 
      `[SBS ${i + 1}] Volume ${s.volume}\n` +
      `Q: ${s.question}\n` +
      `A: ${s.answer}\n` +
      `(Similarity: ${((s.similarity || 0) * 100).toFixed(1)}%)`
    )
    .join('\n\n');

  // System prompt for One Piece expert
  const systemPrompt = `You are an expert on the One Piece manga series by Eiichiro Oda. You have access to specific manga panels and SBS (author Q&A) entries to answer questions accurately.

IMPORTANT RULES:
1. Base your answer ONLY on the provided manga panels and SBS entries
2. Cite specific panels using the format: (Chapter X, Page Y)
3. If the context doesn't contain enough information, say so clearly
4. Don't make up information or speculate beyond what's shown
5. Be concise but thorough
6. Use markdown formatting for citations

When citing, use this format:
> "Quote from panel" — **Chapter X, Page Y**

If you reference an SBS entry, cite it as:
> (Source: SBS Volume X)`;

  const userPrompt = `Question: ${question}

=== RETRIEVED MANGA PANELS ===
${panelContext || 'No relevant panels found.'}

=== SBS ENTRIES ===
${sbsContext || 'No relevant SBS entries found.'}

Please answer the question based on the above context. Include specific citations.`;

  // Call LLM
  const openaiClient = getOpenAI();
  if (!openaiClient) {
    throw new Error('OpenAI not configured');
  }

  const completion = await openaiClient.chat.completions.create({
    model: LLM_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3, // Lower temperature for more factual responses
    max_tokens: 1000,
  });

  const answerText = completion.choices[0].message.content || 'Unable to generate answer.';

  // Extract citations from panels and SBS
  const citations = [
    ...context.panels.map(p => ({
      type: 'panel' as const,
      chapter: p.chapter_number,
      page: p.page_number,
      panel: p.panel_number,
      title: p.chapter_title,
    })),
    ...context.sbs.map(s => ({
      type: 'sbs' as const,
      volume: s.volume,
      question: s.question,
    })),
  ];

  return {
    text: answerText,
    citations,
  };
}
