/**
 * Menyiapkan satu sel CSV dari teks. Selain meng-escape tanda kutip, sel yang
 * diawali karakter formula (=, +, -, @, tab, CR) diberi prefiks `'` agar tidak
 * dieksekusi sebagai formula saat dibuka di Excel/Sheets (CSV injection).
 */
export function csvCell(val: unknown): string {
  let text = String(val ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}
