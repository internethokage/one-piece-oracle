# Data Pipeline Scripts

This directory contains scripts for scraping, processing, and importing One Piece manga data.

## Pipeline Flow

```
1. Scrape → 2. OCR → 3. Embed → 4. Import
```

### 1. Scrape Panels & SBS
- `scrapers/panels.ts` — Scrape manga panels from One Piece Wiki
- `scrapers/sbs.ts` — Scrape SBS Q&A from Library of Ohara
- Output: `data/raw/`

### 2. Extract Text (OCR)
- `process/ocr.ts` — Extract text from panel images
- Uses Tesseract.js or Google Cloud Vision
- Output: `data/processed/`

### 3. Generate Embeddings
- `process/embeddings.ts` — Generate vector embeddings
- Uses OpenAI `text-embedding-ada-002`
- Output: `data/embeddings/`

### 4. Import to Database
- `import/supabase.ts` — Bulk import to Supabase
- Inserts chapters, panels, SBS entries

---

## Usage

### Install Dependencies
```bash
npm install cheerio axios tesseract.js openai @supabase/supabase-js
```

### Scrape Alabasta Arc (Chapters 155-217)
```bash
npx tsx scripts/scrapers/panels.ts --arc alabasta
```

### Process OCR
```bash
npx tsx scripts/process/ocr.ts --input data/raw/panels
```

### Generate Embeddings
```bash
npx tsx scripts/process/embeddings.ts --input data/processed/panels
```

### Import to Supabase
```bash
npx tsx scripts/import/supabase.ts --data data/embeddings/panels
```

---

## Data Structure

### `data/raw/panels/`
```json
{
  "chapter": 155,
  "page": 1,
  "panel": 1,
  "image_url": "https://...",
  "arc": "Alabasta",
  "volume": 17
}
```

### `data/processed/panels/`
```json
{
  "chapter": 155,
  "page": 1,
  "panel": 1,
  "image_url": "https://...",
  "ocr_text": "Luffy: I'm gonna be King of the Pirates!",
  "dialogue": ["Luffy: I'm gonna be King of the Pirates!"],
  "characters": ["Luffy"],
  "location": "Alabasta Desert"
}
```

### `data/embeddings/panels/`
```json
{
  "chapter": 155,
  "page": 1,
  "panel": 1,
  "image_url": "https://...",
  "ocr_text": "...",
  "dialogue": [...],
  "characters": [...],
  "location": "...",
  "embedding": [0.123, -0.456, ...] // 1536-dim vector
}
```

---

## Scraping Targets

### One Piece Wiki (Panels)
- URL: https://onepiece.fandom.com/wiki/Chapter_XXX
- Alabasta arc: Chapters 155-217 (63 chapters)
- ~10-20 panels per chapter = ~1,000 panels total

### Library of Ohara (SBS)
- URL: https://thelibraryofohara.com/sbs/
- Volumes 1-100+ available
- Start with Volumes 1-20 (~200 Q&A entries)

---

## Legal / Ethics

**Fair Use Stance:**
- Educational/reference purpose
- Transformative use (RAG search)
- Attribution to Eiichiro Oda/Shueisha
- No redistribution of raw manga

**Scraping Ethics:**
- Respect robots.txt
- Rate limiting (1 req/second)
- User agent identification
- Cache responses to minimize requests

**Disclaimer (in app):**
> All manga panels and content © Eiichiro Oda/Shueisha.  
> Used for reference and educational purposes.  
> No copyright infringement intended.

---

## MVP Goal

**Target dataset:**
- 63 chapters (Alabasta arc)
- ~1,000 panels with OCR + embeddings
- ~200 SBS entries
- Ready to import in 24-48 hours
