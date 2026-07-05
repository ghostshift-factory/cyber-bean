// Plain-node migration runner (mirrors the factory's own warehouse pattern).
// Runs on container start before `next start`, and in CI before the gate.
import { readdir, readFile } from "node:fs/promises";
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query(
  "create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())",
);
const files = (await readdir("migrations")).filter((f) => f.endsWith(".sql")).sort();
for (const f of files) {
  const seen = await client.query("select 1 from schema_migrations where name=$1", [f]);
  if (seen.rowCount) continue;
  await client.query("begin");
  try {
    await client.query(await readFile(`migrations/${f}`, "utf8"));
    await client.query("insert into schema_migrations (name) values ($1)", [f]);
    await client.query("commit");
    console.log(`applied ${f}`);
  } catch (e) {
    await client.query("rollback");
    throw e;
  }
}
await client.end();
