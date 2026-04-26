import { Catalog, Series, Episode } from '../types';
import catalogData from '../../content/series.json';

const S3_BASE_URL = process.env.S3_BASE_URL || 'https://hoerspiel-skill-media.s3.eu-central-1.amazonaws.com';

const catalog: Catalog = catalogData as Catalog;

export function getAllSeries(): Series[] {
  return catalog.series;
}

export function getSeriesById(seriesId: string): Series | undefined {
  return catalog.series.find(s => s.id === seriesId);
}

export function getEpisodeById(episodeId: string): { series: Series; episode: Episode } | undefined {
  for (const series of catalog.series) {
    const episode = series.episodes.find(e => e.id === episodeId);
    if (episode) {
      return { series, episode };
    }
  }
  return undefined;
}

export function getNextEpisode(seriesId: string, currentNumber: number): Episode | undefined {
  const series = getSeriesById(seriesId);
  if (!series) return undefined;
  return series.episodes.find(e => e.number === currentNumber + 1);
}

export function getPreviousEpisode(seriesId: string, currentNumber: number): Episode | undefined {
  const series = getSeriesById(seriesId);
  if (!series) return undefined;
  return series.episodes.find(e => e.number === currentNumber - 1);
}

export function resolveAudioUrl(file: string): string {
  return `${S3_BASE_URL}/${file}`;
}

export function resolveCoverUrl(cover: string): string {
  return `${S3_BASE_URL}/${cover}`;
}
