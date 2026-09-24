export type KupsTier = 'BIRU' | 'PERAK' | 'EMAS' | 'PLATINUM';

export interface OverviewKPI {
  total_kups: number;
  total_kps: number;
  total_nilai_ekonomi: number;
  total_komoditas: number;
  total_provinsi: number;
}

export interface TierDistribution {
  kelas: KupsTier;
  count: number;
  percentage: number;
  description: string;
}

export interface TopCommodity {
  komoditas: string;
  kategori_komoditas: string;
  transaksi_count: number;
  total_nilai: number;
}

export interface LeaderboardItem {
  kups_nama: string;
  nama_lembaga: string;
  provinsi: string;
  kabupaten: string;
  skema: string;
  kelas: KupsTier;
  total_nilai: number;
  transaksi_count: number;
  komoditas_list: string;
  kategori_list: string;
}

export interface OverviewData {
  kpi: OverviewKPI;
  tierDistribution: TierDistribution[];
  topCommodities: TopCommodity[];
  topLeaderboard: LeaderboardItem[];
}

export interface ProvinceStat {
  provinsi: string;
  total_kups: number;
  count_biru: number;
  count_perak: number;
  count_emas: number;
  count_platinum: number;
  total_nilai_ekonomi: number;
  total_komoditas: number;
  top_commodities?: string[];
}

export interface CriteriaItem {
  id: number;
  tier: KupsTier;
  number: number;
  syarat: string;
  penjelasan: string;
  indikator_bukti: string;
  gap_percentage: number;
  status_verifikasi: 'Otomatis GoKUPS' | 'Verifikasi Khusus Lapangan';
}

export interface ProgresTierData {
  summary: {
    total_kups: number;
    biru: number;
    perak: number;
    emas: number;
    platinum: number;
  };
  criteria15: CriteriaItem[];
  provinces: ProvinceStat[];
  bottlenecks: {
    from: KupsTier;
    to: KupsTier;
    label: string;
    gapDescription: string;
    keyHurdles: string[];
    affectedKups: number;
  }[];
}

export interface CommodityItem {
  komoditas: string;
  kategori_komoditas: string;
  count: number;
  total_nilai: number;
}

export interface LembagaKupsItem {
  id: string;
  nama_kups: string;
  kelas: KupsTier;
  nilai_ekonomi: number;
  transaksi_count: number;
  komoditas: string;
  potensi_count?: number;
  produk_count?: number;
}

export interface LembagaItem {
  id: string;
  nama_lembaga: string;
  surat_keputusan: string;
  skema: string;
  luas_total: number;
  provinsi: string;
  kabupaten: string;
  kecamatan: string;
  desa: string;
  nama_balai: string;
  seksi_wilayah: string;
  nama_ketua: string;
  no_telp: string;
  anggota_pria: number;
  anggota_wanita: number;
  total_anggota: number;
  jumlah_kups: number;
  total_nilai: number;
  total_transaksi: number;
  kups_list: LembagaKupsItem[];
}

export interface LembagaDetailKupsItem extends LembagaKupsItem {
  sk_penetapan?: string;
  tanggal_penetapan?: string;
  detail_id?: string;
  potensi: any[];
  produk: any[];
}

export interface LembagaDetail extends Omit<LembagaItem, 'kups_list'> {
  tanggal: string;
  dokumen_rkps: string;
  luas_breakdown: {
    hl: number;
    hp: number;
    hpt: number;
    hpk: number;
    hk: number;
    apl: number;
  };
  kups_list: LembagaDetailKupsItem[];
}

export interface LembagaResponse {
  data: LembagaItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ReadinessCandidate {
  id: string;
  nama_kups: string;
  kelas_sekarang: KupsTier;
  target_kelas: KupsTier;
  lembaga_id: string;
  nama_lembaga: string;
  surat_keputusan: string;
  skema: string;
  provinsi: string;
  kabupaten: string;
  nama_balai: string;
  total_nilai: number;
  transaksi_count: number;
  komoditas_list: string;
  produk_count: number;
  potensi_count: number;
  checklist: {
    kelembagaan_sk: boolean;
    potensi: boolean;
    rkps: boolean;
    produk: boolean;
    nilai_ekonomi: boolean;
    skor: number;
  };
  status_rekomendasi: 'SANGAT_SIAP' | 'SIAP' | 'POTENSIAL' | 'KANDIDAT_AUDIT';
  rekomendasi_tindakan: string;
}

export interface ReadinessResponse {
  pipelineStats: {
    biru_to_perak: {
      total: number;
      sangat_siap: number;
      potensial: number;
    };
    perak_to_emas: {
      total: number;
      sangat_siap: number;
      potensial: number;
    };
    emas_to_platinum: {
      total: number;
      kandidat_audit: number;
    };
  };
  candidates: ReadinessCandidate[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
