import { Router, Request, Response } from 'express';
import { pool } from '../db.js';

export const exportRouter = Router();

exportRouter.get('/progres-tier.csv', async (_req: Request, res: Response) => {
  try {
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

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="rekap-progres-tier-kups-nasional.csv"');

    let csv = 'Provinsi,Total KUPS,Biru,Perak,Emas,Platinum,Total Nilai Ekonomi (Rp),Jumlah Komoditas\n';

    for (const r of provRes.rows) {
      const p = `"${r.provinsi.replace(/"/g, '""')}"`;
      csv += `${p},${r.total_kups},${r.count_biru},${r.count_perak},${r.count_emas},${r.count_platinum},${r.total_nilai_ekonomi},${r.total_komoditas}\n`;
    }

    res.send(csv);
  } catch (err: any) {
    console.error('[Export Progres Tier Error]:', err);
    res.status(500).send('Gagal mengekspor data');
  }
});

exportRouter.get('/leaderboard.csv', async (req: Request, res: Response) => {
  try {
    const { search, provinsi, kategori, skema, kelas } = req.query;

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
        STRING_AGG(DISTINCT p.komoditas, '; ') as komoditas_list,
        STRING_AGG(DISTINCT p.kategori_komoditas, '; ') as kategori_list
      FROM kps_production_records p
      JOIN kps_records k ON p.kps_id = k.id
      LEFT JOIN kups_records ku ON (p.kups_detail_id IS NOT NULL AND ku.source_payload->>'detail_id' = p.kups_detail_id) OR (p.kps_id = ku.lembaga_id AND LOWER(TRIM(p.kups_nama)) = LOWER(TRIM(ku.nama_kups)))
      ${whereClause}
      GROUP BY p.kups_nama, k.nama_lembaga, k.provinsi, k.kabupaten, k.skema
      ${havingClause}
      ORDER BY SUM(p.nilai_ekonomi_rupiah) DESC, p.kups_nama ASC
      LIMIT 1000
    `;

    const dataRes = await pool.query(dataSql, params);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="leaderboard-kups-prestasi.csv"');

    let csv = 'Rank,Nama KUPS,Nama Lembaga,Provinsi,Kabupaten,Skema PS,Kelas,Total Nilai Ekonomi (Rp),Jumlah Transaksi,Komoditas,Kategori\n';

    let rank = 1;
    for (const r of dataRes.rows) {
      const kups = `"${(r.kups_nama || '').replace(/"/g, '""')}"`;
      const lembaga = `"${(r.nama_lembaga || '').replace(/"/g, '""')}"`;
      const prov = `"${(r.provinsi || '').replace(/"/g, '""')}"`;
      const kab = `"${(r.kabupaten || '').replace(/"/g, '""')}"`;
      const skemaVal = `"${(r.skema || '').replace(/"/g, '""')}"`;
      const komoditasVal = `"${(r.komoditas_list || '').replace(/"/g, '""')}"`;
      const kategoriVal = `"${(r.kategori_list || '').replace(/"/g, '""')}"`;

      csv += `${rank},${kups},${lembaga},${prov},${kab},${skemaVal},${r.kelas},${r.total_nilai},${r.transaksi_count},${komoditasVal},${kategoriVal}\n`;
      rank++;
    }

    res.send(csv);
  } catch (err: any) {
    console.error('[Export Leaderboard Error]:', err);
    res.status(500).send('Gagal mengekspor data');
  }
});

exportRouter.get('/lembaga.csv', async (req: Request, res: Response) => {
  try {
    const { search, provinsi, skema, kelas } = req.query;

    const whereConditions: string[] = [];
    const params: any[] = [];
    let pIdx = 1;

    if (provinsi && typeof provinsi === 'string' && provinsi.trim() !== '') {
      whereConditions.push(`k.provinsi ILIKE $${pIdx}`);
      params.push(provinsi.trim());
      pIdx++;
    }

    if (skema && typeof skema === 'string' && skema.trim() !== '') {
      whereConditions.push(`k.skema ILIKE $${pIdx}`);
      params.push(`%${skema.trim()}%`);
      pIdx++;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      whereConditions.push(`(k.nama_lembaga ILIKE $${pIdx} OR k.surat_keputusan ILIKE $${pIdx} OR k.kabupaten ILIKE $${pIdx})`);
      params.push(`%${search.trim()}%`);
      pIdx++;
    }

    if (kelas && typeof kelas === 'string' && kelas.trim() !== '') {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM kups_records ku_k 
        WHERE ku_k.lembaga_id = k.id AND ku_k.kelas = $${pIdx}
      )`);
      params.push(kelas.trim().toUpperCase());
      pIdx++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const sql = `
      WITH kups_agg AS (
        SELECT 
          ku.lembaga_id,
          COUNT(ku.id) as jumlah_kups,
          STRING_AGG(DISTINCT ku.nama_kups || ' (' || ku.kelas || ')', '; ') as kups_list,
          COALESCE(SUM(p.nilai_ekonomi_rupiah), 0) as total_nilai,
          COUNT(p.id) as total_transaksi
        FROM kups_records ku
        LEFT JOIN kps_production_records p ON (p.kups_detail_id IS NOT NULL AND ku.source_payload->>'detail_id' = p.kups_detail_id)
        GROUP BY ku.lembaga_id
      )
      SELECT 
        k.nama_lembaga,
        k.surat_keputusan,
        k.skema,
        k.luas_total,
        k.provinsi,
        k.kabupaten,
        k.kecamatan,
        k.desa,
        k.nama_balai,
        k.nama_ketua,
        COALESCE(k.anggota_pria, 0) + COALESCE(k.anggota_wanita, 0) as total_anggota,
        COALESCE(ka.jumlah_kups, 0) as jumlah_kups,
        ka.kups_list,
        COALESCE(ka.total_nilai, 0) as total_nilai,
        COALESCE(ka.total_transaksi, 0) as total_transaksi
      FROM kps_records k
      JOIN kups_agg ka ON ka.lembaga_id = k.id
      ${whereClause}
      ORDER BY ka.total_nilai DESC, k.nama_lembaga ASC
      LIMIT 1000
    `;

    const result = await pool.query(sql, params);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="direktori-lembaga-kps.csv"');

    let csv = 'Nama Lembaga,Nomor SK,Skema PS,Luas (Ha),Provinsi,Kabupaten,Kecamatan,Desa,Nama Balai,Nama Ketua,Total Anggota,Jumlah KUPS,Daftar KUPS Binaan,Total Nilai Ekonomi (Rp),Jumlah Transaksi\n';

    for (const r of result.rows) {
      const escape = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;
      csv += `${escape(r.nama_lembaga)},${escape(r.surat_keputusan)},${escape(r.skema)},${r.luas_total || 0},${escape(r.provinsi)},${escape(r.kabupaten)},${escape(r.kecamatan)},${escape(r.desa)},${escape(r.nama_balai)},${escape(r.nama_ketua)},${r.total_anggota},${r.jumlah_kups},${escape(r.kups_list)},${r.total_nilai},${r.total_transaksi}\n`;
    }

    res.send(csv);
  } catch (err: any) {
    console.error('[Export Lembaga Error]:', err);
    res.status(500).send('Gagal mengekspor data lembaga');
  }
});
