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
