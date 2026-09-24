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
