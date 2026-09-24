import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { ProgresTierData, KupsTier, ReadinessResponse, ReadinessCandidate, ProvinceStat } from '../types';
import { fetchProgresTier, fetchReadiness, fetchProvinces } from '../api';
import { TierBadge } from '../components/TierBadge';
import { LembagaModal } from '../components/LembagaModal';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Search, 
  Layers, 
  HelpCircle, 
  Filter, 
  ArrowUpDown,
  FileCheck2,
  Building,
  Flame,
  ArrowRight,
  TrendingUp,
  Award,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Package,
  Building2
} from 'lucide-react';

export const ProgresTierView: React.FC = () => {
  // Main view tab: 'readiness' (default) | 'criteria' | 'provinces'
  const [mainTab, setMainTab] = useState<'readiness' | 'criteria' | 'provinces'>('readiness');

  // Core Data
  const [data, setData] = useState<ProgresTierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Readiness Matrix State
  const [targetTier, setTargetTier] = useState<'PERAK' | 'EMAS' | 'PLATINUM' | 'ALL'>('PERAK');
  const [readinessData, setReadinessData] = useState<ReadinessResponse | null>(null);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [readinessSearch, setReadinessSearch] = useState('');
  const [readinessProvinsi, setReadinessProvinsi] = useState('');
  const [readinessPage, setReadinessPage] = useState(1);
  const [provincesList, setProvincesList] = useState<ProvinceStat[]>([]);

  // Criteria Tab State
  const [activeTab, setActiveTab] = useState<KupsTier>('BIRU');

  // Provinces Tab State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'total_kups' | 'count_emas' | 'count_platinum' | 'total_nilai_ekonomi'>('total_kups');
  const [sortAsc, setSortAsc] = useState(false);

  // Modal State
  const [selectedLembagaId, setSelectedLembagaId] = useState<string | null>(null);

  // Load Initial Progres Tier Data & Provinces
  useEffect(() => {
    Promise.all([fetchProgresTier(), fetchProvinces()])
      .then(([tierRes, provRes]) => {
        setData(tierRes);
        setProvincesList(provRes);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Load Readiness Candidates Data
  const loadReadiness = useCallback(() => {
    setReadinessLoading(true);
    fetchReadiness({
      targetTier,
      provinsi: readinessProvinsi,
      search: readinessSearch,
      page: readinessPage,
      limit: 15,
    })
      .then((res) => {
        setReadinessData(res);
        setReadinessLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching readiness:', err);
        setReadinessLoading(false);
      });
  }, [targetTier, readinessProvinsi, readinessSearch, readinessPage]);

  useEffect(() => {
    loadReadiness();
  }, [loadReadiness]);

  const handleReadinessSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setReadinessPage(1);
    loadReadiness();
  };

  const formatNumber = (n: number) => new Intl.NumberFormat('id-ID').format(n || 0);
  const formatRupiah = (val: number) => {
    if (!val) return 'Rp 0';
    if (val >= 1_000_000_000_000) return `Rp ${(val / 1_000_000_000_000).toFixed(2)} T`;
    if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(2)} M`;
    if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(2)} Jt`;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const filteredProvinces = useMemo(() => {
    if (!data?.provinces) return [];
    let list = data.provinces.filter((p) =>
      p.provinsi.toLowerCase().includes(searchTerm.toLowerCase())
    );

    list.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      return sortAsc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

    return list;
  }, [data?.provinces, searchTerm, sortField, sortAsc]);

  const toggleSort = (field: 'total_kups' | 'count_emas' | 'count_platinum' | 'total_nilai_ekonomi') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block p-4 border border-earth-clay bg-white text-earth-clay font-mono text-sm">
          Menghitung pemenuhan 15 kriteria tier & memuat agregat 38 provinsi...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-16 text-center text-red-700 bg-red-50 border border-red-300 p-6 max-w-lg mx-auto">
        <p className="font-bold">Gagal memuat data:</p>
        <p>{error || 'Data tidak tersedia'}</p>
      </div>
    );
  }

  const { summary, criteria15, bottlenecks } = data;
  const filteredCriteria = criteria15.filter((c) => c.tier === activeTab);
  const pipelineStats = readinessData?.pipelineStats;

  const exportReadinessUrl = `/api/export/readiness.csv?targetTier=${targetTier}&provinsi=${encodeURIComponent(readinessProvinsi)}&search=${encodeURIComponent(readinessSearch)}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
      {/* Header Banner */}
      <section className="bg-white border-2 border-earth-sand-border p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-4xl">
            <div className="inline-flex items-center space-x-2 bg-earth-forest text-white text-xs px-2.5 py-1 mb-3">
              <Layers className="w-3.5 h-3.5" />
              <span>STANDAR PENETAPAN RESMI: SK DIRJEN PS NO. 32/2022</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-earth-soil">
              Progres & Matriks Kesiapan Kenaikan Kelas KUPS
            </h1>
            <p className="mt-2 text-sm text-earth-soil-muted leading-relaxed">
              Sesuai Buku Saku Peningkatan Kelas KUPS (Kementerian Kehutanan), peningkatan kelas 
              <strong> tidak diukur semata oleh ambang omzet</strong>, melainkan melalui 
              <strong> pemenuhan 15 kriteria kumulatif</strong>. Fitur ini menyajikan radar KUPS yang telah 
              memenuhi indikator dan siap diusulkan naik kelas pada sidang semesteran Dirjen PS.
            </p>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <a
              href="/api/export/progres-tier.csv"
              download="rekap-progres-tier-kups-nasional.csv"
              className="px-4 py-2.5 bg-earth-forest text-white font-bold text-xs hover:bg-earth-forest-dark flex items-center space-x-1.5 border border-earth-forest-light"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Rekap Wilayah CSV</span>
            </a>
          </div>
        </div>

        {/* 4 Cards Summary Dynamically Calculated */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 pt-6 border-t border-earth-sand-border">
          <div className="p-3 bg-blue-50/50 border border-blue-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900">KELAS BIRU</span>
              <span className="text-xs font-mono font-bold text-blue-700">
                {((summary.biru / summary.total_kups) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-blue-900 mt-1">
              {formatNumber(summary.biru)}
            </div>
            <div className="text-[11px] text-blue-800 mt-1">Syarat 1 s.d. 3 Terpenuhi</div>
          </div>

          <div className="p-3 bg-stone-100 border border-stone-400">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900">KELAS PERAK</span>
              <span className="text-xs font-mono font-bold text-stone-700">
                {((summary.perak / summary.total_kups) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-stone-900 mt-1">
              {formatNumber(summary.perak)}
            </div>
            <div className="text-[11px] text-stone-800 mt-1">Syarat 1 s.d. 7 Terpenuhi</div>
          </div>

          <div className="p-3 bg-amber-50/60 border border-amber-400">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900">KELAS EMAS</span>
              <span className="text-xs font-mono font-bold text-amber-700">
                {((summary.emas / summary.total_kups) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-amber-900 mt-1">
              {formatNumber(summary.emas)}
            </div>
            <div className="text-[11px] text-amber-800 mt-1">15 Syarat Lengkap Terpenuhi</div>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950">KELAS PLATINUM</span>
              <span className="text-xs font-mono font-bold text-emerald-700">
                {((summary.platinum / summary.total_kups) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-950 mt-1">
              {formatNumber(summary.platinum)}
            </div>
            <div className="text-[11px] text-emerald-900 mt-1">Verifikasi Lapangan & SK Pusat</div>
          </div>
        </div>

        {/* Primary View Mode Switcher Tabs */}
        <div className="mt-6 pt-4 border-t border-earth-sand-border">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setMainTab('readiness')}
              className={`px-4 py-2.5 text-xs font-bold flex items-center space-x-2 border-2 transition-all ${
                mainTab === 'readiness'
                  ? 'bg-earth-terracotta text-white border-earth-terracotta shadow-sm'
                  : 'bg-white text-earth-soil border-earth-sand-border hover:bg-earth-sand-surface'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Matriks Radar Kesiapan Naik Kelas</span>
              <span className="px-1.5 py-0.2 bg-white/20 text-white font-mono text-[10px]">
                Prioritas
              </span>
            </button>

            <button
              onClick={() => setMainTab('criteria')}
              className={`px-4 py-2.5 text-xs font-bold flex items-center space-x-2 border-2 transition-all ${
                mainTab === 'criteria'
                  ? 'bg-earth-soil text-white border-earth-soil shadow-sm'
                  : 'bg-white text-earth-soil border-earth-sand-border hover:bg-earth-sand-surface'
              }`}
            >
              <FileCheck2 className="w-4 h-4 text-emerald-400" />
              <span>Analisis 15 Kriteria Kumulatif & Gap</span>
            </button>

            <button
              onClick={() => setMainTab('provinces')}
              className={`px-4 py-2.5 text-xs font-bold flex items-center space-x-2 border-2 transition-all ${
                mainTab === 'provinces'
                  ? 'bg-earth-soil text-white border-earth-soil shadow-sm'
                  : 'bg-white text-earth-soil border-earth-sand-border hover:bg-earth-sand-surface'
              }`}
            >
              <Building className="w-4 h-4 text-amber-400" />
              <span>Rekapitulasi Wilayah & Balai PS (38 Provinsi)</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 1: MATRIKS RADAR KESIAPAN NAIK KELAS (UPGRADE READINESS PIPELINE) */}
      {/* ========================================================================= */}
      {mainTab === 'readiness' && (
        <div className="space-y-6">
          {/* Pipeline Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pipeline 1: Biru to Perak */}
            <div 
              onClick={() => { setTargetTier('PERAK'); setReadinessPage(1); }}
              className={`border-2 p-5 bg-white cursor-pointer transition-all hover:border-blue-500 ${
                targetTier === 'PERAK' ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-earth-sand-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 font-mono text-xs font-bold">
                  PIPELINE 1
                </span>
                <span className="text-xs font-semibold text-blue-700 flex items-center space-x-1">
                  <span>Biru</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Perak</span>
                </span>
              </div>

              <div className="mt-4">
                <div className="text-2xl font-extrabold font-mono text-blue-900">
                  {formatNumber(pipelineStats?.biru_to_perak.sangat_siap || 504)}
                </div>
                <div className="text-xs font-bold text-earth-soil mt-0.5">
                  KUPS Biru Sangat Siap Naik ke Perak
                </div>
                <p className="text-xs text-earth-soil-muted mt-2 leading-relaxed">
                  Telah memiliki <strong>produk riil</strong> dan <strong>mencatatkan nilai transaksi ekonomi</strong> di GoKUPS.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-earth-sand-border flex items-center justify-between text-xs text-earth-soil-muted">
                <span>Total Populasi Biru: {formatNumber(pipelineStats?.biru_to_perak.total || 8562)}</span>
                <span className="font-bold text-blue-800">
                  {((pipelineStats?.biru_to_perak.sangat_siap || 504) / (pipelineStats?.biru_to_perak.total || 8562) * 100).toFixed(1)}% Siap
                </span>
              </div>
            </div>

            {/* Pipeline 2: Perak to Emas */}
            <div 
              onClick={() => { setTargetTier('EMAS'); setReadinessPage(1); }}
              className={`border-2 p-5 bg-white cursor-pointer transition-all hover:border-amber-500 ${
                targetTier === 'EMAS' ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-earth-sand-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 font-mono text-xs font-bold">
                  PIPELINE 2
                </span>
                <span className="text-xs font-semibold text-amber-700 flex items-center space-x-1">
                  <span>Perak</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Emas</span>
                </span>
              </div>

              <div className="mt-4">
                <div className="text-2xl font-extrabold font-mono text-amber-900">
                  {formatNumber(pipelineStats?.perak_to_emas.sangat_siap || 1047)}
                </div>
                <div className="text-xs font-bold text-earth-soil mt-0.5">
                  KUPS Perak Sangat Siap Naik ke Emas
                </div>
                <p className="text-xs text-earth-soil-muted mt-2 leading-relaxed">
                  Telah memiliki <strong>transaksi omzet rutin</strong> dan <strong>katalog produk aktif</strong> di GoKUPS.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-earth-sand-border flex items-center justify-between text-xs text-earth-soil-muted">
                <span>Total Populasi Perak: {formatNumber(pipelineStats?.perak_to_emas.total || 6469)}</span>
                <span className="font-bold text-amber-800">
                  {((pipelineStats?.perak_to_emas.sangat_siap || 1047) / (pipelineStats?.perak_to_emas.total || 6469) * 100).toFixed(1)}% Siap
                </span>
              </div>
            </div>

            {/* Pipeline 3: Emas to Platinum */}
            <div 
              onClick={() => { setTargetTier('PLATINUM'); setReadinessPage(1); }}
              className={`border-2 p-5 bg-white cursor-pointer transition-all hover:border-emerald-600 ${
                targetTier === 'PLATINUM' ? 'border-emerald-600 ring-2 ring-emerald-600/20' : 'border-earth-sand-border'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-950 font-mono text-xs font-bold">
                  PIPELINE 3
                </span>
                <span className="text-xs font-semibold text-emerald-700 flex items-center space-x-1">
                  <span>Emas</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Platinum</span>
                </span>
              </div>

              <div className="mt-4">
                <div className="text-2xl font-extrabold font-mono text-emerald-950">
                  {formatNumber(pipelineStats?.emas_to_platinum.kandidat_audit || 555)}
                </div>
                <div className="text-xs font-bold text-earth-soil mt-0.5">
                  Kandidat Audit Faktual PLATINUM
                </div>
                <p className="text-xs text-earth-soil-muted mt-2 leading-relaxed">
                  Memiliki <strong>omzet besar (&gt;Rp 50 Jt)</strong> dan komoditas pasar luas yang siap audit lapangan Ditjen PS.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-earth-sand-border flex items-center justify-between text-xs text-earth-soil-muted">
                <span>Total Populasi Emas: {formatNumber(pipelineStats?.emas_to_platinum.total || 1648)}</span>
                <span className="font-bold text-emerald-800">
                  {((pipelineStats?.emas_to_platinum.kandidat_audit || 555) / (pipelineStats?.emas_to_platinum.total || 1648) * 100).toFixed(1)}% Layak
                </span>
              </div>
            </div>
          </div>

          {/* Candidates Filter & Table Section */}
          <div className="bg-white border-2 border-earth-sand-border p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-earth-sand-border gap-4">
              <div>
                <h3 className="text-lg font-bold text-earth-soil flex items-center space-x-2">
                  <Award className="w-5 h-5 text-earth-terracotta" />
                  <span>Daftar Nominasi KUPS Siap Naik Kelas ({formatNumber(readinessData?.meta.total || 0)})</span>
                </h3>
                <p className="text-xs text-earth-soil-muted mt-0.5">
                  Penyaringan KUPS yang telah melampaui kriteria kelas asalnya dan layak diusulkan pada sidang semesteran Dirjen PS
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <a
                  href={exportReadinessUrl}
                  download={`nominasi-kups-siap-naik-kelas-${targetTier.toLowerCase()}.csv`}
                  className="px-3.5 py-2 bg-earth-soil text-white font-bold text-xs hover:bg-earth-soil-light flex items-center space-x-1.5 border border-earth-soil-muted"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Unduh Nominasi CSV</span>
                </a>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="mt-4 pt-2 space-y-3">
              <form onSubmit={handleReadinessSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {/* Search */}
                <div className="lg:col-span-2 relative">
                  <input
                    type="text"
                    placeholder="Cari KUPS, Lembaga, atau Kabupaten..."
                    value={readinessSearch}
                    onChange={(e) => setReadinessSearch(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 text-xs border border-earth-sand-border bg-earth-sand-surface focus:outline-none focus:border-earth-terracotta"
                  />
                  <button type="submit" className="absolute right-2.5 top-2.5 text-earth-soil-muted hover:text-earth-soil">
                    <Search className="w-4 h-4" />
                  </button>
                </div>

                {/* Target Tier Filter */}
                <div>
                  <select
                    value={targetTier}
                    onChange={(e) => {
                      setTargetTier(e.target.value as any);
                      setReadinessPage(1);
                    }}
                    className="w-full px-2 py-2 text-xs border border-earth-sand-border bg-earth-sand-surface focus:outline-none focus:border-earth-terracotta font-semibold"
                  >
                    <option value="PERAK">Pipeline: Biru ➔ Perak</option>
                    <option value="EMAS">Pipeline: Perak ➔ Emas</option>
                    <option value="PLATINUM">Pipeline: Emas ➔ Platinum</option>
                    <option value="ALL">Semua Pipeline Kenaikan</option>
                  </select>
                </div>

                {/* Provinsi Filter */}
                <div>
                  <select
                    value={readinessProvinsi}
                    onChange={(e) => {
                      setReadinessProvinsi(e.target.value);
                      setReadinessPage(1);
                    }}
                    className="w-full px-2 py-2 text-xs border border-earth-sand-border bg-earth-sand-surface focus:outline-none focus:border-earth-terracotta"
                  >
                    <option value="">Semua Provinsi</option>
                    {provincesList.map((p) => (
                      <option key={p.provinsi} value={p.provinsi}>
                        {p.provinsi}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <button
                    type="submit"
                    className="w-full py-2 bg-earth-forest text-white font-bold text-xs hover:bg-earth-forest-dark"
                  >
                    Terapkan Filter
                  </button>
                </div>
              </form>
            </div>

            {/* Candidate Table */}
            <div className="mt-5 border border-earth-sand-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-earth-soil text-earth-sand uppercase font-bold tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-3 text-center">Rank</th>
                      <th className="py-3 px-4">Nama KUPS & Lembaga</th>
                      <th className="py-3 px-3">Wilayah & Balai PS</th>
                      <th className="py-3 px-3 text-center">Transisi Kelas</th>
                      <th className="py-3 px-3 text-center">Checklist 5 Indikator</th>
                      <th className="py-3 px-4 text-right">Nilai Transaksi (Rp)</th>
                      <th className="py-3 px-4">Rekomendasi Sidang</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-earth-sand-border">
                    {readinessLoading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-earth-soil-muted font-mono text-xs">
                          Memuat nominasi KUPS siap naik kelas...
                        </td>
                      </tr>
                    ) : (readinessData?.candidates || []).length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-earth-soil-muted text-xs">
                          Tidak ada kandidat KUPS yang sesuai filter.
                        </td>
                      </tr>
                    ) : (
                      (readinessData?.candidates || []).map((cand, idx) => {
                        const rank = ((readinessData?.meta.page || 1) - 1) * (readinessData?.meta.limit || 15) + idx + 1;
                        return (
                          <tr key={cand.id} className="hover:bg-earth-sand/30 transition-colors">
                            <td className="py-3 px-3 text-center font-mono font-bold text-earth-soil-muted">
                              #{rank}
                            </td>

                            <td className="py-3 px-4 max-w-xs">
                              <div className="font-bold text-sm text-earth-soil">
                                {cand.nama_kups}
                              </div>
                              <div 
                                onClick={() => setSelectedLembagaId(cand.lembaga_id)}
                                className="text-[11px] text-earth-forest font-semibold mt-0.5 hover:underline cursor-pointer"
                                title="Klik untuk lihat profil SK Lembaga"
                              >
                                {cand.nama_lembaga}
                              </div>
                              <div className="text-[10px] text-earth-soil-muted font-mono mt-0.5">
                                SK: {cand.surat_keputusan}
                              </div>
                            </td>

                            <td className="py-3 px-3">
                              <div className="font-semibold text-earth-soil">{cand.kabupaten}</div>
                              <div className="text-[10px] text-earth-soil-muted uppercase">{cand.provinsi}</div>
                              {cand.nama_balai && (
                                <div className="text-[10px] text-earth-forest mt-0.5">
                                  {cand.nama_balai}
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-3 text-center">
                              <div className="inline-flex items-center space-x-1.5 bg-earth-sand-surface px-2 py-1 border border-earth-sand-border">
                                <TierBadge tier={cand.kelas_sekarang} size="sm" />
                                <ArrowRight className="w-3 h-3 text-earth-terracotta" />
                                <TierBadge tier={cand.target_kelas} size="sm" />
                              </div>
                              <div className="mt-1">
                                <span className={`text-[10px] font-mono px-1.5 py-0.2 font-bold ${
                                  cand.status_rekomendasi === 'SANGAT_SIAP'
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                    : cand.status_rekomendasi === 'KANDIDAT_AUDIT'
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : 'bg-blue-100 text-blue-900 border border-blue-300'
                                }`}>
                                  {cand.checklist.skor}% Kesiapan
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center space-x-1 font-mono text-[10px]">
                                <span title="SK Penetapan KUPS" className="px-1 py-0.5 bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                                  SK
                                </span>
                                <span 
                                  title={cand.checklist.produk ? `Ada ${cand.produk_count} Produk` : 'Belum ada produk'}
                                  className={`px-1 py-0.5 font-bold border ${cand.checklist.produk ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-stone-100 text-stone-400 border-stone-300'}`}
                                >
                                  PROD
                                </span>
                                <span 
                                  title={cand.checklist.nilai_ekonomi ? 'Omzet Transaksi Aktif' : 'Belum ada omzet'}
                                  className={`px-1 py-0.5 font-bold border ${cand.checklist.nilai_ekonomi ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-stone-100 text-stone-400 border-stone-300'}`}
                                >
                                  RP
                                </span>
                                <span 
                                  title={cand.checklist.potensi ? `Ada ${cand.potensi_count} Potensi` : 'Belum ada potensi'}
                                  className={`px-1 py-0.5 font-bold border ${cand.checklist.potensi ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-stone-100 text-stone-400 border-stone-300'}`}
                                >
                                  POT
                                </span>
                                <span 
                                  title={cand.checklist.rkps ? 'Dokumen RKPS Ada' : 'Belum unggah RKPS'}
                                  className={`px-1 py-0.5 font-bold border ${cand.checklist.rkps ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-stone-100 text-stone-400 border-stone-300'}`}
                                >
                                  RKPS
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="font-mono text-sm font-extrabold text-earth-terracotta">
                                {formatRupiah(cand.total_nilai)}
                              </div>
                              <div className="text-[10px] text-earth-soil-muted truncate max-w-xs" title={cand.komoditas_list}>
                                {cand.komoditas_list || 'Komoditas Terdata'}
                              </div>
                            </td>

                            <td className="py-3 px-4 text-xs text-earth-soil leading-snug max-w-xs">
                              <p className="text-[11px] text-earth-soil-muted">
                                {cand.rekomendasi_tindakan}
                              </p>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {readinessData && readinessData.meta.totalPages > 1 && (
              <div className="mt-4 p-4 border border-earth-sand-border bg-earth-sand-surface flex items-center justify-between text-xs font-mono">
                <div className="text-earth-soil-muted">
                  Halaman {readinessData.meta.page} dari {readinessData.meta.totalPages} (Total {formatNumber(readinessData.meta.total)} kandidat)
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setReadinessPage((p) => Math.max(1, p - 1))}
                    disabled={readinessPage <= 1}
                    className="p-1.5 border border-earth-sand-border bg-white disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 bg-earth-soil text-white font-bold">
                    {readinessPage}
                  </span>
                  <button
                    onClick={() => setReadinessPage((p) => Math.min(readinessData.meta.totalPages, p + 1))}
                    disabled={readinessPage >= readinessData.meta.totalPages}
                    className="p-1.5 border border-earth-sand-border bg-white disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: 15 CUMULATIVE CRITERIA CHECKLIST & BOTTLENECK ANALYSIS         */}
      {/* ========================================================================= */}
      {mainTab === 'criteria' && (
        <div className="space-y-8">
          <section className="bg-white border-2 border-earth-sand-border p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-earth-sand-border gap-2">
              <div>
                <h2 className="text-xl font-bold text-earth-soil flex items-center space-x-2">
                  <FileCheck2 className="w-5 h-5 text-earth-forest" />
                  <span>Matriks 15 Syarat Kumulatif Tingkatan Kelas</span>
                </h2>
                <p className="text-xs text-earth-soil-muted mt-0.5">
                  Pilih kelas untuk memeriksa syarat tambahan yang harus dipenuhi oleh KUPS
                </p>
              </div>
              <div className="flex items-center space-x-1 font-mono text-xs">
                <span className="text-earth-soil-muted">Verifikasi:</span>
                <span className="bg-earth-sand-surface px-2 py-0.5 border border-earth-sand-border">
                  Semesteran GoKUPS
                </span>
              </div>
            </div>

            {/* Tier Tabs */}
            <div className="mt-6 flex flex-wrap gap-2 border-b border-earth-sand-border pb-3">
              {(['BIRU', 'PERAK', 'EMAS', 'PLATINUM'] as KupsTier[]).map((tier) => {
                const isActive = activeTab === tier;
                return (
                  <button
                    key={tier}
                    onClick={() => setActiveTab(tier)}
                    className={`px-4 py-2 font-bold text-xs uppercase tracking-wider border-2 transition-colors ${
                      isActive
                        ? 'border-earth-terracotta bg-earth-terracotta text-white'
                        : 'border-earth-sand-border bg-earth-sand-surface text-earth-soil hover:border-earth-terracotta'
                    }`}
                  >
                    {tier === 'BIRU' && '1. Kelas Biru (3 Syarat Awal)'}
                    {tier === 'PERAK' && '2. Kelas Perak (+4 Syarat / Total 7)'}
                    {tier === 'EMAS' && '3. Kelas Emas (+8 Syarat / Total 15)'}
                    {tier === 'PLATINUM' && '4. Kelas Platinum (Audit Verifikasi)'}
                  </button>
                );
              })}
            </div>

            {/* Criteria Cards Grid */}
            <div className="mt-6 space-y-4">
              <div className="text-xs text-earth-soil-muted p-3 bg-earth-sand-surface border border-earth-sand-border">
                {activeTab === 'BIRU' && (
                  <span>
                    <strong>Kelas Biru (Tahap Awal):</strong> Tahap inisiasi pembentukan kelembagaan KUPS, pengenalan potensi hutan, dan pengesahan RKPS.
                  </span>
                )}
                {activeTab === 'PERAK' && (
                  <span>
                    <strong>Kelas Perak (Tahap Operasional):</strong> Telah memiliki unit usaha berbadan pengurus, produk riil siap edar, akses permodalan, dan pasar tingkat lokal.
                  </span>
                )}
                {activeTab === 'EMAS' && (
                  <span>
                    <strong>Kelas Emas (Tahap Maju/Mandiri):</strong> Memiliki pasar regional/nasional, menyerap tenaga kerja, sertifikasi produk (P-IRT/Halal), kemitraan offtaker, dan mencatat nilai ekonomi di GoKUPS.
                  </span>
                )}
                {activeTab === 'PLATINUM' && (
                  <span>
                    <strong>Kelas Platinum (Tahap Mandiri/Ekspor):</strong> Kelas tertinggi dengan verifikasi dokumen & lapangan khusus oleh Ditjen PS (Form 1, 2, 3) dan memiliki akses ekspor / pasar internasional.
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCriteria.map((c) => (
                  <div
                    key={c.id}
                    className="border border-earth-sand-border p-4 bg-white flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="font-mono text-xs font-bold text-earth-soil bg-earth-sand px-2 py-0.5 border border-earth-sand-border">
                          Syarat #{c.number}
                        </span>
                        <span className="text-[10px] font-mono uppercase bg-earth-sand-surface px-2 py-0.5 text-earth-soil-muted border border-earth-sand-border">
                          {c.status_verifikasi}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-earth-soil mt-2">
                        {c.syarat}
                      </h4>
                      <p className="text-xs text-earth-soil-muted mt-1 leading-relaxed">
                        {c.penjelasan}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-earth-sand-border text-[11px] text-earth-soil">
                      <span className="font-bold text-earth-forest block mb-0.5">Bukti Verifikasi Resmi:</span>
                      <span className="text-earth-soil-muted">{c.indikator_bukti}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Bottlenecks 3 Cards */}
          <section className="bg-white border-2 border-earth-sand-border p-6 sm:p-8">
            <div className="pb-4 border-b border-earth-sand-border">
              <h2 className="text-xl font-bold text-earth-soil flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-earth-terracotta" />
                <span>Analisis Bottleneck Transisi Antar-Kelas</span>
              </h2>
              <p className="text-xs text-earth-soil-muted mt-0.5">
                Kesenjangan pemenuhan syarat yang paling sering menjadi hambatan kenaikan kelas
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {bottlenecks.map((b, idx) => (
                <div
                  key={idx}
                  className="border-2 border-earth-sand-border p-5 bg-earth-sand-surface flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <TierBadge tier={b.from} size="sm" />
                      <span className="text-xs text-earth-soil-muted">&rarr;</span>
                      <TierBadge tier={b.to} size="sm" />
                    </div>

                    <h3 className="font-bold text-sm text-earth-soil mt-2">
                      {b.label}
                    </h3>
                    <p className="text-xs text-earth-soil-muted mt-2 leading-relaxed">
                      {b.gapDescription}
                    </p>

                    <div className="mt-4 pt-3 border-t border-earth-sand-border space-y-1.5">
                      <span className="text-[11px] font-bold text-earth-terracotta block">
                        Faktor Penghambat Utama:
                      </span>
                      {b.keyHurdles.map((h, hIdx) => (
                        <div key={hIdx} className="text-xs text-earth-soil flex items-start space-x-2">
                          <span className="w-1.5 h-1.5 bg-earth-terracotta mt-1.5 shrink-0"></span>
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-earth-sand-border text-[11px] text-earth-clay font-medium">
                    Prioritas pendampingan Balai PS & Penyuluh Kehutanan
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: PROVINCIAL AGGREGATES TABLE (38 PROVINCES)                    */}
      {/* ========================================================================= */}
      {mainTab === 'provinces' && (
        <section className="bg-white border-2 border-earth-sand-border p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-earth-sand-border gap-4">
            <div>
              <h2 className="text-xl font-bold text-earth-soil flex items-center space-x-2">
                <Building className="w-5 h-5 text-earth-forest" />
                <span>Sebaran Komposisi Kelas KUPS per Provinsi (38 Provinsi)</span>
              </h2>
              <p className="text-xs text-earth-soil-muted mt-0.5">
                Data agregat kewilayahan berdasarkan rekapitulasi database resmi GoKUPS
              </p>
            </div>

            {/* Search Input Flat */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Cari provinsi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-3 pr-8 py-2 text-xs border border-earth-sand-border bg-earth-sand-surface focus:outline-none focus:border-earth-terracotta"
              />
              <Search className="w-4 h-4 text-earth-soil-muted absolute right-2.5 top-2.5" />
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-earth-soil text-earth-sand uppercase font-bold tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-3">Provinsi</th>
                  <th
                    onClick={() => toggleSort('total_kups')}
                    className="py-3 px-3 text-right cursor-pointer hover:bg-earth-soil-light"
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Total KUPS</span>
                      <ArrowUpDown className="w-3 h-3 text-earth-terracotta" />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center bg-blue-900/40">Biru</th>
                  <th className="py-3 px-3 text-center bg-stone-700/40">Perak</th>
                  <th
                    onClick={() => toggleSort('count_emas')}
                    className="py-3 px-3 text-center bg-amber-900/40 cursor-pointer hover:bg-amber-900/60"
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Emas</span>
                      <ArrowUpDown className="w-3 h-3 text-amber-300" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('count_platinum')}
                    className="py-3 px-3 text-center bg-emerald-900/40 cursor-pointer hover:bg-emerald-900/60"
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Platinum</span>
                      <ArrowUpDown className="w-3 h-3 text-emerald-300" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort('total_nilai_ekonomi')}
                    className="py-3 px-4 text-right cursor-pointer hover:bg-earth-soil-light"
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Nilai Ekonomi (Rp)</span>
                      <ArrowUpDown className="w-3 h-3 text-earth-terracotta" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-sand-border">
                {filteredProvinces.map((p, idx) => (
                  <tr key={p.provinsi} className="hover:bg-earth-sand/30 transition-colors">
                    <td className="py-3 px-3 font-semibold text-earth-soil">
                      <span className="font-mono text-earth-soil-muted mr-2">{idx + 1}.</span>
                      {p.provinsi}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-earth-soil">
                      {formatNumber(p.total_kups)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-blue-800 bg-blue-50/20">
                      {formatNumber(p.count_biru)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-stone-700 bg-stone-50">
                      {formatNumber(p.count_perak)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-amber-800 bg-amber-50/20 font-bold">
                      {formatNumber(p.count_emas)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-emerald-900 bg-emerald-50/30 font-bold">
                      {p.count_platinum > 0 ? (
                        <span className="px-1.5 py-0.5 bg-emerald-700 text-white font-extrabold text-[11px]">
                          {p.count_platinum}
                        </span>
                      ) : (
                        <span className="text-stone-400">0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-earth-terracotta">
                      {formatRupiah(p.total_nilai_ekonomi)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Lembaga Detail Modal */}
      <LembagaModal
        lembagaId={selectedLembagaId}
        onClose={() => setSelectedLembagaId(null)}
      />
    </div>
  );
};
