#!/usr/bin/env npx ts-node
/**
 * Scans a directory of Hörspiele and generates series.json
 *
 * Expected folder structure:
 *   /path/to/hoerspiele/
 *     TKKG/
 *       001 - Die Jagd nach den Millionendieben.mp3
 *       002 - Der blinde Hellseher.mp3
 *     Die drei Fragezeichen/
 *       001 - und der Super-Papagei.mp3
 *
 * Cover images (optional): place cover.jpg in each series folder
 *
 * Usage: npx ts-node tools/generate-catalog.ts /path/to/hoerspiele
 */

import * as fs from 'fs';
import * as path from 'path';

interface Episode {
  id: string;
  number: number;
  title: string;
  file: string;
}

interface Series {
  id: string;
  title: string;
  cover: string;
  episodes: Episode[];
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseEpisodeFilename(filename: string): { number: number; title: string } | null {
  const base = path.basename(filename, path.extname(filename));

  // Pattern: "001 - Title" or "001 Title" or "1 - Title"
  const match = base.match(/^(\d+)\s*[-–—.]?\s*(.+)$/);
  if (match) {
    return { number: parseInt(match[1], 10), title: match[2].trim() };
  }

  // Pattern: "Folge 001 - Title"
  const match2 = base.match(/^[Ff]olge\s*(\d+)\s*[-–—.]?\s*(.+)$/);
  if (match2) {
    return { number: parseInt(match2[1], 10), title: match2[2].trim() };
  }

  return null;
}

function scanDirectory(sourceDir: string): Series[] {
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  const seriesList: Series[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.')) continue;

    const seriesDir = path.join(sourceDir, entry.name);
    const seriesId = slugify(entry.name);
    const seriesTitle = entry.name;

    const files = fs.readdirSync(seriesDir)
      .filter(f => f.toLowerCase().endsWith('.mp3'))
      .sort();

    const episodes: Episode[] = [];
    for (const file of files) {
      const parsed = parseEpisodeFilename(file);
      if (!parsed) {
        console.warn(`  Skipping (can't parse): ${file}`);
        continue;
      }

      episodes.push({
        id: `${seriesId}-${String(parsed.number).padStart(3, '0')}`,
        number: parsed.number,
        title: parsed.title,
        file: `${seriesId}/${file}`,
      });
    }

    episodes.sort((a, b) => a.number - b.number);

    const hasCover = fs.existsSync(path.join(seriesDir, 'cover.jpg'));

    seriesList.push({
      id: seriesId,
      title: seriesTitle,
      cover: hasCover ? `covers/${seriesId}.jpg` : `covers/default.jpg`,
      episodes,
    });

    console.log(`${seriesTitle}: ${episodes.length} episodes`);
  }

  return seriesList.sort((a, b) => a.title.localeCompare(b.title, 'de'));
}

const sourceDir = process.argv[2];
if (!sourceDir) {
  console.error('Usage: npx ts-node tools/generate-catalog.ts /path/to/hoerspiele');
  process.exit(1);
}

if (!fs.existsSync(sourceDir)) {
  console.error(`Directory not found: ${sourceDir}`);
  process.exit(1);
}

console.log(`Scanning: ${sourceDir}\n`);
const series = scanDirectory(sourceDir);

const catalog = { series };
const outputPath = path.join(__dirname, '..', 'lambda', 'src', 'content', 'series.json');
fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2) + '\n');

console.log(`\nWrote ${series.length} series to ${outputPath}`);
