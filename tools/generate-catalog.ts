#!/usr/bin/env npx ts-node
/**
 * Scans a directory of Hörspiele and generates series.json
 *
 * Expected folder structure:
 *   /path/to/hoerspiele/
 *     TKKG/
 *       001 - Die Jagd nach den Millionendieben.mp3
 *       002 - Der blinde Hellseher.mp3
 *
 * Cover images (optional): place cover.jpg in each series folder
 * Episode covers: extracted from MP3 ID3 tags automatically
 *
 * Usage: npx ts-node tools/generate-catalog.ts /path/to/hoerspiele
 */

import * as fs from 'fs';
import * as path from 'path';
import { slugify, parseEpisodeFilename, Episode, Series } from './catalog-utils';

const COVERS_OUTPUT_DIR = path.join(__dirname, '..', 'extracted-covers');

async function extractCover(mp3Path: string, outputPath: string): Promise<boolean> {
  try {
    const mm = await import('music-metadata');
    const metadata = await mm.parseFile(mp3Path, { duration: false });
    const pictures = metadata.common.picture;

    if (!pictures || pictures.length === 0) return false;

    const pic = pictures[0];
    const ext = pic.format === 'image/png' ? '.png' : '.jpg';
    const finalPath = outputPath.replace(/\.[^.]+$/, ext);
    fs.writeFileSync(finalPath, pic.data);
    return true;
  } catch {
    return false;
  }
}

async function scanDirectory(sourceDir: string): Promise<Series[]> {
  const entries = fs.readdirSync(sourceDir, { withFileTypes: true });
  const seriesList: Series[] = [];

  if (!fs.existsSync(COVERS_OUTPUT_DIR)) {
    fs.mkdirSync(COVERS_OUTPUT_DIR, { recursive: true });
  }

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
    let coversExtracted = 0;

    for (const file of files) {
      const parsed = parseEpisodeFilename(file);
      if (!parsed) {
        console.warn(`  Skipping (can't parse): ${file}`);
        continue;
      }

      const episodeId = `${seriesId}-${String(parsed.number).padStart(3, '0')}`;
      const coverFilename = `${episodeId}.jpg`;
      const coverOutputPath = path.join(COVERS_OUTPUT_DIR, coverFilename);

      let cover: string | undefined;
      if (fs.existsSync(coverOutputPath)) {
        cover = `covers/${coverFilename}`;
        coversExtracted++;
      } else {
        const mp3Path = path.join(seriesDir, file);
        const extracted = await extractCover(mp3Path, coverOutputPath);
        if (extracted) {
          const actualFile = fs.readdirSync(COVERS_OUTPUT_DIR)
            .find(f => f.startsWith(episodeId));
          cover = actualFile ? `covers/${actualFile}` : undefined;
          if (cover) coversExtracted++;
        }
      }

      episodes.push({
        id: episodeId,
        number: parsed.number,
        title: parsed.title,
        file: `${entry.name}/${file}`,
        ...(cover ? { cover } : {}),
      });
    }

    episodes.sort((a, b) => a.number - b.number);

    if (episodes.length === 0) continue;

    const hasCover = fs.existsSync(path.join(seriesDir, 'cover.jpg'));

    seriesList.push({
      id: seriesId,
      title: seriesTitle,
      cover: hasCover ? `covers/${seriesId}.jpg` : `covers/default.jpg`,
      episodes,
    });

    console.log(`${seriesTitle}: ${episodes.length} episodes, ${coversExtracted} covers extracted`);
  }

  return seriesList.sort((a, b) => a.title.localeCompare(b.title, 'de'));
}

async function main() {
  const sourceDir = process.argv[2];
  if (!sourceDir) {
    console.error('Usage: npx ts-node tools/generate-catalog.ts /path/to/hoerspiele');
    process.exit(1);
  }

  if (!fs.existsSync(sourceDir)) {
    console.error(`Directory not found: ${sourceDir}`);
    process.exit(1);
  }

  console.log(`Scanning: ${sourceDir}`);
  console.log(`Covers output: ${COVERS_OUTPUT_DIR}\n`);

  const series = await scanDirectory(sourceDir);
  const catalog = { series };
  const outputPath = path.join(__dirname, '..', 'lambda', 'src', 'content', 'series.json');
  fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2) + '\n');

  console.log(`\nWrote ${series.length} series to ${outputPath}`);
  console.log(`Upload covers: aws s3 sync ${COVERS_OUTPUT_DIR}/ s3://hoerspiel-skill-media/covers/`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
