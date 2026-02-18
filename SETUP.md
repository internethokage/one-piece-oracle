# Setup Guide — One Piece Oracle

This guide walks you through setting up One Piece Oracle locally with Supabase Auth + Stripe.

---

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier is fine)
- A [Stripe](https://stripe.com) account (test mode)
- An [OpenAI](https://platform.openai.com) API key (for embeddings + LLM)

---

## 1. Clone & Install

```bash
git clone https://github.com/internethokage/one-piece-oracle.git
cd one-piece-oracle
npm install
```

---

## 2. Supabase Setup

### 2a. Create Project
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New project**
3. Name: `one-piece-oracle`
4. Region: closest to your users (US East recommended)
5. Generate a strong database password

### 2b. Run Schema
1. Go to **SQL Editor** in Supabase Dashboard
2. Paste the contents of `supabase/schema.sql`
3. Click **Run**

This creates:
- `chapters` — manga chapter metadata
- `panels` — panel data with vector embeddings
- `sbs_entries` — SBS Q&A with vector embeddings
- `user_profiles` — user accounts + Stripe billing
- `search_panels()` — vector search function
- `search_sbs()` — vector search function
- Row Level Security (RLS) policies
- Auth trigger (auto-creates profile on signup)

### 2c. Enable pgvector
pgvector is enabled automatically by the schema's `CREATE EXTENSION IF NOT EXISTS vector;`

### 2d. Enable Google OAuth (optional)
1. Go to **Authentication → Providers**
2. Enable **Google**
3. Add your Google OAuth credentials
4. Authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`

### 2e. Get API Keys
Go to **Project Settings → API**:
- `NEXT_PUBLIC_SUPABASE_URL` — Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon/public key
- `SUPABASE_SERVICE_KEY` — service_role key (⚠️ secret, server-only)

---

## 3. Stripe Setup

### 3a. Create Product
1. Go to [stripe.com/dashboard](https://dashboard.stripe.com)
2. **Products → Add product**
3. Name: `One Piece Oracle Pro`
4. Pricing: $5 / month, recurring
5. Copy the **Price ID** (starts with `price_`)

### 3b. Get API Keys
Go to **Developers → API Keys**:
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Publishable key
- `STRIPE_SECRET_KEY` — Secret key

### 3c. Set Up Webhook
1. **Developers → Webhooks → Add endpoint**
2. Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy **Signing secret** → `STRIPE_WEBHOOK_SECRET`

**For local development**, use Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
The CLI prints a local webhook secret — use it as `STRIPE_WEBHOOK_SECRET`.

---

## 4. Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with all values from steps 2 and 3:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

OPENAI_API_KEY=sk-...

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Test the flow:
1. Click "Get Started Free" → create account
2. Verify email (check inbox or disable in Supabase Auth settings)
3. Sign in
4. Click "Upgrade to Pro" → complete Stripe checkout (use test card `4242 4242 4242 4242`)
5. Verify Pro badge appears in header

---

## 6. Seed Test Data (Quick Start)

Want to see the app working immediately without running the full scraper pipeline? Use the seed script:

```bash
npm run seed
```

This inserts:
- **5 sample chapters** (Alabasta arc)
- **10 sample panels** with placeholder images + real dialogue
- **8 SBS Q&A entries** (Oda answering fan questions)

Full-text search works immediately. Semantic search needs real embeddings (run the pipeline below for that).

---

## 7. Run Data Pipeline

Once auth is working, populate the database with real manga data:

```bash
# Scrape Alabasta arc panels from One Piece Wiki
npm run scrape:panels -- --arc alabasta

# OCR text from panel images
npm run process:ocr -- --input data/raw/panels/alabasta.json

# Generate OpenAI embeddings
npm run process:embeddings -- --input data/processed/panels/

# Import to Supabase
npm run import:supabase -- --panels data/embeddings/panels/

# Scrape + import SBS entries
npm run scrape:sbs
npm run import:supabase -- --sbs data/raw/sbs/
```

See `DATA_PIPELINE.md` for detailed instructions.

---

## 7. Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Set all environment variables in Vercel Dashboard → Project Settings → Environment Variables.

Update `NEXT_PUBLIC_APP_URL` to your production URL.
Update Stripe webhook endpoint to your production URL.

---

## Architecture Overview

```
User → Next.js (Vercel)
         ├─ /api/search     → Supabase pgvector semantic search
         ├─ /api/ask        → OpenAI embeddings + RAG + LLM answer
         ├─ /api/checkout   → Stripe Checkout session
         ├─ /api/webhooks/stripe → Stripe events → update user_profiles
         ├─ /api/user       → Auth check + tier lookup
         └─ /auth/callback  → Supabase OAuth callback
```

See `ARCHITECTURE.md` for the full system design.
