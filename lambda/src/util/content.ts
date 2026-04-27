import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Catalog, Episode, Series } from '../types';

const S3_BASE_URL = process.env.S3_BASE_URL || 'https://hoerspiel-skill-media.s3.eu-central-1.amazonaws.com';
const CATALOG_BUCKET = process.env.CATALOG_BUCKET || 'hoerspiel-skill-media';
const CATALOG_KEY = process.env.CATALOG_KEY || 'catalog/series.json';
const CACHE_TTL_MS = 5 * 60 * 1000;

const s3 = new S3Client({ region: process.env.CATALOG_REGION || 'eu-central-1' });

let catalog: Catalog | null = null;
let lastLoaded = 0;

async function loadCatalog(): Promise<Catalog> {
  if (catalog && Date.now() - lastLoaded < CACHE_TTL_MS) return catalog;

  const response = await s3.send(new GetObjectCommand({
    Bucket: CATALOG_BUCKET,
    Key: CATALOG_KEY,
  }));

  const body = await response.Body!.transformToString();
  catalog = JSON.parse(body) as Catalog;
  lastLoaded = Date.now();
  return catalog;
}

export async function getAllSeries(): Promise<Series[]> {
  const cat = await loadCatalog();
  return cat.series;
}

export async function getSeriesById(seriesId: string): Promise<Series | undefined> {
  const cat = await loadCatalog();
  return cat.series.find(s => s.id === seriesId);
}

export async function getEpisodeById(episodeId: string): Promise<{ series: Series; episode: Episode } | undefined> {
  const cat = await loadCatalog();
  for (const series of cat.series) {
    const episode = series.episodes.find(e => e.id === episodeId);
    if (episode) {
      return { series, episode };
    }
  }
  return undefined;
}

export async function getNextEpisode(seriesId: string, currentNumber: number): Promise<Episode | undefined> {
  const series = await getSeriesById(seriesId);
  if (!series) return undefined;
  return series.episodes.find(e => e.number === currentNumber + 1);
}

export async function getPreviousEpisode(seriesId: string, currentNumber: number): Promise<Episode | undefined> {
  const series = await getSeriesById(seriesId);
  if (!series) return undefined;
  return series.episodes.find(e => e.number === currentNumber - 1);
}

export function resolveAudioUrl(file: string): string {
  return `${S3_BASE_URL}/${file}`;
}

export function resolveCoverUrl(cover: string): string {
  return `${S3_BASE_URL}/${cover}`;
}

export function resolveEpisodeCoverUrl(episode: Episode, series: Series): string {
  const cover = episode.cover || series.cover;
  return `${S3_BASE_URL}/${cover}`;
}
