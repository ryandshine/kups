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

// GET /api/progres-tier/readiness - Matriks Analisis Kesiapan Kenaikan Kelas KUPS
progresTierRouter.get('/readiness', async (req: Request, res: Response) => {
  try {
    const {
      targetTier = 'PERAK', // 'PERAK' | 'EMAS' | 'PLATINUM' | 'ALL'
      provinsi,
      search,
      page = '1',
      limit = '15',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 15));
    const offset = (pageNum - 1) * limitNum;

    // 1. Pipeline Stats Aggregation
    const statsRes = await pool.query(`
      WITH kups_summary AS (
        SELECT 
          ku.id,
          ku.kelas,
          jsonb_array_length(COALESCE(ku.source_payload->'produk', '[]'::jsonb)) as produk_cnt,
          jsonb_array_length(COALESCE(ku.source_payload->'potensi', '[]'::jsonb)) as potensi_cnt,
          COALESCE(SUM(p.nilai_ekonomi_rupiah), 0) as total_nilai
        FROM kups_records ku
        LEFT JOIN kps_production_records p ON (p.kups_detail_id IS NOT NULL AND ku.source_payload->>'detail_id' = p.kups_detail_id)
        GROUP BY ku.id, ku.kelas, ku.source_payload
      )
      SELECT 
        COUNT(CASE WHEN kelas = 'BIRU' AND produk_cnt > 0 AND total_nilai > 0 THEN 1 END) as biru_sangat_siap,
        COUNT(CASE WHEN kelas = 'BIRU' AND (produk_cnt > 0 OR total_nilai > 0) THEN 1 END) as biru_potensial,
        COUNT(CASE WHEN kelas = 'BIRU' THEN 1 END) as total_biru,
        
        COUNT(CASE WHEN kelas = 'PERAK' AND total_nilai > 0 AND produk_cnt > 0 THEN 1 END) as perak_sangat_siap,
        COUNT(CASE WHEN kelas = 'PERAK' AND total_nilai > 0 THEN 1 END) as perak_potensial,
        COUNT(CASE WHEN kelas = 'PERAK' THEN 1 END) as total_perak,

        COUNT(CASE WHEN kelas = 'EMAS' AND total_nilai >= 50000000 THEN 1 END) as emas_kandidat_audit,
        COUNT(CASE WHEN kelas = 'EMAS' THEN 1 END) as total_emas
      FROM kups_summary
    `);

    const rawStats = statsRes.rows[0];
    const pipelineStats = {
      biru_to_perak: {
        total: parseInt(rawStats.total_biru, 10),
        sangat_siap: parseInt(rawStats.biru_sangat_siap, 10),
        potensial: parseInt(rawStats.biru_potensial, 10),
      },
      perak_to_emas: {
        total: parseInt(rawStats.total_perak, 10),
        sangat_siap: parseInt(rawStats.perak_sangat_siap, 10),
        potensial: parseInt(rawStats.perak_potensial, 10),
      },
      emas_to_platinum: {
        total: parseInt(rawStats.total_emas, 10),
        kandidat_audit: parseInt(rawStats.emas_kandidat_audit, 10),
      },
    };

    // 2. Candidate Filtering
    const whereConditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (targetTier === 'PERAK') {
      whereConditions.push(`ku.kelas = 'BIRU' AND (jsonb_array_length(COALESCE(ku.source_payload->'produk', '[]'::jsonb)) > 0 OR COALESCE(pr.total_nilai, 0) > 0)`);
    } else if (targetTier === 'EMAS') {
      whereConditions.push(`ku.kelas = 'PERAK' AND COALESCE(pr.total_nilai, 0) > 0`);
    } else if (targetTier === 'PLATINUM') {
      whereConditions.push(`ku.kelas = 'EMAS' AND COALESCE(pr.total_nilai, 0) >= 50000000`);
    } else {
      whereConditions.push(`(
        (ku.kelas = 'BIRU' AND (jsonb_array_length(COALESCE(ku.source_payload->'produk', '[]'::jsonb)) > 0 OR COALESCE(pr.total_nilai, 0) > 0))
        OR (ku.kelas = 'PERAK' AND COALESCE(pr.total_nilai, 0) > 0)
        OR (ku.kelas = 'EMAS' AND COALESCE(pr.total_nilai, 0) >= 50000000)
      )`);
    }

    if (provinsi && typeof provinsi === 'string' && provinsi.trim() !== '') {
      whereConditions.push(`k.provinsi ILIKE $${pIdx}`);
      params.push(provinsi.trim());
      pIdx++;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      whereConditions.push(`(ku.nama_kups ILIKE $${pIdx} OR k.nama_lembaga ILIKE $${pIdx} OR k.kabupaten ILIKE $${pIdx})`);
      params.push(`%${search.trim()}%`);
      pIdx++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count Candidates
    const countSql = `
      WITH prod_agg AS (
        SELECT 
          p.kups_detail_id,
          COALESCE(SUM(p.nilai_ekonomi_rupiah), 0) as total_nilai,
          COUNT(p.id) as transaksi_count,
          STRING_AGG(DISTINCT p.komoditas, ', ') as komoditas_list
        FROM kps_production_records p
        WHERE p.kups_detail_id IS NOT NULL
        GROUP BY p.kups_detail_id
      )
      SELECT COUNT(ku.id) as total
      FROM kups_records ku
      JOIN kps_records k ON k.id = ku.lembaga_id
      LEFT JOIN prod_agg pr ON pr.kups_detail_id = ku.source_payload->>'detail_id'
      ${whereClause}
    `;

    const countRes = await pool.query(countSql, params);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    // Fetch Candidates Data
    const dataSql = `
      WITH prod_agg AS (
        SELECT 
          p.kups_detail_id,
          COALESCE(SUM(p.nilai_ekonomi_rupiah), 0) as total_nilai,
          COUNT(p.id) as transaksi_count,
          STRING_AGG(DISTINCT p.komoditas, ', ') as komoditas_list
        FROM kps_production_records p
        WHERE p.kups_detail_id IS NOT NULL
        GROUP BY p.kups_detail_id
      )
      SELECT 
        ku.id,
        ku.nama_kups,
        ku.kelas as kelas_sekarang,
        k.id as lembaga_id,
        k.nama_lembaga,
        k.surat_keputusan,
        k.skema,
        k.provinsi,
        k.kabupaten,
        k.nama_balai,
        k.dokumen_rkps,
        COALESCE(pr.total_nilai, 0) as total_nilai,
        COALESCE(pr.transaksi_count, 0) as transaksi_count,
        COALESCE(pr.komoditas_list, '') as komoditas_list,
        jsonb_array_length(COALESCE(ku.source_payload->'produk', '[]'::jsonb)) as produk_count,
        jsonb_array_length(COALESCE(ku.source_payload->'potensi', '[]'::jsonb)) as potensi_count
      FROM kups_records ku
      JOIN kps_records k ON k.id = ku.lembaga_id
      LEFT JOIN prod_agg pr ON pr.kups_detail_id = ku.source_payload->>'detail_id'
      ${whereClause}
      ORDER BY pr.total_nilai DESC NULLS LAST, produk_count DESC, ku.nama_kups ASC
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;

    const dataParams = [...params, limitNum, offset];
    const dataRes = await pool.query(dataSql, dataParams);

    const candidates = dataRes.rows.map((r) => {
      const kelasSekarang = r.kelas_sekarang;
      const targetKelas = kelasSekarang === 'BIRU' ? 'PERAK' : kelasSekarang === 'PERAK' ? 'EMAS' : 'PLATINUM';
      const totalNilai = parseInt(r.total_nilai, 10) || 0;
      const transaksiCount = parseInt(r.transaksi_count, 10) || 0;
      const produkCount = parseInt(r.produk_count, 10) || 0;
      const potensiCount = parseInt(r.potensi_count, 10) || 0;
      const hasRkps = Boolean(r.dokumen_rkps && r.dokumen_rkps.trim() !== '');

      let statusRekomendasi = 'POTENSIAL';
      let skorKesiapan = 60;
      let rekomendasiTindakan = '';

      if (kelasSekarang === 'BIRU') {
        if (produkCount > 0 && totalNilai > 0) {
          statusRekomendasi = 'SANGAT_SIAP';
          skorKesiapan = 100;
          rekomendasiTindakan = 'Prioritas Usulan Kenaikan ke PERAK pada sidang semesteran Dirjen PS (telah memiliki produk fisik & perputaran omzet).';
        } else if (totalNilai > 0) {
          statusRekomendasi = 'SIAP';
          skorKesiapan = 85;
          rekomendasiTindakan = 'Lengkapi administrasi katalog produk resmi di GoKUPS untuk pengesahan ke PERAK.';
        } else {
          statusRekomendasi = 'POTENSIAL';
          skorKesiapan = 70;
          rekomendasiTindakan = 'Lakukan pendampingan pencatatan transaksi ekonomi hasil penjualan produk lokal di GoKUPS.';
        }
      } else if (kelasSekarang === 'PERAK') {
        if (totalNilai > 0 && produkCount > 0) {
          statusRekomendasi = 'SANGAT_SIAP';
          skorKesiapan = 100;
          rekomendasiTindakan = 'Prioritas Usulan Kenaikan ke EMAS pada sidang semesteran Dirjen PS (telah berproduksi rutin & mencatat nilai ekonomi).';
        } else {
          statusRekomendasi = 'SIAP';
          skorKesiapan = 80;
          rekomendasiTindakan = 'Dorong pengurusan izin edar produk (P-IRT/Halal) dan perjanjian kemitraan offtaker.';
        }
      } else if (kelasSekarang === 'EMAS') {
        statusRekomendasi = 'KANDIDAT_AUDIT';
        skorKesiapan = 95;
        rekomendasiTindakan = 'Siap diajukan audit verifikasi faktual lapangan (Formulir 1–3) oleh Tim Gabungan Ditjen PS & Balai PS untuk penetapan PLATINUM.';
      }

      return {
        id: r.id,
        nama_kups: r.nama_kups,
        kelas_sekarang: kelasSekarang,
        target_kelas: targetKelas,
        lembaga_id: r.lembaga_id,
        nama_lembaga: r.nama_lembaga,
        surat_keputusan: r.surat_keputusan || '-',
        skema: r.skema,
        provinsi: r.provinsi,
        kabupaten: r.kabupaten,
        nama_balai: r.nama_balai,
        total_nilai: totalNilai,
        transaksi_count: transaksiCount,
        komoditas_list: r.komoditas_list,
        produk_count: produkCount,
        potensi_count: potensiCount,
        checklist: {
          kelembagaan_sk: true,
          potensi: potensiCount > 0,
          rkps: hasRkps,
          produk: produkCount > 0,
          nilai_ekonomi: totalNilai > 0,
          skor: skorKesiapan,
        },
        status_rekomendasi: statusRekomendasi,
        rekomendasi_tindakan: rekomendasiTindakan,
      };
    });

    res.json({
      pipelineStats,
      candidates,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error: any) {
    console.error('[API Readiness Error]:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
