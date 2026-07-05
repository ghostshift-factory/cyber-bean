import { beforeEach, describe, expect, it, vi } from "vitest";

// Hermetic: the route checks out a mocked pool client, never a real Postgres.
const query = vi.fn();
const release = vi.fn();
const connect = vi.fn(async () => ({ query, release }));
vi.mock("@/lib/db", () => ({ db: () => ({ connect }) }));

import { PATCH } from "../src/app/api/beans/[id]/logs/[logId]/best/route";

const BEAN_ID = "8f14e45f-ea0a-4e64-9c08-4f2f5c9a1b2d";
const LOG_ID = "1c9a7e2b-5d34-4b7a-9e1f-0a2b3c4d5e6f";

const BEST_LOG = {
  id: LOG_ID,
  bean_id: BEAN_ID,
  grind_size: 12,
  extraction_seconds: 28,
  basket_type: "double",
  notes: "balanced, slight caramel",
  is_best: true,
  logged_at: "2026-07-04T08:30:00.000Z",
};

function ctx(id: string, logId: string) {
  return { params: Promise.resolve({ id, logId }) };
}

function patchRequest(id = BEAN_ID, logId = LOG_ID) {
  return new Request(`http://test/api/beans/${id}/logs/${logId}/best`, { method: "PATCH" });
}

/** SQL text of every non-transaction-control query, in execution order. */
function statements(): string[] {
  return query.mock.calls
    .map((c) => String(c[0]).trim().toLowerCase())
    .filter((sql) => !["begin", "commit", "rollback"].includes(sql));
}

beforeEach(() => {
  query.mockReset();
  release.mockClear();
  connect.mockClear();
});

describe("PATCH /api/beans/[id]/logs/[logId]/best", () => {
  it("clears is_best on all of the bean's rows before setting is_best on the target row", async () => {
    query.mockImplementation(async (sql: string) => {
      if (/select is_best/i.test(sql)) return { rows: [{ is_best: false }], rowCount: 1 };
      if (/set is_best = \$2/i.test(sql)) return { rows: [BEST_LOG], rowCount: 1 };
      return { rows: [], rowCount: 0 };
    });

    const res = await PATCH(patchRequest(), ctx(BEAN_ID, LOG_ID));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ log: BEST_LOG });

    // Mutual-exclusion invariant: the bean-wide clear runs strictly before the
    // target set, inside one transaction, so at most one row is ever is_best.
    const sqls = statements();
    const clearIdx = sqls.findIndex((s) => /set is_best = false\s+where bean_id = \$1/.test(s));
    const setIdx = sqls.findIndex((s) => /set is_best = \$2\s+where id = \$1/.test(s));
    expect(clearIdx).toBeGreaterThanOrEqual(0);
    expect(setIdx).toBeGreaterThanOrEqual(0);
    expect(clearIdx).toBeLessThan(setIdx);

    const clearCall = query.mock.calls.find((c) => /set is_best = false/i.test(c[0]));
    expect(clearCall?.[1]).toEqual([BEAN_ID]);
    const setCall = query.mock.calls.find((c) => /set is_best = \$2/i.test(c[0]));
    expect(setCall?.[1]).toEqual([LOG_ID, true]);

    const raw = query.mock.calls.map((c) => String(c[0]).trim().toLowerCase());
    expect(raw[0]).toBe("begin");
    expect(raw[raw.length - 1]).toBe("commit");
    expect(release).toHaveBeenCalledTimes(1);
  });

  it("toggles is_best off when the target row is already the best shot", async () => {
    const unflagged = { ...BEST_LOG, is_best: false };
    query.mockImplementation(async (sql: string) => {
      if (/select is_best/i.test(sql)) return { rows: [{ is_best: true }], rowCount: 1 };
      if (/set is_best = \$2/i.test(sql)) return { rows: [unflagged], rowCount: 1 };
      return { rows: [], rowCount: 0 };
    });

    const res = await PATCH(patchRequest(), ctx(BEAN_ID, LOG_ID));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ log: unflagged });
    const setCall = query.mock.calls.find((c) => /set is_best = \$2/i.test(c[0]));
    expect(setCall?.[1]).toEqual([LOG_ID, false]);
  });

  it("returns 404 for an unknown logId without mutating any rows", async () => {
    query.mockImplementation(async (sql: string) => {
      if (/select is_best/i.test(sql)) return { rows: [], rowCount: 0 };
      return { rows: [], rowCount: 0 };
    });

    const res = await PATCH(patchRequest(), ctx(BEAN_ID, LOG_ID));

    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("log not found");
    expect(query.mock.calls.some((c) => /update dial_in_logs/i.test(c[0]))).toBe(false);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it("returns 404 when the log belongs to a different bean", async () => {
    // The lookup is scoped by bean_id, so a logId under the wrong bean matches no row.
    query.mockImplementation(async (sql: string) => {
      if (/select is_best/i.test(sql)) return { rows: [], rowCount: 0 };
      return { rows: [], rowCount: 0 };
    });

    const res = await PATCH(patchRequest(), ctx(BEAN_ID, LOG_ID));

    expect(res.status).toBe(404);
    const lookup = query.mock.calls.find((c) => /select is_best/i.test(c[0]));
    expect(lookup?.[1]).toEqual([LOG_ID, BEAN_ID]);
  });

  it.each([
    ["bean id", "not-a-uuid", LOG_ID],
    ["logId", BEAN_ID, "not-a-uuid"],
  ])("returns 404 for a malformed %s without touching the db", async (_label, id, logId) => {
    const res = await PATCH(patchRequest(id, logId), ctx(id, logId));

    expect(res.status).toBe(404);
    expect(connect).not.toHaveBeenCalled();
  });

  it("rolls back and releases the client when a query fails", async () => {
    query.mockImplementation(async (sql: string) => {
      if (/select is_best/i.test(sql)) return { rows: [{ is_best: false }], rowCount: 1 };
      if (/set is_best = false/i.test(sql)) throw new Error("boom");
      return { rows: [], rowCount: 0 };
    });

    await expect(PATCH(patchRequest(), ctx(BEAN_ID, LOG_ID))).rejects.toThrow("boom");
    const raw = query.mock.calls.map((c) => String(c[0]).trim().toLowerCase());
    expect(raw).toContain("rollback");
    expect(raw).not.toContain("commit");
    expect(release).toHaveBeenCalledTimes(1);
  });
});
