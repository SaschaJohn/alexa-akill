import express from 'express';
import cors from 'cors';
import catalogRoutes from './routes/catalog.js';
import coverRoutes from './routes/covers.js';
import mp3Routes from './routes/mp3.js';
import progressRoutes from './routes/progress.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api', catalogRoutes);
app.use('/api', coverRoutes);
app.use('/api', mp3Routes);
app.use('/api', progressRoutes);

app.listen(PORT, () => {
  console.log(`Admin API running on http://localhost:${PORT}`);
});
