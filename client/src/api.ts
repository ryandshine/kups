import { OverviewData, ProgresTierData, ProvinceStat, LeaderboardItem, CommodityItem } from './types';

const API_BASE = '/api';

export async function fetchOverview(): Promise<OverviewData> {
  const res = await fetch(`${API_BASE}/overview`);
  if (!res.ok) throw new Error('Gagal memuat ringkasan overview');
  return res.json();
}

export async function fetchProgresTier(): Promise<ProgresTierData> {
  const res = await fetch(`${API_BASE}/progres-tier`);
  if (!res.ok) throw new Error('Gagal memuat data progres tier');
  return res.json();
}

export async function fetchMapGeoJson(): Promise<any> {
  const res = await fetch(`${API_BASE}/map`);
  if (!res.ok) throw new Error('Gagal memuat peta GeoJSON');
  return res.json();
}

export async function fetchProvinces(): Promise<ProvinceStat[]> {
  const res = await fetch(`${API_BASE}/provinces`);
  if (!res.ok) throw new Error('Gagal memuat data provinsi');
  return res.json();
}

export interface LeaderboardQuery {
  search?: string;
  provinsi?: string;
  kategori?: string;
  komoditas?: string;
  skema?: string;
  kelas?: string;
  sortBy?: 'total_nilai' | 'nama_kups' | 'transaksi_count';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface LeaderboardResponse {
  data: LeaderboardItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function fetchLeaderboard(params: LeaderboardQuery = {}): Promise<LeaderboardResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.provinsi) query.set('provinsi', params.provinsi);
  if (params.kategori) query.set('kategori', params.kategori);
  if (params.komoditas) query.set('komoditas', params.komoditas);
  if (params.skema) query.set('skema', params.skema);
  if (params.kelas) query.set('kelas', params.kelas);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());

  const res = await fetch(`${API_BASE}/leaderboard?${query.toString()}`);
  if (!res.ok) throw new Error('Gagal memuat leaderboard KUPS');
  return res.json();
}

export async function fetchCommodities(): Promise<CommodityItem[]> {
  const res = await fetch(`${API_BASE}/commodities`);
  if (!res.ok) throw new Error('Gagal memuat daftar komoditas');
  return res.json();
}

export interface LembagaQuery {
  search?: string;
  provinsi?: string;
  skema?: string;
  kelas?: string;
  sortBy?: 'total_nilai' | 'jumlah_kups' | 'luas_total' | 'nama_lembaga';
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export async function fetchLembaga(params: LembagaQuery = {}): Promise<LembagaResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.provinsi) query.set('provinsi', params.provinsi);
  if (params.skema) query.set('skema', params.skema);
  if (params.kelas) query.set('kelas', params.kelas);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());

  const res = await fetch(`${API_BASE}/lembaga?${query.toString()}`);
  if (!res.ok) throw new Error('Gagal memuat data lembaga');
  return res.json();
}

export async function fetchLembagaDetail(id: string): Promise<{ data: LembagaDetail }> {
  const res = await fetch(`${API_BASE}/lembaga/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error('Gagal memuat detail lembaga');
  return res.json();
}

export interface ReadinessQuery {
  targetTier?: 'PERAK' | 'EMAS' | 'PLATINUM' | 'ALL';
  provinsi?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function fetchReadiness(params: ReadinessQuery = {}): Promise<import('./types').ReadinessResponse> {
  const query = new URLSearchParams();
  if (params.targetTier) query.set('targetTier', params.targetTier);
  if (params.provinsi) query.set('provinsi', params.provinsi);
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());

  const res = await fetch(`${API_BASE}/progres-tier/readiness?${query.toString()}`);
  if (!res.ok) throw new Error('Gagal memuat matriks kesiapan kenaikan kelas');
  return res.json();
}
