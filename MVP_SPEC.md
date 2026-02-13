# MVP Specification — One Piece Oracle

**Goal:** Launch a testable MVP in 2 weeks that demonstrates core value: search panels + AI answers.

---

## Week 1: Core RAG System

### Day 1-2: Data Pipeline
- [x] Scaffold Next.js app
- [x] Create Supabase schema
- [ ] **Scrape Alabasta arc (50 chapters):**
  - Source: One Piece Wiki / fan scans
  - Save panels as images (Cloudflare R2 or Supabase Storage)
  - Extract OCR text (Tesseract or Google Cloud Vision)
  - Insert into `panels` table
- [ ] **Scrape SBS entries (Volumes 1-20):**
  - Source: Library of Ohara
  - Insert into `sbs_entries` table

### Day 3-4: Embeddings & Vector Search
- [ ] Generate embeddings for all panels
  - Use OpenAI `text-embedding-ada-002` API
  - Store in `panels.embedding` column
- [ ] Implement vector search API
  - Use Supabase pgvector cosine similarity
  - Return top 10 most relevant panels
- [ ] Test search accuracy (manual queries)

### Day 5-7: UI + Search
- [x] Build landing page (pirate theme)
- [x] Search bar component
- [x] Panel grid component
- [ ] Wire up search to Supabase
- [ ] Add filters (chapter range, character)
- [ ] Mobile responsive design
- [ ] Loading states, error handling

---

## Week 2: LLM + Monetization

### Day 8-9: AI Answers
- [ ] Set up Ollama locally
  - Model: `gpt-oss40k:20b`
- [ ] Create `/api/ask` endpoint
  - Vector search → retrieve top 10 panels
  - Build context prompt with panel data
  - Call Ollama LLM
  - Parse and format response with citations
- [ ] Add "AI Answer" section to UI (Pro badge)
- [ ] Test with sample questions

### Day 10-11: Stripe + Auth
- [ ] Integrate Supabase Auth
  - Email/password signup
  - Magic link login
- [ ] Set up Stripe
  - Create $5/mo subscription product
  - Checkout flow
  - Webhook endpoint (`/api/webhooks/stripe`)
  - Update `user_profiles.subscription_tier`
- [ ] Gate AI answers behind Pro tier
  - Check `subscription_tier` in `/api/ask`
  - Show upgrade prompt for free users

### Day 12-13: Agent Reports (Basic)
- [ ] Create `/api/report` endpoint
  - Input: User request (e.g., "Zoro's swords timeline")
  - LLM breaks down into sub-queries
  - For each: vector search + extract data
  - LLM synthesizes markdown report
- [ ] Add "Generate Report" button (Pro only)
- [ ] Display markdown with panel citations

### Day 14: Polish + Launch
- [ ] Final UI polish
  - Dark mode tweaks
  - Mobile testing
  - Loading animations
- [ ] Write docs
  - [x] README.md
  - [x] ARCHITECTURE.md
  - [x] MVP_SPEC.md (this file)
  - [ ] DEPLOYMENT.md
- [ ] Deploy to Vercel
- [ ] Soft launch (post on Reddit r/OnePiece)

---

## MVP Features Checklist

### Free Tier
- [ ] Search panels by text (full-text search)
- [ ] Filter by chapter, character, arc
- [ ] View panel images with citations
- [ ] SBS lookup
- [ ] Spoiler-free mode (chapter filter)

### Pro Tier ($5/mo)
- [ ] AI-powered answers with citations
- [ ] Agent-generated reports
- [ ] Unlimited queries (free has rate limit)
- [ ] Priority search (faster)

### Infrastructure
- [x] Next.js 14 app
- [x] Supabase (PostgreSQL + pgvector)
- [ ] Supabase Auth
- [ ] Stripe subscriptions
- [ ] Ollama LLM (local/Railway)
- [ ] Vercel deployment

---

## Success Metrics (MVP)

### Week 1
- ✅ 50 chapters scraped and indexed
- ✅ Vector search returns relevant panels
- ✅ UI is functional and looks good

### Week 2
- ✅ AI answers work (90% accuracy)
- ✅ Stripe checkout flows
- ✅ Deployed to production

### Post-Launch (Week 3-4)
- 🎯 100 signups
- 🎯 10 Pro subscribers ($50 MRR)
- 🎯 <3s average search response time
- 🎯 Positive feedback on Reddit/Twitter

---

## Out of Scope (for MVP)

These are **not** included in the 2-week MVP but planned for Phase 2:

- ❌ Full 1000+ chapter dataset (start with Alabasta)
- ❌ User dashboard / saved searches
- ❌ Mobile app
- ❌ Community features (upvotes, corrections)
- ❌ Advanced theory validation
- ❌ Spoiler management system
- ❌ Admin panel for moderators
- ❌ Analytics dashboard

---

## Risks & Mitigations

### Risk 1: Copyright Takedown
**Mitigation:**
- Clear fair use disclaimer
- Attribution to Oda/Shueisha
- Only reference panels, not full chapters
- Be ready to pivot if needed

### Risk 2: OCR Quality
**Mitigation:**
- Start with clean scans (One Piece Wiki)
- Manual correction for key panels
- Accept 80% accuracy for MVP

### Risk 3: LLM Hallucinations
**Mitigation:**
- Ground answers in retrieved panels only
- Show citations for every claim
- Add "AI may make mistakes" disclaimer

### Risk 4: Slow Ollama Performance
**Mitigation:**
- Use GPU instance (Railway)
- OR switch to OpenAI GPT-4 (faster, but costs)
- Cache common queries

---

## Next Steps (Tonight)

1. ✅ Create GitHub repo
2. ✅ Scaffold Next.js app
3. ✅ Supabase schema
4. ✅ Landing page UI
5. ✅ Search bar + panel grid components
6. ✅ API route (mock data)
7. ✅ Documentation
8. ⏳ Open PR
9. ⏳ Deploy to Vercel (test)
10. ⏳ Start scraping Alabasta arc (tomorrow)

---

**Status:** MVP scaffolding complete. Ready for data pipeline + Supabase integration.
