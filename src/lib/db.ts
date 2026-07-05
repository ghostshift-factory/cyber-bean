import { Pool } from "pg";

let pool: Pool | undefined;

/** Lazy singleton — DATABASE_URL is injected by the factory (dev.env locally, /opt/products/<name>/.env on the host). */
export function db(): Pool {
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL });
  return pool;
}
