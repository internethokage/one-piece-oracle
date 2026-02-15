# One Piece Oracle - Setup Guide

Complete setup instructions for getting One Piece Oracle running locally and in production.

## Prerequisites

- **Node.js** 18+ and npm
- **Supabase account** (free tier works)
- **OpenAI API key** (for embeddings and LLM)
- **Git** for version control

## Step 1: Clone and Install

```bash
git clone https://github.com/internethokage/one-piece-oracle.git
cd one-piece-oracle
npm install
```

## Step 2: Set Up Supabase

### 2.1 Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Name: `one-piece-oracle`
4. Set a strong database password
5. Choose a region close to you
6. Wait for project to finish provisioning (~2 minutes)

### 2.2 Run Database Schema

1. In your Supabase project dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase/schema.sql`
4. Paste into the query editor
5. Click "Run" or press `Cmd/Ctrl + Enter`

This will create:
- ✅ `chapters`, `panels`, `sbs_entries` tables
- ✅ Vector search indexes (pgvector)
- ✅ Full-text search indexes
- ✅ RPC functions (`search_panels`, `search_sbs`)
- ✅ Row Level Security policies

### 2.3 Get API Keys

In your Supabase project:

1. Go to **Settings** → **API**
2. Copy your **Project URL** → This is `NEXT_PUBLIC_SUPABASE_URL`
3. Copy your **service_role key** (not anon!) → This is `SUPABASE_SERVICE_KEY`

⚠️ **Never commit the service_role key to Git!**

### 2.4 Set Up Storage (for panel images)

1. Go to **Storage** in Supabase dashboard
2. Click "Create a new bucket"
3. Name: `manga-panels`
4. Public bucket: **Yes** (so images are accessible)
5. Click "Create bucket"

## Step 3: Configure Environment Variables

Create `.env.local` in the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# Optional: Custom LLM model
LLM_MODEL=gpt-4-turbo-preview

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 4: Ingest Data (First-Time Setup)

### Option A: Run Full Data Pipeline

If you want to scrape and process manga panels yourself:

```bash
# Scrape Alabasta arc panels from One Piece Wiki
npm run scrape:panels -- --arc alabasta

# Extract text from panels using OCR
npm run process:ocr -- --input data/raw/panels/alabasta.json

# Generate embeddings
npm run process:embeddings -- --input data/processed/panels/

# Import to Supabase
npm run import:supabase -- --panels data/embeddings/panels/
```

**Note:** This will take 24-48 hours and cost ~$0.20 in OpenAI API fees (for embeddings).

See `DATA_PIPELINE.md` for detailed pipeline instructions.

### Option B: Use Sample Data (Faster)

For testing, you can manually insert a few sample records:

```sql
-- In Supabase SQL Editor

-- Insert sample chapter
INSERT INTO chapters (number, title, arc, volume)
VALUES (1, 'Romance Dawn', 'Romance Dawn', 1);

-- Get the chapter ID
SELECT id FROM chapters WHERE number = 1;

-- Insert sample panel (replace <chapter-id> with actual UUID)
INSERT INTO panels (
  chapter_id,
  page_number,
  panel_number,
  image_url,
  dialogue,
  characters
) VALUES (
  '<chapter-id>',
  1,
  1,
  'https://via.placeholder.com/400x300',
  'I''m gonna be King of the Pirates!',
  ARRAY['Monkey D. Luffy']
);
```

## Step 5: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 6: Test the APIs

### Test Search API

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Luffy", "method": "fulltext"}'
```

Expected response:
```json
{
  "success": true,
  "query": "Luffy",
  "method": "fulltext",
  "results": {
    "panels": [...],
    "sbs": [...]
  }
}
```

### Test LLM Q&A API (Pro Tier)

```bash
curl -X POST http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is Gear Second?", "user_tier": "pro"}'
```

Expected response:
```json
{
  "success": true,
  "question": "What is Gear Second?",
  "answer": "Gear Second is a technique where...",
  "citations": [...]
}
```

## Troubleshooting

### "Supabase not configured" error

- Verify `.env.local` exists and has correct values
- Restart dev server (`Ctrl+C`, then `npm run dev`)
- Check Supabase project URL is correct (should end in `.supabase.co`)

### "relation 'panels' does not exist"

- Make sure you ran `supabase/schema.sql` in SQL Editor
- Check for errors in the SQL output

### "function search_panels does not exist"

- The RPC functions are defined in `supabase/schema.sql`
- Re-run the schema file to create them

### OpenAI API errors

- Verify your `OPENAI_API_KEY` is correct
- Check you have credits in your OpenAI account
- For embeddings: ada-002 costs $0.0001/1K tokens (~$0.20 for 1,000 panels)

### Vector search returns no results

- Make sure panels have embeddings (check `panels.embedding IS NOT NULL`)
- Lower the `match_threshold` in API calls (try 0.5 instead of 0.7)
- Verify pgvector extension is enabled (`SELECT * FROM pg_extension WHERE extname = 'vector';`)

## Next Steps

1. **Scrape more data** - Expand beyond Alabasta arc
2. **Add authentication** - Wire up Supabase Auth for user login
3. **Implement Stripe** - Add Pro subscription billing
4. **Build agent system** - Multi-step LLM reports (timelines, theories)
5. **Deploy to Vercel** - Production deployment

See `MVP_SPEC.md` for the full roadmap.

## Production Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Settings → Environment Variables → Add each var from .env.local
```

### Set Up Stripe (Pro Subscriptions)

1. Create Stripe account at [stripe.com](https://stripe.com)
2. Get API keys from Stripe Dashboard
3. Create a $5/month product
4. Add keys to `.env.local`:
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   ```
5. Set up webhook endpoint: `https://your-domain.com/api/webhooks/stripe`

---

## Support

- **Issues:** [GitHub Issues](https://github.com/internethokage/one-piece-oracle/issues)
- **Email:** tre@example.com

---

Built with ❤️ and 🏴‍☠️ by [Tre](https://github.com/internethokage)
