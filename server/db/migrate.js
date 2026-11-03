import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';
import { env } from '../src/config/env.js';

const pool = new Pool({ connectionString: env.databaseUrl, connectionTimeoutMillis: 3000, ssl: env.databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false } });
try {
  const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');
  await pool.query(schema);
  console.info('Database schema applied successfully.');
} catch (error) {
  console.error(`Migration could not reach PostgreSQL: ${error.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
