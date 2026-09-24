import React, { useEffect, useRef } from 'react';
import { ReadinessCandidate } from '../types';
import {
  X,
  FileText,
  Package,
  TrendingUp,
  Leaf,
  FolderOpen,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export type ChecklistBadgeType = 'sk' | 'prod' | 'rp' | 'pot' | 'rkps';

interface ChecklistPopoverProps {
  candidate: ReadinessCandidate;
  badgeType: ChecklistBadgeType;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLSpanElement | null>;
}

function formatRupiah(val: number) {
  if (!val) return 'Rp 0';
  if (val >= 1e12) return `Rp ${(val / 1e12).toFixed(2)} T`;
  if (val >= 1e9) return `Rp ${(val / 1e9).toFixed(2)} M`;
  if (val >= 1e6) return `Rp ${(val / 1e6).toFixed(1)} Jt`;
  return `Rp ${val.toLocaleString('id-ID')}`;
}

const BADGE_CONFIG: Record<ChecklistBadgeType, { label: string; icon: React.ReactNode; color: string }> = {
  sk: {
    label: 'SK Penetapan KUPS',
    icon: <FileText className="w-4 h-4" />,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  prod: {
    label: 'Katalog Produk Fisik (GoKUPS)',
    icon: <Package className="w-4 h-4" />,
    color: 'text-blue-700 bg-blue-50 border-blue-200',
  },
  rp: {
    label: 'Rincian Transaksi Nilai Ekonomi',
    icon: <TrendingUp className="w-4 h-4" />,
    color: 'text-orange-700 bg-orange-50 border-orange-200',
  },
  pot: {
    label: 'Identifikasi Potensi Komoditas',
    icon: <Leaf className="w-4 h-4" />,
    color: 'text-teal-700 bg-teal-50 border-teal-200',
  },
  rkps: {
    label: 'Dokumen Perencanaan RKPS',
    icon: <FolderOpen className="w-4 h-4" />,
    color: 'text-purple-700 bg-purple-50 border-purple-200',
  },
};

export const ChecklistPopover: React.FC<ChecklistPopoverProps> = ({
  candidate,
  badgeType,
  onClose,
  anchorRef,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const config = BADGE_CONFIG[badgeType];

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose, anchorRef]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const renderContent = () => {
    switch (badgeType) {
      // ── SK PENETAPAN KUPS ──────────────────────────────────────────
      case 'sk':
        return (
          <div className="space-y-3">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold mb-1 flex items-center justify-between">
                <span>SK Penetapan KUPS</span>
                {candidate.has_sk_kups && candidate.sk_kups ? (
                  <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                    TERCATAT
                  </span>
                ) : (
                  <span className="text-[9px] px-1.5 py-0.2 bg-amber-100 text-amber-800 font-bold border border-amber-300">
                    BELUM TERCATAT
                  </span>
                )}
              </div>

              {candidate.has_sk_kups && candidate.sk_kups ? (
                <div className="font-mono text-xs bg-emerald-50 border border-emerald-300 px-3 py-2 text-emerald-950 font-bold break-all">
                  {candidate.sk_kups}
                </div>
              ) : (
                <div className="text-xs bg-amber-50 border border-amber-200 px-3 py-2 text-amber-900 leading-relaxed">
                  <div className="font-semibold text-[11px] mb-1 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                    Belum Memiliki SK Penetapan KUPS
                  </div>
                  <div className="text-[10px] text-amber-800">
                    Unit usaha KUPS ini belum memiliki nomor SK penetapan resmi tersendiri dari Kepala Balai PS. Perlu usulan penerbitan SK KUPS ke Balai PS setempat.
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-stone-200 pt-2 space-y-1.5 bg-stone-50 p-2.5 border">
              <div className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
                Lembaga Induk Pemegang SK PS
              </div>
              <div className="text-xs font-bold text-earth-soil">
                {candidate.nama_lembaga}
              </div>
              <div className="text-[10px] text-stone-600 font-mono break-all bg-white p-1.5 border border-stone-200">
                SK Lembaga: {candidate.surat_keputusan || '-'}
              </div>
              <div className="text-[10px] text-stone-500">
                Skema: <span className="font-semibold text-earth-soil">{candidate.skema || '-'}</span> · Balai PS: <span className="font-semibold text-earth-soil">{candidate.nama_balai || '-'}</span>
              </div>
            </div>

            <div className="text-[10px] text-stone-400 border-t border-stone-100 pt-1">
              Kriteria #1 SK Dirjen PS No. 32/2022: Ditetapkan sebagai KUPS oleh Kepala Balai PS.
            </div>
          </div>
        );

      // ── PRODUK ──────────────────────────────────────────────────────
      case 'prod':
        return (
          <div>
            {candidate.produk_list.length === 0 ? (
              <div className="flex flex-col items-center py-4 text-stone-400 text-center">
                <XCircle className="w-8 h-8 mb-2 opacity-40 text-stone-500" />
                <p className="text-xs font-semibold text-stone-600">Belum Ada Katalog Produk Fisik</p>
                <p className="text-[10px] mt-1 text-stone-400">
                  KUPS belum mendaftarkan barang/jasa komersial di GoKUPS.
                </p>
                <div className="mt-2 text-[10px] px-2 py-1 bg-amber-50 border border-amber-200 text-amber-800">
                  Syarat Kenaikan ke PERAK: Memiliki produk fisik siap jual (Kriteria #5).
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold mb-1">
                  Katalog Produk ({candidate.produk_list.length} Item)
                </div>
                {candidate.produk_list.map((p, i) => (
                  <div key={i} className="border border-stone-200 bg-stone-50 px-3 py-2 space-y-1">
                    <div className="font-bold text-xs text-earth-soil">
                      {p.namaProduk || p.nama_produk || p.nama || `Produk #${i + 1}`}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(p.kategori || p.jenisProduk || p.jenis_produk) && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-900 border border-blue-200 font-semibold">
                          {p.kategori || p.jenisProduk || p.jenis_produk}
                        </span>
                      )}
                      {p.volume && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-stone-200 text-stone-800 border border-stone-300 font-mono">
                          Vol: {p.volume}
                        </span>
                      )}
                      {p.periode && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-purple-100 text-purple-900 border border-purple-200">
                          Tahun: {p.periode}
                        </span>
                      )}
                      {(p.izinUsaha || p.izin_usaha) && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-200 font-semibold">
                          Izin: {p.izinUsaha || p.izin_usaha}
                        </span>
                      )}
                    </div>
                    {p.deskripsi && (
                      <div className="text-[10px] text-stone-500 italic mt-0.5">
                        {p.deskripsi}
                      </div>
                    )}
                  </div>
                ))}
                <div className="text-[10px] text-stone-400 pt-1">
                  Kriteria #5 SK Dirjen PS No. 32/2022: Memiliki produk dipasarkan.
                </div>
              </div>
            )}
          </div>
        );

      // ── RP / TRANSAKSI NILAI EKONOMI ────────────────────────────────
      case 'rp':
        return (
          <div className="space-y-3">
            <div className="text-center py-2.5 bg-orange-50 border border-orange-200">
              <div className="text-2xl font-extrabold font-mono text-orange-800">
                {formatRupiah(candidate.total_nilai)}
              </div>
              <div className="text-[10px] text-orange-600 font-semibold mt-0.5">
                Total Omzet Transaksi Tercatat di GoKUPS
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-stone-50 border border-stone-200 px-2 py-1.5">
                <div className="text-base font-bold text-earth-soil">{candidate.transaksi_count}</div>
                <div className="text-[9px] text-stone-400 uppercase">Rekaman Transaksi</div>
              </div>
              <div className="bg-stone-50 border border-stone-200 px-2 py-1.5">
                <div className="text-xs font-bold text-earth-soil truncate" title={candidate.komoditas_list}>
                  {candidate.komoditas_list || '-'}
                </div>
                <div className="text-[9px] text-stone-400 uppercase">Komoditas Utama</div>
              </div>
            </div>

            {candidate.transaksi_list && candidate.transaksi_list.length > 0 ? (
              <div className="space-y-1.5 mt-2">
                <div className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
                  Rincian Transaksi ({candidate.transaksi_list.length})
                </div>
                {candidate.transaksi_list.map((t, idx) => (
                  <div key={idx} className="bg-stone-50 border border-stone-200 p-2 text-xs space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-earth-soil">{t.hasil_produk || t.komoditas || 'Produksi'}</span>
                      <span className="font-mono font-bold text-orange-700">
                        {formatRupiah(Number(t.nilai_ekonomi_rupiah) || 0)}
                      </span>
                    </div>
                    <div className="text-[10px] text-stone-500 flex flex-wrap gap-x-2">
                      {t.volume && <span>Vol: <strong>{t.volume}</strong></span>}
                      {t.periode && <span>Tahun: <strong>{t.periode}</strong></span>}
                    </div>
                    {t.pemasaran && (
                      <div className="text-[9px] text-stone-400">
                        Jangkauan Pasar: {t.pemasaran}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : candidate.total_nilai === 0 ? (
              <div className="flex items-center gap-2 text-xs text-stone-500 border border-stone-200 bg-stone-50 px-3 py-2">
                <XCircle className="w-4 h-4 text-stone-400 flex-shrink-0" />
                Belum ada rekaman transaksi omzet di GoKUPS.
              </div>
            ) : null}

            <div className="text-[10px] text-stone-400 border-t border-stone-100 pt-1">
              Kriteria #15 SK Dirjen PS No. 32/2022: Mencatatkan nilai transaksi ekonomi di GoKUPS.
            </div>
          </div>
        );

      // ── POTENSI KOMODITAS ───────────────────────────────────────────
      case 'pot':
        return (
          <div>
            {candidate.potensi_list.length === 0 ? (
              <div className="flex flex-col items-center py-4 text-stone-400 text-center">
                <XCircle className="w-8 h-8 mb-2 opacity-40 text-stone-500" />
                <p className="text-xs font-semibold text-stone-600">Belum Ada Data Potensi Komoditas</p>
                <p className="text-[10px] mt-1 text-stone-400">
                  Data komoditas hasil hutan / jasa lingkungan belum diinput di GoKUPS.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-wider text-stone-500 font-semibold mb-1">
                  Komoditas Potensi ({candidate.potensi_list.length} Item)
                </div>
                {candidate.potensi_list.map((p, i) => (
                  <div key={i} className="border border-teal-200 bg-teal-50 px-3 py-2 space-y-0.5">
                    <div className="font-bold text-xs text-teal-950 flex items-center justify-between">
                      <span>{p.komoditas || p.namaKomoditas || p.nama || `Potensi #${i + 1}`}</span>
                      {p.prioritas && (
                        <span className="text-[9px] px-1 py-0.2 bg-teal-200 text-teal-900 font-mono">
                          {p.prioritas}
                        </span>
                      )}
                    </div>
                    {p.kategori && (
                      <div className="text-[9px] text-teal-700 font-semibold">
                        Kategori: {p.kategori}
                      </div>
                    )}
                    {(p.deskripsi || p.keterangan) && (
                      <div className="text-[10px] text-teal-800 leading-snug">
                        {p.deskripsi || p.keterangan}
                      </div>
                    )}
                  </div>
                ))}
                <div className="text-[10px] text-stone-400 pt-1">
                  Kriteria #2 SK Dirjen PS No. 32/2022: Potensi usaha teridentifikasi.
                </div>
              </div>
            )}
          </div>
        );

      // ── DOKUMEN RKPS ─────────────────────────────────────────────────
      case 'rkps':
        const sudah = candidate.checklist.rkps;
        return (
          <div className="space-y-3">
            <div className={`flex items-center gap-3 px-3 py-2.5 border ${sudah ? 'bg-emerald-50 border-emerald-300' : 'bg-stone-50 border-stone-200'}`}>
              {sudah ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-7 h-7 text-stone-400 flex-shrink-0" />
              )}
              <div>
                <div className={`font-bold text-xs ${sudah ? 'text-emerald-900' : 'text-stone-700'}`}>
                  Status RKPS: {sudah ? 'Sudah Terunggah & Sah' : 'Belum Terunggah'}
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">
                  Verifikasi sistem SIPEKAPS / GoKUPS Ditjen PS
                </div>
              </div>
            </div>

            <div className="text-xs text-stone-600 space-y-1.5 bg-stone-50 p-2.5 border border-stone-200">
              <div className="font-semibold text-earth-soil text-[11px]">Rencana Kerja Perhutanan Sosial (RKPS)</div>
              <p className="text-[10px] text-stone-500 leading-relaxed">
                Dokumen perencanaan 10 tahunan kelompok yang memuat rencana usaha, penataan areal, target produksi, dan pengembangan KUPS. Wajib disahkan oleh Kepala Balai PS.
              </p>
            </div>

            {!sudah && (
              <div className="bg-amber-50 border border-amber-200 px-3 py-2 text-[10px] text-amber-900 leading-relaxed">
                <span className="font-bold">Rekomendasi Tindakan:</span> Lakukan pendampingan penyusunan dokumen RKPS melalui fasilitator/penyuluh kehutanan Balai PS setempat agar KUPS memenuhi syarat kumulatif naik kelas.
              </div>
            )}

            <div className="text-[10px] text-stone-400 border-t border-stone-100 pt-1">
              Kriteria #3 SK Dirjen PS No. 32/2022: Memiliki dokumen RKPS yang telah disahkan.
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 w-80 bg-white border border-stone-300 shadow-xl text-left"
      style={{ top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 8 }}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-2.5 border-b border-stone-200 ${config.color}`}>
        <div className="flex items-center gap-2">
          {config.icon}
          <span className="text-xs font-bold">{config.label}</span>
        </div>
        <button onClick={onClose} className="hover:opacity-70 p-0.5">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* KUPS name sub-header */}
      <div className="px-3 py-1.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
        <div className="text-[10px] font-bold text-earth-soil truncate max-w-[200px]" title={candidate.nama_kups}>
          {candidate.nama_kups}
        </div>
        <div className="text-[9px] font-mono text-stone-400">
          Tier: {candidate.kelas_sekarang}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 max-h-80 overflow-y-auto">
        {renderContent()}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 bg-stone-100 border-t border-stone-200 flex justify-between items-center text-[10px]">
        <span className="text-stone-500">Basis: SK Dirjen PS No. 32/2022</span>
        <a
          href="https://gokups.hutsos.kehutanan.go.id/public/chart/grading"
          target="_blank"
          rel="noopener noreferrer"
          className="text-earth-forest font-semibold flex items-center gap-1 hover:underline"
        >
          <span>GoKUPS</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
