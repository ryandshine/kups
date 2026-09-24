import React from 'react';
import { ExternalLink, ShieldCheck, Database, FileText } from 'lucide-react';

interface FooterProps {
  onSelectTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  return (
    <footer className="bg-earth-soil text-earth-sand border-t-4 border-earth-forest mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Identity */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-earth-terracotta text-white font-bold flex items-center justify-center">
                K
              </div>
              <span className="text-lg font-bold font-mono text-white">PORTAL KUPS</span>
            </div>
            <p className="text-sm text-stone-300 leading-relaxed max-w-lg">
              Portal Publik Data Terpadu Kelompok Usaha Perhutanan Sosial (KUPS) menyajikan
              informasi capaian kelas (Blue, Silver, Gold, Platinum) dan sebaran komoditas unggulan
              berdasarkan basis data live SIPEKAPS dan GoKUPS Kementerian Kehutanan Republik Indonesia.
            </p>
            <div className="pt-2 flex items-center space-x-2 text-xs text-stone-400">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Sumber Data: Database Terpadu SIPEKAPS (Live Query)</span>
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-xs uppercase font-bold text-earth-terracotta tracking-wider mb-3">
              Navigasi Halaman
            </h4>
            <ul className="space-y-2 text-sm text-stone-300">
              <li>
                <button 
                  onClick={() => onSelectTab('beranda')} 
                  className="hover:text-white hover:underline text-left"
                >
                  Beranda & Statistik Nasional
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onSelectTab('progres-tier')} 
                  className="hover:text-white hover:underline text-left"
                >
                  Progres Peningkatan Tier
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onSelectTab('peta-sebaran')} 
                  className="hover:text-white hover:underline text-left"
                >
                  Peta Sebaran Komoditas 38 Provinsi
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onSelectTab('leaderboard')} 
                  className="hover:text-white hover:underline text-left"
                >
                  Leaderboard / Sorotan Prestasi KUPS
                </button>
              </li>
              <li>
                <button 
                  onClick={() => onSelectTab('tentang')} 
                  className="hover:text-white hover:underline text-left"
                >
                  Metodologi 15 Kriteria Tier
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Reference */}
          <div>
            <h4 className="text-xs uppercase font-bold text-earth-terracotta tracking-wider mb-3">
              Landasan Kebijakan
            </h4>
            <ul className="space-y-2 text-xs text-stone-300">
              <li className="flex items-start space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-stone-400 mt-0.5 shrink-0" />
                <span>SK Dirjen PS No. 32/2022 tentang Klasifikasi KUPS</span>
              </li>
              <li className="flex items-start space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-stone-400 mt-0.5 shrink-0" />
                <span>Buku Saku Peningkatan Kelas KUPS (April 2026)</span>
              </li>
              <li className="flex items-start space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-stone-400 mt-0.5 shrink-0" />
                <span>Akses Publik Read-Only & Agregat Kewilayahan</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-earth-soil-light flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400">
          <div>
            &copy; 2026 Direktorat Pengembangan Usaha Perhutanan Sosial, Ditjen PS, Kementerian Kehutanan.
          </div>
          <div className="mt-2 sm:mt-0 font-mono text-[11px] text-stone-400">
            Domain: kups.ditpps.com
          </div>
        </div>
      </div>
    </footer>
  );
};
