import { Router, Request, Response } from 'express';
import { pool } from '../db.js';
import { getOrSetCache } from '../cache.js';
import { CRITERIA_15_DEFINITIONS } from '../utils/criteria15.js';

export const progresTierRouter = Router();

progresTierRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const data = await getOrSetCache('progres_tier_summary', 120, async () => {
      // 1. National tier summary
      const sumRes = await pool.query(`
        SELECT 
          COUNT(*) as total_kups,
          COUNT(CASE WHEN kelas = 'BIRU' THEN 1 END) as count_biru,
          COUNT(CASE WHEN kelas = 'PERAK' THEN 1 END) as count_perak,
          COUNT(CASE WHEN kelas = 'EMAS' THEN 1 END) as count_emas,
          COUNT(CASE WHEN kelas = 'PLATINUM' THEN 1 END) as count_platinum
        FROM kups_records
      `);

      const summary = {
        total_kups: parseInt(sumRes.rows[0].total_kups, 10),
        biru: parseInt(sumRes.rows[0].count_biru, 10),
        perak: parseInt(sumRes.rows[0].count_perak, 10),
        emas: parseInt(sumRes.rows[0].count_emas, 10),
        platinum: parseInt(sumRes.rows[0].count_platinum, 10),
      };

      // 2. Provinces Aggregation
      const provRes = await pool.query(`
        SELECT 
          k.provinsi,
          COUNT(DISTINCT ku.id) as total_kups,
          COUNT(DISTINCT CASE WHEN ku.kelas = 'BIRU' THEN ku.id END) as count_biru,
          COUNT(DISTINCT CASE WHEN ku.kelas = 'PERAK' THEN ku.id END) as count_perak,
          COUNT(DISTINCT CASE WHEN ku.kelas = 'EMAS' THEN ku.id END) as count_emas,
          COUNT(DISTINCT CASE WHEN ku.kelas = 'PLATINUM' THEN ku.id END) as count_platinum,
          COALESCE(SUM(p.nilai_ekonomi_rupiah), 0) as total_nilai_ekonomi,
          COUNT(DISTINCT p.komoditas) as total_komoditas
        FROM kps_records k
        LEFT JOIN kups_records ku ON ku.lembaga_id = k.id
        LEFT JOIN kps_production_records p ON p.kps_id = k.id
        WHERE k.provinsi <> ''
        GROUP BY k.provinsi
        ORDER BY total_kups DESC
      `);

      const provinces = provRes.rows.map((r) => ({
        provinsi: r.provinsi,
        total_kups: parseInt(r.total_kups, 10),
        count_biru: parseInt(r.count_biru, 10),
        count_perak: parseInt(r.count_perak, 10),
        count_emas: parseInt(r.count_emas, 10),
        count_platinum: parseInt(r.count_platinum, 10),
        total_nilai_ekonomi: parseInt(r.total_nilai_ekonomi, 10),
        total_komoditas: parseInt(r.total_komoditas, 10),
      }));

      // 3. Bottleneck Analysis
      const bottlenecks = [
        {
          from: 'BIRU' as const,
          to: 'PERAK' as const,
          label: 'Hambatan Transisi Inisiasi ke Operasional Pasar',
          gapDescription: 'Sebanyak 36.9% KUPS masih berada di kelas Biru. KUPS telah memiliki SK dan potensi, tetapi belum mampu mendirikan unit usaha formal dan memasarkan produk secara kontinu.',
          keyHurdles: [
            'Belum ada struktur kepengurusan unit usaha mandiri (Syarat #4)',
            'Kemasan dan kontinuitas produk siap pasar masih minim (Syarat #5)',
            'Keterbatasan akses modal usaha awal / pinjaman mikro (Syarat #6)',
          ],
          affectedKups: summary.biru,
        },
        {
          from: 'PERAK' as const,
          to: 'EMAS' as const,
          label: 'Hambatan Transisi Mandiri & Kemitraan Usaha Luas',
          gapDescription: 'Sebanyak 49.5% KUPS berada di kelas Perak. Produk sudah dipasarkan lokal, namun kesulitan menembus pasar regional/nasional dan belum mengantongi perizinan sertifikasi edar resmi.',
          keyHurdles: [
            'Belum mencatatkan rekaman transaksi nilai ekonomi di GoKUPS (Syarat #15)',
            'Belum memiliki sertifikasi izin edar P-IRT / Halal / SNI (Syarat #11)',
            'Belum terikat perjanjian kerjasama (PKS/MoU) offtaker atau BUMDes (Syarat #13)',
            'Kepatuhan pembayaran PNBP kehutanan (Syarat #14)',
          ],
          affectedKups: summary.perak,
        },
        {
          from: 'EMAS' as const,
          to: 'PLATINUM' as const,
          label: 'Hambatan Verifikasi Faktual Khusus & Akses Ekspor',
          gapDescription: 'KUPS Emas (12.5%) telah memenuhi ke-15 kriteria otomatis, namun kenaikan ke Platinum memerlukan audit langsung lapangan tim Pusat dan bukti sah ekspor / turis mancanegara.',
          keyHurdles: [
            'Verifikasi lapangan dan dokumen khusus oleh Tim Gabungan Pusat/Balai (Formulir 1, 2, 3)',
            'Akses pasar ekspor langsung atau invoice pembeli luar negeri',
            'Kesiapan volume pasokan berstandar internasional yang konsisten',
          ],
          affectedKups: summary.emas,
        },
      ];

      return {
        summary,
        criteria15: CRITERIA_15_DEFINITIONS,
        provinces,
        bottlenecks,
      };
    });

    res.json(data);
  } catch (error: any) {
    console.error('[API Progres Tier Error]:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
