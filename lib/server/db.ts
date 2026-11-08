import { Pool, QueryResultRow } from 'pg';

let pool: Pool | undefined;

function getPool() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for database access.');
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 10 });
  return pool;
}

export function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export async function dbQuery<T extends QueryResultRow>(text: string, values: unknown[] = []) {
  return getPool().query<T>(text, values);
}
