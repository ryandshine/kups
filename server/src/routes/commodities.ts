import { Router, Request, Response } from 'express';
import { pool } from '../db.js';
import { getOrSetCache } from '../cache.js';

export const commoditiesRouter = Router();

commoditiesRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const list = await getOrSetCache('commodities_all', 300, async () => {
      const res = await pool.query(`
        SELECT 
          komoditas, 
          kategori_komoditas, 
          COUNT(*) as count, 
          COALESCE(SUM(nilai_ekonomi_rupiah), 0) as total_nilai
        FROM kps_production_records
        WHERE komoditas IS NOT NULL AND komoditas <> ''
        GROUP BY komoditas, kategori_komoditas
        ORDER BY total_nilai DESC, komoditas ASC
      `);

      return res.rows.map((r) => ({
        komoditas: r.komoditas,
        kategori_komoditas: r.kategori_komoditas,
        count: parseInt(r.count, 10),
        total_nilai: parseInt(r.total_nilai, 10),
      }));
    });

    res.json(list);
  } catch (error: any) {
    console.error('[API Commodities Error]:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
