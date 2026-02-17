# Data Pipeline Guide

Complete guide to scraping, processing, and importing One Piece manga data.

---

## 🎯 Overview

The data pipeline transforms raw manga panels into searchable, embedded data:

```
1. SCRAPE → 2. OCR → 3. EMBED → 4. IMPORT
```

**Timeline:** ~24-48 hours for full Alabasta arc (1,000+ panels)

---

## 📦 Setup

### 1. Install Dependencies

```bash
npm install
```

This installs:
- `cheerio` — HTML parsing for web scraping
- `axios` — HTTP requests
- `tesseract.js` — OCR text extraction
- `openai` — Embeddings generation
- `@supabase/supabase-js` — Database import

### 2. Environment Variables

Create `.env.local`:

```bash
# OpenAI (for embeddings)
OPENAI_API_KEY=sk-...

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...
```

**Get OpenAI API key:** https://platform.openai.com/api-keys  
**Get Supabase creds:** https://app.supabase.com/project/_/settings/api

---

## 🚀 Quick Start (Full Pipeline)

Run the entire pipeline for Alabasta arc:

```bash
npm run pipeline:full
```

This runs all 4 steps automatically. **Estimated time: 12-24 hours** (due to rate limits).

---

## 🔧 Step-by-Step (Manual Control)

### Step 1: Scrape Panels

```bash
npm run scrape:panels -- --arc alabasta
```

**What it does:**
- Scrapes One Piece Wiki for Chapters 155-217 (Alabasta arc)
- Downloads panel metadata (image URLs, chapter, page, panel numbers)
- Saves to `data/raw/panels/alabasta.json`

**Output:**
```json
{
  "chapter": 155,
  "page": 1,
  "panel": 1,
  "image_url": "https://...",
  "arc": "Alabasta",
  "volume": 17,
  "chapter_title": "Adventure in the Kingdom of Sand"
}
```

**Time:** ~2 hours (1 second delay per chapter = 63 seconds + processing)

---

### Step 2: Extract Text (OCR)

```bash
npm run process:ocr -- --input data/raw/panels/alabasta.json
```

**What it does:**
- Downloads panel images
- Runs Tesseract OCR to extract text
- Parses dialogue and character speech
- Saves to `data/processed/panels/alabasta.json`

**Output:**
```json
{
  "chapter": 155,
  "page": 1,
  "panel": 1,
  "image_url": "https://...",
  "ocr_text": "Luffy: I'm gonna be King of the Pirates!",
  "dialogue": ["Luffy: I'm gonna be King of the Pirates!"],
  "confidence": 87.5
}
```

**Time:** ~6-12 hours (OCR is slow, ~10-30 seconds per panel × 1,000 panels)

---

### Step 3: Generate Embeddings

```bash
npm run process:embeddings -- --input data/processed/panels/alabasta.json
```

**What it does:**
- Combines dialogue + chapter context into embedding text
- Calls OpenAI `text-embedding-ada-002` API
- Generates 1536-dimensional vectors for semantic search
- Saves to `data/embeddings/panels/alabasta.json`

**Output:**
```json
{
  "chapter": 155,
  "page": 1,
  "panel": 1,
  "image_url": "https://...",
  "ocr_text": "...",
  "dialogue": [...],
  "embedding": [0.123, -0.456, 0.789, ...], // 1536 numbers
  "embedding_text": "Chapter 155: Adventure in the Kingdom of Sand Arc: Alabasta Luffy: I'm gonna be King of the Pirates!"
}
```

**Cost:** ~$0.13 per 1,000 panels (OpenAI embeddings are $0.0001/1K tokens)

**Time:** ~1-2 hours (rate limited to avoid OpenAI 3,000 RPM limit)

---

### Step 4: Import to Supabase

```bash
npm run import:supabase -- --panels data/embeddings/panels/alabasta.json
```

**What it does:**
- Connects to Supabase
- Creates chapter records
- Inserts panels with embeddings
- Handles duplicates (upsert on conflict)

**Time:** ~10-20 minutes (batch insert, 100 panels at a time)

---

## 📖 SBS Pipeline (Same Steps)

### Scrape SBS

```bash
npm run scrape:sbs -- --volumes 1-20
```

