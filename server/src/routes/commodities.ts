import { Router, Request, Response } from 'express';
import { pool } from '../db.js';
import { getOrSetCache } from '../cache.js';
import { normalizeProvinceName } from '../utils/geojsonLoader.js';

export const commoditiesRouter = Router();

// GET /api/commodities (all commodities list)
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

// GET /api/commodities/distribution
// Accepts ?komoditas=...&kategori=...&provinsi=...
commoditiesRouter.get('/distribution', async (req: Request, res: Response) => {
  try {
    const komoditasQuery = (req.query.komoditas as string || '').trim();
    const kategoriQuery = (req.query.kategori as string || '').trim();
    const provinsiQuery = (req.query.provinsi as string || '').trim();

    const cacheKey = `commodity_dist_${komoditasQuery}_${kategoriQuery}_${provinsiQuery}`;

    const result = await getOrSetCache(cacheKey, 180, async () => {
      // 1. Categories Breakdown
      const catRes = await pool.query(`
        SELECT 
          kategori_komoditas, 
          COUNT(id) as transaksi_count, 
          COUNT(DISTINCT komoditas) as komoditas_count, 
          COALESCE(SUM(nilai_ekonomi_rupiah), 0) as total_nilai 
        FROM kps_production_records 
        WHERE komoditas IS NOT NULL AND komoditas <> ''
        GROUP BY kategori_komoditas 
        ORDER BY total_nilai DESC
      `);

      // 2. Top 30 Commodities List with metrics
      const topComRes = await pool.query(`
        SELECT 
          p.komoditas,
          p.kategori_komoditas,
          COUNT(p.id) as transaksi_count,
          COUNT(DISTINCT k.provinsi) as provinsi_count,
          COALESCE(SUM(p.nilai_ekonomi_rupiah), 0) as total_nilai
        FROM kps_production_records p
        JOIN kps_records k ON p.kps_id = k.id
        WHERE p.komoditas IS NOT NULL AND p.komoditas <> '' AND k.provinsi <> ''
        GROUP BY p.komoditas, p.kategori_komoditas
        ORDER BY total_nilai DESC
        LIMIT 30
      `);

      // Build WHERE conditions for filtered queries
      const whereClauses: string[] = ["k.provinsi <> ''", "p.komoditas IS NOT NULL", "p.komoditas <> ''"];
      const params: any[] = [];

      if (komoditasQuery && komoditasQuery !== 'ALL') {
        params.push(komoditasQuery);
        whereClauses.push(`p.komoditas = $${params.length}`);
      }
      if (kategoriQuery && kategoriQuery !== 'ALL') {
        params.push(kategoriQuery);
        whereClauses.push(`p.kategori_komoditas = $${params.length}`);
      }
      if (provinsiQuery && provinsiQuery !== 'ALL') {
        params.push(provinsiQuery);
        whereClauses.push(`k.provinsi = $${params.length}`);
      }

      const whereSql = 'WHERE ' + whereClauses.join(' AND ');

      // 3. Province distribution
      const provRes = await pool.query(`
        SELECT 
          k.provinsi,
          COALESCE(SUM(p.nilai_ekonomi_rupiah), 0) as total_nilai,
          COUNT(p.id) as transaksi_count,
          COUNT(DISTINCT p.kps_id) as lembaga_count
        FROM kps_production_records p
        JOIN kps_records k ON p.kps_id = k.id
        ${whereSql}
        GROUP BY k.provinsi
        ORDER BY total_nilai DESC
      `, params);

      // Compute total national value for percentage calculation
      const grandTotalNilai = provRes.rows.reduce((sum, r) => sum + parseInt(r.total_nilai, 10), 0);
      const grandTotalTransaksi = provRes.rows.reduce((sum, r) => sum + parseInt(r.transaksi_count, 10), 0);

      const provinces = provRes.rows.map((r, idx) => {
        const val = parseInt(r.total_nilai, 10);
        return {
          provinsi: r.provinsi,
          normalized_name: normalizeProvinceName(r.provinsi),
          total_nilai: val,
          transaksi_count: parseInt(r.transaksi_count, 10),
          lembaga_count: parseInt(r.lembaga_count, 10),
          percentage: grandTotalNilai > 0 ? parseFloat(((val / grandTotalNilai) * 100).toFixed(1)) : 0,
          rank: idx + 1,
        };
      });

      // 4. Top producers (KUPS / Lembaga)
      const prodRes = await pool.query(`
        SELECT 
          k.nama_lembaga,
          COALESCE(NULLIF(p.kups_nama, ''), k.nama_lembaga) as kups_nama,
          k.provinsi,
          k.kabupaten,
          COALESCE(NULLIF(p.hasil_produk, ''), p.komoditas) as produk,
          COALESCE(SUM(p.nilai_ekonomi_rupiah), 0) as total_nilai
        FROM kps_production_records p
        JOIN kps_records k ON p.kps_id = k.id
        ${whereSql}
        GROUP BY k.nama_lembaga, p.kups_nama, k.provinsi, k.kabupaten, produk
        ORDER BY total_nilai DESC
        LIMIT 10
      `, params);

      const topProducers = prodRes.rows.map((r) => ({
        nama_lembaga: r.nama_lembaga,
        kups_nama: r.kups_nama,
        provinsi: r.provinsi,
        kabupaten: r.kabupaten,
        produk: r.produk,
        total_nilai: parseInt(r.total_nilai, 10),
      }));

      // 5. Summary
      const summary = {
        komoditas: komoditasQuery || 'SEMUA KOMODITAS',
        kategori: kategoriQuery || 'SEMUA KATEGORI',
        total_nilai: grandTotalNilai,
        transaksi_count: grandTotalTransaksi,
        provinsi_count: provRes.rows.length,
        lembaga_count: provRes.rows.reduce((sum, r) => sum + parseInt(r.lembaga_count, 10), 0),
      };

      return {
        summary,
        provinces,
        top_producers: topProducers,
        categories: catRes.rows.map((r) => ({
          kategori_komoditas: r.kategori_komoditas,
          total_nilai: parseInt(r.total_nilai, 10),
          transaksi_count: parseInt(r.transaksi_count, 10),
          komoditas_count: parseInt(r.komoditas_count, 10),
        })),
        top_commodities: topComRes.rows.map((r) => ({
          komoditas: r.komoditas,
          kategori_komoditas: r.kategori_komoditas,
          total_nilai: parseInt(r.total_nilai, 10),
          transaksi_count: parseInt(r.transaksi_count, 10),
          provinsi_count: parseInt(r.provinsi_count, 10),
        })),
      };
    });

    res.json(result);
  } catch (error: any) {
    console.error('[API Commodity Distribution Error]:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
