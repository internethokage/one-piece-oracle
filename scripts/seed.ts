/**
 * One Piece Oracle — Seed Script
 *
 * Populates the database with sample chapters, panels, and SBS entries
 * so you can test the app immediately after Supabase setup — no scraper required.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ─── Seed Data ────────────────────────────────────────────────────────────────

const CHAPTERS = [
  {
    number: 100,
    title: 'The Legend Has Begun',
    arc: 'Alabasta',
    volume: 11,
    release_date: '2000-01-17',
    page_count: 19,
  },
  {
    number: 101,
    title: 'Straw Hats',
    arc: 'Alabasta',
    volume: 11,
    release_date: '2000-01-24',
    page_count: 19,
  },
  {
    number: 155,
    title: 'Sand Pirates',
    arc: 'Alabasta',
    volume: 17,
    release_date: '2001-07-09',
    page_count: 17,
  },
  {
    number: 190,
    title: 'Come On!',
    arc: 'Alabasta',
    volume: 21,
    release_date: '2002-04-22',
    page_count: 19,
  },
  {
    number: 217,
    title: "Everything Is Alright",
    arc: 'Alabasta',
    volume: 24,
    release_date: '2002-12-16',
    page_count: 21,
  },
];

// Placeholder image URL (public placeholder service — no copyright issues)
const placeholder = (w: number, h: number, text: string) =>
  `https://placehold.co/${w}x${h}/1e293b/f59e0b?text=${encodeURIComponent(text)}`;

const PANELS_TEMPLATE = [
  {
    chapter_number: 100,
    page_number: 1,
    panel_number: 1,
    image_url: placeholder(400, 300, 'Luffy - Ch.100 P.1'),
    ocr_text: "I'm going to be King of the Pirates!",
    dialogue: "I'm going to be King of the Pirates!",
    characters: ['Luffy'],
    location: 'East Blue',
  },
  {
    chapter_number: 100,
    page_number: 3,
    panel_number: 2,
    image_url: placeholder(400, 300, 'Zoro - Ch.100 P.3'),
    ocr_text: "I'll become the world's greatest swordsman.",
    dialogue: "I'll become the world's greatest swordsman.",
    characters: ['Zoro'],
    location: 'East Blue',
  },
  {
    chapter_number: 100,
    page_number: 7,
    panel_number: 1,
    image_url: placeholder(400, 300, 'Nami - Ch.100 P.7'),
    ocr_text: "I'm going to draw a map of the world!",
    dialogue: "I'm going to draw a map of the world!",
    characters: ['Nami'],
    location: 'East Blue',
  },
  {
    chapter_number: 101,
    page_number: 2,
    panel_number: 1,
    image_url: placeholder(400, 300, 'Going Merry - Ch.101'),
    ocr_text: 'The Going Merry sailed through the storm.',
    dialogue: null,
    characters: [],
    location: 'Grand Line',
  },
  {
    chapter_number: 101,
    page_number: 9,
    panel_number: 3,
    image_url: placeholder(400, 300, 'Usopp - Ch.101 P.9'),
    ocr_text: "I'm Captain Usopp, hero of the sea!",
    dialogue: "I'm Captain Usopp, hero of the sea!",
    characters: ['Usopp'],
    location: 'Grand Line',
  },
  {
    chapter_number: 155,
    page_number: 4,
    panel_number: 2,
    image_url: placeholder(400, 300, 'Alabasta - Ch.155'),
    ocr_text: 'The desert kingdom of Alabasta stretched before them.',
    dialogue: null,
    characters: ['Luffy', 'Nami', 'Zoro'],
    location: 'Alabasta',
  },
  {
    chapter_number: 155,
    page_number: 11,
    panel_number: 1,
    image_url: placeholder(400, 300, 'Vivi - Ch.155 P.11'),
    ocr_text: 'Please... help my country!',
    dialogue: 'Please... help my country!',
    characters: ['Vivi'],
    location: 'Alabasta',
  },
  {
    chapter_number: 190,
    page_number: 5,
    panel_number: 3,
    image_url: placeholder(400, 300, 'Gear Second - Ch.190'),
    ocr_text: "GEAR... SECOND!",
    dialogue: "GEAR... SECOND!",
    characters: ['Luffy'],
    location: 'Alabasta',
  },
  {
    chapter_number: 217,
    page_number: 15,
    panel_number: 2,
    image_url: placeholder(400, 300, 'Farewell - Ch.217'),
    ocr_text: 'Thank you for everything.',
    dialogue: 'Thank you for everything.',
    characters: ['Vivi', 'Luffy', 'Nami', 'Zoro', 'Usopp'],
    location: 'Alabasta',
  },
  {
    chapter_number: 217,
    page_number: 19,
    panel_number: 1,
    image_url: placeholder(400, 300, 'Crew Arms Out - Ch.217'),
    ocr_text: 'Their arms stretched out across the sea.',
    dialogue: null,
    characters: ['Luffy', 'Zoro', 'Nami', 'Usopp', 'Sanji', 'Chopper'],
    location: 'Open Sea',
  },
];

const SBS_ENTRIES = [
  {
    volume: 4,
    question: "What inspired you to create Luffy's Devil Fruit ability?",
    answer:
      "I wanted his body to be like rubber so he could have silly, unpredictable combat. I thought about what would be most fun to draw in fights — stretching is it!",
    oda_comments: null,
  },
  {
    volume: 7,
    question: "How old is Zoro?",
    answer:
      "Zoro is 19 years old at the start of the series.",
    oda_comments: "He was 17 in the East Blue arc, became 19 after the two-year timeskip... wait, that's later.",
  },
  {
    volume: 10,
    question: "Does Nami actually like Luffy?",
    answer:
      "She respects him and considers him a dear friend and captain. She might not say it often, but her actions show it clearly.",
    oda_comments: null,
  },
  {
    volume: 15,
    question: "Who is the strongest in the Straw Hat crew?",
    answer:
      "Luffy is the captain and grows to be the strongest. But everyone has their own specialty — Zoro is the swordsman, Sanji is the cook and fighter.",
    oda_comments: "The crew grows stronger together!",
  },
  {
    volume: 20,
    question: "What does 'D' stand for in names like Monkey D. Luffy?",
    answer:
      "Oda has kept this a mystery intentionally. Those who carry the initial D seem to share a certain fate tied to the world's history. More will be revealed in time.",
    oda_comments: "The Will of D will be revealed!",
  },
  {
    volume: 25,
    question: "Why does Robin always say 'I want to live'?",
    answer:
      "Robin had never been able to say that before Enies Lobby. She spent her whole life running and thinking no one would protect her. The Straw Hats changed that.",
    oda_comments: null,
  },
  {
    volume: 30,
    question: "What is the One Piece actually?",
    answer:
      "That's the question, isn't it! You'll have to read to the end to find out.",
    oda_comments: "Not telling! (laughs)",
  },
  {
    volume: 35,
    question: "What is Sanji's full name?",
    answer:
      "Vinsmoke Sanji. He's the third son of the Vinsmoke family, rulers of the Germa Kingdom.",
    oda_comments: null,
  },
];

// ─── Seeder ───────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🏴‍☠️ One Piece Oracle — Seed Script');
  console.log('=====================================\n');

  // 1. Seed Chapters
  console.log('📖 Seeding chapters...');
  const { data: chapters, error: chaptersError } = await supabase
    .from('chapters')
    .upsert(CHAPTERS, { onConflict: 'number', ignoreDuplicates: false })
    .select();

  if (chaptersError) {
    console.error('❌ Error seeding chapters:', chaptersError.message);
    process.exit(1);
  }
  console.log(`   ✓ ${chapters?.length ?? 0} chapters seeded`);

  // Build chapter number → ID map
  const chapterMap: Record<number, string> = {};
  for (const ch of chapters ?? []) {
    chapterMap[ch.number] = ch.id;
  }

  // 2. Seed Panels
  console.log('🖼️  Seeding panels...');
  const panelsToInsert = PANELS_TEMPLATE.map(({ chapter_number, ...rest }) => ({
    ...rest,
    chapter_id: chapterMap[chapter_number],
  })).filter((p) => p.chapter_id); // skip if chapter not found

  // Upsert uses UNIQUE(chapter_id, page_number, panel_number)
  const { data: panels, error: panelsError } = await supabase
    .from('panels')
    .upsert(panelsToInsert, {
      onConflict: 'chapter_id,page_number,panel_number',
      ignoreDuplicates: false,
    })
    .select();

  if (panelsError) {
    console.error('❌ Error seeding panels:', panelsError.message);
    console.error('   Detail:', panelsError.details);
  } else {
    console.log(`   ✓ ${panels?.length ?? 0} panels seeded`);
  }

  // 3. Seed SBS Entries
  console.log('📚 Seeding SBS entries...');
  const { data: sbs, error: sbsError } = await supabase
    .from('sbs_entries')
    .insert(SBS_ENTRIES)
    .select();

  if (sbsError) {
    // If they already exist, that's fine — try a select count instead
    if (sbsError.code === '23505') {
      // unique violation — data already there
      const { count } = await supabase.from('sbs_entries').select('*', { count: 'exact', head: true });
      console.log(`   ✓ ${count ?? 0} SBS entries already present (skipped duplicates)`);
    } else {
      console.error('❌ Error seeding SBS entries:', sbsError.message);
    }
  } else {
    console.log(`   ✓ ${sbs?.length ?? 0} SBS entries seeded`);
  }

  console.log('\n✅ Seed complete!');
  console.log('\nNext steps:');
  console.log('  1. Start the app:  npm run dev');
  console.log('  2. Search for "Luffy" or "Gear Second"');
  console.log('  3. Full-text search works immediately with this seed data');
  console.log('  4. Semantic search needs embeddings — run the full pipeline when ready');
  console.log('\n🏴‍☠️ Yohohoho!');
}

seed().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
