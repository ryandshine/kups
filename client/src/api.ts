import { OverviewData, ProgresTierData, ProvinceStat, LeaderboardItem, CommodityItem, LembagaItem, LembagaDetail } from './types';

const API_BASE = '/api';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const clientMemoryCache = new Map<string, CacheEntry<any>>();
const inFlightClientRequests = new Map<string, Promise<any>>();

async function fetchWithClientCache<T>(key: string, url: string, ttlMs: number = 300_000): Promise<T> {
  const now = Date.now();
  const cached = clientMemoryCache.get(key);
  if (cached && now - cached.timestamp < ttlMs) {
    return cached.data;
  }

  if (inFlightClientRequests.has(key)) {
    return inFlightClientRequests.get(key)!;
  }

  const fetchPromise = (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Permintaan gagal (${res.status} ${res.statusText})`);
      }
      const data = await res.json();
      clientMemoryCache.set(key, { data, timestamp: Date.now() });
      return data;
    } finally {
      inFlightClientRequests.delete(key);
    }
  })();

  inFlightClientRequests.set(key, fetchPromise);
  return fetchPromise;
}

export async function fetchOverview(forceRefresh = false): Promise<OverviewData> {
  if (forceRefresh) clientMemoryCache.delete('overview');
  return fetchWithClientCache<OverviewData>('overview', `${API_BASE}/overview`, 180_000);
}

export async function fetchProgresTier(forceRefresh = false): Promise<ProgresTierData> {
  if (forceRefresh) clientMemoryCache.delete('progres-tier');
  return fetchWithClientCache<ProgresTierData>('progres-tier', `${API_BASE}/progres-tier`, 180_000);
}

export async function fetchMapGeoJson(): Promise<any> {
  return fetchWithClientCache<any>('map_geojson', `${API_BASE}/map`, 600_000);
}

export async function fetchProvinces(): Promise<ProvinceStat[]> {
  return fetchWithClientCache<ProvinceStat[]>('provinces_list', `${API_BASE}/provinces`, 600_000);
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

  const queryString = query.toString();
  const cacheKey = `leaderboard_${queryString}`;
  return fetchWithClientCache<LeaderboardResponse>(cacheKey, `${API_BASE}/leaderboard?${queryString}`, 60_000);
}

export async function fetchCommodities(): Promise<CommodityItem[]> {
  return fetchWithClientCache<CommodityItem[]>('commodities_list', `${API_BASE}/commodities`, 300_000);
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

export interface LembagaResponse {
  data: LembagaItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
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

  const queryString = query.toString();
  const cacheKey = `lembaga_${queryString}`;
  return fetchWithClientCache<LembagaResponse>(cacheKey, `${API_BASE}/lembaga?${queryString}`, 60_000);
}

export async function fetchLembagaDetail(id: string): Promise<{ data: LembagaDetail }> {
  const cacheKey = `lembaga_detail_${id}`;
  return fetchWithClientCache<{ data: LembagaDetail }>(cacheKey, `${API_BASE}/lembaga/${encodeURIComponent(id)}`, 120_000);
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

  const queryString = query.toString();
  const cacheKey = `readiness_${queryString}`;
  return fetchWithClientCache<import('./types').ReadinessResponse>(cacheKey, `${API_BASE}/progres-tier/readiness?${queryString}`, 60_000);
}
