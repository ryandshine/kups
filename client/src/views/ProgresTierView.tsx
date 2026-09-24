import React, { useEffect, useState, useMemo } from 'react';
import { ProgresTierData, KupsTier } from '../types';
import { fetchProgresTier } from '../api';
import { TierBadge } from '../components/TierBadge';
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
  Building
} from 'lucide-react';

export const ProgresTierView: React.FC = () => {
  const [data, setData] = useState<ProgresTierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<KupsTier>('BIRU');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'total_kups' | 'count_emas' | 'count_platinum' | 'total_nilai_ekonomi'>('total_kups');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    fetchProgresTier()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const formatNumber = (n: number) => new Intl.NumberFormat('id-ID').format(n);
  const formatRupiah = (val: number) => {
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
      {/* Header Banner */}
      <section className="bg-white border-2 border-earth-sand-border p-6 sm:p-8">
        <div className="max-w-4xl">
          <div className="inline-flex items-center space-x-2 bg-earth-forest text-white text-xs px-2.5 py-1 mb-3">
            <Layers className="w-3.5 h-3.5" />
            <span>STANDAR PENETAPAN RESMI: SK DIRJEN PSKL NO. 32/2022</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-earth-soil">
            Progres & Analisis Kesenjangan (Gap) Peningkatan Kelas KUPS
          </h1>
          <p className="mt-2 text-sm text-earth-soil-muted leading-relaxed">
            Sesuai Buku Saku Peningkatan Kelas KUPS (Kementerian Kehutanan), kenaikan kelas KUPS 
            <strong> tidak ditentukan oleh ambang omzet/rupiah</strong>, melainkan melalui 
            <strong> checklist 15 syarat kumulatif</strong>. Halaman ini menyajikan 
            kesenjangan kualitatif yang dialami KUPS per wilayah dan syarat bottleneck utama.
          </p>
        </div>

        {/* 4 Cards Summary */}
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3 pt-6 border-t border-earth-sand-border">
          <div className="p-3 bg-blue-50/50 border border-blue-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900">KELAS BIRU</span>
              <span className="text-xs font-mono font-bold text-blue-700">36.9%</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-blue-900 mt-1">
              {formatNumber(summary.biru)}
            </div>
            <div className="text-[11px] text-blue-800 mt-1">Syarat 1 s.d. 3 Terpenuhi</div>
          </div>

          <div className="p-3 bg-stone-100 border border-stone-400">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900">KELAS PERAK</span>
              <span className="text-xs font-mono font-bold text-stone-700">49.5%</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-stone-900 mt-1">
              {formatNumber(summary.perak)}
            </div>
            <div className="text-[11px] text-stone-800 mt-1">Syarat 1 s.d. 7 Terpenuhi</div>
          </div>

          <div className="p-3 bg-amber-50/60 border border-amber-400">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900">KELAS EMAS</span>
              <span className="text-xs font-mono font-bold text-amber-700">12.5%</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-amber-900 mt-1">
              {formatNumber(summary.emas)}
            </div>
            <div className="text-[11px] text-amber-800 mt-1">15 Syarat Lengkap Terpenuhi</div>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-500">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950">KELAS PLATINUM</span>
              <span className="text-xs font-mono font-bold text-emerald-700">1.0%</span>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-950 mt-1">
              {formatNumber(summary.platinum)}
            </div>
            <div className="text-[11px] text-emerald-900 mt-1">Verifikasi Lapangan & SK Pusat</div>
          </div>
        </div>
      </section>

      {/* 15 Cumulative Criteria Interactive Matrix */}
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

        {/* Active Tier Criteria Cards */}
        <div className="mt-6 space-y-4">
          <div className="p-3 bg-earth-sand-surface border border-earth-sand-border text-xs text-earth-soil-muted">
            {activeTab === 'BIRU' && (
              <span>
                <strong>Kelas Biru (Tahap Inisiasi):</strong> Ditetapkan untuk KUPS yang baru memulai tata kelola usaha hutan sosial.
              </span>
            )}
            {activeTab === 'PERAK' && (
              <span>
                <strong>Kelas Perak (Tahap Berkembang):</strong> KUPS telah memiliki unit usaha mandiri dan memasarkan produk/wisata ke pasar lokal.
              </span>
            )}
            {activeTab === 'EMAS' && (
              <span>
                <strong>Kelas Emas (Tahap Maju):</strong> KUPS telah berbadan usaha kuat, pasar regional/nasional, menyerap tenaga kerja, dan rutin mencatat nilai ekonomi di GoKUPS.
              </span>
            )}
            {activeTab === 'PLATINUM' && (
              <span>
                <strong>Kelas Platinum (Tahap Mandiri/Ekspor):</strong> Kelas tertinggi dengan verifikasi dokumen & lapangan khusus oleh Ditjen PSKL (Form 1, 2, 3) dan memiliki akses ekspor / pasar internasional.
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
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-6 h-6 bg-earth-soil text-earth-sand font-mono text-xs font-bold flex items-center justify-center">
                      #{c.number}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-earth-sand-surface border border-earth-sand-border text-earth-clay">
                      {c.status_verifikasi}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-earth-soil mt-1">
                    {c.syarat}
                  </h4>
                  <p className="text-xs text-earth-soil-muted mt-2 leading-relaxed">
                    {c.penjelasan}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-earth-sand-border">
                  <div className="text-[11px] text-earth-forest font-semibold flex items-start space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span><strong>Bukti:</strong> {c.indikator_bukti}</span>
                  </div>

                  {/* Gap bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] text-earth-soil-muted mb-1 font-mono">
                      <span>Estimasi Gap Pemenuhan:</span>
                      <span className="font-bold text-earth-terracotta">{c.gap_percentage}% KUPS Belum Lengkap</span>
                    </div>
                    <div className="w-full h-1.5 bg-earth-sand border border-earth-sand-border">
                      <div
                        className="h-full bg-earth-terracotta"
                        style={{ width: `${c.gap_percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottlenecks & Strategic Obstacles Section */}
      <section className="bg-white border-2 border-earth-sand-border p-6 sm:p-8">
        <div className="pb-4 border-b border-earth-sand-border">
          <h2 className="text-xl font-bold text-earth-soil flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-earth-terracotta" />
            <span>Faktor Hambatan Utama (Bottleneck) Peningkatan Kelas</span>
          </h2>
          <p className="text-xs text-earth-soil-muted mt-0.5">
            Analisis kesenjangan sistemik mengapa KUPS tertahan di kelas tertentu
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {bottlenecks.map((b) => (
            <div key={b.label} className="border-2 border-earth-sand-border p-5 bg-earth-sand/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-earth-terracotta uppercase">
                    Transisi: {b.from} &rarr; {b.to}
                  </span>
                  <span className="text-xs font-mono font-bold bg-white px-2 py-0.5 border border-earth-sand-border">
                    {formatNumber(b.affectedKups)} KUPS
                  </span>
                </div>
                <h3 className="text-base font-bold text-earth-soil mt-2">
                  {b.label}
                </h3>
                <p className="text-xs text-earth-soil-muted mt-2 leading-relaxed">
                  {b.gapDescription}
                </p>

                <div className="mt-4 space-y-2">
                  <div className="text-[11px] font-bold text-earth-soil uppercase tracking-wider">
                    Syarat Utama yang Sering Tertunda:
                  </div>
                  {b.keyHurdles.map((h, i) => (
                    <div key={i} className="text-xs flex items-start space-x-2 text-earth-soil">
                      <span className="w-1.5 h-1.5 bg-earth-terracotta mt-1.5 shrink-0"></span>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-earth-sand-border text-[11px] text-earth-clay font-medium">
                Prioritas pendampingan BPSKL & Penyuluh Kehutanan
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Provincial Aggregates Table Section */}
      <section className="bg-white border-2 border-earth-sand-border p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-earth-sand-border gap-4">
          <div>
            <h2 className="text-xl font-bold text-earth-soil flex items-center space-x-2">
              <Building className="w-5 h-5 text-earth-forest" />
              <span>Matriks Distribusi Kelas Per Provinsi (Agregat Wilayah)</span>
            </h2>
            <p className="text-xs text-earth-soil-muted mt-0.5">
              Sesuai klausul privasi publik, data disajikan dalam bentuk agregat wilayah tanpa identitas individual KUPS
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href="/api/export/progres-tier.csv"
              download="rekap-progres-tier-kups.csv"
              className="px-3.5 py-2 bg-earth-forest text-white font-bold text-xs hover:bg-earth-forest-dark flex items-center space-x-1.5 border border-earth-forest-light"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh CSV Agregat</span>
            </a>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari provinsi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-earth-sand-border bg-earth-sand-surface focus:outline-none focus:border-earth-terracotta"
            />
          </div>
          <div className="text-xs text-earth-soil-muted font-mono">
            Menampilkan {filteredProvinces.length} dari {data.provinces.length} provinsi
          </div>
        </div>

        {/* Flat Table */}
        <div className="mt-4 overflow-x-auto border border-earth-sand-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-earth-soil text-earth-sand uppercase font-bold tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-4">Provinsi</th>
                <th 
                  onClick={() => toggleSort('total_kups')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-earth-soil-light select-none"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Total KUPS</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center bg-blue-950/40">Biru</th>
                <th className="py-3 px-3 text-center bg-stone-800">Perak</th>
                <th 
                  onClick={() => toggleSort('count_emas')}
                  className="py-3 px-3 text-center bg-amber-950/40 cursor-pointer hover:bg-amber-900 select-none"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Emas</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => toggleSort('count_platinum')}
                  className="py-3 px-3 text-center bg-emerald-950/40 cursor-pointer hover:bg-emerald-900 select-none"
                >
                  <div className="flex items-center justify-center space-x-1">
                    <span>Platinum</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  onClick={() => toggleSort('total_nilai_ekonomi')}
                  className="py-3 px-4 text-right cursor-pointer hover:bg-earth-soil-light select-none"
                >
                  <div className="flex items-center justify-end space-x-1">
                    <span>Nilai Ekonomi (Rp)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-earth-sand-border">
              {filteredProvinces.map((p, idx) => {
                const pctBiru = p.total_kups ? Math.round((p.count_biru / p.total_kups) * 100) : 0;
                const pctPerak = p.total_kups ? Math.round((p.count_perak / p.total_kups) * 100) : 0;
                const pctEmas = p.total_kups ? Math.round((p.count_emas / p.total_kups) * 100) : 0;
                const pctPlatinum = p.total_kups ? Math.round((p.count_platinum / p.total_kups) * 100) : 0;

                return (
                  <tr key={p.provinsi} className="hover:bg-earth-sand/40 transition-colors">
                    <td className="py-3 px-3 font-mono text-earth-soil-muted">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-earth-soil">
                      {p.provinsi}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-earth-soil">
                      {formatNumber(p.total_kups)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono font-semibold text-blue-800">
                        {p.count_biru}
                      </span>
                      <span className="text-[10px] text-earth-soil-muted block">
                        ({pctBiru}%)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono font-semibold text-stone-800">
                        {p.count_perak}
                      </span>
                      <span className="text-[10px] text-earth-soil-muted block">
                        ({pctPerak}%)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono font-semibold text-amber-900">
                        {p.count_emas}
                      </span>
                      <span className="text-[10px] text-earth-soil-muted block">
                        ({pctEmas}%)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-mono font-bold text-emerald-800">
                        {p.count_platinum}
                      </span>
                      <span className="text-[10px] text-earth-soil-muted block">
                        ({pctPlatinum}%)
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-earth-forest">
                      {formatRupiah(p.total_nilai_ekonomi)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
