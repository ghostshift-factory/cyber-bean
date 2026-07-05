import { beforeEach, describe, expect, it, vi } from "vitest";

// Hermetic: route handlers talk to a mocked db client, never a real Postgres.
const query = vi.fn();
vi.mock("@/lib/db", () => ({ db: () => ({ query }) }));

import { GET, POST } from "../src/app/api/beans/[id]/logs/route";

const BEAN_ID = "8f14e45f-ea0a-4e64-9c08-4f2f5c9a1b2d";

const LOG = {
  id: "1c9a7e2b-5d34-4b7a-9e1f-0a2b3c4d5e6f",
  bean_id: BEAN_ID,
  grind_size: 12,
  dose_in_g: 18,
  yield_out_g: 36,
  extraction_seconds: 28,
  basket_type: "double",
  taste_rating: 4,
  taste_balance: "balanced",
  notes: "balanced, slight caramel",
  is_best: false,
  logged_at: "2026-07-04T08:30:00.000Z",
};

const VALID_BODY = {
  grind_size: 12,
  dose_in_g: 18,
  yield_out_g: 36,
  extraction_seconds: 28,
  basket_type: "double",
  taste_rating: 4,
  logged_at: "2026-07-04T08:30:00.000Z",
};

function ctx(id: string) {
  return { params: Promise.resolve({ id }) };
}

function getRequest(id: string) {
  return new Request(`http://test/api/beans/${id}/logs`);
}

function postRequest(id: string, body: unknown) {
  return new Request(`http://test/api/beans/${id}/logs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  query.mockReset();
});

describe("GET /api/beans/[id]/logs", () => {
  it("returns the bean's logs ordered by logged_at descending", async () => {
    const older = { ...LOG, id: "2d0b8f3c-6e45-4c8b-af20-1b3c4d5e6f70", logged_at: "2026-07-01T07:00:00.000Z" };
    query.mockResolvedValueOnce({ rows: [LOG, older], rowCount: 2 });

    const res = await GET(getRequest(BEAN_ID), ctx(BEAN_ID));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ logs: [LOG, older] });
    const [sql, params] = query.mock.calls[0];
    expect(sql).toMatch(/from dial_in_logs/i);
    expect(sql).toMatch(/order by logged_at desc/i);
    expect(params).toEqual([BEAN_ID]);
  });

  it("returns 404 for a malformed bean id without querying", async () => {
    const res = await GET(getRequest("not-a-uuid"), ctx("not-a-uuid"));

    expect(res.status).toBe(404);
    expect(query).not.toHaveBeenCalled();
  });
});

describe("POST /api/beans/[id]/logs", () => {
  it("inserts a log with all required fields and returns it with 201", async () => {
    query.mockResolvedValueOnce({ rows: [LOG], rowCount: 1 });

    const res = await POST(
      postRequest(BEAN_ID, {
        ...VALID_BODY,
        taste_balance: "balanced",
        notes: "balanced, slight caramel",
      }),
      ctx(BEAN_ID),
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ log: LOG });
    const [sql, params] = query.mock.calls[0];
    expect(sql).toMatch(/insert into dial_in_logs/i);
    expect(params).toEqual([
      BEAN_ID,
      12,
      18,
      36,
      28,
      "double",
      4,
      "balanced",
      "balanced, slight caramel",
      "2026-07-04T08:30:00.000Z",
    ]);
  });

  it("accepts a log without taste_balance and notes", async () => {
    const bare = { ...LOG, taste_balance: null, notes: null };
    query.mockResolvedValueOnce({ rows: [bare], rowCount: 1 });

    const res = await POST(postRequest(BEAN_ID, VALID_BODY), ctx(BEAN_ID));

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ log: bare });
    const params = query.mock.calls[0][1];
    expect(params[7]).toBeNull(); // taste_balance
    expect(params[8]).toBeNull(); // notes
  });

  it.each([
    "grind_size",
    "dose_in_g",
    "yield_out_g",
    "extraction_seconds",
    "basket_type",
    "taste_rating",
    "logged_at",
  ])(
    "rejects a body missing %s with 400",
    async (field) => {
      const body: Record<string, unknown> = { ...VALID_BODY };
      delete body[field];

      const res = await POST(postRequest(BEAN_ID, body), ctx(BEAN_ID));

      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain(field);
      expect(query).not.toHaveBeenCalled();
    },
  );

  it.each([0, 6, 3.5, "4"])("rejects a taste_rating of %j with 400", async (rating) => {
    const res = await POST(
      postRequest(BEAN_ID, { ...VALID_BODY, taste_rating: rating }),
      ctx(BEAN_ID),
    );

    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("taste_rating");
    expect(query).not.toHaveBeenCalled();
  });

  it("rejects a non-numeric grind_size with 400", async () => {
    const res = await POST(
      postRequest(BEAN_ID, { ...VALID_BODY, grind_size: "coarse" }),
      ctx(BEAN_ID),
    );

    expect(res.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });

  it("rejects an unparseable logged_at with 400", async () => {
    const res = await POST(
      postRequest(BEAN_ID, { ...VALID_BODY, logged_at: "yesterday-ish" }),
      ctx(BEAN_ID),
    );

    expect(res.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });

  it("rejects a non-JSON body with 400", async () => {
    const res = await POST(
      new Request(`http://test/api/beans/${BEAN_ID}/logs`, { method: "POST", body: "not json" }),
      ctx(BEAN_ID),
    );

    expect(res.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });

  it("returns 404 for a malformed bean id without querying", async () => {
    const res = await POST(postRequest("not-a-uuid", VALID_BODY), ctx("not-a-uuid"));

    expect(res.status).toBe(404);
    expect(query).not.toHaveBeenCalled();
  });

  it("returns 404 when the bean does not exist (FK violation)", async () => {
    query.mockRejectedValueOnce(Object.assign(new Error("fk"), { code: "23503" }));

    const res = await POST(postRequest(BEAN_ID, VALID_BODY), ctx(BEAN_ID));

    expect(res.status).toBe(404);
  });
});
