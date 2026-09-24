import { Router, Request, Response } from 'express';
import { pool } from '../db.js';

export const lembagaRouter = Router();

// GET /api/lembaga - List Lembaga with KUPS summary
lembagaRouter.get('/', async (req: Request, res: Response) => {
  try {
    const {
      search,
      provinsi,
      skema,
      kelas,
      sortBy = 'total_nilai',
      sortOrder = 'DESC',
      page = '1',
      limit = '15',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 15));
    const offset = (pageNum - 1) * limitNum;

    const whereConditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    // Filter Provinsi
    if (provinsi && typeof provinsi === 'string' && provinsi.trim() !== '') {
      whereConditions.push(`k.provinsi ILIKE $${pIdx}`);
      params.push(provinsi.trim());
      pIdx++;
    }

    // Filter Skema
    if (skema && typeof skema === 'string' && skema.trim() !== '') {
      whereConditions.push(`k.skema ILIKE $${pIdx}`);
      params.push(`%${skema.trim()}%`);
      pIdx++;
    }

    // Filter Search
    if (search && typeof search === 'string' && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      whereConditions.push(`(
        k.nama_lembaga ILIKE $${pIdx} 
        OR k.surat_keputusan ILIKE $${pIdx} 
        OR k.kabupaten ILIKE $${pIdx}
        OR EXISTS (
          SELECT 1 FROM kups_records ku_s 
          WHERE ku_s.lembaga_id = k.id AND ku_s.nama_kups ILIKE $${pIdx}
        )
      )`);
      params.push(term);
      pIdx++;
    }

    // Filter Kelas KUPS (lembaga must have at least one KUPS with this tier)
    if (kelas && typeof kelas === 'string' && kelas.trim() !== '') {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM kups_records ku_k 
        WHERE ku_k.lembaga_id = k.id AND ku_k.kelas = $${pIdx}
      )`);
      params.push(kelas.trim().toUpperCase());
      pIdx++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Allowed sort columns
    let orderClause = 'lk.total_nilai DESC, k.nama_lembaga ASC';
    const dir = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    if (sortBy === 'jumlah_kups') {
      orderClause = `lk.jumlah_kups ${dir}, k.nama_lembaga ASC`;
    } else if (sortBy === 'luas_total') {
      orderClause = `k.luas_total ${dir}, k.nama_lembaga ASC`;
    } else if (sortBy === 'nama_lembaga') {
      orderClause = `k.nama_lembaga ${dir}`;
    } else {
      orderClause = `lk.total_nilai ${dir}, k.nama_lembaga ASC`;
    }

    // Count query
    const countSql = `
      SELECT COUNT(DISTINCT k.id) as total
      FROM kps_records k
      JOIN kups_records ku ON ku.lembaga_id = k.id
      ${whereClause}
    `;
    const countRes = await pool.query(countSql, params);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    // Data query with aggregated KUPS list
    const dataSql = `
      WITH filtered_lembaga AS (
        SELECT DISTINCT k.id
        FROM kps_records k
        JOIN kups_records ku ON ku.lembaga_id = k.id
        ${whereClause}
      ),
      kups_agg AS (
        SELECT 
          ku.lembaga_id,
          ku.id as kups_id,
          ku.nama_kups,
          ku.kelas,
          COALESCE(SUM(p.nilai_ekonomi_rupiah), 0) as kups_nilai,
          COUNT(p.id) as kups_transaksi,
          STRING_AGG(DISTINCT p.komoditas, ', ') as kups_komoditas,
          jsonb_array_length(COALESCE(ku.source_payload->'potensi', '[]'::jsonb)) as potensi_count,
          jsonb_array_length(COALESCE(ku.source_payload->'produk', '[]'::jsonb)) as produk_count
        FROM kups_records ku
        JOIN filtered_lembaga fl ON fl.id = ku.lembaga_id
        LEFT JOIN kps_production_records p ON (p.kups_detail_id IS NOT NULL AND ku.source_payload->>'detail_id' = p.kups_detail_id)
        GROUP BY ku.lembaga_id, ku.id, ku.nama_kups, ku.kelas, ku.source_payload
      ),
      lembaga_kups AS (
        SELECT 
          lembaga_id,
          COUNT(kups_id) as jumlah_kups,
          COALESCE(SUM(kups_nilai), 0) as total_nilai,
          COALESCE(SUM(kups_transaksi), 0) as total_transaksi,
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', kups_id,
              'nama_kups', nama_kups,
              'kelas', kelas,
              'nilai_ekonomi', kups_nilai,
              'transaksi_count', kups_transaksi,
              'komoditas', kups_komoditas,
              'potensi_count', potensi_count,
              'produk_count', produk_count
            ) ORDER BY kups_nilai DESC, nama_kups ASC
          ) as kups_list
        FROM kups_agg
        GROUP BY lembaga_id
      )
      SELECT 
        k.id,
        k.nama_lembaga,
        k.surat_keputusan,
        k.skema,
        COALESCE(k.luas_total, 0) as luas_total,
        k.provinsi,
        k.kabupaten,
        k.kecamatan,
        k.desa,
        k.nama_balai,
        k.seksi_wilayah,
        k.nama_ketua,
        k.no_telp,
        COALESCE(k.anggota_pria, 0) as anggota_pria,
        COALESCE(k.anggota_wanita, 0) as anggota_wanita,
        lk.jumlah_kups,
        lk.total_nilai,
        lk.total_transaksi,
        lk.kups_list
      FROM lembaga_kups lk
      JOIN kps_records k ON k.id = lk.lembaga_id
      ORDER BY ${orderClause}
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;

    const dataParams = [...params, limitNum, offset];
    const dataRes = await pool.query(dataSql, dataParams);

    const data = dataRes.rows.map((r) => ({
      id: r.id,
      nama_lembaga: r.nama_lembaga,
      surat_keputusan: r.surat_keputusan || '-',
      skema: r.skema,
      luas_total: parseFloat(r.luas_total) || 0,
      provinsi: r.provinsi,
      kabupaten: r.kabupaten,
      kecamatan: r.kecamatan,
      desa: r.desa,
      nama_balai: r.nama_balai,
      seksi_wilayah: r.seksi_wilayah,
      nama_ketua: r.nama_ketua,
      no_telp: r.no_telp,
      anggota_pria: parseInt(r.anggota_pria, 10) || 0,
      anggota_wanita: parseInt(r.anggota_wanita, 10) || 0,
      total_anggota: (parseInt(r.anggota_pria, 10) || 0) + (parseInt(r.anggota_wanita, 10) || 0),
      jumlah_kups: parseInt(r.jumlah_kups, 10) || 0,
      total_nilai: parseInt(r.total_nilai, 10) || 0,
      total_transaksi: parseInt(r.total_transaksi, 10) || 0,
      kups_list: (r.kups_list || []).map((k: any) => ({
        id: k.id,
        nama_kups: k.nama_kups,
        kelas: k.kelas,
        nilai_ekonomi: parseInt(k.nilai_ekonomi, 10) || 0,
        transaksi_count: parseInt(k.transaksi_count, 10) || 0,
        komoditas: k.komoditas || '',
        potensi_count: parseInt(k.potensi_count, 10) || 0,
        produk_count: parseInt(k.produk_count, 10) || 0,
      })),
    }));

    res.json({
      data,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error: any) {
    console.error('[API Lembaga Error]:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// GET /api/lembaga/:id - Detail of a single Lembaga with full KUPS & products
lembagaRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 1. Fetch Lembaga (KPS) info
    const kpsRes = await pool.query(`
      SELECT 
        id,
        nama_lembaga,
        surat_keputusan,
        tanggal,
        skema,
        luas_total,
        luas_hl,
        luas_hp,
        luas_hpt,
        luas_hpk,
        luas_hk,
        luas_apl,
        provinsi,
        kabupaten,
        kecamatan,
        desa,
        nama_balai,
        seksi_wilayah,
        nama_ketua,
        no_telp,
        anggota_pria,
        anggota_wanita,
        dokumen_rkps,
        source_payload
      FROM kps_records
      WHERE id = $1
      LIMIT 1
    `, [id]);

    if (kpsRes.rows.length === 0) {
      return res.status(404).json({ error: 'Lembaga tidak ditemukan' });
    }

    const kps = kpsRes.rows[0];

    // 2. Fetch KUPS records under this Lembaga
    const kupsRes = await pool.query(`
      SELECT 
        ku.id,
        ku.nama_kups,
        ku.kelas,
        ku.source_payload,
        COALESCE(SUM(p.nilai_ekonomi_rupiah), 0) as total_nilai,
        COUNT(p.id) as transaksi_count,
        STRING_AGG(DISTINCT p.komoditas, ', ') as komoditas_list
      FROM kups_records ku
      LEFT JOIN kps_production_records p ON (p.kups_detail_id IS NOT NULL AND ku.source_payload->>'detail_id' = p.kups_detail_id)
      WHERE ku.lembaga_id = $1
      GROUP BY ku.id, ku.nama_kups, ku.kelas, ku.source_payload
      ORDER BY total_nilai DESC, ku.nama_kups ASC
    `, [id]);

    const kupsList = kupsRes.rows.map((k) => {
      const payload = k.source_payload || {};
      return {
        id: k.id,
        nama_kups: k.nama_kups,
        kelas: k.kelas,
        sk_penetapan: payload.sk_penetapan || '',
        tanggal_penetapan: payload.tanggal_penetapan || '',
        total_nilai: parseInt(k.total_nilai, 10) || 0,
        transaksi_count: parseInt(k.transaksi_count, 10) || 0,
        komoditas_list: k.komoditas_list || '',
        detail_id: payload.detail_id || null,
        potensi: Array.isArray(payload.potensi) ? payload.potensi : [],
        produk: Array.isArray(payload.produk) ? payload.produk : [],
      };
    });

    const totalNilaiLembaga = kupsList.reduce((sum, item) => sum + item.total_nilai, 0);
    const totalTransaksiLembaga = kupsList.reduce((sum, item) => sum + item.transaksi_count, 0);

    res.json({
      data: {
        id: kps.id,
        nama_lembaga: kps.nama_lembaga,
        surat_keputusan: kps.surat_keputusan || '-',
        tanggal: kps.tanggal || '',
        skema: kps.skema,
        luas_total: parseFloat(kps.luas_total) || 0,
        luas_breakdown: {
          hl: parseFloat(kps.luas_hl) || 0,
          hp: parseFloat(kps.luas_hp) || 0,
          hpt: parseFloat(kps.luas_hpt) || 0,
          hpk: parseFloat(kps.luas_hpk) || 0,
          hk: parseFloat(kps.luas_hk) || 0,
          apl: parseFloat(kps.luas_apl) || 0,
        },
        provinsi: kps.provinsi,
        kabupaten: kps.kabupaten,
        kecamatan: kps.kecamatan,
        desa: kps.desa,
        nama_balai: kps.nama_balai,
        seksi_wilayah: kps.seksi_wilayah,
        nama_ketua: kps.nama_ketua,
        no_telp: kps.no_telp,
        anggota_pria: parseInt(kps.anggota_pria, 10) || 0,
        anggota_wanita: parseInt(kps.anggota_wanita, 10) || 0,
        total_anggota: (parseInt(kps.anggota_pria, 10) || 0) + (parseInt(kps.anggota_wanita, 10) || 0),
        dokumen_rkps: kps.dokumen_rkps || '',
        jumlah_kups: kupsList.length,
        total_nilai: totalNilaiLembaga,
        total_transaksi: totalTransaksiLembaga,
        kups_list: kupsList,
      },
    });
  } catch (error: any) {
    console.error('[API Lembaga Detail Error]:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
