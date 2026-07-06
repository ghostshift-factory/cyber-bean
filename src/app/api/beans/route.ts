import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const REQUIRED_FIELDS = ["brand", "bean_type"] as const;

/** Matches the varchar(500) limit on beans.photo_url. */
const PHOTO_URL_MAX_LENGTH = 500;

/** Bean catalogue, newest first. */
export async function GET() {
  const r = await db().query(
    "select id, brand, bean_type, photo_url, created_at from beans order by created_at desc",
  );
  return NextResponse.json({ beans: r.rows });
}

/** Add a bean. Brand and bean type are required, non-blank strings; photo_url is optional. */
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

  const rawPhotoUrl = record.photo_url;
  if (
    rawPhotoUrl !== undefined &&
    rawPhotoUrl !== null &&
    typeof rawPhotoUrl !== "string"
  ) {
    return NextResponse.json(
      { error: "photo_url must be a string" },
      { status: 400 },
    );
  }
  const photoUrl =
    typeof rawPhotoUrl === "string" && rawPhotoUrl.trim() !== ""
      ? rawPhotoUrl.trim()
      : null;
  if (photoUrl !== null && photoUrl.length > PHOTO_URL_MAX_LENGTH) {
    return NextResponse.json(
      { error: `photo_url must be at most ${PHOTO_URL_MAX_LENGTH} characters` },
      { status: 400 },
    );
  }

  const r = await db().query(
    `insert into beans (brand, bean_type, photo_url)
     values ($1, $2, $3)
     returning id, brand, bean_type, photo_url, created_at`,
    [...REQUIRED_FIELDS.map((f) => (record[f] as string).trim()), photoUrl],
  );
  return NextResponse.json({ bean: r.rows[0] }, { status: 201 });
}
