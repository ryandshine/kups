import React, { useEffect, useState } from 'react';
import { OverviewData } from '../types';
import { fetchOverview } from '../api';
import { StatCard } from '../components/StatCard';
import { TierBadge } from '../components/TierBadge';
import { 
  Building2, 
  Banknote, 
  Sprout, 
  Map, 
  Award, 
  ArrowRight, 
  TrendingUp, 
  CheckCircle2, 
  Layers, 
  AlertCircle 
} from 'lucide-react';

interface BerandaViewProps {
  onNavigate: (tab: string) => void;
}

export const BerandaView: React.FC<BerandaViewProps> = ({ onNavigate }) => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOverview()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const formatRupiah = (val: number) => {
    if (val >= 1_000_000_000_000) {
      return `Rp ${(val / 1_000_000_000_000).toFixed(2)} T`;
    }
    if (val >= 1_000_000_000) {
      return `Rp ${(val / 1_000_000_000).toFixed(2)} M`;
    }
    if (val >= 1_000_000) {
      return `Rp ${(val / 1_000_000).toFixed(2)} Jt`;
    }
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block p-4 border border-earth-clay bg-white text-earth-clay font-mono text-sm">
          Menghubungkan ke database SIPEKAPS... Memuat ringkasan nasional...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block p-6 border-2 border-red-600 bg-red-50 text-red-800 text-sm max-w-md">
          <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
          <p className="font-bold">Gagal memuat data:</p>
          <p className="mt-1">{error || 'Data tidak tersedia'}</p>
        </div>
      </div>
    );
  }

  const { kpi, tierDistribution, topCommodities, topLeaderboard } = data;

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="bg-earth-soil text-earth-sand border-b-4 border-earth-terracotta p-6 sm:p-10">
        <div className="max-w-4xl">
          <div className="inline-flex items-center space-x-2 bg-earth-forest text-white text-xs px-2.5 py-1 mb-4 border border-earth-forest-light">
            <span className="w-1.5 h-1.5 bg-white"></span>
            <span>PORTAL PUBLIK RESMI KEMENTERIAN KEHUTANAN</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight font-sans">
            Monitoring Peningkatan Kelas KUPS & Nilai Ekonomi Nasional
          </h1>
          <p className="mt-4 text-base sm:text-lg text-stone-300 leading-relaxed max-w-3xl">
            Sistem publik terpadu yang menampilkan progres klasifikasi kelas 
            <strong> Blue, Silver, Gold,</strong> hingga <strong>Platinum</strong> bagi 
            11.000+ Kelompok Usaha Perhutanan Sosial (KUPS) di seluruh Indonesia berdasarkan 
            15 kriteria kumulatif SK Dirjen PSKL No. 32/2022.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('progres-tier')}
              className="px-5 py-3 bg-earth-terracotta text-white font-bold text-sm hover:bg-earth-terracotta-dark flex items-center space-x-2 transition-colors border border-earth-terracotta-light"
            >
              <Layers className="w-4 h-4" />
              <span>Lihat Progres Tier Per Provinsi</span>
            </button>
            <button
              onClick={() => onNavigate('peta-sebaran')}
              className="px-5 py-3 bg-earth-forest text-white font-bold text-sm hover:bg-earth-forest-dark flex items-center space-x-2 transition-colors border border-earth-forest-light"
            >
              <Map className="w-4 h-4" />
              <span>Buka Peta Sebaran 38 Provinsi</span>
            </button>
            <button
              onClick={() => onNavigate('leaderboard')}
              className="px-5 py-3 bg-earth-soil-light text-stone-200 font-bold text-sm hover:bg-stone-800 hover:text-white flex items-center space-x-2 transition-colors border border-stone-600"
            >
              <Award className="w-4 h-4" />
              <span>Leaderboard KUPS</span>
            </button>
          </div>
        </div>
      </section>

      {/* KPI 5 Cards Flat Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs uppercase font-extrabold text-earth-clay tracking-widest flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-earth-terracotta"></span>
            <span>INDIKATOR UTAMA NASIONAL (REAL-TIME SIPEKAPS)</span>
          </h2>
          <span className="text-xs text-earth-soil-muted font-mono">
            38 Provinsi Terpetakan
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total KUPS"
            value={formatNumber(kpi.total_kups)}
            subtitle="Unit Usaha Terdaftar"
            icon={<Building2 className="w-5 h-5 text-earth-forest" />}
            accentColor="forest"
            badge="100% Tercatat"
          />
          <StatCard
            title="Lembaga KPS"
            value={formatNumber(kpi.total_kps)}
            subtitle="Induk Pemegang Izin PS"
            icon={<Sprout className="w-5 h-5 text-earth-terracotta" />}
            accentColor="terracotta"
          />
          <StatCard
            title="Nilai Ekonomi"
            value={formatRupiah(kpi.total_nilai_ekonomi)}
            subtitle="Tercatat di GoKUPS"
            icon={<Banknote className="w-5 h-5 text-earth-clay" />}
            accentColor="clay"
            badge="Akumulatif"
          />
          <StatCard
            title="Ragam Komoditas"
            value={kpi.total_komoditas}
            subtitle="HHBK, HHK, Jasling"
            icon={<TrendingUp className="w-5 h-5 text-earth-forest" />}
            accentColor="forest"
          />
          <StatCard
            title="Provinsi Aktif"
            value={`${kpi.total_provinsi} / 38`}
            subtitle="Cakupan Kewilayahan"
            icon={<Map className="w-5 h-5 text-earth-clay" />}
            accentColor="sand"
            badge="Nasional"
          />
        </div>
      </section>

      {/* 4 Tiers Breakdown Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white border-2 border-earth-sand-border p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-earth-sand-border gap-2">
            <div>
              <h2 className="text-xl font-extrabold text-earth-soil tracking-tight flex items-center space-x-2">
                <Layers className="w-5 h-5 text-earth-forest" />
                <span>Distribusi Nasional Kelas KUPS</span>
              </h2>
              <p className="text-xs text-earth-soil-muted mt-1">
                Klasifikasi kemandirian usaha berdasarkan pemenuhan 15 kriteria kumulatif (SK Dirjen PSKL 32/2022)
              </p>
            </div>
            <button
              onClick={() => onNavigate('progres-tier')}
              className="text-xs font-bold text-earth-terracotta hover:underline inline-flex items-center space-x-1"
            >
              <span>Lihat Detail Kriteria & Gap Analisis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Combined Progress Bar Flat */}
          <div className="mt-6">
            <div className="h-6 w-full flex border border-earth-soil-muted overflow-hidden bg-earth-sand">
              {tierDistribution.map((t) => {
                const colors: Record<string, string> = {
                  PLATINUM: 'bg-emerald-700',
                  EMAS: 'bg-amber-500',
                  PERAK: 'bg-stone-500',
                  BIRU: 'bg-blue-600',
                };
                return (
                  <div
                    key={t.kelas}
                    style={{ width: `${t.percentage}%` }}
                    className={`${colors[t.kelas]} h-full relative group transition-all`}
                    title={`${t.kelas}: ${formatNumber(t.count)} KUPS (${t.percentage}%)`}
                  />
                );
              })}
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between text-xs text-earth-soil-muted">
              <span>Rasio Nasional: Blue (36.9%) | Silver (49.5%) | Gold (12.5%) | Platinum (1.0%)</span>
              <span>Total Populasi: {formatNumber(kpi.total_kups)} KUPS</span>
            </div>
          </div>

          {/* 4 Cards Grid */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tierDistribution.map((t) => {
              const borderStyles: Record<string, string> = {
                BIRU: 'border-blue-400 bg-blue-50/40',
                PERAK: 'border-stone-400 bg-stone-50',
                EMAS: 'border-amber-400 bg-amber-50/40',
                PLATINUM: 'border-emerald-600 bg-emerald-50/50',
              };

              return (
                <div
                  key={t.kelas}
                  className={`border-2 p-5 flex flex-col justify-between ${borderStyles[t.kelas]}`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <TierBadge tier={t.kelas} size="sm" />
                      <span className="font-mono text-xs font-bold text-earth-soil-muted">
                        {t.percentage}%
                      </span>
                    </div>
                    <div className="text-3xl font-extrabold font-mono text-earth-soil">
                      {formatNumber(t.count)}
                    </div>
                    <div className="text-xs font-semibold text-earth-soil-muted uppercase mt-0.5">
                      KUPS Terdata
                    </div>
                    <p className="mt-3 text-xs text-earth-soil-muted leading-relaxed">
                      {t.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-earth-sand-border text-[11px] text-earth-soil flex items-center justify-between">
                    <span className="font-medium">Tahap:</span>
                    <span className="font-mono text-earth-soil-muted">
                      {t.kelas === 'BIRU' && '3 Syarat Awal'}
                      {t.kelas === 'PERAK' && '+4 Syarat (Total 7)'}
                      {t.kelas === 'EMAS' && '+8 Syarat (Total 15)'}
                      {t.kelas === 'PLATINUM' && 'Audit Verifikasi Pusat'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Two Column Section: Top Commodities & Top Leaderboard Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Col Left: Top 5 Commodities */}
          <div className="lg:col-span-6 bg-white border-2 border-earth-sand-border p-6">
            <div className="flex items-center justify-between pb-4 border-b border-earth-sand-border">
              <div>
                <h3 className="text-lg font-bold text-earth-soil flex items-center space-x-2">
                  <Sprout className="w-5 h-5 text-earth-forest" />
                  <span>Komoditas Unggulan Terbesar</span>
                </h3>
                <p className="text-xs text-earth-soil-muted mt-0.5">
                  Berdasarkan akumulasi nilai ekonomi transaksi di GoKUPS
                </p>
              </div>
              <button
                onClick={() => onNavigate('peta-sebaran')}
                className="text-xs font-bold text-earth-terracotta hover:underline inline-flex items-center space-x-1"
              >
                <span>Peta Komoditas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-5 divide-y divide-earth-sand-border">
              {topCommodities.map((c, idx) => (
                <div key={c.komoditas} className="py-3.5 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 bg-earth-sand-surface border border-earth-sand-border text-earth-soil font-mono text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-sm text-earth-soil">
                        {c.komoditas}
                      </div>
                      <div className="text-[11px] text-earth-soil-muted uppercase">
                        {c.kategori_komoditas} &bull; {formatNumber(c.transaksi_count)} Transaksi
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-extrabold text-earth-forest">
                      {formatRupiah(c.total_nilai)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-earth-sand-surface border border-earth-sand-border text-xs text-earth-soil-muted leading-relaxed">
              <strong>Catatan GoKUPS:</strong> Hasil Hutan Bukan Kayu (HHBK) mendominasi &gt;95% 
              total nilai perputaran ekonomi komoditas perhutanan sosial nasional.
            </div>
          </div>

          {/* Col Right: Top 5 Leaderboard Preview */}
          <div className="lg:col-span-6 bg-white border-2 border-earth-sand-border p-6">
            <div className="flex items-center justify-between pb-4 border-b border-earth-sand-border">
              <div>
                <h3 className="text-lg font-bold text-earth-soil flex items-center space-x-2">
                  <Award className="w-5 h-5 text-earth-terracotta" />
                  <span>Sorotan Prestasi KUPS Teratas</span>
                </h3>
                <p className="text-xs text-earth-soil-muted mt-0.5">
                  KUPS dengan pencatatan nilai transaksi tertinggi
                </p>
              </div>
              <button
                onClick={() => onNavigate('leaderboard')}
                className="text-xs font-bold text-earth-terracotta hover:underline inline-flex items-center space-x-1"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-5 divide-y divide-earth-sand-border">
              {topLeaderboard.slice(0, 5).map((k, idx) => (
                <div key={`${k.kups_nama}-${idx}`} className="py-3.5 flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <span className="w-6 h-6 bg-earth-terracotta text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-sm text-earth-soil line-clamp-1">
                        {k.kups_nama}
                      </div>
                      <div className="text-[11px] text-earth-soil-muted">
                        {k.kabupaten}, {k.provinsi}
                      </div>
                      <div className="mt-1 flex items-center space-x-1.5">
                        <TierBadge tier={k.kelas} size="sm" />
                        <span className="text-[10px] bg-earth-sand px-1.5 py-0.5 font-mono text-earth-soil-muted border border-earth-sand-border">
                          {k.skema}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-sm font-extrabold text-earth-terracotta">
                      {formatRupiah(k.total_nilai)}
                    </div>
                    <div className="text-[10px] text-earth-soil-muted">
                      {k.komoditas_list || 'Komoditas Terdata'}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-earth-sand-border flex justify-end">
              <button
                onClick={() => onNavigate('leaderboard')}
                className="px-4 py-2 bg-earth-soil text-white font-bold text-xs hover:bg-earth-soil-light flex items-center space-x-2"
              >
                <span>Buka Leaderboard Lengkap (Filter Provinsi & Komoditas)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
