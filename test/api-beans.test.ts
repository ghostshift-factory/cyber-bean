import { beforeEach, describe, expect, it, vi } from "vitest";

// Hermetic: route handlers talk to a mocked db client, never a real Postgres.
const query = vi.fn();
vi.mock("@/lib/db", () => ({ db: () => ({ query }) }));

import { GET, POST } from "../src/app/api/beans/route";
import { DELETE } from "../src/app/api/beans/[id]/route";

const BEAN = {
  id: "8f14e45f-ea0a-4e64-9c08-4f2f5c9a1b2d",
  brand: "Single O",
  bean_type: "Reservoir",
  photo_url: null,
  created_at: "2026-07-01T09:00:00.000Z",
};

function postRequest(body: unknown) {
  return new Request("http://test/api/beans", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function deleteRequest(id: string) {
  return new Request(`http://test/api/beans/${id}`, { method: "DELETE" });
}

beforeEach(() => {
  query.mockReset();
});

describe("GET /api/beans", () => {
  it("returns the bean catalogue", async () => {
    query.mockResolvedValueOnce({ rows: [BEAN], rowCount: 1 });

    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ beans: [BEAN] });
    expect(query.mock.calls[0][0]).toMatch(/select .* from beans/is);
  });
});

describe("POST /api/beans", () => {
  it("creates a bean and returns it with 201", async () => {
    query.mockResolvedValueOnce({ rows: [BEAN], rowCount: 1 });

    const res = await POST(
      postRequest({ brand: "Single O", bean_type: "Reservoir" }),
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ bean: BEAN });
    const [sql, params] = query.mock.calls[0];
    expect(sql).toMatch(/insert into beans/i);
    expect(params).toEqual(["Single O", "Reservoir", null]);
  });

  it("stores photo_url when supplied", async () => {
    const withPhoto = { ...BEAN, photo_url: "/uploads/reservoir.webp" };
    query.mockResolvedValueOnce({ rows: [withPhoto], rowCount: 1 });

    const res = await POST(
      postRequest({
        brand: "Single O",
        bean_type: "Reservoir",
        photo_url: "/uploads/reservoir.webp",
      }),
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ bean: withPhoto });
    const [sql, params] = query.mock.calls[0];
    expect(sql).toMatch(/insert into beans/i);
    expect(sql).toMatch(/photo_url/i);
    expect(params).toEqual(["Single O", "Reservoir", "/uploads/reservoir.webp"]);
  });

  it("stores null when photo_url is omitted", async () => {
    query.mockResolvedValueOnce({ rows: [BEAN], rowCount: 1 });

    await POST(postRequest({ brand: "Single O", bean_type: "Reservoir" }));

    expect(query.mock.calls[0][1]).toEqual(["Single O", "Reservoir", null]);
  });

  it("stores null when photo_url is a blank string", async () => {
    query.mockResolvedValueOnce({ rows: [BEAN], rowCount: 1 });

    await POST(
      postRequest({ brand: "Single O", bean_type: "Reservoir", photo_url: "  " }),
    );

    expect(query.mock.calls[0][1]).toEqual(["Single O", "Reservoir", null]);
  });

  it("rejects a non-string photo_url with 400", async () => {
    const res = await POST(
      postRequest({ brand: "Single O", bean_type: "Reservoir", photo_url: 42 }),
    );

    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("photo_url");
    expect(query).not.toHaveBeenCalled();
  });

  it("rejects a photo_url longer than 500 chars with 400", async () => {
    const res = await POST(
      postRequest({
        brand: "Single O",
        bean_type: "Reservoir",
        photo_url: `/uploads/${"x".repeat(500)}.png`,
      }),
    );

    expect(res.status).toBe(400);
    expect((await res.json()).error).toContain("photo_url");
    expect(query).not.toHaveBeenCalled();
  });

  it.each(["brand", "bean_type"])(
    "rejects a body missing %s with 400",
    async (field) => {
      const body: Record<string, string> = {
        brand: "Single O",
        bean_type: "Reservoir",
      };
      delete body[field];

      const res = await POST(postRequest(body));

      expect(res.status).toBe(400);
      expect((await res.json()).error).toContain(field);
      expect(query).not.toHaveBeenCalled();
    },
  );

  it("rejects blank-string fields with 400", async () => {
    const res = await POST(postRequest({ brand: "  ", bean_type: "Reservoir" }));

    expect(res.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });

  it("rejects a non-JSON body with 400", async () => {
    const res = await POST(
      new Request("http://test/api/beans", { method: "POST", body: "not json" }),
    );

    expect(res.status).toBe(400);
    expect(query).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/beans/[id]", () => {
  it("deletes the bean and returns 200", async () => {
    query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const res = await DELETE(deleteRequest(BEAN.id), {
      params: Promise.resolve({ id: BEAN.id }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    const [sql, params] = query.mock.calls[0];
    expect(sql).toMatch(/delete from beans/i);
    expect(params).toEqual([BEAN.id]);
  });

  it("returns 404 when the bean does not exist", async () => {
    query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await DELETE(deleteRequest(BEAN.id), {
      params: Promise.resolve({ id: BEAN.id }),
    });

    expect(res.status).toBe(404);
  });

  it("returns 404 for a malformed id without querying", async () => {
    const res = await DELETE(deleteRequest("not-a-uuid"), {
      params: Promise.resolve({ id: "not-a-uuid" }),
    });

    expect(res.status).toBe(404);
    expect(query).not.toHaveBeenCalled();
  });
});
