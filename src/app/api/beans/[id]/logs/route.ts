import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const LOG_COLUMNS =
  "id, bean_id, grind_size, extraction_seconds, basket_type, notes, is_best, logged_at";

type RouteContext = { params: Promise<{ id: string }> };

/** Shot history for a bean, newest shot first. */
export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  // A malformed id can't match any bean — 404 without tripping Postgres's uuid cast error.
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "bean not found" }, { status: 404 });
  }

  const r = await db().query(
    `select ${LOG_COLUMNS} from dial_in_logs where bean_id = $1 order by logged_at desc`,
    [id],
  );
  return NextResponse.json({ logs: r.rows });
}

/**
 * Log a shot. Requires grind_size and extraction_seconds (finite numbers),
 * basket_type (non-blank string), and logged_at (parseable date); notes optional.
 */
export async function POST(req: Request, { params }: RouteContext) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "bean not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "body must be JSON" }, { status: 400 });
  }
  const record = (body ?? {}) as Record<string, unknown>;

  const invalid: string[] = [];
  for (const f of ["grind_size", "extraction_seconds"] as const) {
    if (typeof record[f] !== "number" || !Number.isFinite(record[f])) invalid.push(f);
  }
  const basketType = record.basket_type;
  if (typeof basketType !== "string" || basketType.trim() === "") invalid.push("basket_type");
  const loggedAt = record.logged_at;
  if (typeof loggedAt !== "string" || Number.isNaN(Date.parse(loggedAt))) invalid.push("logged_at");
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: `missing or invalid required fields: ${invalid.join(", ")}` },
      { status: 400 },
    );
  }

  const notes =
    typeof record.notes === "string" && record.notes.trim() !== "" ? record.notes : null;

  try {
    const r = await db().query(
      `insert into dial_in_logs (bean_id, grind_size, extraction_seconds, basket_type, logged_at, notes)
       values ($1, $2, $3, $4, $5, $6)
       returning ${LOG_COLUMNS}`,
      [
        id,
        record.grind_size,
        record.extraction_seconds,
        (basketType as string).trim(),
        loggedAt,
        notes,
      ],
    );
    return NextResponse.json({ log: r.rows[0] }, { status: 201 });
  } catch (err) {
    // FK violation: the bean was deleted (or never existed) — not a server fault.
    if ((err as { code?: string }).code === "23503") {
      return NextResponse.json({ error: "bean not found" }, { status: 404 });
    }
    throw err;
  }
}
