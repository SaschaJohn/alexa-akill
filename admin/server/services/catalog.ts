import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { uploadCatalogToS3 } from './s3.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const LOCAL_CATALOG_PATH = path.resolve(__dirname, '../../../lambda/src/content/series.json');

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

export interface Catalog {
  series: Series[];
}

export function readCatalog(): Catalog {
  const raw = fs.readFileSync(LOCAL_CATALOG_PATH, 'utf-8');
  return JSON.parse(raw);
}

export function writeCatalog(catalog: Catalog): void {
  const json = JSON.stringify(catalog, null, 2) + '\n';
  fs.writeFileSync(LOCAL_CATALOG_PATH, json);
}

export async function writeCatalogAndSync(catalog: Catalog): Promise<void> {
  const json = JSON.stringify(catalog, null, 2) + '\n';
  fs.writeFileSync(LOCAL_CATALOG_PATH, json);
  await uploadCatalogToS3(json);
}
