import React, { useEffect, useState } from 'react';
import { LembagaDetail } from '../types';
import { fetchLembagaDetail } from '../api';
import { TierBadge } from './TierBadge';
import { 
  X, 
  Building2, 
  MapPin, 
  FileText, 
  Users, 
  Trees, 
  Banknote, 
  ShieldCheck, 
  Phone, 
  Calendar, 
  Tag, 
  Package, 
  Flame,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface LembagaModalProps {
  lembagaId: string | null;
  onClose: () => void;
}

export const LembagaModal: React.FC<LembagaModalProps> = ({ lembagaId, onClose }) => {
  const [data, setData] = useState<LembagaDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lembagaId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);
    fetchLembagaDetail(lembagaId)
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Gagal memuat profil lembaga');
        setLoading(false);
      });
  }, [lembagaId]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!lembagaId) return null;

  const formatNumber = (n: number) => new Intl.NumberFormat('id-ID').format(n || 0);
  const formatRupiah = (val: number) => {
    if (!val) return 'Rp 0';
    if (val >= 1_000_000_000_000) return `Rp ${(val / 1_000_000_000_000).toFixed(2)} T`;
    if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(2)} M`;
    if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(2)} Jt`;
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      {/* Modal Container */}
      <div className="bg-white border-2 border-earth-soil w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Top Header Bar */}
        <div className="bg-earth-soil text-earth-sand px-5 py-4 flex items-center justify-between border-b-2 border-earth-terracotta shrink-0">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-earth-terracotta shrink-0" />
            <span className="font-mono text-xs uppercase tracking-wider font-bold">PROFIL LEMBAGA PENGELOLA PERHUTANAN SOSIAL</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-earth-soil-light text-stone-300 hover:text-white transition-colors"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-7 space-y-6">
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block p-4 border border-earth-clay bg-earth-sand-surface text-earth-clay font-mono text-xs">
                Memuat data detail lembaga & KUPS binaan...
              </div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-300 text-red-700 text-sm">
              {error}
            </div>
          ) : data ? (
            <>
              {/* Institution Identity Banner */}
              <div className="border border-earth-sand-border bg-earth-sand-surface p-5">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 bg-earth-soil text-earth-sand text-xs font-mono font-bold">
                    {data.skema}
                  </span>
                  {data.nama_balai && (
                    <span className="px-2 py-0.5 bg-earth-forest text-white text-xs font-medium">
                      {data.nama_balai}
                    </span>
                  )}
                  {data.seksi_wilayah && (
                    <span className="px-2 py-0.5 bg-earth-sand border border-earth-sand-border text-earth-soil text-xs font-mono">
                      Wilayah: {data.seksi_wilayah}
                    </span>
                  )}
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-earth-soil">
                  {data.nama_lembaga}
                </h2>

                <div className="mt-2 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-earth-soil-muted">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-earth-terracotta shrink-0" />
                    <span>
                      {[data.desa, data.kecamatan, data.kabupaten, data.provinsi]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                  {data.nama_ketua && (
                    <div className="flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-earth-forest shrink-0" />
                      <span>Ketua: <strong>{data.nama_ketua}</strong></span>
                    </div>
                  )}
                  {data.no_telp && (
                    <div className="flex items-center space-x-1">
                      <Phone className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                      <span>{data.no_telp}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Legal & Operational Data Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="border border-earth-sand-border p-3 bg-white">
                  <div className="text-[10px] uppercase font-bold text-earth-soil-muted">Nomor SK Penetapan</div>
                  <div className="font-mono font-bold text-xs text-earth-soil mt-1 break-all" title={data.surat_keputusan}>
                    {data.surat_keputusan || '-'}
                  </div>
                  {data.tanggal && (
                    <div className="text-[10px] text-earth-soil-muted mt-1">
                      Tanggal: {data.tanggal}
                    </div>
                  )}
                </div>

                <div className="border border-earth-sand-border p-3 bg-white">
                  <div className="text-[10px] uppercase font-bold text-earth-soil-muted">Luas Kelola SK</div>
                  <div className="font-mono text-base font-extrabold text-earth-forest mt-1">
                    {formatNumber(data.luas_total)} <span className="text-xs font-normal">Ha</span>
                  </div>
                  <div className="text-[10px] text-earth-soil-muted mt-1">
                    {data.luas_breakdown?.hl > 0 && `HL: ${data.luas_breakdown.hl} Ha `}
                    {data.luas_breakdown?.hp > 0 && `HP: ${data.luas_breakdown.hp} Ha `}
                    {data.luas_breakdown?.hpt > 0 && `HPT: ${data.luas_breakdown.hpt} Ha`}
                  </div>
                </div>

                <div className="border border-earth-sand-border p-3 bg-white">
                  <div className="text-[10px] uppercase font-bold text-earth-soil-muted">Anggota Lembaga</div>
                  <div className="font-mono text-base font-extrabold text-earth-soil mt-1">
                    {formatNumber(data.total_anggota)} <span className="text-xs font-normal">Jiwa</span>
                  </div>
                  <div className="text-[10px] text-earth-soil-muted mt-1">
                    {data.anggota_pria} Pria &bull; {data.anggota_wanita} Wanita
                  </div>
                </div>

                <div className="border border-earth-sand-border p-3 bg-white">
                  <div className="text-[10px] uppercase font-bold text-earth-soil-muted">Akumulasi Nilai Ekonomi</div>
                  <div className="font-mono text-base font-extrabold text-earth-terracotta mt-1">
                    {formatRupiah(data.total_nilai)}
                  </div>
                  <div className="text-[10px] text-earth-soil-muted mt-1">
                    {data.total_transaksi} kali transaksi GoKUPS
                  </div>
                </div>
              </div>

              {/* Child KUPS Section */}
              <div className="border-t border-earth-sand-border pt-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-earth-soil flex items-center space-x-2">
                      <Package className="w-4 h-4 text-earth-forest" />
                      <span>Unit Usaha KUPS Binaan ({data.kups_list.length} KUPS)</span>
                    </h3>
                    <p className="text-xs text-earth-soil-muted mt-0.5">
                      Kelompok Usaha Perhutanan Sosial yang bernaung di bawah SK {data.nama_lembaga}
                    </p>
                  </div>
                </div>

                {data.kups_list.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-earth-sand-border text-earth-soil-muted text-xs">
                    Belum ada data KUPS yang tercatat aktif untuk lembaga ini.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.kups_list.map((kups, idx) => (
                      <div
                        key={kups.id || idx}
                        className="border-2 border-earth-sand-border p-4 bg-white hover:border-earth-terracotta/60 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center space-x-2">
                              <TierBadge tier={kups.kelas} size="sm" />
                              <h4 className="font-bold text-sm text-earth-soil">
                                {kups.nama_kups}
                              </h4>
                            </div>
                            {kups.sk_penetapan && (
                              <div className="text-[11px] text-earth-soil-muted mt-1 font-mono">
                                SK KUPS: {kups.sk_penetapan} {kups.tanggal_penetapan ? `(${kups.tanggal_penetapan})` : ''}
                              </div>
                            )}
                          </div>

                          <div className="text-left sm:text-right shrink-0">
                            <div className="font-mono text-base font-extrabold text-earth-terracotta">
                              {formatRupiah(kups.nilai_ekonomi)}
                            </div>
                            <div className="text-[10px] text-earth-soil-muted">
                              {kups.transaksi_count > 0 ? `${kups.transaksi_count} transaksi tercatat` : 'Belum ada transaksi'}
                            </div>
                          </div>
                        </div>

                        {/* Commodities / Products Breakdown */}
                        <div className="mt-3 pt-3 border-t border-earth-sand-border grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {/* Produk */}
                          <div className="bg-earth-sand-surface p-2.5 border border-earth-sand-border">
                            <div className="text-[10px] uppercase font-bold text-earth-forest flex items-center space-x-1">
                              <Package className="w-3 h-3" />
                              <span>Produk Usaha ({kups.produk?.length || 0})</span>
                            </div>
                            {kups.produk && kups.produk.length > 0 ? (
                              <div className="mt-1 space-y-1">
                                {kups.produk.slice(0, 3).map((p: any, pIdx: number) => {
                                  const pName = p.namaProduk || p.nama_produk || p.jenisProduk || p.jenis_produk || 'Produk';
                                  const pIzin = p.izinUsaha || p.izin_usaha;
                                  return (
                                    <div key={pIdx} className="text-[11px] text-earth-soil font-medium">
                                      &bull; {pName} 
                                      {pIzin ? <span className="text-stone-500 text-[10px]"> ({pIzin})</span> : null}
                                    </div>
                                  );
                                })}
                                {kups.produk.length > 3 && (
                                  <div className="text-[10px] text-earth-soil-muted italic">
                                    +{kups.produk.length - 3} produk lainnya
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-[11px] text-earth-soil-muted mt-1">
                                {kups.komoditas ? kups.komoditas : 'Belum ada produk spesifik terdaftar'}
                              </div>
                            )}
                          </div>

                          {/* Potensi */}
                          <div className="bg-earth-sand-surface p-2.5 border border-earth-sand-border">
                            <div className="text-[10px] uppercase font-bold text-earth-terracotta flex items-center space-x-1">
                              <Flame className="w-3 h-3" />
                              <span>Potensi Komoditas ({kups.potensi?.length || 0})</span>
                            </div>
                            {kups.potensi && kups.potensi.length > 0 ? (
                              <div className="mt-1 space-y-1">
                                {kups.potensi.slice(0, 3).map((pot: any, potIdx: number) => {
                                  const potName = pot.komoditas || pot.komoditi || pot.nama_komoditi || pot.namaKomoditas || 'Komoditas';
                                  const potVol = pot.potensi_per_tahun || pot.potensiPerTahun;
                                  return (
                                    <div key={potIdx} className="text-[11px] text-earth-soil">
                                      &bull; <strong>{potName}</strong>
                                      {potVol ? <span className="text-stone-500"> ({potVol} {pot.satuan || ''}/thn)</span> : null}
                                    </div>
                                  );
                                })}
                                {kups.potensi.length > 3 && (
                                  <div className="text-[10px] text-earth-soil-muted italic">
                                    +{kups.potensi.length - 3} potensi lainnya
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-[11px] text-earth-soil-muted mt-1">
                                Identifikasi potensi sedang berjalan
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="bg-earth-sand-surface border-t border-earth-sand-border px-5 py-3 flex items-center justify-between text-xs font-mono shrink-0">
          <div className="text-earth-soil-muted">
            Sumber Data: SIPEKAPS & GoKUPS Ditjen PS Kementerian Kehutanan
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-earth-soil text-white font-bold hover:bg-earth-soil-light transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
