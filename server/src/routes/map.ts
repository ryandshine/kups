import { Router, Request, Response } from 'express';
import { pool } from '../db.js';
import { getOrSetCache } from '../cache.js';
import { loadIndonesianProvincesGeoJson, normalizeProvinceName } from '../utils/geojsonLoader.js';

export const mapRouter = Router();

mapRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const data = await getOrSetCache('map_enriched_geojson', 600, async () => {
      // 1. Get stats per province (Optimized CTE avoiding Cartesian product)
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
      `);

      // 2. Get top commodities per province
      const comRes = await pool.query(`
        SELECT 
          k.provinsi,
          p.komoditas,
          p.kategori_komoditas,
          SUM(p.nilai_ekonomi_rupiah) as nilai
        FROM kps_production_records p
        JOIN kps_records k ON p.kps_id = k.id
        WHERE p.komoditas IS NOT NULL AND p.komoditas <> '' AND k.provinsi <> ''
        GROUP BY k.provinsi, p.komoditas, p.kategori_komoditas
        ORDER BY k.provinsi, nilai DESC
      `);

      const topComMap = new Map<string, Array<{ komoditas: string; total_nilai: number; kategori: string }>>();
      for (const row of comRes.rows) {
        const normP = normalizeProvinceName(row.provinsi);
        if (!topComMap.has(normP)) {
          topComMap.set(normP, []);
        }
        const arr = topComMap.get(normP)!;
        if (arr.length < 5) {
          arr.push({
            komoditas: row.komoditas,
            total_nilai: parseInt(row.nilai, 10),
            kategori: row.kategori_komoditas,
          });
        }
      }

      // Map DB stats by normalized province name
      const statsMap = new Map<string, any>();
      for (const row of provRes.rows) {
        const normKey = normalizeProvinceName(row.provinsi);
        statsMap.set(normKey, {
          db_provinsi: row.provinsi,
          total_kups: parseInt(row.total_kups, 10),
          count_biru: parseInt(row.count_biru, 10),
          count_perak: parseInt(row.count_perak, 10),
          count_emas: parseInt(row.count_emas, 10),
          count_platinum: parseInt(row.count_platinum, 10),
          total_nilai_ekonomi: parseInt(row.total_nilai_ekonomi, 10),
          total_komoditas: parseInt(row.total_komoditas, 10),
          top_commodities: topComMap.get(normKey) || [],
        });
      }

      // 3. Load base GeoJSON and enrich properties
      const geoJson = loadIndonesianProvincesGeoJson();
      geoJson.features = geoJson.features.map((feature: any) => {
        const rawName = feature.properties?.PROVINSI || feature.properties?.name || '';
        const normName = normalizeProvinceName(rawName);
        const stats = statsMap.get(normName) || {
          total_kups: 0,
          count_biru: 0,
          count_perak: 0,
          count_emas: 0,
          count_platinum: 0,
          total_nilai_ekonomi: 0,
          total_komoditas: 0,
          top_commodities: [],
        };

        return {
          ...feature,
          properties: {
            ...feature.properties,
            ...stats,
            PROVINSI: rawName,
          },
        };
      });

      return geoJson;
    });

    res.json(data);
  } catch (error: any) {
    console.error('[API Map Error]:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});
