import { Router } from 'express';
import { scanProgress, scanDeviceState } from '../services/dynamo.js';

const router = Router();

router.get('/progress', async (_req, res) => {
  try {
    const items = await scanProgress();
    res.json({ items });
  } catch (err) {
    console.error('Progress scan failed:', err);
    res.status(500).json({ error: 'Failed to scan progress' });
  }
});

router.get('/devices', async (_req, res) => {
  try {
    const items = await scanDeviceState();
    res.json({ items });
  } catch (err) {
    console.error('Device scan failed:', err);
    res.status(500).json({ error: 'Failed to scan devices' });
  }
});

export default router;
