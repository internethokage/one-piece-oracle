#!/usr/bin/env node
/**
 * OCR Processor — Extract text from manga panels
 * 
 * Uses Tesseract.js to extract text from panel images
 * 
 * Usage:
 *   npx tsx scripts/process/ocr.ts --input data/raw/panels/alabasta.json
 */

import { createWorker } from 'tesseract.js';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

interface PanelData {
  chapter: number;
  page: number;
  panel: number;
  image_url: string;
  arc: string;
  volume: number;
  chapter_title?: string;
}

interface ProcessedPanel extends PanelData {
  ocr_text: string;
  dialogue: string[];
  confidence: number;
}

class OCRProcessor {
  private worker: any;
  private outputDir = path.join(process.cwd(), 'data', 'processed', 'panels');

  async init(): Promise<void> {
    console.log('Initializing Tesseract worker...');
    this.worker = await createWorker('eng');
    console.log('✓ Worker ready\n');
  }

  async processPanel(panel: PanelData): Promise<ProcessedPanel | null> {
    try {
      // Download image
      const response = await axios.get(panel.image_url, {
        responseType: 'arraybuffer',
        timeout: 10000,
      });

      const imageBuffer = Buffer.from(response.data);

      // Run OCR
      const { data } = await this.worker.recognize(imageBuffer);

      // Extract dialogue (lines with reasonable confidence)
      const dialogue = data.lines
        .filter((line: any) => line.confidence > 60) // Filter low confidence
        .map((line: any) => line.text.trim())
        .filter((text: string) => text.length > 0);

      return {
        ...panel,
        ocr_text: data.text.trim(),
        dialogue,
        confidence: data.confidence,
      };

    } catch (error) {
      console.error(`  ✗ Error processing panel ${panel.chapter}-${panel.page}-${panel.panel}:`, error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  async processDataset(inputPath: string): Promise<void> {
    const rawData = JSON.parse(await fs.readFile(inputPath, 'utf-8')) as PanelData[];
    const filename = path.basename(inputPath, '.json');

    console.log(`\n📷 Processing ${rawData.length} panels from ${filename}\n`);

    const processed: ProcessedPanel[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rawData.length; i++) {
      const panel = rawData[i];
      console.log(`[${i + 1}/${rawData.length}] Chapter ${panel.chapter}, Page ${panel.page}, Panel ${panel.panel}`);

      const result = await this.processPanel(panel);
      if (result) {
        processed.push(result);
        successCount++;
        console.log(`  ✓ OCR complete (${result.dialogue.length} dialogue lines, ${result.confidence.toFixed(0)}% confidence)`);
      } else {
        errorCount++;
      }

      // Brief delay to avoid rate limits
      await this.sleep(200);
    }

    // Save processed data
    await this.saveData(filename, processed);

    console.log(`\n✅ Processing complete!`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Saved to: ${this.outputDir}/${filename}.json`);
  }

  async saveData(filename: string, panels: ProcessedPanel[]): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true });
    const filepath = path.join(this.outputDir, `${filename}.json`);
    await fs.writeFile(filepath, JSON.stringify(panels, null, 2));

    // Save summary
    const summary = {
      total_panels: panels.length,
      avg_confidence: panels.reduce((sum, p) => sum + p.confidence, 0) / panels.length,
      panels_with_dialogue: panels.filter(p => p.dialogue.length > 0).length,
      total_dialogue_lines: panels.reduce((sum, p) => sum + p.dialogue.length, 0),
      processed_at: new Date().toISOString(),
    };

    const summaryPath = path.join(this.outputDir, `${filename}_summary.json`);
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
  }

  async cleanup(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI
const args = process.argv.slice(2);
const inputPath = args.find(a => a.startsWith('--input='))?.split('=')[1] || 
                  args[args.indexOf('--input') + 1];

if (!inputPath) {
  console.error('Usage: npx tsx scripts/process/ocr.ts --input <path-to-json>');
  process.exit(1);
}

const processor = new OCRProcessor();
processor.init()
  .then(() => processor.processDataset(inputPath))
  .then(() => processor.cleanup())
  .catch(console.error);
