import React, { useEffect, useState, useCallback } from 'react';
import { LeaderboardItem, ProvinceStat } from '../types';
import { fetchLeaderboard, fetchProvinces, LeaderboardResponse } from '../api';
import { TierBadge } from '../components/TierBadge';
import { 
  Trophy, 
  Search, 
  Filter, 
  Download, 
  Building2, 
  MapPin, 
  Banknote, 
  ChevronLeft, 
  ChevronRight, 
  LayoutGrid, 
  List, 
  Sprout,
  ArrowUpDown
} from 'lucide-react';

export const LeaderboardView: React.FC = () => {
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [provinces, setProvinces] = useState<ProvinceStat[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedProvinsi, setSelectedProvinsi] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('');
  const [selectedSkema, setSelectedSkema] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('');
  const [sortBy, setSortBy] = useState<'total_nilai' | 'nama_kups' | 'transaksi_count'>('total_nilai');
  const [page, setPage] = useState(1);

  // Load provinces for filter
  useEffect(() => {
    fetchProvinces().then(setProvinces).catch(console.error);
  }, []);

  const loadData = useCallback(() => {
    setLoading(true);
    fetchLeaderboard({
      search,
      provinsi: selectedProvinsi,
      kategori: selectedKategori,
      skema: selectedSkema,
      kelas: selectedKelas,
      sortBy,
      page,
      limit: 15,
    })
      .then((res: LeaderboardResponse) => {
        setItems(res.data);
        setMeta(res.meta);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [search, selectedProvinsi, selectedKategori, selectedSkema, selectedKelas, sortBy, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedProvinsi('');
    setSelectedKategori('');
    setSelectedSkema('');
    setSelectedKelas('');
    setSortBy('total_nilai');
    setPage(1);
  };

  const formatNumber = (n: number) => new Intl.NumberFormat('id-ID').format(n || 0);
  const formatRupiah = (val: number) => {
    if (!val) return 'Rp 0';
    if (val >= 1_000_000_000_000) return `Rp ${(val / 1_000_000_000_000).toFixed(2)} T`;
    if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(2)} M`;
    if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(2)} Jt`;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const exportUrl = `/api/export/leaderboard.csv?search=${encodeURIComponent(search)}&provinsi=${encodeURIComponent(selectedProvinsi)}&kategori=${encodeURIComponent(selectedKategori)}&skema=${encodeURIComponent(selectedSkema)}&kelas=${encodeURIComponent(selectedKelas)}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
      {/* View Header */}
      <div className="bg-white border-2 border-earth-sand-border p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-earth-terracotta text-white text-xs px-2.5 py-1 mb-2 font-bold">
              <Trophy className="w-3.5 h-3.5" />
              <span>ETALASE PRESTASI KUPS NASIONAL</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-earth-soil">
              Leaderboard & Sorotan KUPS Berprestasi
            </h1>
            <p className="text-xs sm:text-sm text-earth-soil-muted mt-1 max-w-3xl leading-relaxed">
              Daftar pemeringkatan KUPS berdasarkan akumulasi nilai transaksi ekonomi yang tercatat
              dan terverifikasi di sistem GoKUPS. Filter menurut provinsi, komoditas, atau kelas tier.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <a
              href={exportUrl}
              download="leaderboard-kups.csv"
              className="px-4 py-2.5 bg-earth-forest text-white font-bold text-xs hover:bg-earth-forest-dark flex items-center space-x-1.5 border border-earth-forest-light"
            >
              <Download className="w-4 h-4" />
              <span>Unduh CSV Hasil</span>
            </a>
          </div>
        </div>

        {/* Filter Bar Flat */}
        <div className="mt-6 pt-6 border-t border-earth-sand-border space-y-3">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-2 relative">
              <input
                type="text"
                placeholder="Cari nama KUPS atau Lembaga..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-3 pr-8 py-2 text-xs border border-earth-sand-border bg-earth-sand-surface focus:outline-none focus:border-earth-terracotta"
              />
              <button
                type="submit"
                className="absolute right-2.5 top-2.5 text-earth-soil-muted hover:text-earth-soil"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Provinsi */}
            <div>
              <select
                value={selectedProvinsi}
                onChange={(e) => {
                  setSelectedProvinsi(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2 py-2 text-xs border border-earth-sand-border bg-earth-sand-surface focus:outline-none focus:border-earth-terracotta"
              >
                <option value="">Semua Provinsi</option>
                {provinces.map((p) => (
                  <option key={p.provinsi} value={p.provinsi}>
                    {p.provinsi}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Kategori */}
            <div>
              <select
                value={selectedKategori}
                onChange={(e) => {
                  setSelectedKategori(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2 py-2 text-xs border border-earth-sand-border bg-earth-sand-surface focus:outline-none focus:border-earth-terracotta"
              >
                <option value="">Semua Kategori</option>
                <option value="HASIL HUTAN bukan KAYU">HHBK (Bukan Kayu)</option>
                <option value="HASIL HUTAN KAYU">HHK (Hasil Kayu)</option>
                <option value="JASA LINGKUNGAN">Jasa Lingkungan (Jasling)</option>
              </select>
            </div>

            {/* Filter Kelas */}
            <div>
              <select
                value={selectedKelas}
                onChange={(e) => {
                  setSelectedKelas(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2 py-2 text-xs border border-earth-sand-border bg-earth-sand-surface focus:outline-none focus:border-earth-terracotta"
              >
                <option value="">Semua Kelas</option>
                <option value="PLATINUM">Platinum</option>
                <option value="EMAS">Emas</option>
                <option value="PERAK">Perak</option>
                <option value="BIRU">Biru</option>
              </select>
            </div>

            {/* Filter Skema */}
            <div>
              <select
                value={selectedSkema}
                onChange={(e) => {
                  setSelectedSkema(e.target.value);
                  setPage(1);
                }}
                className="w-full px-2 py-2 text-xs border border-earth-sand-border bg-earth-sand-surface focus:outline-none focus:border-earth-terracotta"
              >
                <option value="">Semua Skema PS</option>
                <option value="HUTAN DESA">Hutan Desa (HD)</option>
                <option value="HUTAN KEMASYARAKATAN">Hutan Kemasyarakatan (HKm)</option>
                <option value="HUTAN TANAMAN RAKYAT">Hutan Tanaman Rakyat (HTR)</option>
                <option value="HUTAN ADAT">Hutan Adat (HA)</option>
                <option value="KEMITRAAN KEHUTANAN">Kemitraan Kehutanan (KK)</option>
              </select>
            </div>
          </form>

          {/* Sub-bar: active filter counts & view mode toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-earth-sand-border gap-2 text-xs">
            <div className="flex items-center space-x-2 text-earth-soil-muted font-mono">
              <span>Hasil Ditemukan: <strong>{formatNumber(meta.total)} KUPS</strong></span>
              {(search || selectedProvinsi || selectedKategori || selectedSkema || selectedKelas) && (
                <button
                  onClick={handleResetFilters}
                  className="text-earth-terracotta hover:underline font-bold"
                >
                  (Reset Filter)
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {/* Sort Switcher */}
              <div className="flex items-center space-x-1">
                <span className="text-earth-soil-muted">Urutkan:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="border border-earth-sand-border bg-white text-xs px-2 py-1 font-semibold"
                >
                  <option value="total_nilai">Nilai Tertinggi</option>
                  <option value="transaksi_count">Jumlah Transaksi</option>
                  <option value="nama_kups">Nama KUPS (A-Z)</option>
                </select>
              </div>

              {/* View toggle */}
              <div className="flex items-center border border-earth-sand-border bg-earth-sand-surface">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 ${viewMode === 'table' ? 'bg-earth-soil text-white' : 'text-earth-soil'}`}
                  title="Tampilan Tabel"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 ${viewMode === 'cards' ? 'bg-earth-soil text-white' : 'text-earth-soil'}`}
                  title="Tampilan Kartu"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block p-4 border border-earth-clay bg-white text-earth-clay font-mono text-xs">
            Memuat data leaderboard dari database...
          </div>
        </div>
      ) : error ? (
        <div className="py-12 text-center text-red-700 bg-red-50 border border-red-300 p-4">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center bg-white border-2 border-earth-sand-border p-8 text-earth-soil-muted text-sm">
          <Sprout className="w-10 h-10 text-stone-400 mx-auto mb-2" />
          <p className="font-bold text-earth-soil">Tidak ada KUPS yang sesuai dengan kriteria filter.</p>
          <p className="text-xs mt-1">Coba ubah kata kunci pencarian atau reset filter provinsi dan kategori.</p>
          <button
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 bg-earth-terracotta text-white text-xs font-bold"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Flat Table View */
        <div className="bg-white border-2 border-earth-sand-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-earth-soil text-earth-sand uppercase font-bold tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3 text-center">Rank</th>
                  <th className="py-3 px-4">Nama KUPS & Lembaga</th>
                  <th className="py-3 px-3">Wilayah</th>
                  <th className="py-3 px-3">Skema PS</th>
                  <th className="py-3 px-3 text-center">Kelas</th>
                  <th className="py-3 px-4">Komoditas & Produk</th>
                  <th className="py-3 px-4 text-right">Nilai Transaksi (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-sand-border">
                {items.map((k, idx) => {
                  const rank = (meta.page - 1) * meta.limit + idx + 1;
                  return (
                    <tr key={`${k.kups_nama}-${idx}`} className="hover:bg-earth-sand/30 transition-colors">
                      <td className="py-3 px-3 text-center font-mono">
                        {rank === 1 && (
                          <span className="w-6 h-6 bg-amber-400 text-stone-900 font-extrabold inline-flex items-center justify-center border border-amber-500">
                            1
                          </span>
                        )}
                        {rank === 2 && (
                          <span className="w-6 h-6 bg-stone-300 text-stone-900 font-extrabold inline-flex items-center justify-center border border-stone-400">
                            2
                          </span>
                        )}
                        {rank === 3 && (
                          <span className="w-6 h-6 bg-amber-700 text-white font-extrabold inline-flex items-center justify-center border border-amber-800">
                            3
                          </span>
                        )}
                        {rank > 3 && (
                          <span className="text-earth-soil-muted font-bold font-mono">
                            {rank}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-sm text-earth-soil">
                          {k.kups_nama}
                        </div>
                        <div className="text-[11px] text-earth-soil-muted mt-0.5">
                          Lembaga: {k.nama_lembaga}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-earth-soil">{k.kabupaten}</div>
                        <div className="text-[10px] text-earth-soil-muted uppercase">{k.provinsi}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="bg-earth-sand-surface px-2 py-0.5 border border-earth-sand-border text-[10px] font-mono text-earth-soil font-semibold">
                          {k.skema}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <TierBadge tier={k.kelas} size="sm" />
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-medium text-earth-soil truncate" title={k.komoditas_list}>
                          {k.komoditas_list || '-'}
                        </div>
                        <div className="text-[10px] text-earth-soil-muted uppercase mt-0.5">
                          {k.kategori_list}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="font-mono text-sm font-extrabold text-earth-terracotta">
                          {formatRupiah(k.total_nilai)}
                        </div>
                        <div className="text-[10px] text-earth-soil-muted">
                          {k.transaksi_count} kali pencatatan
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Flat Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((k, idx) => {
            const rank = (meta.page - 1) * meta.limit + idx + 1;
            return (
              <div
                key={`${k.kups_nama}-${idx}`}
                className="bg-white border-2 border-earth-sand-border p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="w-7 h-7 bg-earth-soil text-white font-mono text-xs font-bold flex items-center justify-center">
                      #{rank}
                    </span>
                    <TierBadge tier={k.kelas} size="sm" />
                  </div>

                  <h3 className="font-bold text-base text-earth-soil mt-3 leading-snug">
                    {k.kups_nama}
                  </h3>
                  <div className="text-xs text-earth-soil-muted mt-1">
                    Lembaga: {k.nama_lembaga}
                  </div>

                  <div className="mt-3 flex items-center space-x-1.5 text-xs text-earth-soil-muted">
                    <MapPin className="w-3.5 h-3.5 text-earth-forest shrink-0" />
                    <span>{k.kabupaten}, {k.provinsi}</span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-earth-sand-border text-xs">
                    <div className="text-earth-soil-muted text-[11px] uppercase font-bold">Komoditas:</div>
                    <div className="font-semibold text-earth-soil mt-0.5 line-clamp-2">
                      {k.komoditas_list || '-'}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-earth-sand-border flex items-end justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-earth-soil-muted block">
                      Nilai Transaksi:
                    </span>
                    <div className="text-lg font-mono font-extrabold text-earth-terracotta">
                      {formatRupiah(k.total_nilai)}
                    </div>
                  </div>
                  <span className="text-[10px] bg-earth-sand px-1.5 py-0.5 font-mono text-earth-soil border border-earth-sand-border">
                    {k.skema}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar Flat */}
      {meta.totalPages > 1 && (
        <div className="bg-white border-2 border-earth-sand-border p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div className="text-earth-soil-muted">
            Halaman {meta.page} dari {meta.totalPages} (Total {formatNumber(meta.total)} data)
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 border border-earth-sand-border bg-earth-sand-surface hover:bg-earth-sand disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>

            <span className="px-3 py-1.5 bg-earth-soil text-white font-bold">
              {meta.page}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
              className="px-3 py-1.5 border border-earth-sand-border bg-earth-sand-surface hover:bg-earth-sand disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
