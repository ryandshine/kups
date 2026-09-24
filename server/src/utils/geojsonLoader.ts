import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cachedGeoJson: any = null;

export function loadIndonesianProvincesGeoJson(): any {
  if (cachedGeoJson) return JSON.parse(JSON.stringify(cachedGeoJson));

  // Check both relative from server/src or server/dist or root
  let geoJsonPath = path.resolve(__dirname, '../../../../indonesia-38-provinces.geojson');
  if (!fs.existsSync(geoJsonPath)) {
    geoJsonPath = path.resolve(__dirname, '../../../indonesia-38-provinces.geojson');
  }
  if (!fs.existsSync(geoJsonPath)) {
    geoJsonPath = path.resolve(process.cwd(), 'indonesia-38-provinces.geojson');
  }
  if (!fs.existsSync(geoJsonPath)) {
    throw new Error(`GeoJSON file not found at ${geoJsonPath}`);
  }

  const raw = fs.readFileSync(geoJsonPath, 'utf8');
  cachedGeoJson = JSON.parse(raw);
  return JSON.parse(JSON.stringify(cachedGeoJson));
}

export function normalizeProvinceName(rawName: string): string {
  if (!rawName) return '';
  return rawName
    .toUpperCase()
    .replace(/^PROVINSI\s+/, '')
    .replace(/^DAERAH\s+ISTIMEWA\s+/, 'D I ')
    .replace(/^DKI\s+/, 'D K I ')
    .replace(/KEP\.\s*/, 'KEPULAUAN ')
    .replace(/[\s\-_]+/g, ' ')
    .trim();
}
