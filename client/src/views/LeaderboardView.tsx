import React, { useEffect, useState, useCallback } from 'react';
import { LeaderboardItem, LembagaItem, ProvinceStat } from '../types';
import { 
  fetchLeaderboard, 
  fetchLembaga, 
  fetchProvinces, 
  LeaderboardResponse, 
  LembagaResponse 
} from '../api';
import { TierBadge } from '../components/TierBadge';
import { LembagaModal } from '../components/LembagaModal';
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
  ChevronDown,
  LayoutGrid, 
  List, 
  Sprout,
  ArrowUpDown,
  Layers,
  ExternalLink,
  ChevronUp,
  Package
} from 'lucide-react';

export const LeaderboardView: React.FC = () => {
  // Main Mode: 'lembaga' (Default) or 'kups'
  const [activeMode, setActiveMode] = useState<'lembaga' | 'kups'>('lembaga');

  // Lembaga Data State
  const [lembagaItems, setLembagaItems] = useState<LembagaItem[]>([]);
  const [lembagaMeta, setLembagaMeta] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [expandedLembaga, setExpandedLembaga] = useState<Set<string>>(new Set());

  // KUPS Data State
  const [kupsItems, setKupsItems] = useState<LeaderboardItem[]>([]);
  const [kupsMeta, setKupsMeta] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });

  // Modal State
  const [selectedLembagaId, setSelectedLembagaId] = useState<string | null>(null);

  // Common States
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
  
  // Sort State
  const [sortByLembaga, setSortByLembaga] = useState<'total_nilai' | 'jumlah_kups' | 'luas_total' | 'nama_lembaga'>('total_nilai');
  const [sortByKups, setSortByKups] = useState<'total_nilai' | 'nama_kups' | 'transaksi_count'>('total_nilai');
  const [page, setPage] = useState(1);

  // Load provinces
  useEffect(() => {
    fetchProvinces().then(setProvinces).catch(console.error);
  }, []);

  // Fetch Lembaga Data
  const loadLembagaData = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchLembaga({
      search,
      provinsi: selectedProvinsi,
      skema: selectedSkema,
      kelas: selectedKelas,
      sortBy: sortByLembaga,
      page,
      limit: 15,
    })
      .then((res: LembagaResponse) => {
        setLembagaItems(res.data);
        setLembagaMeta(res.meta);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [search, selectedProvinsi, selectedSkema, selectedKelas, sortByLembaga, page]);

  // Fetch KUPS Data
  const loadKupsData = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchLeaderboard({
      search,
      provinsi: selectedProvinsi,
      kategori: selectedKategori,
      skema: selectedSkema,
      kelas: selectedKelas,
      sortBy: sortByKups,
      page,
      limit: 15,
    })
      .then((res: LeaderboardResponse) => {
        setKupsItems(res.data);
        setKupsMeta(res.meta);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [search, selectedProvinsi, selectedKategori, selectedSkema, selectedKelas, sortByKups, page]);

  // Trigger data load on mode or dependency change
  useEffect(() => {
    if (activeMode === 'lembaga') {
      loadLembagaData();
    } else {
      loadKupsData();
    }
  }, [activeMode, loadLembagaData, loadKupsData]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    if (activeMode === 'lembaga') {
      loadLembagaData();
    } else {
      loadKupsData();
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedProvinsi('');
    setSelectedKategori('');
    setSelectedSkema('');
    setSelectedKelas('');
    setPage(1);
  };

  const toggleExpandLembaga = (id: string) => {
    setExpandedLembaga((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedLembaga(new Set(lembagaItems.map((l) => l.id)));
  };

  const collapseAll = () => {
    setExpandedLembaga(new Set());
  };

  const formatNumber = (n: number) => new Intl.NumberFormat('id-ID').format(n || 0);
  const formatRupiah = (val: number) => {
    if (!val) return 'Rp 0';
    if (val >= 1_000_000_000_000) return `Rp ${(val / 1_000_000_000_000).toFixed(2)} T`;
    if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(2)} M`;
    if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(2)} Jt`;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const exportUrlLembaga = `/api/export/lembaga.csv?search=${encodeURIComponent(search)}&provinsi=${encodeURIComponent(selectedProvinsi)}&skema=${encodeURIComponent(selectedSkema)}&kelas=${encodeURIComponent(selectedKelas)}`;
  const exportUrlKups = `/api/export/leaderboard.csv?search=${encodeURIComponent(search)}&provinsi=${encodeURIComponent(selectedProvinsi)}&kategori=${encodeURIComponent(selectedKategori)}&skema=${encodeURIComponent(selectedSkema)}&kelas=${encodeURIComponent(selectedKelas)}`;

  const currentMeta = activeMode === 'lembaga' ? lembagaMeta : kupsMeta;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
      {/* Top Banner & Mode Toggle */}
      <div className="bg-white border-2 border-earth-sand-border p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-earth-terracotta text-white text-xs px-2.5 py-1 mb-2 font-bold">
              <Trophy className="w-3.5 h-3.5" />
              <span>DIREKTORI & ETALASE PRESTASI PERHUTANAN SOSIAL</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-earth-soil">
              Direktori Lembaga & Pemeringkatan KUPS
            </h1>
            <p className="text-xs sm:text-sm text-earth-soil-muted mt-1 max-w-3xl leading-relaxed">
              Jelajahi data kelembagaan pemegang izin SK Perhutanan Sosial (KPS) beserta seluruh unit usaha 
              KUPS binaannya. Pantau profil legalitas, sebaran komoditas, dan perputaran nilai ekonomi transaksi riil.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <a
              href={activeMode === 'lembaga' ? exportUrlLembaga : exportUrlKups}
              download={activeMode === 'lembaga' ? 'direktori-lembaga-kps.csv' : 'leaderboard-kups.csv'}
              className="px-4 py-2.5 bg-earth-forest text-white font-bold text-xs hover:bg-earth-forest-dark flex items-center space-x-1.5 border border-earth-forest-light"
            >
              <Download className="w-4 h-4" />
              <span>Unduh CSV {activeMode === 'lembaga' ? 'Lembaga' : 'KUPS'}</span>
            </a>
          </div>
        </div>

        {/* Primary View Switcher Tabs (Lembaga vs KUPS) */}
        <div className="mt-6 pt-4 border-t border-earth-sand-border">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setActiveMode('lembaga');
                setPage(1);
              }}
              className={`px-4 py-2.5 text-xs font-bold flex items-center space-x-2 border-2 transition-all ${
                activeMode === 'lembaga'
                  ? 'bg-earth-soil text-white border-earth-soil shadow-sm'
                  : 'bg-white text-earth-soil border-earth-sand-border hover:bg-earth-sand-surface'
              }`}
            >
              <Building2 className="w-4 h-4 text-earth-terracotta" />
              <span>Berdasarkan Lembaga (KPS)</span>
              <span className={`text-[10px] px-1.5 py-0.2 font-mono ${activeMode === 'lembaga' ? 'bg-earth-soil-light text-earth-sand' : 'bg-earth-sand text-earth-soil'}`}>
                9.866 Lembaga
              </span>
            </button>

            <button
              onClick={() => {
                setActiveMode('kups');
                setPage(1);
              }}
              className={`px-4 py-2.5 text-xs font-bold flex items-center space-x-2 border-2 transition-all ${
                activeMode === 'kups'
                  ? 'bg-earth-soil text-white border-earth-soil shadow-sm'
                  : 'bg-white text-earth-soil border-earth-sand-border hover:bg-earth-sand-surface'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Berdasarkan Unit KUPS</span>
              <span className={`text-[10px] px-1.5 py-0.2 font-mono ${activeMode === 'kups' ? 'bg-earth-soil-light text-earth-sand' : 'bg-earth-sand text-earth-soil'}`}>
                16.822 KUPS
              </span>
            </button>
          </div>
        </div>

        {/* Filter Bar Flat */}
        <div className="mt-4 pt-4 border-t border-earth-sand-border space-y-3">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-2 relative">
              <input
                type="text"
                placeholder={
                  activeMode === 'lembaga'
                    ? 'Cari nama Lembaga, No. SK, atau KUPS...'
                    : 'Cari nama KUPS atau Lembaga...'
                }
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
                <option value="">{activeMode === 'lembaga' ? 'Memiliki KUPS Kelas' : 'Semua Kelas'}</option>
                <option value="PLATINUM">Platinum</option>
                <option value="EMAS">Emas</option>
                <option value="PERAK">Perak</option>
                <option value="BIRU">Biru</option>
              </select>
            </div>

            {/* Filter Kategori (Only in KUPS mode) */}
            {activeMode === 'kups' && (
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
            )}
          </form>

          {/* Sub-bar: Result counts, Expand/Collapse all, and View toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-3 border-t border-earth-sand-border gap-2 text-xs">
            <div className="flex items-center space-x-2 text-earth-soil-muted font-mono">
              <span>
                Hasil Ditemukan:{' '}
                <strong>
                  {formatNumber(currentMeta.total)} {activeMode === 'lembaga' ? 'Lembaga KPS' : 'KUPS'}
                </strong>
              </span>
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
              {/* Accordion Expand/Collapse All buttons (Only in Lembaga Table mode) */}
              {activeMode === 'lembaga' && viewMode === 'table' && (
                <div className="flex items-center space-x-1.5 border-r border-earth-sand-border pr-3">
                  <button
                    onClick={expandAll}
                    className="text-[11px] text-earth-soil hover:text-earth-terracotta font-medium"
                    title="Buka semua anak KUPS"
                  >
                    Buka Semua
                  </button>
                  <span className="text-stone-300">|</span>
                  <button
                    onClick={collapseAll}
                    className="text-[11px] text-earth-soil hover:text-earth-terracotta font-medium"
                    title="Tutup semua anak KUPS"
                  >
                    Tutup Semua
                  </button>
                </div>
              )}

              {/* Sort Switcher */}
              <div className="flex items-center space-x-1">
                <span className="text-earth-soil-muted">Urutkan:</span>
                {activeMode === 'lembaga' ? (
                  <select
                    value={sortByLembaga}
                    onChange={(e) => setSortByLembaga(e.target.value as any)}
                    className="border border-earth-sand-border bg-white text-xs px-2 py-1 font-semibold"
                  >
                    <option value="total_nilai">Nilai Ekonomi Tertinggi</option>
                    <option value="jumlah_kups">Jumlah KUPS Terbanyak</option>
                    <option value="luas_total">Luas Kelola SK (Ha)</option>
                    <option value="nama_lembaga">Nama Lembaga (A-Z)</option>
                  </select>
                ) : (
                  <select
                    value={sortByKups}
                    onChange={(e) => setSortByKups(e.target.value as any)}
                    className="border border-earth-sand-border bg-white text-xs px-2 py-1 font-semibold"
                  >
                    <option value="total_nilai">Nilai Tertinggi</option>
                    <option value="transaksi_count">Jumlah Transaksi</option>
                    <option value="nama_kups">Nama KUPS (A-Z)</option>
                  </select>
                )}
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
            Memuat data {activeMode === 'lembaga' ? 'lembaga perhutanan sosial' : 'leaderboard KUPS'} dari database...
          </div>
        </div>
      ) : error ? (
        <div className="py-12 text-center text-red-700 bg-red-50 border border-red-300 p-4">
          {error}
        </div>
      ) : (activeMode === 'lembaga' ? lembagaItems.length === 0 : kupsItems.length === 0) ? (
        <div className="py-20 text-center bg-white border-2 border-earth-sand-border p-8 text-earth-soil-muted text-sm">
          <Sprout className="w-10 h-10 text-stone-400 mx-auto mb-2" />
          <p className="font-bold text-earth-soil">
            Tidak ada {activeMode === 'lembaga' ? 'lembaga' : 'KUPS'} yang sesuai dengan kriteria filter.
          </p>
          <p className="text-xs mt-1">Coba ubah kata kunci pencarian atau reset filter provinsi dan kategori.</p>
          <button
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 bg-earth-terracotta text-white text-xs font-bold"
          >
            Reset Semua Filter
          </button>
        </div>
      ) : activeMode === 'lembaga' ? (
        /* ================= MODE 1: LEMBAGA VIEW ================= */
        viewMode === 'table' ? (
          /* Lembaga Accordion Table */
          <div className="bg-white border-2 border-earth-sand-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-earth-soil text-earth-sand uppercase font-bold tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3 text-center w-10">Expand</th>
                    <th className="py-3 px-4">Nama Lembaga & No. SK</th>
                    <th className="py-3 px-3">Wilayah</th>
                    <th className="py-3 px-3">Skema & Luas</th>
                    <th className="py-3 px-3 text-center">Unit KUPS</th>
                    <th className="py-3 px-4 text-right">Total Transaksi (Rp)</th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-earth-sand-border">
                  {lembagaItems.map((lem, idx) => {
                    const isExpanded = expandedLembaga.has(lem.id);
                    return (
                      <React.Fragment key={lem.id || idx}>
                        <tr className={`hover:bg-earth-sand/30 transition-colors ${isExpanded ? 'bg-earth-sand-surface' : ''}`}>
                          {/* Toggle Accordion */}
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => toggleExpandLembaga(lem.id)}
                              className="p-1 hover:bg-earth-sand border border-earth-sand-border text-earth-soil transition-colors"
                              title={isExpanded ? 'Tutup rincian KUPS' : 'Lihat rincian KUPS binaan'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-earth-terracotta" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-earth-soil-muted" />
                              )}
                            </button>
                          </td>

                          {/* Lembaga Info */}
                          <td className="py-3 px-4">
                            <div 
                              onClick={() => setSelectedLembagaId(lem.id)}
                              className="font-bold text-sm text-earth-soil hover:text-earth-terracotta cursor-pointer transition-colors"
                            >
                              {lem.nama_lembaga}
                            </div>
                            <div className="text-[11px] text-earth-soil-muted font-mono mt-0.5" title={lem.surat_keputusan}>
                              SK: {lem.surat_keputusan || '-'}
                            </div>
                            {lem.nama_balai && (
                              <div className="text-[10px] text-earth-forest mt-0.5">
                                {lem.nama_balai}
                              </div>
                            )}
                          </td>

                          {/* Location */}
                          <td className="py-3 px-3">
                            <div className="font-semibold text-earth-soil">{lem.kabupaten}</div>
                            <div className="text-[10px] text-earth-soil-muted uppercase">{lem.provinsi}</div>
                          </td>

                          {/* Scheme & Area */}
                          <td className="py-3 px-3">
                            <span className="bg-earth-sand-surface px-2 py-0.5 border border-earth-sand-border text-[10px] font-mono text-earth-soil font-semibold inline-block">
                              {lem.skema}
                            </span>
                            <div className="text-[11px] font-mono text-earth-soil-muted mt-1">
                              {formatNumber(lem.luas_total)} Ha
                            </div>
                          </td>

                          {/* Child KUPS Count & Tiers */}
                          <td className="py-3 px-3 text-center">
                            <div className="inline-flex items-center space-x-1">
                              <span className="font-mono font-extrabold text-sm text-earth-soil">
                                {lem.jumlah_kups}
                              </span>
                              <span className="text-[10px] text-earth-soil-muted">KUPS</span>
                            </div>
                            <div className="flex flex-wrap justify-center gap-1 mt-1">
                              {Array.from(new Set(lem.kups_list.map((k) => k.kelas))).map((tier) => (
                                <TierBadge key={tier} tier={tier} size="sm" />
                              ))}
                            </div>
                          </td>

                          {/* Economic Value */}
                          <td className="py-3 px-4 text-right">
                            <div className="font-mono text-sm font-extrabold text-earth-terracotta">
                              {formatRupiah(lem.total_nilai)}
                            </div>
                            <div className="text-[10px] text-earth-soil-muted">
                              {lem.total_transaksi > 0 ? `${lem.total_transaksi} transaksi` : 'Belum ada transaksi'}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => setSelectedLembagaId(lem.id)}
                              className="px-2.5 py-1 bg-earth-sand hover:bg-earth-terracotta hover:text-white border border-earth-sand-border text-earth-soil font-semibold text-[11px] transition-colors"
                            >
                              Profil SK
                            </button>
                          </td>
                        </tr>

                        {/* Nested Sub-table for Child KUPS */}
                        {isExpanded && (
                          <tr className="bg-earth-sand-surface">
                            <td colSpan={7} className="p-0 border-y border-earth-sand-border">
                              <div className="p-4 pl-12 bg-earth-sand-surface/60 border-l-4 border-earth-terracotta">
                                <div className="text-xs font-bold text-earth-soil mb-2 flex items-center space-x-1.5">
                                  <Package className="w-3.5 h-3.5 text-earth-forest" />
                                  <span>Daftar Unit KUPS Binaan ({lem.kups_list.length} unit):</span>
                                </div>

                                <div className="border border-earth-sand-border bg-white overflow-hidden shadow-sm">
                                  <table className="w-full text-left text-xs">
                                    <thead className="bg-earth-sand text-earth-soil uppercase font-bold text-[10px] border-b border-earth-sand-border">
                                      <tr>
                                        <th className="py-2 px-3">Nama KUPS</th>
                                        <th className="py-2 px-2 text-center">Kelas</th>
                                        <th className="py-2 px-3">Komoditas Utama</th>
                                        <th className="py-2 px-3 text-center">Produk / Potensi</th>
                                        <th className="py-2 px-3 text-right">Nilai Transaksi (Rp)</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-earth-sand-border">
                                      {lem.kups_list.map((k) => (
                                        <tr key={k.id} className="hover:bg-earth-sand/30">
                                          <td className="py-2 px-3 font-semibold text-earth-soil">
                                            {k.nama_kups}
                                          </td>
                                          <td className="py-2 px-2 text-center">
                                            <TierBadge tier={k.kelas} size="sm" />
                                          </td>
                                          <td className="py-2 px-3 text-earth-soil-muted">
                                            {k.komoditas || '-'}
                                          </td>
                                          <td className="py-2 px-3 text-center font-mono text-[11px] text-earth-soil-muted">
                                            {k.produk_count || 0} Produk &bull; {k.potensi_count || 0} Potensi
                                          </td>
                                          <td className="py-2 px-3 text-right font-mono font-bold text-earth-terracotta">
                                            {formatRupiah(k.nilai_ekonomi)}
                                            {k.transaksi_count > 0 && (
                                              <span className="block text-[10px] text-earth-soil-muted font-normal">
                                                ({k.transaksi_count} transaksi)
                                              </span>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Lembaga Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lembagaItems.map((lem, idx) => (
              <div
                key={lem.id || idx}
                className="bg-white border-2 border-earth-sand-border p-5 flex flex-col justify-between hover:border-earth-terracotta transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="bg-earth-soil text-earth-sand text-[10px] px-2 py-0.5 font-mono font-bold">
                      {lem.skema}
                    </span>
                    <button
                      onClick={() => setSelectedLembagaId(lem.id)}
                      className="text-[11px] text-earth-terracotta hover:underline font-bold"
                    >
                      Detail SK &rarr;
                    </button>
                  </div>

                  <h3 
                    onClick={() => setSelectedLembagaId(lem.id)}
                    className="font-bold text-base text-earth-soil mt-2 leading-snug cursor-pointer hover:text-earth-terracotta transition-colors"
                  >
                    {lem.nama_lembaga}
                  </h3>
                  <div className="text-xs text-earth-soil-muted font-mono mt-0.5">
                    SK: {lem.surat_keputusan || '-'}
                  </div>

                  <div className="mt-3 flex items-center space-x-1.5 text-xs text-earth-soil-muted">
                    <MapPin className="w-3.5 h-3.5 text-earth-terracotta shrink-0" />
                    <span>{lem.kabupaten}, {lem.provinsi}</span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-earth-sand-border text-xs">
                    <div className="flex items-center justify-between text-[11px] text-earth-soil-muted">
                      <span>Luas Kelola SK: <strong>{formatNumber(lem.luas_total)} Ha</strong></span>
                      <span>Anggota: <strong>{formatNumber(lem.total_anggota)} Jiwa</strong></span>
                    </div>

                    <div className="mt-3">
                      <div className="text-[10px] uppercase font-bold text-earth-soil-muted mb-1">
                        KUPS Binaan ({lem.jumlah_kups}):
                      </div>
                      <div className="space-y-1.5">
                        {lem.kups_list.slice(0, 3).map((kups) => (
                          <div key={kups.id} className="flex items-center justify-between bg-earth-sand-surface p-1.5 border border-earth-sand-border text-xs">
                            <div className="flex items-center space-x-1.5 truncate pr-2">
                              <TierBadge tier={kups.kelas} size="sm" />
                              <span className="font-semibold text-earth-soil truncate">{kups.nama_kups}</span>
                            </div>
                            <span className="font-mono text-[11px] font-bold text-earth-terracotta shrink-0">
                              {formatRupiah(kups.nilai_ekonomi)}
                            </span>
                          </div>
                        ))}
                        {lem.kups_list.length > 3 && (
                          <div 
                            onClick={() => setSelectedLembagaId(lem.id)}
                            className="text-[11px] text-earth-terracotta hover:underline font-bold cursor-pointer text-center"
                          >
                            +{lem.kups_list.length - 3} KUPS lainnya
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-earth-sand-border flex items-end justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-earth-soil-muted block">
                      Total Akumulasi Transaksi:
                    </span>
                    <div className="text-lg font-mono font-extrabold text-earth-terracotta">
                      {formatRupiah(lem.total_nilai)}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedLembagaId(lem.id)}
                    className="px-3 py-1 bg-earth-forest text-white text-xs font-bold hover:bg-earth-forest-dark"
                  >
                    Profil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* ================= MODE 2: KUPS VIEW ================= */
        viewMode === 'table' ? (
          /* KUPS Flat Table View */
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
                  {kupsItems.map((k, idx) => {
                    const rank = (kupsMeta.page - 1) * kupsMeta.limit + idx + 1;
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
                          <div className="text-[11px] text-earth-forest font-medium mt-0.5">
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
          /* KUPS Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kupsItems.map((k, idx) => {
              const rank = (kupsMeta.page - 1) * kupsMeta.limit + idx + 1;
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
                    <div className="text-xs text-earth-forest font-medium mt-1">
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
        )
      )}

      {/* Pagination Bar Flat */}
      {currentMeta.totalPages > 1 && (
        <div className="bg-white border-2 border-earth-sand-border p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div className="text-earth-soil-muted">
            Halaman {currentMeta.page} dari {currentMeta.totalPages} (Total {formatNumber(currentMeta.total)} data)
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 border border-earth-sand-border bg-earth-sand-surface hover:bg-earth-sand disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1.5 bg-earth-soil text-white font-bold">
              {currentMeta.page}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(currentMeta.totalPages, p + 1))}
              disabled={page >= currentMeta.totalPages}
              className="p-2 border border-earth-sand-border bg-earth-sand-surface hover:bg-earth-sand disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Lembaga Detail Modal */}
      <LembagaModal
        lembagaId={selectedLembagaId}
        onClose={() => setSelectedLembagaId(null)}
      />
    </div>
  );
};