Saves to `data/raw/sbs/volumes_1-20.json`

### Generate Embeddings (Skip OCR)

```bash
npm run process:embeddings -- --input data/raw/sbs/volumes_1-20.json --type sbs
```

Saves to `data/embeddings/sbs/volumes_1-20.json`

### Import

```bash
npm run import:supabase -- --sbs data/embeddings/sbs/volumes_1-20.json
```

**SBS is faster** (no OCR step, text already available)

---

## 🗄️ Data Output

```
data/
├── raw/
│   ├── panels/
│   │   ├── alabasta.json
│   │   └── alabasta_summary.json
│   └── sbs/
│       ├── volumes_1-20.json
│       └── volumes_1-20_summary.json
├── processed/
│   └── panels/
│       ├── alabasta.json
│       └── alabasta_summary.json
└── embeddings/
    ├── panels/
    │   ├── alabasta.json
    │   └── alabasta_summary.json
    └── sbs/
        ├── volumes_1-20.json
        └── volumes_1-20_summary.json
```

Each `_summary.json` contains metadata (counts, stats, timestamps).

---

## ⚙️ Advanced Options

### Custom Chapter Range

```bash
npx tsx scripts/scrapers/panels.ts --chapters 155-180
```

### Parallel OCR (Faster)

```bash
# Process first 100 panels
npx tsx scripts/process/ocr.ts --input data/raw/panels/alabasta.json --limit 100

# Process next 100 panels
npx tsx scripts/process/ocr.ts --input data/raw/panels/alabasta.json --offset 100 --limit 100
```

### Local Embeddings (No OpenAI Cost)

Use `sentence-transformers` instead:

```bash
# TODO: Add local embeddings script using transformers.js
```

---

## 🐛 Troubleshooting

### OCR is slow
- **Solution:** Use Google Cloud Vision API instead (faster, better accuracy)
- **Alternative:** Use local embeddings only, skip OCR for MVP

### OpenAI rate limits
- **Solution:** Reduce batch size in `scripts/process/embeddings.ts`
- **Alternative:** Use local embedding model (Ollama + nomic-embed-text)

### Supabase import fails
- **Check:** Run `supabase/schema.sql` in SQL Editor first
- **Check:** Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are correct
- **Check:** Vector extension enabled: `CREATE EXTENSION IF NOT EXISTS vector;`

### Panels missing
- **Reason:** One Piece Wiki structure varies by chapter
- **Solution:** Manually adjust selectors in `scrapers/panels.ts`
- **Workaround:** Use sample dataset for MVP, expand later

---

## 📊 Expected Results

### Alabasta Arc (Full Pipeline)

- **Chapters:** 63 (155-217)
- **Panels:** ~1,000-1,500
- **SBS Volumes 1-20:** ~200 entries
- **Total embeddings:** ~1,200-1,700
- **Database size:** ~50-100 MB (with embeddings)
- **Cost:** ~$0.20 (OpenAI embeddings only)
- **Time:** 24-48 hours (mostly OCR wait time)

---

## 🚀 Next Steps

After importing data:

1. **Wire up `/api/search`** — Use Supabase vector search
2. **Test queries** — Search by dialogue, character, arc
3. **Build LLM endpoint** — `/api/ask` for Q&A
4. **Deploy** — Vercel + Supabase

---

## 🔐 Legal / Ethics

**Scraping Policy:**
- Respect `robots.txt`
- 1 second delay between requests
- User agent identifies project
- Cache responses to minimize traffic

**Copyright:**
- All manga panels © Eiichiro Oda/Shueisha
- Used for educational/reference purposes
- No redistribution of raw manga
- Clear attribution in app

**If contacted by Shueisha:**
- Immediate compliance with takedown requests
- Offer to work with official API if available
- Pivot to user-generated content model

---

## 📝 Notes

- **MVP doesn't need perfect OCR** — Even 60% accuracy is useful for search
- **Start small** — Test with 1-2 chapters before running full pipeline
- **Manual curation** — Flag low-confidence panels for manual review
- **Community help** — Users can submit corrections later

---

**Ready to build?** Start with:

```bash
npm run scrape:panels -- --arc alabasta
```

🏴‍☠️ Let's go!
