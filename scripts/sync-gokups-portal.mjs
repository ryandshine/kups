import { Pool } from 'pg';
import crypto from 'node:crypto';
import fs from 'node:fs';

const BASE_URL = 'https://gokups.hutsos.kehutanan.go.id';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
  'Origin': BASE_URL,
  'X-Requested-With': 'XMLHttpRequest',
  'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
};

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://gealgeolgeo:GeoSecure2026R3set@127.0.0.1:5434/sipekaps';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeSk(sk) {
  if (!sk) return '';
  return sk.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

function skNumberYear(sk) {
  if (!sk) return '';
  const num = (sk.match(/(?:SK|B)[\.\s]*([0-9]+)/i) || [])[1];
  const yr = (sk.match(/(19|20)[0-9]{2}/) || [])[0];
  if (num && yr) return `${num}_${yr}`;
  if (num) return num;
  return '';
}

function normName(s) {
  return (s || '')
    .toUpperCase()
    .replace(/^KUPS\s+/i, '')
    .replace(/^KELOMPOK\s+/i, '')
    .replace(/[^A-Z0-9]/g, '');
}

async function fetchWithRetry(url, params, referer, retries = 3) {
  const reqHeaders = {
    ...HEADERS,
    Referer: referer
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: reqHeaders,
        body: new URLSearchParams(params),
        signal: AbortSignal.timeout(60000)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`[WARN] Attempt ${attempt} failed for ${url}: ${err.message}. Retrying...`);
      await sleep(1500 * attempt);
    }
  }
}

