import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../../../../../../.env') });
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL no definido');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  keepAlive: true,
});

process.on('SIGINT', async () => { await pool.end(); process.exit(0); });
export { pool };
