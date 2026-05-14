import { Router } from 'express';
import { readCatalog, writeCatalogAndSync } from '../services/catalog.js';
import { S3_BASE_URL, listAllObjects } from '../services/s3.js';

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
  const base = filename.replace(/\.[^.]+$/, '').split('/').pop() || '';
  const match = base.match(/^(\d+)\s*[-–—.]?\s*(.+)$/);
  if (match) return { number: parseInt(match[1], 10), title: match[2].trim() };
  const match2 = base.match(/^[Ff]olge\s*(\d+)\s*[-–—.]?\s*(.+)$/);
  if (match2) return { number: parseInt(match2[1], 10), title: match2[2].trim() };
  return null;
}

const router = Router();

router.get('/catalog', (_req, res) => {
  try {
    const catalog = readCatalog();
    res.json({ ...catalog, s3BaseUrl: S3_BASE_URL });
  } catch (err) {
    res.status(500).json({ error: 'Failed to read catalog' });
  }
});

router.put('/catalog/episode/:episodeId', async (req, res) => {
  try {
    const { episodeId } = req.params;
    const { title } = req.body;
    if (!title || typeof title !== 'string') {
      res.status(400).json({ error: 'title required' });
      return;
    }

    const catalog = readCatalog();
    let found = false;
    for (const series of catalog.series) {
      for (const ep of series.episodes) {
        if (ep.id === episodeId) {
          ep.title = title;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      res.status(404).json({ error: 'Episode not found' });
      return;
    }

    await writeCatalogAndSync(catalog);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update episode' });
  }
});

router.post('/catalog/regenerate', async (_req, res) => {
  try {
    const allKeys = await listAllObjects();

    const coverKeys = new Set(
      allKeys.filter(k => k.startsWith('covers/') && /\.(jpg|png)$/i.test(k))
    );

    const mp3Keys = allKeys.filter(k => k.toLowerCase().endsWith('.mp3'));
    const seriesMap = new Map<string, { title: string; episodes: any[] }>();

    for (const key of mp3Keys) {
      const parts = key.split('/');
      if (parts.length < 2) continue;

      const seriesFolder = parts[0];
      const filename = parts.slice(1).join('/');
      const seriesId = slugify(seriesFolder);
      const parsed = parseEpisodeFilename(filename);
      if (!parsed) continue;

      const episodeId = `${seriesId}-${String(parsed.number).padStart(3, '0')}`;

      let cover: string | undefined;
      if (coverKeys.has(`covers/${episodeId}.jpg`)) cover = `covers/${episodeId}.jpg`;
      else if (coverKeys.has(`covers/${episodeId}.png`)) cover = `covers/${episodeId}.png`;

      if (!seriesMap.has(seriesFolder)) {
        seriesMap.set(seriesFolder, { title: seriesFolder, episodes: [] });
      }
      seriesMap.get(seriesFolder)!.episodes.push({
        id: episodeId, number: parsed.number, title: parsed.title, file: key,
        ...(cover ? { cover } : {}),
      });
    }

    const series = [];
    for (const [folder, data] of seriesMap) {
      const seriesId = slugify(folder);
      data.episodes.sort((a: any, b: any) => a.number - b.number);

      let seriesCover = 'covers/default.jpg';
      if (coverKeys.has(`covers/${seriesId}.jpg`)) seriesCover = `covers/${seriesId}.jpg`;
      else if (coverKeys.has(`covers/${seriesId}.png`)) seriesCover = `covers/${seriesId}.png`;

      series.push({ id: seriesId, title: data.title, cover: seriesCover, episodes: data.episodes });
    }

    series.sort((a, b) => a.title.localeCompare(b.title, 'de'));
    const catalog = { series };
    await writeCatalogAndSync(catalog);
    res.json({ ...catalog, s3BaseUrl: S3_BASE_URL });
  } catch (err) {
    console.error('Regenerate failed:', err);
    res.status(500).json({ error: 'Failed to regenerate catalog' });
  }
});

export default router;
