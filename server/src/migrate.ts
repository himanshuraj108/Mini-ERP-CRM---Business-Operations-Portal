import { Pool } from 'pg';
import dns from 'dns';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();
dns.setDefaultResultOrder('ipv4first');

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const sqlPath = path.join(__dirname, '..', 'migrations', '001_initial_schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  console.log('Running migration on Supabase...');
  try {
    await pool.query(sql);
    console.log('Migration completed successfully!');
  } catch (err) {
    const e = err as { code?: string; message?: string };
    if (e.code === '42710' || e.code === '42P07') {
      console.log('Tables already exist — skipping migration.');
    } else {
      console.error('Migration error:', err);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

migrate();
