import { Router, Request, Response } from 'express';
import { pool } from '../db.js';
import { getOrSetCache } from '../cache.js';

export const overviewRouter = Router();

overviewRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const data = await getOrSetCache('overview_national', 60, async () => {
      // 1. KPI
      const kpiRes = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM kups_records) as total_kups,
          (SELECT COUNT(DISTINCT lembaga_id) FROM kups_records) as total_kps,
          (SELECT COALESCE(SUM(nilai_ekonomi_rupiah), 0) FROM kps_production_records) as total_nilai_ekonomi,
          (SELECT COUNT(DISTINCT komoditas) FROM kps_production_records WHERE komoditas IS NOT NULL AND komoditas <> '') as total_komoditas,
          (SELECT COUNT(DISTINCT provinsi) FROM kps_records WHERE provinsi <> '') as total_provinsi
      `);

      const kpi = {
        total_kups: parseInt(kpiRes.rows[0].total_kups, 10),
        total_kps: parseInt(kpiRes.rows[0].total_kps, 10),
        total_nilai_ekonomi: parseInt(kpiRes.rows[0].total_nilai_ekonomi, 10),
        total_komoditas: parseInt(kpiRes.rows[0].total_komoditas, 10),
        total_provinsi: parseInt(kpiRes.rows[0].total_provinsi, 10),
      };

      // 2. Tier Distribution
      const tierRes = await pool.query(`
        SELECT 
          kelas, 
          COUNT(*) as count,
          ROUND((COUNT(*)::numeric / (SELECT COUNT(*) FROM kups_records)::numeric) * 100, 1) as percentage
        FROM kups_records
        GROUP BY kelas
        ORDER BY 
          CASE kelas 
            WHEN 'PLATINUM' THEN 1 
            WHEN 'EMAS' THEN 2 
            WHEN 'PERAK' THEN 3 
            WHEN 'BIRU' THEN 4 
            ELSE 5 
          END
      `);

      const tierDescriptions: Record<string, string> = {
        BIRU: 'Tahap inisiasi kelembagaan, pemetaan potensi usaha, dan penyusunan dokumen RKPS (Syarat 1 s.d. 3).',
        PERAK: 'Tahap operasional, telah memiliki unit usaha, produk dipasarkan, akses permodalan, dan pasar lokal (Syarat 1 s.d. 7).',
        EMAS: 'Tahap maju & mandiri, sertifikasi produk, kemitraan offtaker, menyerap tenaga kerja, dan input nilai ekonomi GoKUPS (Syarat 1 s.d. 15).',
        PLATINUM: 'Tahap unggul & ekspor, lolos verifikasi faktual lapangan Tim Gabungan Pusat/Balai dengan sertifikat resmi Dirjen PS.',
      };

      const tierDistribution = tierRes.rows.map((r) => ({
        kelas: r.kelas,
        count: parseInt(r.count, 10),
        percentage: parseFloat(r.percentage),
        description: tierDescriptions[r.kelas] || '',
      }));

      // 3. Top 5 Commodities
      const topComRes = await pool.query(`
        SELECT 
          komoditas, 
          kategori_komoditas, 
          COUNT(*) as transaksi_count, 
          COALESCE(SUM(nilai_ekonomi_rupiah), 0) as total_nilai
        FROM kps_production_records
        WHERE komoditas IS NOT NULL AND komoditas <> ''
        GROUP BY komoditas, kategori_komoditas
        ORDER BY total_nilai DESC
        LIMIT 5
      `);

      const topCommodities = topComRes.rows.map((r) => ({
        komoditas: r.komoditas,
        kategori_komoditas: r.kategori_komoditas,
        transaksi_count: parseInt(r.transaksi_count, 10),
        total_nilai: parseInt(r.total_nilai, 10),
      }));

      // 4. Top 5 Leaderboard
      const topLeadRes = await pool.query(`
        SELECT 
          p.kups_nama,
          k.nama_lembaga,
          k.provinsi,
          k.kabupaten,
          k.skema,
          COALESCE(MAX(ku.kelas), 'EMAS') as kelas,
          SUM(p.nilai_ekonomi_rupiah) as total_nilai,
          COUNT(p.id) as transaksi_count,
          STRING_AGG(DISTINCT p.komoditas, ', ') as komoditas_list,
          STRING_AGG(DISTINCT p.kategori_komoditas, ', ') as kategori_list
        FROM kps_production_records p
        JOIN kps_records k ON p.kps_id = k.id
        LEFT JOIN kups_records ku ON (p.kups_detail_id IS NOT NULL AND ku.source_payload->>'detail_id' = p.kups_detail_id) OR (p.kps_id = ku.lembaga_id AND LOWER(TRIM(p.kups_nama)) = LOWER(TRIM(ku.nama_kups)))
        WHERE p.nilai_ekonomi_rupiah > 0
        GROUP BY p.kups_nama, k.nama_lembaga, k.provinsi, k.kabupaten, k.skema
        ORDER BY total_nilai DESC
        LIMIT 5
      `);

      const topLeaderboard = topLeadRes.rows.map((r) => ({
        kups_nama: r.kups_nama,
        nama_lembaga: r.nama_lembaga,
        provinsi: r.provinsi,
        kabupaten: r.kabupaten,
        skema: r.skema,
        kelas: r.kelas,
        total_nilai: parseInt(r.total_nilai, 10),
        transaksi_count: parseInt(r.transaksi_count, 10),
        komoditas_list: r.komoditas_list || '',
        kategori_list: r.kategori_list || '',
      }));

      return {
        kpi,
        tierDistribution,
        topCommodities,
        topLeaderboard,
      };
    });

    res.json(data);
  } catch (error: any) {
    console.error('[API Overview Error]:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
