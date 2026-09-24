# Portal KUPS (Publik & Read-Only)

Portal publik terpadu pemantauan capaian kelas **KUPS (Kelompok Usaha Perhutanan Sosial)** dan **Peta Sebaran Komoditas & Nilai Ekonomi Nasional** di bawah Direktorat Pengembangan Usaha Perhutanan Sosial, Ditjen PSKL, Kementerian Kehutanan Republik Indonesia.

- **Domain Target**: `kups.ditpps.com`
- **Akses**: Publik, tanpa login, read-only.
- **Basis Data**: Live Query ke database PostgreSQL `sipekaps` (`kups_records`, `kps_records`, `kps_production_records`).
- **Desain Visual**: Flat design murni (tanpa bayangan/shadow, bidang datar, batas tegas) dengan palet warna-warna bumi (*earth tones*: hijau hutan/lumut, terracotta, coklat tanah/lempung, dan khaki/pasir).

---

## 5 Halaman Utama (Sitemap v1)

1. **Beranda (`#beranda`)**:
   - Indikator utama nasional: 11.711 KUPS terdata, 5.461 Lembaga KPS, Rp 6,03 Triliun akumulasi nilai ekonomi transaksi di GoKUPS, 170 ragam komoditas, dan 38 provinsi.
   - Distribusi 4 kelas KUPS (*Blue*, *Silver*, *Gold*, *Platinum*) lengkap dengan visualisasi persentase dan definisi tahap kemandirian.
   - Cuplikan 5 komoditas terbesar dan 5 KUPS bernilai ekonomi tertinggi.

2. **Progres Tier (`#progres-tier`)**:
   - Matriks interaktif pemenuhan **15 Syarat Kumulatif** berlandaskan **SK Dirjen PSKL No. 32 Tahun 2022** dan **Buku Saku Peningkatan Kelas KUPS (April 2026)**.
   - Analisis kesenjangan (*gap & bottleneck*): faktor penyebab KUPS tertahan di kelas Biru ke Perak, Perak ke Emas, atau Emas ke Platinum.
   - Matriks agregat 38 provinsi (jumlah & persentase Biru, Perak, Emas, Platinum tanpa membongkar identitas individu KUPS sesuai klausul privasi).
   - Fitur unduh rekap agregat CSV.

3. **Peta Sebaran Komoditas & Nilai Ekonomi (`#peta-sebaran`)**:
   - Peta choropleth interaktif 38 batas provinsi Indonesia (GeoJSON asli).
   - Saklar metrik: Gradasi Nilai Transaksi (Rp) vs Gradasi Kepadatan Populasi KUPS (Unit).
   - Panel samping (*drawer profil wilayah*) saat provinsi diklik: rincian KUPS, nilai ekonomi, komposisi 4 tier, dan daftar 5 komoditas unggulan wilayah.

4. **Leaderboard / Sorotan Prestasi KUPS (`#leaderboard`)**:
   - Etalase prestasi KUPS Indonesia dengan nama KUPS dan Lembaga ditampilkan.
   - Filter lengkap: pencarian teks, provinsi (38 provinsi), kategori komoditas (HHBK, HHK, Jasling), skema PS (HD, HKm, HTR, HA, KK), dan kelas tier.
   - Tampilan Tabel & Kartu (*Card View*).
   - Fitur unduh data leaderboard CSV.

5. **Tentang & Metodologi (`#tentang`)**:
   - Landasan hukum SK Dirjen PSKL No. 32/2022.
   - Penjelasan mendalam 15 kriteria kumulatif dan indikator bukti dokumen/fisik.
   - Alur 4 langkah penetapan kelas (Otomatis GoKUPS semesteran vs Verifikasi Lapangan Khusus Platinum memakai Formulir 1, 2, dan 3).
   - Tanya Jawab (*FAQ*).

---

## Struktur Folder

```
/home/ryandshinevps/kups/
├── package.json
├── tsconfig.json
├── pnpm-workspace.yaml
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── indonesia-38-provinces.geojson   # Batas spasial 38 provinsi
├── server/
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                # Express server + SPA static serving
│       ├── db.ts                   # Pool PostgreSQL sipekaps
│       ├── cache.ts                # In-memory TTL cache
│       ├── routes/
│       │   ├── overview.ts         # GET /api/overview
│       │   ├── progresTier.ts      # GET /api/progres-tier
│       │   ├── map.ts              # GET /api/map (enriched GeoJSON)
│       │   ├── leaderboard.ts      # GET /api/leaderboard
│       │   ├── commodities.ts      # GET /api/commodities
│       │   └── export.ts           # GET /api/export/*.csv
│       └── utils/
│           ├── criteria15.ts       # Definisi 15 syarat kumulatif
│           └── geojsonLoader.ts    # Loader & normalisasi provinsi
└── client/
    ├── index.html
    ├── vite.config.ts
    ├── tailwind.config.js          # Flat design & earth tones tokens
    └── src/
        ├── App.tsx                 # Hash routing
        ├── api.ts                  # Typed client fetchers
        ├── components/
        │   ├── Navbar.tsx
        │   ├── Footer.tsx
        │   ├── StatCard.tsx
        │   └── TierBadge.tsx
        └── views/
            ├── BerandaView.tsx
            ├── ProgresTierView.tsx
            ├── PetaSebaranView.tsx
            ├── LeaderboardView.tsx
            └── TentangView.tsx
```

---

## Menjalankan Aplikasi

### Mode Pengembangan (Lokal Host)
```bash
# Instal dependensi & build aset client
pnpm install
pnpm build

# Jalankan server
pnpm start
# atau dengan tsx watch:
pnpm dev
```

Aplikasi dapat dibuka pada `http://localhost:3000` (atau port yang disetel di `.env`).

### Deploy via Docker & Dokploy (Produksi)
Container terhubung ke jaringan internal `dokploy-network` dan `gealgeolgeo-db`, dengan Traefik secara otomatis merutekan HTTPS ke domain `kups.ditpps.com`:
```bash
docker compose up -d --build
```
