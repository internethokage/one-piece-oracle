#!/usr/bin/env node
/**
 * Embeddings Generator — Generate vector embeddings for semantic search
 * 
 * Uses OpenAI text-embedding-ada-002 to generate 1536-dim vectors
 * 
 * Usage:
 *   npx tsx scripts/process/embeddings.ts --input data/processed/panels/alabasta.json
 *   npx tsx scripts/process/embeddings.ts --input data/raw/sbs/volumes_1-20.json --type sbs
 */

import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';

interface ProcessedPanel {
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
}

interface SBSEntry {
  volume: number;
  question: string;
  answer: string;
  oda_comments?: string;
  source_url: string;
}

interface EmbeddedPanel extends ProcessedPanel {
  embedding: number[];
  embedding_text: string;
}

interface EmbeddedSBS extends SBSEntry {
  embedding: number[];
  embedding_text: string;
}

class EmbeddingsGenerator {
  private openai: OpenAI;
  private outputDir = path.join(process.cwd(), 'data', 'embeddings');
  private batchSize = 100; // Process in batches to avoid rate limits

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async generatePanelEmbedding(panel: ProcessedPanel): Promise<EmbeddedPanel | null> {
    try {
      // Create embedding text (combine dialogue + chapter context)
      const embeddingText = [
        `Chapter ${panel.chapter}: ${panel.chapter_title || ''}`,
        `Arc: ${panel.arc}`,
        ...panel.dialogue,
        panel.ocr_text,
      ].filter(Boolean).join(' ').trim();

      if (embeddingText.length === 0) {
        console.warn(`  ⚠ Skipping panel ${panel.chapter}-${panel.page}-${panel.panel} (no text)`);
        return null;
      }

      // Generate embedding
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: embeddingText,
      });

      return {
        ...panel,
        embedding: response.data[0].embedding,
        embedding_text: embeddingText,
      };

    } catch (error) {
      console.error(`  ✗ Error generating embedding for panel ${panel.chapter}-${panel.page}-${panel.panel}:`, error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  async generateSBSEmbedding(sbs: SBSEntry): Promise<EmbeddedSBS | null> {
    try {
      // Create embedding text (question + answer)
      const embeddingText = `Volume ${sbs.volume} SBS - Q: ${sbs.question} A: ${sbs.answer}`;

      // Generate embedding
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: embeddingText,
      });

      return {
        ...sbs,
        embedding: response.data[0].embedding,
        embedding_text: embeddingText,
      };

    } catch (error) {
      console.error(`  ✗ Error generating embedding for SBS entry:`, error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  async processDataset(inputPath: string, type: 'panels' | 'sbs'): Promise<void> {
    const rawData = JSON.parse(await fs.readFile(inputPath, 'utf-8'));
    const filename = path.basename(inputPath, '.json');

    console.log(`\n🔮 Generating embeddings for ${rawData.length} ${type}\n`);

    const embedded: (EmbeddedPanel | EmbeddedSBS)[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rawData.length; i++) {
      const item = rawData[i];
      console.log(`[${i + 1}/${rawData.length}] Processing...`);

      let result;
      if (type === 'panels') {
        result = await this.generatePanelEmbedding(item as ProcessedPanel);
      } else {
        result = await this.generateSBSEmbedding(item as SBSEntry);
      }

      if (result) {
        embedded.push(result);
        successCount++;
        console.log(`  ✓ Embedding generated (${result.embedding.length} dimensions)`);
      } else {
        errorCount++;
      }

      // Rate limiting (OpenAI has 3,000 RPM limit on free tier)
      if ((i + 1) % this.batchSize === 0) {
        console.log(`  💤 Batch complete, pausing for rate limits...`);
        await this.sleep(2000);
      }
    }

    // Save embedded data
    await this.saveData(filename, embedded, type);

    console.log(`\n✅ Embedding generation complete!`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Saved to: ${this.outputDir}/${type}/${filename}.json`);
  }

  async saveData(filename: string, data: any[], type: string): Promise<void> {
    const dir = path.join(this.outputDir, type);
    await fs.mkdir(dir, { recursive: true });
    
    const filepath = path.join(dir, `${filename}.json`);
    await fs.writeFile(filepath, JSON.stringify(data, null, 2));

    // Save summary
    const summary = {
      total_items: data.length,
      embedding_dimensions: data[0]?.embedding?.length || 0,
      avg_text_length: data.reduce((sum: number, item: any) => sum + item.embedding_text.length, 0) / data.length,
      generated_at: new Date().toISOString(),
    };

    const summaryPath = path.join(dir, `${filename}_summary.json`);
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI
const args = process.argv.slice(2);
const inputPath = args.find(a => a.startsWith('--input='))?.split('=')[1] || 
                  args[args.indexOf('--input') + 1];
const type = (args.find(a => a.startsWith('--type='))?.split('=')[1] || 
              args[args.indexOf('--type') + 1] || 
              'panels') as 'panels' | 'sbs';

if (!inputPath) {
  console.error('Usage: npx tsx scripts/process/embeddings.ts --input <path-to-json> [--type panels|sbs]');
  process.exit(1);
}

// Get OpenAI API key from env
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('Error: OPENAI_API_KEY environment variable not set');
  console.log('Get your API key from: https://platform.openai.com/api-keys');
  process.exit(1);
}

const generator = new EmbeddingsGenerator(apiKey);
generator.processDataset(inputPath, type).catch(console.error);
