import { Router } from 'express';
import multer from 'multer';
import { uploadBuffer, S3_BASE_URL } from '../services/s3.js';
import { readCatalog, writeCatalogAndSync } from '../services/catalog.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

router.post('/covers/:id', upload.single('cover'), async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const ext = file.mimetype === 'image/png' ? 'png' : 'jpg';
    const key = `covers/${id}.${ext}`;
    await uploadBuffer(key, file.buffer, file.mimetype);

    const catalog = readCatalog();
    for (const series of catalog.series) {
      if (series.id === id) {
        series.cover = key;
      }
      for (const ep of series.episodes) {
        if (ep.id === id) {
          ep.cover = key;
        }
      }
    }
    await writeCatalogAndSync(catalog);

    res.json({ ok: true, key, url: `${S3_BASE_URL}/${key}` });
  } catch (err) {
    console.error('Cover upload failed:', err);
    res.status(500).json({ error: 'Failed to upload cover' });
  }
});

export default router;
