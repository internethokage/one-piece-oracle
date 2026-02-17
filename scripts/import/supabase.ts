#!/usr/bin/env node
/**
 * Supabase Importer — Bulk import data to Supabase database
 * 
 * Imports chapters, panels, and SBS entries with embeddings
 * 
 * Usage:
 *   npx tsx scripts/import/supabase.ts --panels data/embeddings/panels/alabasta.json
 *   npx tsx scripts/import/supabase.ts --sbs data/embeddings/sbs/volumes_1-20.json
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';

interface EmbeddedPanel {
  chapter: number;
  page: number;
  panel: number;
  image_url: string;
  arc: string;
  volume: number;
  chapter_title?: string;
  ocr_text: string;
  dialogue: string[];
  confidence: number;
  embedding: number[];
  embedding_text: string;
}

interface EmbeddedSBS {
  volume: number;
  question: string;
  answer: string;
  oda_comments?: string;
  source_url: string;
  embedding: number[];
  embedding_text: string;
}

class SupabaseImporter {
  private supabase;
  private batchSize = 100;

  constructor(url: string, serviceKey: string) {
    this.supabase = createClient(url, serviceKey);
  }

  async importPanels(filepath: string): Promise<void> {
    const panels = JSON.parse(await fs.readFile(filepath, 'utf-8')) as EmbeddedPanel[];
    console.log(`\n📦 Importing ${panels.length} panels to Supabase\n`);

    // First, ensure chapters exist
    await this.importChapters(panels);

    // Then import panels in batches
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < panels.length; i += this.batchSize) {
      const batch = panels.slice(i, i + this.batchSize);
      console.log(`[${i + 1}-${Math.min(i + this.batchSize, panels.length)}/${panels.length}] Importing batch...`);

      try {
        // Map to database schema
        const panelData = await Promise.all(batch.map(async (p) => {
          // Get chapter_id
          const { data: chapter } = await this.supabase
            .from('chapters')
            .select('id')
            .eq('number', p.chapter)
            .single();

          return {
            chapter_id: chapter?.id,
            page_number: p.page,
            panel_number: p.panel,
            image_url: p.image_url,
            ocr_text: p.ocr_text,
            dialogue: p.dialogue.join('\n'),
            characters: [], // TODO: Extract from OCR/dialogue
            location: null, // TODO: Extract from context
            embedding: `[${p.embedding.join(',')}]`, // PostgreSQL vector format
          };
        }));

        // Upsert panels
        const { error } = await this.supabase
          .from('panels')
          .upsert(panelData, { onConflict: 'chapter_id,page_number,panel_number' });

        if (error) {
          console.error(`  ✗ Batch error:`, error instanceof Error ? error.message : String(error));
          errorCount += batch.length;
        } else {
          successCount += batch.length;
          console.log(`  ✓ Batch imported successfully`);
        }

      } catch (error) {
        console.error(`  ✗ Batch error:`, error instanceof Error ? error.message : String(error));
        errorCount += batch.length;
      }
    }

    console.log(`\n✅ Panel import complete!`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
  }

  async importChapters(panels: EmbeddedPanel[]): Promise<void> {
    // Extract unique chapters
    const chapters = Array.from(
      new Map(
        panels.map(p => [
          p.chapter,
          {
            number: p.chapter,
            title: p.chapter_title || `Chapter ${p.chapter}`,
            arc: p.arc,
            volume: p.volume,
            release_date: null, // TODO: Add release dates
            page_count: Math.max(...panels.filter(x => x.chapter === p.chapter).map(x => x.page)),
          }
        ])
      ).values()
    );

    console.log(`📚 Importing ${chapters.length} chapters...`);

    const { error } = await this.supabase
      .from('chapters')
      .upsert(chapters, { onConflict: 'number' });

    if (error) {
      console.error(`  ✗ Chapter import error:`, error instanceof Error ? error.message : String(error));
    } else {
      console.log(`  ✓ Chapters imported\n`);
    }
  }

  async importSBS(filepath: string): Promise<void> {
    const sbs = JSON.parse(await fs.readFile(filepath, 'utf-8')) as EmbeddedSBS[];
    console.log(`\n📖 Importing ${sbs.length} SBS entries to Supabase\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < sbs.length; i += this.batchSize) {
      const batch = sbs.slice(i, i + this.batchSize);
      console.log(`[${i + 1}-${Math.min(i + this.batchSize, sbs.length)}/${sbs.length}] Importing batch...`);

      try {
        const sbsData = batch.map(s => ({
          volume: s.volume,
          question: s.question,
          answer: s.answer,
          oda_comments: s.oda_comments || null,
          embedding: `[${s.embedding.join(',')}]`, // PostgreSQL vector format
        }));

        const { error } = await this.supabase
          .from('sbs_entries')
          .insert(sbsData);

        if (error) {
          console.error(`  ✗ Batch error:`, error instanceof Error ? error.message : String(error));
          errorCount += batch.length;
        } else {
          successCount += batch.length;
          console.log(`  ✓ Batch imported successfully`);
        }

      } catch (error) {
        console.error(`  ✗ Batch error:`, error instanceof Error ? error.message : String(error));
        errorCount += batch.length;
      }
    }

    console.log(`\n✅ SBS import complete!`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
  }
}

// CLI
const args = process.argv.slice(2);
const panelsPath = args.find(a => a.startsWith('--panels='))?.split('=')[1] || 
                   args[args.indexOf('--panels') + 1];
const sbsPath = args.find(a => a.startsWith('--sbs='))?.split('=')[1] || 
                args[args.indexOf('--sbs') + 1];

if (!panelsPath && !sbsPath) {
  console.error('Usage: npx tsx scripts/import/supabase.ts [--panels <path>] [--sbs <path>]');
  process.exit(1);
}

// Get Supabase credentials from env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables required');
  console.log('Get these from: https://app.supabase.com/project/_/settings/api');
  process.exit(1);
}

const importer = new SupabaseImporter(supabaseUrl, supabaseKey);

(async () => {
  if (panelsPath) {
    await importer.importPanels(panelsPath);
  }
  if (sbsPath) {
    await importer.importSBS(sbsPath);
  }
})().catch(console.error);
