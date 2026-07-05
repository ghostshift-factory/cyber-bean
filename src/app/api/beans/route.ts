import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const REQUIRED_FIELDS = ["brand", "name", "roast_level", "origin"] as const;

/** Bean catalogue, newest first. */
export async function GET() {
  const r = await db().query(
    "select id, brand, name, roast_level, origin, created_at from beans order by created_at desc",
  );
  return NextResponse.json({ beans: r.rows });
}

/** Add a bean. All four catalogue fields are required, non-blank strings. */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "body must be JSON" }, { status: 400 });
  }

  const record = (body ?? {}) as Record<string, unknown>;
  const missing = REQUIRED_FIELDS.filter(
    (f) => typeof record[f] !== "string" || (record[f] as string).trim() === "",
  );
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `missing required fields: ${missing.join(", ")}` },
      { status: 400 },
    );
  }

  const r = await db().query(
    `insert into beans (brand, name, roast_level, origin)
     values ($1, $2, $3, $4)
     returning id, brand, name, roast_level, origin, created_at`,
    REQUIRED_FIELDS.map((f) => (record[f] as string).trim()),
  );
  return NextResponse.json({ bean: r.rows[0] }, { status: 201 });
}
