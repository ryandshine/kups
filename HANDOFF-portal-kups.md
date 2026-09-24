# Handoff: Portal KUPS (publik, read-only)

Status: **masih tahap diskusi/brainstorming** — belum ada implementasi produksi,
belum ada folder proyek aktif, belum ada keputusan arsitektur final. Dokumen
ini untuk melanjutkan diskusi di sesi lain tanpa kehilangan konteks.

## Apa yang sedang dirancang

Portal publik baru, **terpisah dari SIPEKAPS** (subdomain sendiri, tanpa
login, read-only) untuk menampilkan progres kelas/tier KUPS (Kelompok Usaha
Perhutanan Sosial) dan peta sebaran komoditas & nilai ekonominya.

Bukan yang dimaksud: alur kerja internal Walidata→Tim Data→Tim Spasial→GoKUPS
dari file `Konsep-Alur-Pengelolaan-Data-PKPS-GoKUPS.pptx` — itu ide terpisah
yang belum dibahas lagi, dicatat sebagai kemungkinan proyek lain nanti.

## Keputusan yang sudah diambil

- **Akses**: publik, tanpa login, read-only (tidak ada input data).
- **Lokasi**: aplikasi/subdomain terpisah dari SIPEKAPS, deploy sendiri.
- **Freshness data**: real-time / live query (bukan snapshot berkala).
- **Sumber data**: database SIPEKAPS (bukan sumber eksternal baru) — arsitektur
  detail (rute publik di `apps/api` yang ada vs backend terpisah) belum
  diputuskan, ditunda sampai folder proyek aktif dibuat.
- **Level detail publik**: campuran — Progres Tier & Peta Sebaran tampil
  **agregat per wilayah saja** (tidak membongkar identitas KUPS individu);
  Leaderboard/showcase prestasi **boleh** tampilkan nama KUPS individu.
- **Desain visual** *(instruksi baru dari user, belum diterapkan ke mockup)*:
  **model flat** (flat design — hindari shadow/gradient/skeuomorphic, warna
  solid, bidang datar) dan **palet warna-warna bumi** (earth tones — coklat
  tanah, hijau lumut/hutan, terracotta, khaki/pasir, dst). Mockup HTML yang
  sudah ada (lihat di bawah) masih pakai palet kerja lama (hijau institusional
  + card dengan shadow tipis) — **perlu direvisi** mengikuti arahan ini.

## Artefak yang sudah dibuat (Claude Artifacts, privat — hanya bisa dibuka pemilik akun)

1. **Dokumen rencana** (Google Docs via Claude Docs):
   https://claude.ai/artifact/1bMeXvBiCm6ciTf52sH2eZ
   — sitemap halaman, keputusan, kriteria tier resmi, pertanyaan terbuka.
2. **Mockup Design canvas** (prototipe wireframe, tool desain Claude):
   https://claude.ai/artifact/SMu6uHtAPLQst6Avnv4BMV
   — 5 artboard/layar (Beranda, Progres Tier, Peta Sebaran, Leaderboard,
   Tentang), masih pakai peta ilustrasi blob (belum direvisi ke peta asli).
3. **Mockup HTML interaktif** (artifact HTML biasa, terasa seperti website
   sungguhan, bisa diklik navigasinya):
   https://claude.ai/artifact/6ipfKNW1MSXMitpZFptAcV (versi 3, per 24 Sep 2026)
   — versi paling mutakhir/lengkap. Peta pakai batas wilayah 38 provinsi asli
   (GeoJSON, CC BY 4.0, sumber:
   github.com/denyherianto/indonesia-geojson-topojson-maps-with-38-provinces).
   Halaman Progres Tier & Tentang sudah dikoreksi mengikuti kriteria resmi
   (lihat bawah). **Belum** direvisi ke arahan flat design + earth tones.

Semua data di ketiga artefak di atas **ilustratif/contoh**, bukan data
produksi SIPEKAPS asli.

## Temuan kritis: kriteria tier KUPS (dari buku saku resmi)

Sumber: `Buku Saku Peningkatan Kelas KUPS.pdf` (folder ini), diterbitkan
Direktorat Pengembangan Usaha Perhutanan Sosial, Ditjen PSKL, Kementerian
Kehutanan, dasar hukum SK Dirjen PSKL No. 32 Tahun 2022, per April 2026.

**Tier ditentukan checklist 15 syarat kumulatif — BUKAN ambang nilai
ekonomi Rp.** Ini koreksi penting dari asumsi awal di mockup pertama.

