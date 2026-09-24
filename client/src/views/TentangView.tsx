import React from 'react';
import { 
  BookOpen, 
  ShieldCheck, 
  FileText, 
  Database, 
  Scale, 
  Award, 
  CheckCircle, 
  HelpCircle,
  Building,
  CalendarCheck
} from 'lucide-react';
import { TierBadge } from '../components/TierBadge';

export const TentangView: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Pencatatan Mandiri di GoKUPS',
      actor: 'Pengurus KUPS / Pendamping PS',
      desc: 'Pengurus KUPS bersama Pendamping Perhutanan Sosial mengunggah dokumen RKPS, data potensi komoditas, jenis produk, dan catatan realisasi transaksi produksi di aplikasi GoKUPS.',
    },
    {
      step: '02',
      title: 'Validasi & Usulan Balai (BPS)',
      actor: 'Balai Perhutanan Sosial (BPS)',
      desc: 'Balai PS memverifikasi kesesuaian dokumen dan usulan kenaikan kelas dari Biru ke Perak atau Perak ke Emas setiap semester (2 kali dalam setahun).',
    },
    {
      step: '03',
      title: 'Verifikasi Khusus Platinum (Formulir 1, 2, 3)',
      actor: 'Tim Terpadu Ditjen PS & Balai PS',
      desc: 'Khusus calon KUPS Platinum, dilakukan verifikasi faktual lapangan menggunakan Formulir 1 (Lembar Verifikasi), Formulir 2 (Berita Acara), dan Formulir 3 (Profil KUPS) mencakup akses modal dan pasar ekspor.',
    },
    {
      step: '04',
      title: 'Penetapan Surat Keputusan Dirjen PS',
      actor: 'Direktur Jenderal Perhutanan Sosial',
      desc: 'Dirjen PS menerbitkan SK resmi penetapan klasifikasi kelas KUPS dan sertifikat KUPS Platinum yang diintegrasikan langsung ke sistem database SIPEKAPS.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
      {/* Header Banner */}
      <section className="bg-white border-2 border-earth-sand-border p-6 sm:p-8">
        <div className="max-w-4xl">
          <div className="inline-flex items-center space-x-2 bg-earth-forest text-white text-xs px-2.5 py-1 mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>METODOLOGI & DASAR HUKUM RESMI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-earth-soil">
            Tentang Portal KUPS & Standar Klasifikasi Kelas Usaha
          </h1>
          <p className="mt-3 text-sm text-earth-soil-muted leading-relaxed">
            Portal ini merupakan kanal publik transparansi data kinerja dan capaian kemandirian
            Kelompok Usaha Perhutanan Sosial (KUPS) di bawah Direktorat Pengembangan Usaha Perhutanan Sosial,
            Ditjen PS, Kementerian Kehutanan Republik Indonesia.
          </p>
        </div>
      </section>

      {/* Legal Basis Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border-2 border-earth-sand-border p-6 border-l-4 border-l-earth-terracotta">
          <Scale className="w-6 h-6 text-earth-terracotta mb-3" />
          <h3 className="font-bold text-base text-earth-soil">
            SK Dirjen PS No. 32/2022
          </h3>
          <p className="text-xs text-earth-soil-muted mt-2 leading-relaxed">
            Surat Keputusan Direktur Jenderal Perhutanan Sosial Nomor SK.32/PSKL/SET/KUM.1/5/2022
            tentang Pedoman Penilaian Klasifikasi Kelompok Usaha Perhutanan Sosial (KUPS).
          </p>
        </div>

        <div className="bg-white border-2 border-earth-sand-border p-6 border-l-4 border-l-earth-forest">
          <FileText className="w-6 h-6 text-earth-forest mb-3" />
          <h3 className="font-bold text-base text-earth-soil">
            Buku Saku Peningkatan Kelas (2026)
          </h3>
          <p className="text-xs text-earth-soil-muted mt-2 leading-relaxed">
            Panduan teknis operasional terbitan Direktorat PUPS yang menetapkan 15 kriteria kumulatif
            bertahap (Blue, Silver, Gold, Platinum) serta standar verifikasi lapangan bagi KUPS binaan.
          </p>
        </div>

        <div className="bg-white border-2 border-earth-sand-border p-6 border-l-4 border-l-earth-clay">
          <Database className="w-6 h-6 text-earth-clay mb-3" />
          <h3 className="font-bold text-base text-earth-soil">
            Integrasi Live SIPEKAPS & GoKUPS
          </h3>
          <p className="text-xs text-earth-soil-muted mt-2 leading-relaxed">
            Data portal ini diambil secara langsung (real-time query) dari basis data terpadu SIPEKAPS 
            dan GoKUPS, menjamin keselarasan data tanpa manipulasi atau penundaan snapshot berkala.
          </p>
        </div>
      </section>

      {/* Kriteria Tier Deep-Dive */}
      <section className="bg-white border-2 border-earth-sand-border p-6 sm:p-8 space-y-6">
        <div className="pb-4 border-b border-earth-sand-border">
          <h2 className="text-xl font-bold text-earth-soil flex items-center space-x-2">
            <Award className="w-5 h-5 text-earth-forest" />
            <span>Pemahaman 4 Tingkatan Kelas KUPS</span>
          </h2>
          <p className="text-xs text-earth-soil-muted mt-0.5">
            Setiap kelas merepresentasikan fase kedewasaan tata kelola usaha kelompok tani hutan
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Blue */}
          <div className="border border-blue-300 bg-blue-50/40 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <TierBadge tier="BIRU" size="md" />
              <span className="text-xs font-mono font-bold text-blue-900">3 Syarat Kumulatif</span>
            </div>
            <h4 className="font-bold text-sm text-blue-950">Tahap Inisiasi & Identifikasi Potensi</h4>
            <p className="text-xs text-earth-soil-muted leading-relaxed">
              KUPS pada tahap ini telah memiliki kelembagaan sah melalui SK Penetapan KUPS, 
              telah mengidentifikasi komoditas potensi di areal izin PS, dan telah menyusun 
              dokumen Rencana Kerja Perhutanan Sosial (RKPS).
            </p>
            <div className="text-[11px] font-mono text-blue-900 pt-2 border-t border-blue-200">
              Syarat 1 s.d. 3: SK KUPS, Potensi Usaha, Dokumen RKPS.
            </div>
          </div>

          {/* Silver */}
          <div className="border border-stone-400 bg-stone-50 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <TierBadge tier="PERAK" size="md" />
              <span className="text-xs font-mono font-bold text-stone-900">+4 Syarat (Total 7)</span>
            </div>
            <h4 className="font-bold text-sm text-stone-950">Tahap Pengembangan Usaha & Pasar Lokal</h4>
            <p className="text-xs text-earth-soil-muted leading-relaxed">
              KUPS telah menjalankan unit usaha aktif, memiliki produk fisik atau sarana jasa wisata
              yang dipasarkan, telah memiliki akses permodalan (swadaya kelompok, hibah, atau perbankan),
              serta memiliki konsumen/wisatawan tingkat lokal desa/kecamatan.
            </p>
            <div className="text-[11px] font-mono text-stone-800 pt-2 border-t border-stone-300">
              Syarat 4 s.d. 7: Unit Usaha, Produk/Jasa, Akses Modal, Pasar Lokal.
            </div>
          </div>

          {/* Gold */}
          <div className="border border-amber-400 bg-amber-50/50 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <TierBadge tier="EMAS" size="md" />
              <span className="text-xs font-mono font-bold text-amber-900">+8 Syarat (Total 15)</span>
            </div>
            <h4 className="font-bold text-sm text-amber-950">Tahap Usaha Mandiri & Berkelanjutan</h4>
            <p className="text-xs text-earth-soil-muted leading-relaxed">
              KUPS memiliki jangkauan pasar regional hingga nasional, pernah menjadi pemenang lomba inovasi,
              mampu menyerap tenaga kerja warga sekitar, memiliki sertifikasi produk resmi (P-IRT/Halal/SNI),
              memiliki AD/ART, bekerjasama dengan offtaker/BUMDes, patuh PNBP, dan mencatat nilai ekonomi di GoKUPS.
            </p>
            <div className="text-[11px] font-mono text-amber-900 pt-2 border-t border-amber-300">
              Syarat 8 s.d. 15: Pasar Luas, Juara Lomba, Tenaga Kerja, Sertifikasi, AD/ART, Mitra Usaha, PNBP, Nilai Ekonomi.
            </div>
          </div>

          {/* Platinum */}
          <div className="border border-emerald-600 bg-emerald-50/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <TierBadge tier="PLATINUM" size="md" />
              <span className="text-xs font-mono font-bold text-emerald-950">Audit Verifikasi Lapangan</span>
            </div>
            <h4 className="font-bold text-sm text-emerald-950">Tahap Mandiri Unggul & Ekspor Internasional</h4>
            <p className="text-xs text-earth-soil-muted leading-relaxed">
              Tingkatan tertinggi KUPS yang telah memenuhi ke-15 syarat Emas dan telah lolos audit faktual
              lapangan oleh Tim Gabungan Kementerian Kehutanan. KUPS Platinum terbukti memiliki akses pembiayaan
              formal serta menembus rantai pasok ekspor atau mendatangkan wisatawan mancanegara.
            </p>
            <div className="text-[11px] font-mono text-emerald-900 pt-2 border-t border-emerald-300">
              Verifikasi Faktual: Formulir 1, Formulir 2 (BA), Formulir 3 & Sertifikat Dirjen PS.
            </div>
          </div>
        </div>
      </section>

      {/* Alur Penetapan 4 Steps Flat */}
      <section className="bg-white border-2 border-earth-sand-border p-6 sm:p-8 space-y-6">
        <div className="pb-4 border-b border-earth-sand-border">
          <h2 className="text-xl font-bold text-earth-soil flex items-center space-x-2">
            <CalendarCheck className="w-5 h-5 text-earth-forest" />
            <span>Alur Tata Kelola Penetapan Kelas KUPS</span>
          </h2>
          <p className="text-xs text-earth-soil-muted mt-0.5">
            Mekanisme resmi yang dijalankan dua kali setahun (semesteran)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s) => (
            <div
              key={s.step}
              className="border-2 border-earth-sand-border p-4 bg-earth-sand/30 flex flex-col justify-between"
            >
              <div>
                <span className="font-mono text-2xl font-black text-earth-terracotta block">
                  {s.step}
                </span>
                <h4 className="font-bold text-sm text-earth-soil mt-2">
                  {s.title}
                </h4>
                <div className="text-[10px] uppercase font-bold text-earth-clay mt-1">
                  Pelaksana: {s.actor}
                </div>
                <p className="text-xs text-earth-soil-muted mt-2 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ & Hubungi Kami */}
      <section className="bg-white border-2 border-earth-sand-border p-6 sm:p-8">
        <h2 className="text-xl font-bold text-earth-soil flex items-center space-x-2 pb-4 border-b border-earth-sand-border">
          <HelpCircle className="w-5 h-5 text-earth-forest" />
          <span>Pertanyaan Umum (FAQ)</span>
        </h2>

        <div className="mt-6 divide-y divide-earth-sand-border">
          <div className="py-4">
            <h4 className="font-bold text-sm text-earth-soil">
              Mengapa nilai ekonomi rupiah tidak menentukan kenaikan kelas KUPS?
            </h4>
            <p className="text-xs text-earth-soil-muted mt-1 leading-relaxed">
              Berdasarkan SK Dirjen PS No. 32/2022, nilai ekonomi adalah salah satu dari 15 syarat kumulatif
              (indikator syarat nomor 15: telah mencatat nilai ekonomi di GoKUPS). Kematangan usaha diukur dari
              aspek kelembagaan (AD/ART), pasar, legalitas produk, kemitraan, dan permodalan, bukan hanya besaran omzet.
            </p>
          </div>

          <div className="py-4">
            <h4 className="font-bold text-sm text-earth-soil">
              Bagaimana KUPS dapat mengajukan kenaikan kelas?
            </h4>
            <p className="text-xs text-earth-soil-muted mt-1 leading-relaxed">
              Pengurus KUPS bersama Pendamping PS memperbarui data profil dan portofolio bukti syarat kumulatif
              di aplikasi GoKUPS. Setiap periode semesteran, Balai PS dan Direktorat PUPS memvalidasi data tersebut.
            </p>
          </div>

          <div className="py-4">
            <h4 className="font-bold text-sm text-earth-soil">
              Apakah data pada portal ini terbuka untuk publik?
            </h4>
            <p className="text-xs text-earth-soil-muted mt-1 leading-relaxed">
              Ya, seluruh data agregat wilayah, sebaran komoditas, dan etalase KUPS berprestasi bersifat publik,
              tanpa login, dan dapat diakses bebas oleh pemangku kepentingan, akademisi, dan calon pembeli/offtaker.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