// 1. Fetch all Grading (KUPS + Tier)
async function fetchAllGrading() {
  console.log('\n--- 1. Mengunduh data KUPS & Kelas dari Portal GoKUPS (grading_datatable) ---');
  const grades = [
    { id: '4', name: 'PLATINUM' },
    { id: '3', name: 'EMAS' },
    { id: '2', name: 'PERAK' },
    { id: '1', name: 'BIRU' }
  ];

  const allKups = [];
  const PAGE_SIZE = 2000;

  for (const g of grades) {
    let start = 0;
    let total = 0;
    let draw = 1;

    console.log(`Mengambil kelas ${g.name}...`);
    do {
      const data = await fetchWithRetry(
        `${BASE_URL}/public/chart/grading_datatable`,
        {
          draw: String(draw),
          start: String(start),
          length: String(PAGE_SIZE),
          grade: g.id,
          category: '',
          type: '',
          period: ''
        },
        `${BASE_URL}/public/chart/grading`
      );

      total = Number(data.recordsTotal || 0);
      const rows = data.data || [];

      for (const row of rows) {
        const col1 = row[1] || '';
        const col2 = row[2] || '';

        const detailMatch = col1.match(/detail\/([^\"\' >]+)/);
        const detailId = detailMatch ? detailMatch[1] : '';

        const gradeMatch = col1.match(/>([A-Z]+)<\/span>/);
        const grade = gradeMatch ? gradeMatch[1] : g.name;

        const skMatch = col1.match(/class=\"text-cyan\">\s*(.*?)<\/small>/);
        const sk = skMatch ? skMatch[1].trim() : '';

        let name = col1.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (grade && name.startsWith(grade)) {
          name = name.slice(grade.length).trim();
        }
        if (sk && name.includes(sk)) {
          name = name.replace(sk, '').trim();
        }

        let loc = col2.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const balaiMatch = col2.match(/class=\"text-info\">\s*(.*?)<\/small>/);
        const balai = balaiMatch ? balaiMatch[1].trim() : '';
        if (balai && loc.includes(balai)) {
          loc = loc.replace(balai, '').trim();
        }

        if (detailId) {
          allKups.push({
            detailId,
            grade,
            namaKups: name.toUpperCase(),
            sk,
            lokasi: loc,
            balai
          });
        }
      }

      start += rows.length;
      draw++;
      console.log(` -> Terunduh ${start}/${total} untuk ${g.name}`);
      await sleep(300);
    } while (start < total);
  }

  console.log(`Total KUPS terunduh dari portal: ${allKups.length}`);
  return allKups;
}

// 2. Fetch all Potency
async function fetchAllPotency() {
  console.log('\n--- 2. Mengunduh data Potensi Komoditas dari Portal GoKUPS (potency_datatable) ---');
  const potencyMap = new Map();
  const PAGE_SIZE = 2000;
  let start = 0;
  let total = 0;
  let draw = 1;

  do {
    const data = await fetchWithRetry(
      `${BASE_URL}/public/chart/potency_datatable/`,
      {
        draw: String(draw),
        start: String(start),
        length: String(PAGE_SIZE)
      },
      `${BASE_URL}/public/chart/potency`
    );

    total = Number(data.recordsTotal || 0);
    const rows = data.data || [];

    for (const r of rows) {
      const col1 = r[1] || '';
      const col3 = r[3] || '';
      const col4 = r[4] || '';

      const detailMatch = col1.match(/detail\/([^\"\' >]+)/);
      const detailId = detailMatch ? detailMatch[1] : '';

      const priorityMatch = col3.match(/>\s*([A-Z]+)\s*<\/span>/);
      const priority = priorityMatch ? priorityMatch[1] : '';

      const catMatch = col3.match(/class=\"text-info\">\s*(.*?)<\/small>/);
      const category = catMatch ? catMatch[1].trim() : '';

      let comm = col3.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (priority && comm.startsWith(priority)) comm = comm.slice(priority.length).trim();
      if (category && comm.includes(category)) comm = comm.replace(category, '').trim();

      if (detailId) {
        if (!potencyMap.has(detailId)) potencyMap.set(detailId, []);
        potencyMap.get(detailId).push({
          komoditas: comm,
          kategori: category,
          prioritas: priority,
          volume: col4
        });
      }
    }

    start += rows.length;
    draw++;
    console.log(` -> Terunduh ${start}/${total} data potensi`);
    await sleep(300);
  } while (start < total);

  console.log(`Total KUPS dengan data potensi: ${potencyMap.size}`);
  return potencyMap;
}

// 3. Fetch all Producing
async function fetchAllProducing() {
  console.log('\n--- 3. Mengunduh data Hasil Produk dari Portal GoKUPS (producing_datatable) ---');
  const producingMap = new Map();
  const PAGE_SIZE = 2000;
  let start = 0;
  let total = 0;
  let draw = 1;

  do {
    const data = await fetchWithRetry(
      `${BASE_URL}/public/chart/producing_datatable/`,
      {
        draw: String(draw),
        start: String(start),
        length: String(PAGE_SIZE)
      },
      `${BASE_URL}/public/chart/producing`
    );

    total = Number(data.recordsTotal || 0);
    const rows = data.data || [];

    for (const r of rows) {
      const col1 = r[1] || '';
      const col3 = r[3] || '';
      const col4 = r[4] || '';

      const detailMatch = col1.match(/detail\/([^\"\' >]+)/);
      const detailId = detailMatch ? detailMatch[1] : '';

      const yearMatch = col3.match(/>\s*([0-9, ]+)\s*<\/span>/);
      const year = yearMatch ? yearMatch[1].trim() : '';

      const catMatch = col3.match(/class=\"text-info\">\s*(.*?)<\/small>/);
      const category = catMatch ? catMatch[1].trim() : '';

      let prod = col3.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (year && prod.startsWith(year)) prod = prod.slice(year.length).trim();
      if (category && prod.includes(category)) prod = prod.replace(category, '').trim();

      if (detailId) {
        if (!producingMap.has(detailId)) producingMap.set(detailId, []);
        producingMap.get(detailId).push({
          namaProduk: prod,
          kategori: category,
          periode: year,
          volume: col4
        });
      }
    }

    start += rows.length;
    draw++;
    console.log(` -> Terunduh ${start}/${total} data produksi`);
    await sleep(300);
  } while (start < total);

  console.log(`Total KUPS dengan data produk: ${producingMap.size}`);
  return producingMap;
}

// 4. Main sync runner
async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`\n======================================================`);
  console.log(`SINKRONISASI KUPS PORTAL GOKUPS -> SIPEKAPS POSTGRESQL`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN (Simulasi, tidak mengubah DB)' : 'EKSEKUSI PENUH (Update Database)'}`);
  console.log(`======================================================\n`);

  const pool = new Pool({ connectionString: DATABASE_URL });

  // 1. Load KPS records for candidate matching
  console.log('Memuat data master kps_records...');
  const kpsRes = await pool.query('SELECT id, nama_lembaga, surat_keputusan, provinsi, kabupaten FROM kps_records');
  const kpsById = new Map();
  for (const k of kpsRes.rows) kpsById.set(k.id, k);

  const exactMap = new Map();
  const numYrMap = new Map();
  const addCandidate = (map, key, id) => {
    if (!key) return;
    const list = map.get(key);
    if (list) list.push(id);
    else map.set(key, [id]);
  };

  for (const k of kpsRes.rows) {
    addCandidate(exactMap, normalizeSk(k.surat_keputusan), k.id);
    addCandidate(numYrMap, skNumberYear(k.surat_keputusan), k.id);
  }
  console.log(`Total kps_records: ${kpsRes.rows.length}`);

  // 2. Fetch GoKUPS data
  const gokupsList = await fetchAllGrading();
  const potencyMap = await fetchAllPotency();
  const producingMap = await fetchAllProducing();

  // 3. Load existing kups_records
  console.log('\nMemuat data existing kups_records...');
  const existingKupsRes = await pool.query('SELECT id, lembaga_id, nama_kups, kelas, source_payload FROM kups_records');
  
  // Index existing by:
  // a) source_payload->>'detail_id'
  // b) (lembaga_id, normName(nama_kups))
  const existingByDetailId = new Map();
  const existingByLembagaAndName = new Map();

  for (const r of existingKupsRes.rows) {
    const dId = r.source_payload?.detail_id;
    if (dId) {
      existingByDetailId.set(dId, r);
    }
    const key = `${r.lembaga_id}||${normName(r.nama_kups)}`;
    if (!existingByLembagaAndName.has(key)) {
      existingByLembagaAndName.set(key, r);
    }
  }
  console.log(`Total existing kups_records: ${existingKupsRes.rows.length}`);

  // 4. Plan Updates & Inserts
  let matchedKps = 0;
  let unmatchedKps = 0;
  let willUpdate = 0;
  let willInsert = 0;
  let tierChanges = 0;

  const toUpdate = [];
  const toInsert = [];

  for (const g of gokupsList) {
    // Match KPS
    const exactIds = exactMap.get(normalizeSk(g.sk)) || [];
    const numYrIds = exactIds.length === 0 ? (numYrMap.get(skNumberYear(g.sk)) || []) : [];
    const candidates = exactIds.length > 0 ? exactIds : numYrIds;

    let targetKpsId = null;
    if (candidates.length === 1) {
      targetKpsId = candidates[0];
    } else if (candidates.length > 1) {
      // Disambiguate by location
      const gLokasi = (g.lokasi || '').toUpperCase();
      const matchedByLoc = candidates.filter((id) => {
        const kps = kpsById.get(id);
        if (!kps) return false;
        const prov = (kps.provinsi || '').toUpperCase();
        const kab = (kps.kabupaten || '').toUpperCase();
        return (prov && gLokasi.includes(prov)) || (kab && gLokasi.includes(kab));
      });
      targetKpsId = matchedByLoc.length > 0 ? matchedByLoc[0] : candidates[0];
    }

    if (!targetKpsId) {
      unmatchedKps++;
      continue;
    }
    matchedKps++;

    const gPotensi = potencyMap.get(g.detailId) || [];
    const gProduk = producingMap.get(g.detailId) || [];

    // Find existing kups record
    let existing = existingByDetailId.get(g.detailId);
    if (!existing) {
      existing = existingByLembagaAndName.get(`${targetKpsId}||${normName(g.namaKups)}`);
    }

    if (existing) {
      willUpdate++;
      if (existing.kelas.toUpperCase() !== g.grade.toUpperCase()) {
        tierChanges++;
      }
      toUpdate.push({
        id: existing.id,
        lembaga_id: targetKpsId,
        nama_kups: g.namaKups,
        kelas: g.grade,
        potensi: gPotensi.length > 0 ? gPotensi : (existing.potensi || []),
        produk: gProduk.length > 0 ? gProduk : (existing.produk || []),
        detail_id: g.detailId,
        sk: g.sk,
        lokasi: g.lokasi,
        balai: g.balai
      });
    } else {
      willInsert++;
      // Deterministic unique ID for new KUPS
      const newId = crypto.createHash('sha256').update(g.detailId).digest('hex').slice(0, 24);
      toInsert.push({
        id: newId,
        lembaga_id: targetKpsId,
        nama_kups: g.namaKups,
        kelas: g.grade,
        potensi: gPotensi,
        produk: gProduk,
        detail_id: g.detailId,
        sk: g.sk,
        lokasi: g.lokasi,
        balai: g.balai
      });
    }
  }

  console.log('\n================ HASIL ANALISIS ================');
  console.log(`Total KUPS dari GoKUPS       : ${gokupsList.length}`);
  console.log(`Berhasil match ke KPS aktif : ${matchedKps}`);
  console.log(`Tidak match ke KPS          : ${unmatchedKps}`);
  console.log(`KUPS yang akan di-UPDATE    : ${toUpdate.length}`);
  console.log(`Perubahan Kelas / Tier      : ${tierChanges}`);
  console.log(`KUPS baru yang akan di-INSERT: ${toInsert.length}`);
  console.log(`Proyeksi Total KUPS akhir   : ${toUpdate.length + toInsert.length}`);
  console.log('================================================\n');

  if (isDryRun) {
    console.log('[DRY RUN] Selesai. Database tidak diubah.');
    await pool.end();
    return;
  }

  // 5. Execute DB write in chunks
  console.log('Memulai eksekusi penulisan ke database PostgreSQL...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Batch update
    console.log(`Memproses update ${toUpdate.length} record...`);
    const UPDATE_CHUNK = 500;
    for (let i = 0; i < toUpdate.length; i += UPDATE_CHUNK) {
      const chunk = toUpdate.slice(i, i + UPDATE_CHUNK);
      for (const item of chunk) {
        await client.query(
          `UPDATE kups_records SET
            kelas = $1,
            nama_kups = $2,
            potensi = $3::jsonb,
            produk = $4::jsonb,
            synced_at = NOW(),
            source_payload = jsonb_set(
              COALESCE(source_payload, '{}'::jsonb),
              '{detail_id}',
              to_jsonb($5::text)
            )
           WHERE id = $6`,
          [
            item.kelas,
            item.nama_kups,
            JSON.stringify(item.potensi),
            JSON.stringify(item.produk),
            item.detail_id,
            item.id
          ]
        );
      }
      console.log(` -> Terupdate ${Math.min(i + UPDATE_CHUNK, toUpdate.length)}/${toUpdate.length}`);
    }

    // Batch insert
    console.log(`Memproses insert ${toInsert.length} record KUPS baru...`);
    const INSERT_CHUNK = 500;
    for (let i = 0; i < toInsert.length; i += INSERT_CHUNK) {
      const chunk = toInsert.slice(i, i + INSERT_CHUNK);
      for (const item of chunk) {
        const payload = {
          detail_id: item.detail_id,
          sk: item.sk,
          lokasi: item.lokasi,
          balai: item.balai,
          source: 'gokups_portal'
        };

        await client.query(
          `INSERT INTO kups_records (
            id, lembaga_id, nama_kups, kelas, potensi, produk,
            synced_at, source_payload
          ) VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, NOW(), $7::jsonb)
          ON CONFLICT (id) DO UPDATE SET
            kelas = EXCLUDED.kelas,
            nama_kups = EXCLUDED.nama_kups,
            potensi = EXCLUDED.potensi,
            produk = EXCLUDED.produk,
            synced_at = NOW()`,
          [
            item.id,
            item.lembaga_id,
            item.nama_kups,
            item.kelas,
            JSON.stringify(item.potensi),
            JSON.stringify(item.produk),
            JSON.stringify(payload)
          ]
        );
      }
      console.log(` -> Ter-insert ${Math.min(i + INSERT_CHUNK, toInsert.length)}/${toInsert.length}`);
    }

    await client.query('COMMIT');
    console.log('\n[SUKSES] Transaksi database berhasil di-COMMIT!');

    // Check final counts
    const finalRes = await client.query(`
      SELECT 
        COUNT(*) as total_kups,
        COUNT(DISTINCT lembaga_id) as total_kps,
        COUNT(CASE WHEN kelas = 'BIRU' THEN 1 END) as count_biru,
        COUNT(CASE WHEN kelas = 'PERAK' THEN 1 END) as count_perak,
        COUNT(CASE WHEN kelas = 'EMAS' THEN 1 END) as count_emas,
        COUNT(CASE WHEN kelas = 'PLATINUM' THEN 1 END) as count_platinum
      FROM kups_records;
    `);

    console.log('\n=== STATISTIK AKHIR KUPS_RECORDS ===');
    console.log(JSON.stringify(finalRes.rows[0], null, 2));

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n[ERROR] Terjadi kesalahan saat menulis ke database. Transaksi di-ROLLBACK!', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
