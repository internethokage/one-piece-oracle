-- One Piece Oracle — Supabase Schema
-- Run this in your Supabase SQL Editor after creating the project

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Chapters table
CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number INT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  arc TEXT,
  volume INT,
  release_date DATE,
  page_count INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Panels table (core data structure)
CREATE TABLE panels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  page_number INT NOT NULL,
  panel_number INT NOT NULL,
  image_url TEXT NOT NULL,
  ocr_text TEXT,
  dialogue TEXT,
  characters TEXT[],
  location TEXT,
  embedding VECTOR(1536),  -- OpenAI ada-002 embeddings for semantic search
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chapter_id, page_number, panel_number)
);

-- SBS (Author Q&A) entries
CREATE TABLE sbs_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volume INT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  oda_comments TEXT,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (extended Supabase auth)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_panels_chapter ON panels(chapter_id);
CREATE INDEX idx_panels_characters ON panels USING GIN(characters);
CREATE INDEX idx_panels_embedding ON panels USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_sbs_embedding ON sbs_entries USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Full-text search indexes
CREATE INDEX idx_panels_dialogue_fts ON panels USING GIN(to_tsvector('english', COALESCE(dialogue, '')));
CREATE INDEX idx_sbs_question_fts ON sbs_entries USING GIN(to_tsvector('english', question || ' ' || answer));

-- Row Level Security (RLS)
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE sbs_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Public read access for chapters, panels, SBS
CREATE POLICY "Public can read chapters" ON chapters FOR SELECT USING (true);
CREATE POLICY "Public can read panels" ON panels FOR SELECT USING (true);
CREATE POLICY "Public can read SBS" ON sbs_entries FOR SELECT USING (true);

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Vector search function for panels
CREATE OR REPLACE FUNCTION search_panels(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  chapter_number INT,
  chapter_title TEXT,
  page_number INT,
  panel_number INT,
  image_url TEXT,
  dialogue TEXT,
  characters TEXT[],
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    c.number AS chapter_number,
    c.title AS chapter_title,
    p.page_number,
    p.panel_number,
    p.image_url,
    p.dialogue,
    p.characters,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM panels p
  JOIN chapters c ON p.chapter_id = c.id
  WHERE p.embedding IS NOT NULL
    AND 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Vector search function for SBS entries
CREATE OR REPLACE FUNCTION search_sbs(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  volume INT,
  question TEXT,
  answer TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.volume,
    s.question,
    s.answer,
    1 - (s.embedding <=> query_embedding) AS similarity
  FROM sbs_entries s
  WHERE s.embedding IS NOT NULL
    AND 1 - (s.embedding <=> query_embedding) > match_threshold
  ORDER BY s.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
