import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Hermetic schema check: parses the migration SQL text, no database required.
// 0003 rebuilds both tables to the dial-in spec, so it is the authoritative
// definition of the schema the app runs against.
const sql = readFileSync(
  join(__dirname, "..", "migrations", "0003_rebuild_beans_and_dial_in_logs.sql"),
  "utf8",
).toLowerCase();

function tableBody(table: string): string {
  const m = sql.match(new RegExp(`create table ${table}\\s*\\(([\\s\\S]*?)\\n\\);`));
  if (!m) throw new Error(`create table ${table} not found in migration`);
  return m[1];
}

describe("migration 0003_rebuild_beans_and_dial_in_logs", () => {
  const beans = tableBody("beans");
  const logs = tableBody("dial_in_logs");

  it("defines beans with id, brand, bean_type, created_at", () => {
    expect(beans).toMatch(/\bid uuid primary key/);
    expect(beans).toMatch(/\bbrand text not null\b/);
    expect(beans).toMatch(/\bbean_type text not null\b/);
    expect(beans).toMatch(/\bcreated_at timestamptz not null default now\(\)/);
  });

  it("defines dial_in_logs id and bean_id FK with ON DELETE CASCADE", () => {
    expect(logs).toMatch(/\bid uuid primary key/);
    expect(logs).toMatch(/\bbean_id uuid not null references beans\s*\(id\) on delete cascade\b/);
  });

  it("defines shot measurement columns with correct types", () => {
    expect(logs).toMatch(/\bgrind_size numeric not null\b/);
    expect(logs).toMatch(/\bdose_in_g numeric not null\b/);
    expect(logs).toMatch(/\byield_out_g numeric not null\b/);
    expect(logs).toMatch(/\bextraction_seconds integer not null\b/);
    expect(logs).toMatch(/\bbasket_type text not null\b/);
  });

  it("defines taste_rating as SMALLINT", () => {
    expect(logs).toMatch(/\btaste_rating smallint not null\b/);
  });

  it("defines taste_balance and notes as nullable text", () => {
    expect(logs).toMatch(/\btaste_balance text\b/);
    expect(logs).not.toMatch(/\btaste_balance text not null\b/);
    expect(logs).toMatch(/\bnotes text\b/);
    expect(logs).not.toMatch(/\bnotes text not null\b/);
  });

  it("defines is_best boolean defaulting to false", () => {
    expect(logs).toMatch(/\bis_best boolean not null default false\b/);
  });

  it("defines logged_at as a required TIMESTAMPTZ without a now() default (user-supplied shot date)", () => {
    expect(logs).toMatch(/\blogged_at timestamptz not null\b/);
    expect(logs).not.toMatch(/\blogged_at timestamptz not null default\b/);
  });
});
