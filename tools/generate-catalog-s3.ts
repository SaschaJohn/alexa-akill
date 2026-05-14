#!/usr/bin/env npx ts-node
/**
 * Generates series.json from S3 bucket contents.
 *
 * Usage: npx ts-node tools/generate-catalog-s3.ts [bucket-name]
 *        Defaults to hoerspiel-skill-media
 */

import * as fs from 'fs';
import * as path from 'path';
import { S3Client, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3';
import { slugify, parseEpisodeFilename, Episode, Series } from './catalog-utils';

const REGION = 'eu-central-1';

async function listAllObjects(s3: S3Client, bucket: string): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await s3.send(new ListObjectsV2Command({
      Bucket: bucket,
      ContinuationToken: continuationToken,
    }));

    for (const obj of response.Contents ?? []) {
      if (obj.Key) keys.push(obj.Key);
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return keys;
}

function buildCatalog(keys: string[], coverKeys: Set<string>): Series[] {
  const mp3Keys = keys.filter(k => k.toLowerCase().endsWith('.mp3'));

  const seriesMap = new Map<string, { title: string; episodes: Episode[] }>();

  for (const key of mp3Keys) {
    const parts = key.split('/');
    if (parts.length < 2) continue;

    const seriesFolder = parts[0];
    const filename = parts.slice(1).join('/');
    const seriesId = slugify(seriesFolder);

    const parsed = parseEpisodeFilename(filename);
    if (!parsed) {
      console.warn(`  Skipping (can't parse): ${key}`);
      continue;
    }

    const episodeId = `${seriesId}-${String(parsed.number).padStart(3, '0')}`;

    let cover: string | undefined;
    const jpgKey = `covers/${episodeId}.jpg`;
    const pngKey = `covers/${episodeId}.png`;
    if (coverKeys.has(jpgKey)) {
      cover = jpgKey;
    } else if (coverKeys.has(pngKey)) {
      cover = pngKey;
    }

    if (!seriesMap.has(seriesFolder)) {
      seriesMap.set(seriesFolder, { title: seriesFolder, episodes: [] });
    }

    seriesMap.get(seriesFolder)!.episodes.push({
      id: episodeId,
      number: parsed.number,
      title: parsed.title,
      file: key,
      ...(cover ? { cover } : {}),
    });
  }

  const seriesList: Series[] = [];

  for (const [folder, data] of seriesMap) {
    const seriesId = slugify(folder);
    data.episodes.sort((a, b) => a.number - b.number);

    const seriesCoverJpg = `covers/${seriesId}.jpg`;
    const seriesCoverPng = `covers/${seriesId}.png`;
    let seriesCover = 'covers/default.jpg';
    if (coverKeys.has(seriesCoverJpg)) seriesCover = seriesCoverJpg;
    else if (coverKeys.has(seriesCoverPng)) seriesCover = seriesCoverPng;

    const coversFound = data.episodes.filter(e => e.cover).length;
    console.log(`${data.title}: ${data.episodes.length} episodes, ${coversFound} covers found in S3`);

    if (coversFound === 0 && seriesCover === 'covers/default.jpg') {
      console.warn(`  ⚠ No covers found for ${data.title}`);
    }

    seriesList.push({
      id: seriesId,
      title: data.title,
      cover: seriesCover,
      episodes: data.episodes,
    });
  }

  return seriesList.sort((a, b) => a.title.localeCompare(b.title, 'de'));
}

async function main() {
  const bucket = process.argv[2] || 'hoerspiel-skill-media';

  console.log(`Listing s3://${bucket}/\n`);

  const s3 = new S3Client({ region: REGION });
  const allKeys = await listAllObjects(s3, bucket);

  console.log(`Found ${allKeys.length} objects\n`);

  const coverKeys = new Set(
    allKeys.filter(k => k.startsWith('covers/') && /\.(jpg|png)$/i.test(k))
  );

  const series = buildCatalog(allKeys, coverKeys);
  const catalog = { series };
  const catalogJson = JSON.stringify(catalog, null, 2) + '\n';

  const outputPath = path.join(__dirname, '..', 'lambda', 'src', 'content', 'series.json');
  fs.writeFileSync(outputPath, catalogJson);
  console.log(`\nWrote ${series.length} series to ${outputPath}`);

  const catalogKey = 'catalog/series.json';
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: catalogKey,
    Body: catalogJson,
    ContentType: 'application/json',
  }));
  console.log(`Uploaded to s3://${bucket}/${catalogKey}`);
}

export { listAllObjects, buildCatalog };

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
