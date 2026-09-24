import { Router, Request, Response } from 'express';
import { pool } from '../db.js';

export const leaderboardRouter = Router();

leaderboardRouter.get('/', async (req: Request, res: Response) => {
  try {
    const {
      search,
      provinsi,
      kategori,
      komoditas,
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

    const conditions: string[] = ['p.nilai_ekonomi_rupiah > 0'];
    const params: any[] = [];
    let pIdx = 1;

    if (search && typeof search === 'string' && search.trim() !== '') {
      conditions.push(`(p.kups_nama ILIKE $${pIdx} OR k.nama_lembaga ILIKE $${pIdx} OR p.komoditas ILIKE $${pIdx})`);
      params.push(`%${search.trim()}%`);
      pIdx++;
    }

    if (provinsi && typeof provinsi === 'string' && provinsi.trim() !== '') {
      conditions.push(`k.provinsi ILIKE $${pIdx}`);
      params.push(provinsi.trim());
      pIdx++;
    }

    if (kategori && typeof kategori === 'string' && kategori.trim() !== '') {
      conditions.push(`p.kategori_komoditas = $${pIdx}`);
      params.push(kategori.trim());
      pIdx++;
    }

    if (komoditas && typeof komoditas === 'string' && komoditas.trim() !== '') {
      conditions.push(`p.komoditas ILIKE $${pIdx}`);
      params.push(komoditas.trim());
      pIdx++;
    }

    if (skema && typeof skema === 'string' && skema.trim() !== '') {
      conditions.push(`k.skema ILIKE $${pIdx}`);
      params.push(`%${skema.trim()}%`);
      pIdx++;
    }

    let havingClause = '';
    if (kelas && typeof kelas === 'string' && kelas.trim() !== '') {
      havingClause = `HAVING COALESCE(MAX(ku.kelas), 'EMAS') = $${pIdx}`;
      params.push(kelas.trim().toUpperCase());
      pIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Allowed sort columns
    let orderColumn = 'SUM(p.nilai_ekonomi_rupiah)';
    if (sortBy === 'nama_kups') orderColumn = 'p.kups_nama';
    if (sortBy === 'transaksi_count') orderColumn = 'COUNT(p.id)';

    const dir = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    // Count query
    const countSql = `
      SELECT COUNT(*) as total FROM (
        SELECT p.kups_nama
        FROM kps_production_records p
        JOIN kps_records k ON p.kps_id = k.id
        LEFT JOIN kups_records ku ON p.kps_id = ku.lembaga_id AND LOWER(TRIM(p.kups_nama)) = LOWER(TRIM(ku.nama_kups))
        ${whereClause}
        GROUP BY p.kups_nama, k.nama_lembaga, k.provinsi, k.kabupaten, k.skema
        ${havingClause}
      ) as subq
    `;
    const countRes = await pool.query(countSql, params);
    const total = parseInt(countRes.rows[0]?.total || '0', 10);

    // Data query
    const dataSql = `
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
      LEFT JOIN kups_records ku ON p.kps_id = ku.lembaga_id AND LOWER(TRIM(p.kups_nama)) = LOWER(TRIM(ku.nama_kups))
      ${whereClause}
      GROUP BY p.kups_nama, k.nama_lembaga, k.provinsi, k.kabupaten, k.skema
      ${havingClause}
      ORDER BY ${orderColumn} ${dir}, p.kups_nama ASC
      LIMIT $${pIdx} OFFSET $${pIdx + 1}
    `;

    const dataParams = [...params, limitNum, offset];
    const dataRes = await pool.query(dataSql, dataParams);

    const data = dataRes.rows.map((r) => ({
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
    console.error('[API Leaderboard Error]:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