| Tier | Syarat tambahan (kumulatif dari tier di bawahnya) |
| --- | --- |
| Blue | 1) ditetapkan sebagai KUPS, 2) potensi usaha teridentifikasi, 3) punya RKPS |
| Silver | + 4) punya unit usaha, 5) punya produk/sarana wisata dipasarkan, 6) punya akses modal (swadaya/hibah/pinjaman), 7) punya pasar/wisatawan lokal |
| Gold | + 8) pasar/wisatawan nasional-regional-internasional, 9) pernah jadi pemenang lomba, 10) menyerap tenaga kerja, 11) sertifikasi produk, 12) punya AD/ART, 13) kerjasama usaha (offtaker/BUMDes/dll), 14) bayar PNBP, 15) sudah mencatat Nilai Ekonomi di GoKUPS |
| Platinum | semua syarat Gold + **verifikasi khusus** (bukan checklist otomatis): akses modal terverifikasi + pasar ekspor/wisatawan regional terverifikasi |

Proses penetapan:
- Blue/Silver/Gold: otomatis dari data GoKUPS, diusulkan BPSKL → Direktur
  PUPS, ditetapkan Dirjen PSKL, **2× setahun**.
- Gold→Platinum: **wajib verifikasi manual** (dokumen + lapangan) oleh
  Pusat (Direktorat PUPS) atau Balai PSKL — pakai Formulir 1 (lembar
  verifikasi), Formulir 2 (berita acara), Formulir 3 (profil KUPS Platinum),
  baru terbit sertifikat resmi bertanda tangan Dirjen PSKL.

**Catatan gap**: buku saku ini fokus detail ke Gold/Platinum (judulnya
eksplisit soal itu). Proses/dokumen resmi untuk Blue→Silver dan
Silver→Gold tidak dijelaskan sedetail Gold→Platinum di dokumen ini — kalau
ada buku saku/juknis terpisah untuk kelas bawah, perlu diminta ke user.

Implikasi desain: halaman "Progres Tier" semestinya menampilkan **syarat
checklist mana yang belum terpenuhi** (gap kualitatif), bukan selisih nilai
Rp. Nilai ekonomi tetap relevan sebagai metrik terpisah (halaman Peta
Sebaran & Leaderboard), tapi cuma salah satu dari 15 syarat (biner: sudah
tercatat di GoKUPS atau belum), bukan penentu tier itu sendiri.

## Rencana halaman (sitemap) — v1

1. **Beranda** — statistik nasional, ringkasan distribusi tier, cuplikan peta & leaderboard.
2. **Progres Tier** — agregat per provinsi: jumlah KUPS per tier + syarat checklist yang paling sering belum terpenuhi. Tanpa nama KUPS individu.
3. **Peta Sebaran Komoditas & Nilai Ekonomi** — peta choropleth 38 provinsi, klik → detail komoditas & nilai ekonomi wilayah.
4. **Leaderboard / Sorotan KUPS** — ranking nasional/per-provinsi by nilai ekonomi, nama KUPS ditampilkan.
5. **Tentang / Metodologi** — penjelasan 15 syarat tier + sumber data.

Ide tambahan yang diusulkan tapi belum diputuskan masuk v1: breakdown
komoditas nasional dengan drill-down, tren nilai ekonomi multi-tahun.

## Pertanyaan terbuka (belum dijawab user)

- [ ] Nama portal — belum ada nama kerja.
- [ ] Leaderboard: ranking nasional total saja, atau juga per-komoditas
      (mis. top KUPS madu, top KUPS kopi)?
- [ ] Peta: cukup peta + panel samping saat provinsi diklik, atau perlu
      halaman detail berjenjang (provinsi → kabupaten)?
- [ ] Arsitektur: rute publik baru di `apps/api` SIPEKAPS yang sudah ada
      (opsi A, direkomendasikan) vs backend terpisah penuh (opsi B) — lihat
      dokumen rencana untuk detail trade-off. Diskusi ditunda sampai folder
      proyek aktif dibuat.
- [ ] Buku saku/juknis untuk kriteria Blue→Silver→Gold yang lebih detail
      (kalau ada, di luar yang sudah dibahas di buku saku Gold/Platinum ini).

## Next step yang jelas

Revisi mockup HTML (`portal-kups-website.html`, artifact #3 di atas) untuk
pakai **flat design + palet earth tones**, ganti dari palet hijau
institusional + card shadow yang sekarang.
