import { Router, Request, Response } from 'express';
import { pool } from '../db.js';
import { getOrSetCache } from '../cache.js';
import { CRITERIA_15_DEFINITIONS } from '../utils/criteria15.js';

export const progresTierRouter = Router();

progresTierRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const data = await getOrSetCache('progres_tier_summary', 300, async () => {
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

      // 2. Provinces Aggregation (Optimized CTE avoiding Cartesian product & disk sort)
      const provRes = await pool.query(`
        WITH kups_agg AS (
          SELECT 
            k.provinsi,
            COUNT(ku.id) as total_kups,
            COUNT(CASE WHEN ku.kelas = 'BIRU' THEN 1 END) as count_biru,
            COUNT(CASE WHEN ku.kelas = 'PERAK' THEN 1 END) as count_perak,
            COUNT(CASE WHEN ku.kelas = 'EMAS' THEN 1 END) as count_emas,
            COUNT(CASE WHEN ku.kelas = 'PLATINUM' THEN 1 END) as count_platinum
          FROM kps_records k
          JOIN kups_records ku ON ku.lembaga_id = k.id
          WHERE k.provinsi <> ''
          GROUP BY k.provinsi
        ),
        prod_agg AS (
          SELECT 
            k.provinsi,
            COALESCE(SUM(p.nilai_ekonomi_rupiah), 0) as total_nilai_ekonomi,
            COUNT(DISTINCT p.komoditas) as total_komoditas
          FROM kps_records k
          JOIN kps_production_records p ON p.kps_id = k.id
          WHERE k.provinsi <> ''
          GROUP BY k.provinsi
        )
        SELECT 
          k.provinsi,
          COALESCE(ka.total_kups, 0) as total_kups,
          COALESCE(ka.count_biru, 0) as count_biru,
          COALESCE(ka.count_perak, 0) as count_perak,
          COALESCE(ka.count_emas, 0) as count_emas,
          COALESCE(ka.count_platinum, 0) as count_platinum,
          COALESCE(pa.total_nilai_ekonomi, 0) as total_nilai_ekonomi,
          COALESCE(pa.total_komoditas, 0) as total_komoditas
        FROM (SELECT DISTINCT provinsi FROM kps_records WHERE provinsi <> '') k
        LEFT JOIN kups_agg ka ON ka.provinsi = k.provinsi
        LEFT JOIN prod_agg pa ON pa.provinsi = k.provinsi
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
            'Belum mencatatkan rekaman transaksi nilai ekonomi (Syarat #15)',
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

    // 1. Pipeline Stats Aggregation (Cached 300s to avoid expensive JSON parsing on every page click)
    const pipelineStats = await getOrSetCache('readiness_pipeline_stats', 300, async () => {
      const statsRes = await pool.query(`
        WITH prod_totals AS (
          SELECT kups_detail_id, SUM(nilai_ekonomi_rupiah) as total_nilai
          FROM kps_production_records
          WHERE nilai_ekonomi_rupiah > 0
          GROUP BY kups_detail_id
        ),
        kups_summary AS (
          SELECT 
            ku.id,
            ku.kelas,
            (COALESCE(NULLIF(TRIM(ku.source_payload->>'sk'), ''), NULLIF(TRIM(ku.source_payload->>'surat_keputusan'), '')) IS NOT NULL) as has_sk,
            (k.dokumen_rkps IS NOT NULL AND TRIM(LOWER(k.dokumen_rkps)) = 'sudah') as has_rkps,
            jsonb_array_length(COALESCE(ku.produk, '[]'::jsonb) || COALESCE(ku.source_payload->'produk', '[]'::jsonb)) as produk_cnt,
            jsonb_array_length(COALESCE(ku.potensi, '[]'::jsonb) || COALESCE(ku.source_payload->'potensi', '[]'::jsonb)) as potensi_cnt,
            COALESCE(pt.total_nilai, 0) as total_nilai
          FROM kups_records ku
          JOIN kps_records k ON k.id = ku.lembaga_id
          LEFT JOIN prod_totals pt ON pt.kups_detail_id = ku.source_payload->>'detail_id'
        ),
        scored AS (
          SELECT 
            id, kelas, total_nilai,
            (
              (CASE WHEN has_sk THEN 1 ELSE 0 END) +
              (CASE WHEN produk_cnt > 0 THEN 1 ELSE 0 END) +
              (CASE WHEN total_nilai > 0 THEN 1 ELSE 0 END) +
              (CASE WHEN potensi_cnt > 0 THEN 1 ELSE 0 END) +
              (CASE WHEN has_rkps THEN 1 ELSE 0 END)
            ) * 20 as score
          FROM kups_summary
        )
        SELECT 
          COUNT(CASE WHEN kelas = 'BIRU' AND score >= 80 THEN 1 END) as biru_sangat_siap,
          COUNT(CASE WHEN kelas = 'BIRU' AND score >= 40 THEN 1 END) as biru_potensial,
          COUNT(CASE WHEN kelas = 'BIRU' THEN 1 END) as total_biru,
          
          COUNT(CASE WHEN kelas = 'PERAK' AND score >= 80 THEN 1 END) as perak_sangat_siap,
          COUNT(CASE WHEN kelas = 'PERAK' AND score >= 40 THEN 1 END) as perak_potensial,
          COUNT(CASE WHEN kelas = 'PERAK' THEN 1 END) as total_perak,

          COUNT(CASE WHEN kelas = 'EMAS' AND score >= 80 AND total_nilai >= 50000000 THEN 1 END) as emas_kandidat_audit,
          COUNT(CASE WHEN kelas = 'EMAS' THEN 1 END) as total_emas
        FROM scored
      `);

      const rawStats = statsRes.rows[0];
      return {
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
    });

    // 2. Candidate Filtering & Pagination (Cached with 120s TTL)
    const cacheKey = `readiness_cand_${targetTier}_${provinsi || ''}_${search || ''}_${pageNum}_${limitNum}`;
    const candResult = await getOrSetCache(cacheKey, 120, async () => {
      const whereConditions: string[] = [];
      const params: any[] = [];
      let pIdx = 1;

      const hasProgressExpr = `(
        (ku.source_payload->>'sk' IS NOT NULL AND TRIM(ku.source_payload->>'sk') != '')
        OR jsonb_array_length(COALESCE(ku.produk, '[]'::jsonb) || COALESCE(ku.source_payload->'produk', '[]'::jsonb)) > 0
        OR COALESCE(pr.total_nilai, 0) > 0
        OR jsonb_array_length(COALESCE(ku.potensi, '[]'::jsonb) || COALESCE(ku.source_payload->'potensi', '[]'::jsonb)) > 0
        OR (k.dokumen_rkps IS NOT NULL AND TRIM(LOWER(k.dokumen_rkps)) = 'sudah')
      )`;

      if (targetTier === 'PERAK') {
        whereConditions.push(`ku.kelas = 'BIRU' AND ${hasProgressExpr}`);
      } else if (targetTier === 'EMAS') {
        whereConditions.push(`ku.kelas = 'PERAK' AND ${hasProgressExpr}`);
      } else if (targetTier === 'PLATINUM') {
        whereConditions.push(`ku.kelas = 'EMAS' AND ${hasProgressExpr}`);
      } else {
        whereConditions.push(`ku.kelas IN ('BIRU', 'PERAK', 'EMAS') AND ${hasProgressExpr}`);
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

      // Count Candidates (uses lightweight prod_summary)
      const countSql = `
        WITH prod_summary AS (
          SELECT 
            p.kups_detail_id,
            COALESCE(SUM(p.nilai_ekonomi_rupiah), 0) as total_nilai
          FROM kps_production_records p
          WHERE p.kups_detail_id IS NOT NULL AND p.nilai_ekonomi_rupiah > 0
          GROUP BY p.kups_detail_id
        )
        SELECT COUNT(ku.id) as total
        FROM kups_records ku
        JOIN kps_records k ON k.id = ku.lembaga_id
        LEFT JOIN prod_summary pr ON pr.kups_detail_id = ku.source_payload->>'detail_id'
        ${whereClause}
      `;

      const countRes = await pool.query(countSql, params);
      const total = parseInt(countRes.rows[0]?.total || '0', 10);

      // Fetch Candidates Data (optimizing json_agg to only candidate page items)
      const dataSql = `
        WITH prod_summary AS (
          SELECT 
            p.kups_detail_id,
            COALESCE(SUM(p.nilai_ekonomi_rupiah), 0) as total_nilai,
            COUNT(p.id) as transaksi_count,
            STRING_AGG(DISTINCT p.komoditas, ', ') as komoditas_list
          FROM kps_production_records p
          WHERE p.kups_detail_id IS NOT NULL
          GROUP BY p.kups_detail_id
        ),
        candidate_matches AS (
          SELECT 
            ku.id,
            ku.nama_kups,
            ku.kelas as kelas_sekarang,
            ku.source_payload->>'detail_id' as detail_id,
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
            jsonb_array_length(COALESCE(ku.produk, '[]'::jsonb) || COALESCE(ku.source_payload->'produk', '[]'::jsonb)) as produk_count,
            jsonb_array_length(COALESCE(ku.potensi, '[]'::jsonb) || COALESCE(ku.source_payload->'potensi', '[]'::jsonb)) as potensi_count,
            (COALESCE(ku.produk, '[]'::jsonb) || COALESCE(ku.source_payload->'produk', '[]'::jsonb)) as produk_list,
            (COALESCE(ku.potensi, '[]'::jsonb) || COALESCE(ku.source_payload->'potensi', '[]'::jsonb)) as potensi_list,
            COALESCE(NULLIF(TRIM(ku.source_payload->>'sk'), ''), NULLIF(TRIM(ku.source_payload->>'surat_keputusan'), '')) as sk_kups,
            (
              (CASE WHEN COALESCE(NULLIF(TRIM(ku.source_payload->>'sk'), ''), NULLIF(TRIM(ku.source_payload->>'surat_keputusan'), '')) IS NOT NULL THEN 1 ELSE 0 END) +
              (CASE WHEN jsonb_array_length(COALESCE(ku.produk, '[]'::jsonb) || COALESCE(ku.source_payload->'produk', '[]'::jsonb)) > 0 THEN 1 ELSE 0 END) +
              (CASE WHEN COALESCE(pr.total_nilai, 0) > 0 THEN 1 ELSE 0 END) +
              (CASE WHEN jsonb_array_length(COALESCE(ku.potensi, '[]'::jsonb) || COALESCE(ku.source_payload->'potensi', '[]'::jsonb)) > 0 THEN 1 ELSE 0 END) +
              (CASE WHEN k.dokumen_rkps IS NOT NULL AND TRIM(LOWER(k.dokumen_rkps)) = 'sudah' THEN 1 ELSE 0 END)
            ) * 20 as skor_kesiapan
          FROM kups_records ku
          JOIN kps_records k ON k.id = ku.lembaga_id
          LEFT JOIN prod_summary pr ON pr.kups_detail_id = ku.source_payload->>'detail_id'
          ${whereClause}
          ORDER BY skor_kesiapan DESC, pr.total_nilai DESC NULLS LAST, produk_count DESC, ku.nama_kups ASC
          LIMIT $${pIdx} OFFSET $${pIdx + 1}
        )
        SELECT 
          cm.*,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'komoditas', p.komoditas,
                  'hasil_produk', p.hasil_produk,
                  'volume', p.volume,
                  'periode', p.periode,
                  'nilai_ekonomi_rupiah', p.nilai_ekonomi_rupiah,
                  'pemasaran', p.pemasaran
                ) ORDER BY p.nilai_ekonomi_rupiah DESC
              )
              FROM kps_production_records p
              WHERE p.kups_detail_id = cm.detail_id
            ),
            '[]'::json
          ) as transaksi_list
        FROM candidate_matches cm
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

        const hasRkps = Boolean(r.dokumen_rkps && r.dokumen_rkps.trim().toLowerCase() === 'sudah');
        const skKups = r.sk_kups || null;
        const hasSkKups = Boolean(skKups && skKups.trim() !== '');
        const hasProduk = produkCount > 0;
        const hasNilai = totalNilai > 0;
        const hasPotensi = potensiCount > 0;

        const indicators = [hasSkKups, hasProduk, hasNilai, hasPotensi, hasRkps];
        const fulfilledCount = indicators.filter(Boolean).length;
        const skorKesiapan = fulfilledCount * 20;

        let statusRekomendasi = 'POTENSIAL';
        let rekomendasiTindakan = '';

        if (skorKesiapan >= 80) {
          statusRekomendasi = 'SANGAT_SIAP';
          rekomendasiTindakan = `Prioritas Usulan Kenaikan ke ${targetKelas} pada sidang semesteran Dirjen PS (telah memenuhi ${fulfilledCount}/5 indikator utama).`;
        } else if (skorKesiapan >= 60) {
          statusRekomendasi = 'SIAP';
          const missing = [];
          if (!hasSkKups) missing.push('SK Penetapan KUPS');
          if (!hasRkps) missing.push('Unggah RKPS');
          if (!hasProduk) missing.push('Katalog Produk');
          if (!hasNilai) missing.push('Pencatatan Transaksi');
          if (!hasPotensi) missing.push('Data Potensi');
          rekomendasiTindakan = `Siap diajukan setelah melengkapi: ${missing.join(', ')}.`;
        } else {
          statusRekomendasi = 'POTENSIAL';
          rekomendasiTindakan = `Perlu pendampingan intensif dari Balai PS untuk melengkapi indikator legalitas dan kelayakan usaha (${fulfilledCount}/5 terpenuhi).`;
        }

        return {
          id: r.id,
          nama_kups: r.nama_kups,
          kelas_sekarang: kelasSekarang,
          target_kelas: targetKelas,
          detail_id: r.detail_id || null,
          lembaga_id: r.lembaga_id,
          nama_lembaga: r.nama_lembaga,
          surat_keputusan: r.surat_keputusan || '-',
          sk_kups: skKups,
          has_sk_kups: hasSkKups,
          skema: r.skema,
          provinsi: r.provinsi,
          kabupaten: r.kabupaten,
          nama_balai: r.nama_balai,
          total_nilai: totalNilai,
          transaksi_count: transaksiCount,
          komoditas_list: r.komoditas_list,
          transaksi_list: Array.isArray(r.transaksi_list) ? r.transaksi_list : [],
          produk_count: produkCount,
          potensi_count: potensiCount,
          produk_list: Array.isArray(r.produk_list) ? r.produk_list : [],
          potensi_list: Array.isArray(r.potensi_list) ? r.potensi_list : [],
          dokumen_rkps: r.dokumen_rkps || '',
          checklist: {
            kelembagaan_sk: hasSkKups,
            potensi: hasPotensi,
            rkps: hasRkps,
            produk: hasProduk,
            nilai_ekonomi: hasNilai,
            skor: skorKesiapan,
          },
          status_rekomendasi: statusRekomendasi,
          rekomendasi_tindakan: rekomendasiTindakan,
        };
      });

      return { candidates, total };
    });

    res.json({
      pipelineStats,
      candidates: candResult.candidates,
      meta: {
        total: candResult.total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(candResult.total / limitNum) || 1,
      },
    });
  } catch (error: any) {
    console.error('[API Readiness Error]:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
