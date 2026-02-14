#!/usr/bin/env node
/**
 * SBS Scraper — Library of Ohara
 * 
 * Scrapes SBS (author Q&A) from https://thelibraryofohara.com/sbs/
 * Target: Volumes 1-20 (~200 Q&A entries)
 * 
 * Usage:
 *   npx tsx scripts/scrapers/sbs.ts --volumes 1-20
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';

interface SBSEntry {
  volume: number;
  question: string;
  answer: string;
  oda_comments?: string;
  source_url: string;
}

class SBSScraper {
  private baseUrl = 'https://thelibraryofohara.com/sbs';
  private userAgent = 'OnePieceOracle/1.0 (Educational Research; +https://github.com/internethokage/one-piece-oracle)';
  private delay = 1500; // 1.5 seconds between requests (be respectful)
  private outputDir = path.join(process.cwd(), 'data', 'raw', 'sbs');

  async scrapeVolume(volumeNum: number): Promise<SBSEntry[]> {
    const url = `${this.baseUrl}-volume-${volumeNum}/`;
    console.log(`Scraping SBS Volume ${volumeNum}...`);

    try {
      const response = await axios.get(url, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const entries: SBSEntry[] = [];

      // Library of Ohara typically structures SBS as:
      // <div class="sbs-entry"> or <p> tags with Q: and A: patterns

      // Try multiple selectors (site structure may vary)
      const contentSelectors = [
        '.entry-content p',
        '.sbs-entry',
        'article p',
        '.post-content p',
      ];

      let allText = '';
      for (const selector of contentSelectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          elements.each((_, elem) => {
            allText += $(elem).text() + '\n';
          });
          break;
        }
      }

      // Parse Q&A patterns
      // Common formats:
      // "Q: [question]" / "A: [answer]"
      // "Reader: [question]" / "Oda: [answer]"

      const lines = allText.split('\n').filter(l => l.trim());
      let currentQuestion = '';
      let currentAnswer = '';

      for (const line of lines) {
        const trimmed = line.trim();

        // Detect question
        if (trimmed.match(/^(Q:|Question:|Reader:)/i)) {
          // Save previous entry if exists
          if (currentQuestion && currentAnswer) {
            entries.push({
              volume: volumeNum,
              question: currentQuestion,
              answer: currentAnswer,
              source_url: url,
            });
          }

          currentQuestion = trimmed.replace(/^(Q:|Question:|Reader:)/i, '').trim();
          currentAnswer = '';
        }
        // Detect answer
        else if (trimmed.match(/^(A:|Answer:|Oda:)/i)) {
          currentAnswer = trimmed.replace(/^(A:|Answer:|Oda:)/i, '').trim();
        }
        // Continue previous answer/question
        else if (trimmed.length > 0) {
          if (currentAnswer) {
            currentAnswer += ' ' + trimmed;
          } else if (currentQuestion) {
            currentQuestion += ' ' + trimmed;
          }
        }
      }

      // Save last entry
      if (currentQuestion && currentAnswer) {
        entries.push({
          volume: volumeNum,
          question: currentQuestion,
          answer: currentAnswer,
          source_url: url,
        });
      }

      console.log(`  ✓ Found ${entries.length} Q&A entries`);
      return entries;

    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        console.log(`  ⊘ Volume ${volumeNum} not found (may not exist yet)`);
      } else {
        console.error(`  ✗ Error scraping Volume ${volumeNum}:`, error instanceof Error ? error.message : String(error));
      }
      return [];
    }
  }

  async scrapeVolumes(startVol: number, endVol: number): Promise<void> {
    console.log(`\n📖 Scraping SBS Volumes ${startVol}-${endVol}\n`);

    const allEntries: SBSEntry[] = [];

    for (let volume = startVol; volume <= endVol; volume++) {
      const entries = await this.scrapeVolume(volume);
      allEntries.push(...entries);

      // Rate limiting
      await this.sleep(this.delay);
    }

    // Save to JSON
    await this.saveData(startVol, endVol, allEntries);

    console.log(`\n✅ Scraping complete!`);
    console.log(`   Total Q&A entries: ${allEntries.length}`);
    console.log(`   Saved to: ${this.outputDir}/volumes_${startVol}-${endVol}.json`);
  }

  async saveData(startVol: number, endVol: number, entries: SBSEntry[]): Promise<void> {
    await fs.mkdir(this.outputDir, { recursive: true });
    const filepath = path.join(this.outputDir, `volumes_${startVol}-${endVol}.json`);
    await fs.writeFile(filepath, JSON.stringify(entries, null, 2));

    // Also save summary
    const summary = {
      volumes: `${startVol}-${endVol}`,
      total_entries: entries.length,
      entries_per_volume: Object.entries(
        entries.reduce((acc, e) => {
          acc[e.volume] = (acc[e.volume] || 0) + 1;
          return acc;
        }, {} as Record<number, number>)
      ).sort((a, b) => Number(a[0]) - Number(b[0])),
      scraped_at: new Date().toISOString(),
    };

    const summaryPath = path.join(this.outputDir, `volumes_${startVol}-${endVol}_summary.json`);
    await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI
const args = process.argv.slice(2);
const volumesArg = args.find(a => a.startsWith('--volumes='))?.split('=')[1] || 
                   args[args.indexOf('--volumes') + 1] || 
                   '1-20';

const [startVol, endVol] = volumesArg.split('-').map(Number);

const scraper = new SBSScraper();
scraper.scrapeVolumes(startVol, endVol).catch(console.error);
