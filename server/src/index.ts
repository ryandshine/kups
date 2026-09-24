import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { pool } from './db.js';
import { overviewRouter } from './routes/overview.js';
import { progresTierRouter } from './routes/progresTier.js';
import { mapRouter } from './routes/map.js';
import { leaderboardRouter } from './routes/leaderboard.js';
import { commoditiesRouter } from './routes/commodities.js';
import { exportRouter } from './routes/export.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/overview', overviewRouter);
app.use('/api/progres-tier', progresTierRouter);
app.use('/api/map', mapRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/commodities', commoditiesRouter);
app.use('/api/export', exportRouter);

// Provinces list endpoint
app.get('/api/provinces', async (_req: Request, res: Response) => {
  try {
    const r = await pool.query(`
      SELECT 
        provinsi,
        COUNT(DISTINCT id) as total_kps
      FROM kps_records
      WHERE provinsi <> ''
      GROUP BY provinsi
      ORDER BY provinsi ASC
    `);
    res.json(r.rows.map((row) => ({ provinsi: row.provinsi })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'healthy',
      app: 'portal-kups',
      domain: 'kups.ditpps.com',
      database: 'connected (sipekaps)',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'unhealthy',
      error: err.message,
    });
  }
});

// Serve frontend static build
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  // SPA fallback
  app.get('*', (req: Request, res: Response) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  app.get('/', (_req: Request, res: Response) => {
    res.send('Portal KUPS API is running. Frontend build not found.');
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`[PORTAL KUPS] Server running on http://0.0.0.0:${port}`);
  console.log(`[PORTAL KUPS] Target Domain: kups.ditpps.com`);
});
