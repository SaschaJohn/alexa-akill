import { Router } from 'express';
import multer from 'multer';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { uploadStream } from '../services/s3.js';

const tmpDir = path.join(os.tmpdir(), 'hoerspiel-upload');
fs.mkdirSync(tmpDir, { recursive: true });

const storage = multer.diskStorage({
  destination: tmpDir,
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

const router = Router();

router.post('/mp3/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const seriesFolder = req.body.seriesFolder;
    if (!file || !seriesFolder) {
      res.status(400).json({ error: 'file and seriesFolder required' });
      return;
    }

    const s3Key = `${seriesFolder}/${file.originalname}`;
    await uploadStream(s3Key, file.path, 'audio/mpeg');

    fs.unlinkSync(file.path);

    res.json({ ok: true, key: s3Key });
  } catch (err) {
    console.error('MP3 upload failed:', err);
    res.status(500).json({ error: 'Failed to upload MP3' });
  }
});

export default router;
