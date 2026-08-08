import { Pool } from 'pg';
import dns from 'dns';
import { config } from './env';

dns.setDefaultResultOrder('ipv4first');

const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client:', err.message);
  process.exit(1);
});

export async function query<T extends object = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number | null }> {
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  const duration = Date.now() - start;

  if (config.nodeEnv === 'development') {
    console.log(`[DB] ${duration}ms | ${text.slice(0, 80)}`);
  }

  return result;
}

export async function getClient() {
  return pool.connect();
}

export default pool;
