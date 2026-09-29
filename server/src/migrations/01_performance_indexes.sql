-- Migration: Performance Indexes for Portal KUPS
-- Created to fix slow queries on production records and KUPS joins

-- 1. Index on kups_records.source_payload->>'detail_id'
CREATE INDEX IF NOT EXISTS idx_kups_records_detail_id 
ON kups_records ((source_payload->>'detail_id'));

-- 2. Index on kps_production_records.kups_detail_id
CREATE INDEX IF NOT EXISTS idx_kps_production_records_detail_id 
ON kps_production_records (kups_detail_id);

-- 3. Index on kps_production_records.nilai_ekonomi_rupiah
CREATE INDEX IF NOT EXISTS idx_kps_production_records_nilai 
ON kps_production_records (nilai_ekonomi_rupiah);

-- 4. Index on kps_production_records.komoditas
CREATE INDEX IF NOT EXISTS idx_kps_production_records_komoditas 
ON kps_production_records (komoditas);

-- 5. Index on kps_production_records.kategori_komoditas
CREATE INDEX IF NOT EXISTS idx_kps_production_records_kategori 
ON kps_production_records (kategori_komoditas);

-- 6. Index on kups_records for fallback matching (lembaga_id, lower(trim(nama_kups)))
CREATE INDEX IF NOT EXISTS idx_kups_records_lembaga_nama 
ON kups_records (lembaga_id, lower(trim(nama_kups)));

-- Analyze tables to update planner statistics
ANALYZE kups_records;
ANALYZE kps_production_records;
ANALYZE kps_records;
