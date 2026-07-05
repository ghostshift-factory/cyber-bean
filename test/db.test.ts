import { describe, expect, it } from "vitest";
import { db } from "../src/lib/db";

// CI always provides DATABASE_URL (postgres service in factory-gate.yml). Its absence there
// means the workflow is broken — fail loudly, never skip silently to a green build.
if (process.env.CI && !process.env.DATABASE_URL) {
  throw new Error("CI must provide DATABASE_URL — check factory-gate.yml's postgres service");
}

describe.skipIf(!process.env.DATABASE_URL)("database", () => {
  it("migrations have been applied", async () => {
    const r = await db().query("select count(*)::int as n from schema_migrations");
    expect(r.rows[0].n).toBeGreaterThanOrEqual(1);
  });
});
