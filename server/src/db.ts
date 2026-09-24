import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = 
  process.env.DATABASE_URL || 
  'postgresql://gealgeolgeo:GeoSecure2026R3set@gealgeolgeo-postgis:5432/sipekaps';

export const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client:', err);
});
