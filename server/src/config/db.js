import pg from 'pg';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export async function connectDatabase() {
  if (!env.databaseUrl || /placeholder|your_.*_url/i.test(env.databaseUrl)) {
    logger.info('DATABASE_URL is unset or a placeholder; using in-memory storage.');
    return null;
  }
  const pool = new pg.Pool({
    connectionString: env.databaseUrl,
    connectionTimeoutMillis: 3000,
    ssl: env.databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false }
  });
  try {
    await pool.query({ text: 'SELECT 1', query_timeout: 3000 });
    logger.info('PostgreSQL storage selected.');
    return pool;
  } catch (error) {
    await pool.end();
    logger.info(`PostgreSQL unavailable (${error.message}); using in-memory storage.`);
    return null;
  }
}
