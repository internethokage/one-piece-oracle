# One Piece Oracle 🏴‍☠️

**RAG-powered Q&A for One Piece manga with exact panel citations.**

Ask any question about One Piece and get accurate answers backed by manga panels and SBS entries.

---

## 🎯 Features

### Free Tier
- 📖 Search 1000+ manga chapters
- 🔍 Find panels by dialogue, character, or arc
- 📚 SBS (author Q&A) lookup
- 🎨 Beautiful pirate-themed UI

### Pro Tier ($5/mo)
- 🤖 AI-powered answers with citations
- 📊 Agent-generated reports (timelines, theories, comparisons)
- 🔬 Theory validation with compiled evidence
- ⚡ Priority search & unlimited queries

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- (Optional) Ollama for local LLM

### Installation

```bash
# Clone the repo
git clone https://github.com/internethokage/one-piece-oracle.git
cd one-piece-oracle

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database Setup

1. Create a new Supabase project
2. Run the schema from `supabase/schema.sql` in the SQL Editor
3. Copy your project URL and anon key to `.env.local`

### Sample Data

To test the app with sample panels:

```bash
# TODO: Add sample data script
npm run seed:sample
```

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS |
| **Backend** | Next.js API Routes |
| **Database** | PostgreSQL + pgvector (Supabase) |
| **Vector Search** | Supabase pgvector |
| **LLM** | Ollama (gpt-oss40k:20b) |
| **Auth** | Supabase Auth |
| **Payments** | Stripe |
| **Hosting** | Vercel |

---

## 📂 Project Structure

```
one-piece-oracle/
├── app/
│   ├── page.tsx              # Landing page
│   ├── api/
│   │   └── search/
│   │       └── route.ts      # Search API
│   └── globals.css
├── components/
│   ├── SearchBar.tsx         # Search input
│   └── PanelGrid.tsx         # Results display
├── supabase/
│   └── schema.sql            # Database schema
├── public/
└── README.md
```

---

## 🎨 Design Philosophy

**Pirate Aesthetic:**
- Dark navy/ocean blue background
- Gold accents (treasure theme)
- Manga panel cards with citations
- Responsive, mobile-first design

**User Experience:**
- Fast, intuitive search
- Clear citations (chapter/page/panel)
- Spoiler-free mode (filter by chapter number)
- Mobile-friendly

---

## 🛣️ Roadmap

### MVP (2 Weeks)
- [x] Next.js scaffold
- [x] Supabase schema
- [x] Landing page UI
- [x] Search API (mock data)
- [ ] Supabase integration
- [ ] Sample data seeding
- [ ] Vector search implementation

### Phase 2 (Week 3-4)
- [ ] LLM integration (Ollama)
- [ ] AI answer generation
- [ ] Stripe subscription
- [ ] Auth flow
- [ ] Pro features gate

### Phase 3 (Month 2)
- [ ] Agent reports system
- [ ] SBS database
- [ ] User dashboard
- [ ] Analytics

### Future
- [ ] Full manga scraping pipeline
- [ ] Mobile app
- [ ] Community features (upvotes, corrections)

---

## 📜 Legal

All manga content © Eiichiro Oda / Shueisha. This project is for **educational and reference purposes only** under fair use doctrine. Not affiliated with Shueisha or VIZ Media.

If you are a rights holder and have concerns, please contact us.

---

## 🤝 Contributing

Contributions welcome! Please open an issue first to discuss what you'd like to change.

---

## 📧 Contact

Built by [@internethokage](https://github.com/internethokage)

**Questions?** Open an issue or reach out on Twitter/Discord.

---

**⚠️ MVP Status:** Currently in active development. Search is using mock data. Supabase integration coming soon.
