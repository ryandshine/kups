export interface CriterionDefinition {
  id: number;
  tier: 'BIRU' | 'PERAK' | 'EMAS' | 'PLATINUM';
  number: number;
  syarat: string;
  penjelasan: string;
  indikator_bukti: string;
  gap_percentage: number;
  status_verifikasi: 'Otomatis GoKUPS' | 'Verifikasi Khusus Lapangan';
}

export const CRITERIA_15_DEFINITIONS: CriterionDefinition[] = [
  // TIER BIRU (1 - 3)
  {
    id: 1,
    tier: 'BIRU',
    number: 1,
    syarat: 'Ditetapkan Sebagai KUPS',
    penjelasan: 'Kelompok telah resmi terdaftar dan ditetapkan sebagai KUPS oleh pengelola persetujuan perhutanan sosial.',
    indikator_bukti: 'SK Penetapan KUPS oleh Kepala Balai PS / SK Pembentukan Kelompok Usaha',
    gap_percentage: 0,
    status_verifikasi: 'Otomatis GoKUPS',
  },
  {
    id: 2,
    tier: 'BIRU',
    number: 2,
    syarat: 'Potensi Usaha Teridentifikasi',
    penjelasan: 'Telah melakukan identifikasi komoditas hasil hutan bukan kayu, kayu, atau jasa lingkungan di areal kerjanya.',
    indikator_bukti: 'Data isian komoditas potensi di GoKUPS / dokumen profil awal KUPS',
    gap_percentage: 24,
    status_verifikasi: 'Otomatis GoKUPS',
  },
  {
    id: 3,
    tier: 'BIRU',
    number: 3,
    syarat: 'Memiliki Dokumen RKPS',
    penjelasan: 'Memiliki Rencana Kerja Perhutanan Sosial (RKPS) yang telah disahkan dan memuat rencana usaha kelompok.',
    indikator_bukti: 'File dokumen RKPS terunggah di sistem SIPEKAPS / GoKUPS',
    gap_percentage: 8,
    status_verifikasi: 'Otomatis GoKUPS',
  },

  // TIER PERAK (4 - 7, kumulatif dari Biru)
  {
    id: 4,
    tier: 'PERAK',
    number: 4,
    syarat: 'Memiliki Unit Usaha Aktif',
    penjelasan: 'Telah membentuk struktur pengelola usaha (manajemen) yang menjalankan kegiatan produksi berkelanjutan.',
    indikator_bukti: 'Struktur kepengurusan unit usaha & berita acara pembentukan unit bisnis',
    gap_percentage: 68,
    status_verifikasi: 'Otomatis GoKUPS',
  },
  {
    id: 5,
    tier: 'PERAK',
    number: 5,
    syarat: 'Memiliki Produk / Sarana Wisata Dipasarkan',
    penjelasan: 'Memiliki barang hasil olahan atau jasa wisata yang telah memiliki wujud produk riil dan kemasan siap jual.',
    indikator_bukti: 'Katalog produk / foto sarana wisata di GoKUPS',
    gap_percentage: 64,
    status_verifikasi: 'Otomatis GoKUPS',
  },
  {
    id: 6,
    tier: 'PERAK',
    number: 6,
    syarat: 'Memiliki Akses Permodalan',
    penjelasan: 'Memperoleh dukungan modal baik swadaya anggota kelompok, hibah pemerintah/CSR, atau pinjaman perbankan/BPDAS.',
    indikator_bukti: 'Buku kas kelompok, bukti rekening usaha, atau surat perjanjian pembiayaan',
    gap_percentage: 75,
    status_verifikasi: 'Otomatis GoKUPS',
  },
  {
    id: 7,
    tier: 'PERAK',
    number: 7,
    syarat: 'Memiliki Pasar / Wisatawan Lokal',
    penjelasan: 'Telah memiliki pembeli rutin atau kunjungan wisatawan di tingkat lokal (desa, kecamatan, atau kabupaten).',
    indikator_bukti: 'Nota penjualan lokal atau buku tamu kunjungan wisata desa',
    gap_percentage: 62,
    status_verifikasi: 'Otomatis GoKUPS',
  },

  // TIER EMAS (8 - 15, kumulatif dari Perak)
  {
    id: 8,
    tier: 'EMAS',
    number: 8,
    syarat: 'Pasar / Wisatawan Nasional & Regional',
    penjelasan: 'Jangkauan pemasaran produk meluas ke tingkat provinsi/antar-pulau atau mendatangkan wisatawan regional.',
    indikator_bukti: 'Faktur pengiriman luar daerah / kemitraan distribusi pasar modern',
    gap_percentage: 85,
    status_verifikasi: 'Otomatis GoKUPS',
  },
  {
    id: 9,
    tier: 'EMAS',
    number: 9,
    syarat: 'Pernah Menjadi Pemenang Lomba / Apresiasi',
    penjelasan: 'Memperoleh piagam penghargaan, juara wirausaha, atau festival produk kehutanan di tingkat daerah/nasional.',
    indikator_bukti: 'Piagam/sertifikat kejuaraan resmi dari instansi pemerintah/lembaga kredibel',
    gap_percentage: 91,
    status_verifikasi: 'Otomatis GoKUPS',
  },
  {
    id: 10,
    tier: 'EMAS',
    number: 10,
    syarat: 'Mampu Menyerap Tenaga Kerja',
    penjelasan: 'Memberikan lapangan kerja berbayar bagi anggota kelompok atau masyarakat sekitar hutan.',
    indikator_bukti: 'Daftar hadir dan bukti slip upah tenaga kerja lokal',
    gap_percentage: 79,
    status_verifikasi: 'Otomatis GoKUPS',
  },
  {
    id: 11,
    tier: 'EMAS',
    number: 11,
    syarat: 'Memiliki Sertifikasi Produk',
    penjelasan: 'Produk telah mengantongi legalitas izin edar seperti P-IRT, Sertifikat Halal, BPOM, atau Standar Nasional (SNI).',
    indikator_bukti: 'Nomor sertifikat izin edar / sertifikat halal MUI-BPJPH / P-IRT Dinkes',
    gap_percentage: 87,
    status_verifikasi: 'Otomatis GoKUPS',
  },
  {
    id: 12,
    tier: 'EMAS',
    number: 12,
    syarat: 'Memiliki Dokumen Legal AD/ART',
    penjelasan: 'Kelompok memiliki Anggaran Dasar dan Anggaran Rumah Tangga (AD/ART) tertulis yang disepakati rapat anggota.',
    indikator_bukti: 'Buku dokumen AD/ART dan berita acara pengesahan musyawarah anggota',
    gap_percentage: 72,
    status_verifikasi: 'Otomatis GoKUPS',
  },
  {
    id: 13,
    tier: 'EMAS',
    number: 13,
    syarat: 'Memiliki Kerjasama Usaha (Offtaker / BUMDes)',
    penjelasan: 'Terikat dalam kesepakatan kerjasama jual-beli (MoU / PKS) dengan penampung hasil (offtaker), koperasi, atau BUMDes.',
    indikator_bukti: 'Surat perjanjian kerjasama (PKS / MoU) yang masih aktif',
    gap_percentage: 78,
    status_verifikasi: 'Otomatis GoKUPS',
  },
  {
    id: 14,
    tier: 'EMAS',
    number: 14,
    syarat: 'Kepatuhan Pembayaran PNBP',
    penjelasan: 'Melunasi kewajiban Penerimaan Negara Bukan Pajak (PNBP) sesuai ketentuan peraturan perundangan kehutanan.',
    indikator_bukti: 'Bukti setor Surat Perintah Pembayaran (SPP) PNBP / Simponi Kemenkeu',
    gap_percentage: 89,
    status_verifikasi: 'Otomatis GoKUPS',
  },
  {
    id: 15,
    tier: 'EMAS',
    number: 15,
    syarat: 'Mencatat Nilai Ekonomi di GoKUPS',
    penjelasan: 'Rutin menginput volume produksi, harga jual, dan omzet transaksi komoditas ke dalam modul produksi GoKUPS.',
    indikator_bukti: 'Rekaman transaksi produksi pada tabel data kps_production_records',
    gap_percentage: 58,
    status_verifikasi: 'Otomatis GoKUPS',
  },

  // TIER PLATINUM (Verifikasi Khusus Lapangan)
  {
    id: 16,
    tier: 'PLATINUM',
    number: 16,
    syarat: 'Verifikasi Khusus Tim Pusat & Akses Ekspor / Internasional',
    penjelasan: 'Semua 15 syarat Emas terpenuhi + lolos audit faktual lapangan (Formulir 1, Formulir 2 BA, Formulir 3 Profil) serta memiliki akses pasar ekspor atau wisatawan mancanegara terverifikasi.',
    indikator_bukti: 'Sertifikat KUPS Platinum bertanda tangan Dirjen PS & dokumen PEB/invoice ekspor',
    gap_percentage: 98,
    status_verifikasi: 'Verifikasi Khusus Lapangan',
  },
];
