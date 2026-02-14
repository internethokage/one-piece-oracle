#!/usr/bin/env node
/**
 * Panel Scraper — One Piece Wiki
 * 
 * Scrapes manga panels from https://onepiece.fandom.com
 * Target: Alabasta arc (Chapters 155-217)
 * 
 * Usage:
 *   npx tsx scripts/scrapers/panels.ts --arc alabasta
 *   npx tsx scripts/scrapers/panels.ts --chapters 155-217
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

// Arc definitions
const ARCS = {
  alabasta: { start: 155, end: 217, name: 'Alabasta', volumes: [17, 18, 19, 20, 21, 22, 23] },
  // Add more arcs later
};

interface PanelData {
  chapter: number;
  page: number;
  panel: number;
  image_url: string;
  arc: string;
  volume: number;
  chapter_title?: string;
  raw_html?: string;
}

class PanelScraper {
  private baseUrl = 'https://onepiece.fandom.com/wiki';
  private userAgent = 'OnePieceOracle/1.0 (Educational Research; +https://github.com/internethokage/one-piece-oracle)';
  private delay = 1000; // 1 second between requests
  private outputDir = path.join(process.cwd(), 'data', 'raw', 'panels');

  async scrapeChapter(chapterNum: number, arc: string, volume: number): Promise<PanelData[]> {
    const url = `${this.baseUrl}/Chapter_${chapterNum}`;
    console.log(`Scraping Chapter ${chapterNum}...`);

    try {
      const response = await axios.get(url, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const panels: PanelData[] = [];

      // Get chapter title
      const chapterTitle = $('h1.page-header__title').text().trim();

      // Find all images in the chapter gallery
      // One Piece Wiki has galleries in sections like "Long Summary" or "Chapter Notes"
      const images = $('img.thumbimage, img.lzyPlcHld, a.image img');

      images.each((index, elem) => {
        const $img = $(elem);
        let imageUrl = $img.attr('src') || $img.attr('data-src') || '';

        // Clean up URL (remove scaling parameters)
        if (imageUrl) {
          imageUrl = imageUrl.split('/revision')[0]; // Remove /revision/latest/...
          imageUrl = imageUrl.replace(/\/scale-to-width-down\/\d+/, ''); // Remove scaling

          panels.push({
            chapter: chapterNum,
            page: Math.floor(index / 4) + 1, // Estimate ~4 panels per page
            panel: (index % 4) + 1,
            image_url: imageUrl,
            arc,
            volume,
            chapter_title: chapterTitle,
          });
        }
      });

      console.log(`  ✓ Found ${panels.length} panels`);
      return panels;

    } catch (error) {
      console.error(`  ✗ Error scraping Chapter ${chapterNum}:`, error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  async scrapeArc(arcName: string): Promise<void> {
    const arc = ARCS[arcName as keyof typeof ARCS];
    if (!arc) {
      console.error(`Unknown arc: ${arcName}`);
      console.log(`Available arcs: ${Object.keys(ARCS).join(', ')}`);
      return;
    }

    console.log(`\n🏴‍☠️ Scraping ${arc.name} Arc (Chapters ${arc.start}-${arc.end})\n`);

    const allPanels: PanelData[] = [];

    for (let chapter = arc.start; chapter <= arc.end; chapter++) {
      // Determine volume (rough estimate based on ~10 chapters per volume)
      const volumeIndex = Math.floor((chapter - arc.start) / 10);
      const volume = arc.volumes[volumeIndex] || arc.volumes[arc.volumes.length - 1];

      const panels = await this.scrapeChapter(chapter, arc.name, volume);
      allPanels.push(...panels);

      // Rate limiting
      await this.sleep(this.delay);
    }

    // Save to JSON
    await this.saveData(arcName, allPanels);

    console.log(`\n✅ Scraping complete!`);
    console.log(`   Total panels: ${allPanels.length}`);
    console.log(`   Saved to: ${this.outputDir}/${arcName}.json`);
  }

  async saveData(arcName: string, panels: PanelData[]): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true });
    const filepath = path.join(this.outputDir, `${arcName}.json`);
    await fs.writeFile(filepath, JSON.stringify(panels, null, 2));

    // Also save chapter summaries
    const summary = {
      arc: arcName,
      total_panels: panels.length,
      chapters: [...new Set(panels.map(p => p.chapter))].length,
      volumes: [...new Set(panels.map(p => p.volume))],
      scraped_at: new Date().toISOString(),
    };

    const summaryPath = path.join(this.outputDir, `${arcName}_summary.json`);
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI
const args = process.argv.slice(2);
const arcArg = args.find(a => a.startsWith('--arc='))?.split('=')[1] || 
               args[args.indexOf('--arc') + 1] || 
               'alabasta';

const scraper = new PanelScraper();
scraper.scrapeArc(arcArg).catch(console.error);
