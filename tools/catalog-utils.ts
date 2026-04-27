import * as path from 'path';

export interface Episode {
  id: string;
  number: number;
  title: string;
  file: string;
  cover?: string;
}

export interface Series {
  id: string;
  title: string;
  cover: string;
  episodes: Episode[];
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function parseEpisodeFilename(filename: string): { number: number; title: string } | null {
  const base = path.basename(filename, path.extname(filename));

  const match = base.match(/^(\d+)\s*[-–—.]?\s*(.+)$/);
  if (match) {
    return { number: parseInt(match[1], 10), title: match[2].trim() };
  }

  const match2 = base.match(/^[Ff]olge\s*(\d+)\s*[-–—.]?\s*(.+)$/);
  if (match2) {
    return { number: parseInt(match2[1], 10), title: match2[2].trim() };
  }

  const match3 = base.match(/^.+\s*-\s*[Ff]olge\s*(\d+)\s*[-–—.]?\s*(.+)$/);
  if (match3) {
    return { number: parseInt(match3[1], 10), title: match3[2].trim() };
  }

  return null;
}
