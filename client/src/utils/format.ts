const nf = (min: number, max: number) =>
  new Intl.NumberFormat('id-ID', { minimumFractionDigits: min, maximumFractionDigits: max });

const fmt0 = nf(0, 0);
const fmt1 = nf(1, 1);
const fmt2 = nf(2, 2);

export const formatNumber = (n: number): string => fmt0.format(n || 0);

/** Persentase berformat id-ID dengan 1 desimal, mis. 51,6%. Nilai positif yang terlalu kecil ditulis "<0,1%". */
export const formatPercent = (pct: number): string => {
  if (!pct || pct <= 0) return '0%';
  if (pct < 0.1) return '<0,1%';
  return `${fmt1.format(pct)}%`;
};

/** Rupiah ringkas dengan 2 desimal untuk M/T/Jt, mis. Rp 835,97 M. */
export const formatRupiah = (val: number): string => {
  if (!val) return 'Rp 0';
  if (val >= 1_000_000_000_000) return `Rp ${fmt2.format(val / 1_000_000_000_000)} T`;
  if (val >= 1_000_000_000) return `Rp ${fmt2.format(val / 1_000_000_000)} M`;
  if (val >= 1_000_000) return `Rp ${fmt2.format(val / 1_000_000)} Jt`;
  return `Rp ${fmt0.format(val)}`;
};

/** Rupiah sangat ringkas untuk label sempit, mis. Rp 431 M, Rp 4 Jt. */
export const formatRupiahShort = (val: number): string => {
  if (!val) return 'Rp 0';
  if (val >= 1_000_000_000_000) return `Rp ${fmt1.format(val / 1_000_000_000_000)} T`;
  if (val >= 1_000_000_000) {
    return `Rp ${(val >= 10_000_000_000 ? fmt0 : fmt1).format(val / 1_000_000_000)} M`;
  }
  if (val >= 1_000_000) return `Rp ${fmt0.format(val / 1_000_000)} Jt`;
  return `Rp ${fmt0.format(val / 1_000)} Rb`;
};
