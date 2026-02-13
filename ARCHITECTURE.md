# Architecture — One Piece Oracle

**Overview:** RAG-powered search and Q&A for One Piece manga using semantic search + LLM.

---

## System Architecture

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│  Next.js Frontend (Vercel)      │
│  - Landing page                 │
│  - Search UI                    │
│  - Panel display                │
│  - Auth flow                    │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Next.js API Routes             │
│  - /api/search (text/vector)    │
│  - /api/ask (LLM answers)       │
│  - /api/report (agent tasks)    │
│  - /api/webhooks/stripe         │
└────┬───────────────────┬────────┘
     │                   │
     ▼                   ▼
┌──────────────┐   ┌───────────────┐
│  Supabase    │   │  Ollama LLM   │
│  - PostgreSQL│   │  (local/cloud)│
│  - pgvector  │   │               │
│  - Auth      │   │  Model:       │
│  - Storage   │   │  gpt-oss40k   │
└──────────────┘   └───────────────┘
```

---

## Data Flow

### 1. Search Flow (Free/Pro)

```
User enters query
   ↓
SearchBar → /api/search
   ↓
Full-text search on panels.dialogue
   ↓
Supabase returns matching panels
   ↓
PanelGrid displays results
```

### 2. AI Answer Flow (Pro Only)

```
User enters question
   ↓
/api/ask
   ↓
1. Vector search: Find top 10 relevant panels
   (embedding similarity search)
   ↓
2. Fetch panel images + OCR text
   ↓
3. Build context prompt:
   "Based on these panels: [panel data]
    Question: {user_question}
    Answer with citations."
   ↓
4. Send to Ollama LLM
   ↓
5. Parse response, format citations
   ↓
6. Return structured answer
```

### 3. Agent Report Flow (Pro Only)

```
User requests report (e.g., "Zoro's swords timeline")
   ↓
/api/report
   ↓
1. LLM analyzes request → breaks into sub-queries
   ↓
2. For each sub-query:
   - Vector search for panels
   - Extract data
   ↓
3. LLM synthesizes markdown report
   ↓
4. Return formatted report with panel references
```

---

## Database Schema

### Tables

**chapters**
- Core metadata for each chapter
- Used for filtering/navigation

**panels**
- Individual manga panels (the core data)
- Includes OCR text, dialogue, character tags
- `embedding` field for semantic search

**sbs_entries**
- Author Q&A from SBS sections
- Also has embeddings for search

**user_profiles**
- Extended user data (beyond Supabase auth)
- Subscription tier, Stripe IDs

### Indexes

- **Full-text search:** `idx_panels_dialogue_fts` for keyword search
- **Vector search:** `idx_panels_embedding` (ivfflat) for semantic similarity
- **Performance:** Indexes on `chapter_id`, `characters` (GIN)

---

## Tech Choices

### Frontend: Next.js 14 (App Router)
- **Why:** SSR, API routes, TypeScript, great DX
- **Hosting:** Vercel (free tier during MVP)

### Database: Supabase (PostgreSQL + pgvector)
- **Why:** Free tier, built-in auth, pgvector for semantic search
- **Alternatives:** Pinecone (vector-only), self-hosted Postgres

### Vector Search: pgvector
- **Why:** Keep everything in one DB, simpler architecture
- **Trade-off:** Slightly slower than dedicated vector DB, but fine for MVP

### LLM: Ollama (gpt-oss40k:20b)
- **Why:** Free, self-hosted, powerful enough for Q&A
- **Hosting:** Run locally during dev, Railway/Fly.io for production
- **Alternative:** OpenAI GPT-4 (faster, better, but $$)

### Payments: Stripe
- **Why:** Industry standard, great docs
- **Flow:** Webhook → update `user_profiles.subscription_tier`

---

## API Endpoints

### Public (Free)
- `POST /api/search` — Full-text panel search
- `GET /api/chapters` — List chapters/arcs

### Authenticated (Pro)
- `POST /api/ask` — AI-powered Q&A
- `POST /api/report` — Generate agent report
- `GET /api/user/subscription` — Check subscription status

### Internal
- `POST /api/webhooks/stripe` — Handle subscription events
- `POST /api/admin/seed` — Seed database (protected)

---

## Deployment Strategy

### MVP (Local)
- Next.js: `npm run dev` (localhost:3000)
- Supabase: Cloud (free tier)
- Ollama: Local (`ollama serve`)

### Production (Phase 2)
- Next.js: Vercel
- Supabase: Cloud (Pro tier if needed)
- Ollama: Railway/Fly.io with GPU instance
- CDN: Cloudflare R2 for panel images

---

## Scaling Considerations

### Current Bottlenecks (MVP)
- **LLM speed:** Ollama on CPU is slow (~10s per answer)
  - Solution: GPU instance or switch to OpenAI
- **Image storage:** Panel images will grow large
  - Solution: Cloudflare R2 (cheap, fast CDN)

### Future Optimizations
- **Caching:** Redis for common queries
- **Rate limiting:** Prevent abuse on free tier
- **CDN:** Serve static panels from edge
- **Lazy loading:** Infinite scroll for panel grids

---

## Security

### Data Protection
- **RLS (Row Level Security):** Supabase policies enforce access control
- **API keys:** Environment variables, never exposed to client
- **Rate limiting:** Cloudflare or Vercel middleware

### Content Moderation
- **Copyright:** Fair use disclaimer, attribution to Oda/Shueisha
- **Spoilers:** Chapter number filter to avoid unwanted spoilers

---

## Monitoring

### MVP
- Vercel analytics (free)
- Supabase dashboard (query performance)
- Console logs

### Production
- Sentry (error tracking)
- PostHog (product analytics)
- Stripe dashboard (revenue)

---

## Cost Estimate (1000 users @ $5/mo)

| Service | Cost |
|---|---|
| **Supabase Pro** | $25/mo |
| **Vercel Pro** | $20/mo |
| **Ollama (Railway)** | ~$50/mo (GPU instance) |
| **Cloudflare R2** | ~$10/mo (storage) |
| **Stripe fees** | ~$150/mo (3% of $5k revenue) |
| **Total** | ~$255/mo |

**Net profit:** $5,000 - $255 = **$4,745/mo** 🚀

---

## Next Steps

1. ✅ Scaffold Next.js app
2. ✅ Create Supabase schema
3. ✅ Build UI components
4. ⏳ Integrate Supabase client
5. ⏳ Seed sample data (Alabasta arc)
6. ⏳ Implement vector search
7. ⏳ Wire up Ollama LLM
8. ⏳ Add Stripe subscriptions
