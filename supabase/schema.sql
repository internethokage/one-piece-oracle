-- One Piece Oracle — Supabase Schema
-- Run this in your Supabase SQL Editor after creating the project

-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Content Tables ────────────────────────────────────────────────────────────

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

-- ─── User Profiles + Auth ──────────────────────────────────────────────────────

-- Extended user profile — linked to Supabase Auth
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  -- Subscription tier
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  -- Stripe billing
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX idx_panels_chapter ON panels(chapter_id);
CREATE INDEX idx_panels_characters ON panels USING GIN(characters);
CREATE INDEX idx_panels_embedding ON panels USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_sbs_embedding ON sbs_entries USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Full-text search indexes
CREATE INDEX idx_panels_dialogue_fts ON panels USING GIN(to_tsvector('english', COALESCE(dialogue, '')));
CREATE INDEX idx_sbs_question_fts ON sbs_entries USING GIN(to_tsvector('english', question || ' ' || answer));

-- Billing lookups
CREATE INDEX idx_user_profiles_stripe_customer ON user_profiles(stripe_customer_id);
CREATE INDEX idx_user_profiles_stripe_subscription ON user_profiles(stripe_subscription_id);

-- ─── Row Level Security ────────────────────────────────────────────────────────

ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE sbs_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Public read access for content
CREATE POLICY "Public can read chapters"   ON chapters    FOR SELECT USING (true);
CREATE POLICY "Public can read panels"     ON panels      FOR SELECT USING (true);
CREATE POLICY "Public can read SBS"        ON sbs_entries FOR SELECT USING (true);

-- Users manage their own profile
CREATE POLICY "Users can read own profile"   ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
-- Service role can insert/update (webhook + OAuth callback)
CREATE POLICY "Service can insert profiles"  ON user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Service can update profiles"  ON user_profiles FOR UPDATE USING (true);

-- ─── Triggers ──────────────────────────────────────────────────────────────────

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

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, tier)
  VALUES (NEW.id, NEW.email, 'free')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ─── Search Functions ──────────────────────────────────────────────────────────

-- Semantic search for panels
CREATE OR REPLACE FUNCTION search_panels(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.65,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  chapter_id UUID,
  page_number INT,
  panel_number INT,
  image_url TEXT,
  dialogue TEXT,
  characters TEXT[],
  location TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.chapter_id,
    p.page_number,
    p.panel_number,
    p.image_url,
    p.dialogue,
    p.characters,
    p.location,
    1 - (p.embedding <=> query_embedding) AS similarity
  FROM panels p
  WHERE 1 - (p.embedding <=> query_embedding) > match_threshold
  ORDER BY p.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Semantic search for SBS entries
CREATE OR REPLACE FUNCTION search_sbs(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.65,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  volume INT,
  question TEXT,
  answer TEXT,
  oda_comments TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.volume,
    s.question,
    s.answer,
    s.oda_comments,
    1 - (s.embedding <=> query_embedding) AS similarity
  FROM sbs_entries s
  WHERE 1 - (s.embedding <=> query_embedding) > match_threshold
  ORDER BY s.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
