import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const LOG_COLUMNS =
  "id, bean_id, grind_size, dose_in_g, yield_out_g, extraction_seconds, basket_type, " +
  "taste_rating, taste_balance, notes, is_best, logged_at";

type RouteContext = { params: Promise<{ id: string; logId: string }> };

/**
 * Toggle a shot's best-dial-in flag. Flagging a shot clears is_best on every
 * other row for the same bean first (in one transaction), so at most one shot
 * per bean is ever the reference; tapping the current best unflags it.
 */
export async function PATCH(_req: Request, { params }: RouteContext) {
  const { id, logId } = await params;
  // Malformed uuids can't match any row — 404 without tripping Postgres's uuid cast error.
  if (!UUID_RE.test(id) || !UUID_RE.test(logId)) {
    return NextResponse.json({ error: "log not found" }, { status: 404 });
  }

  const client = await db().connect();
  try {
    await client.query("begin");

    // Lock the target (scoped to the bean so a logId under the wrong bean is a 404).
    const target = await client.query(
      "select is_best from dial_in_logs where id = $1 and bean_id = $2 for update",
      [logId, id],
    );
    if (target.rowCount === 0) {
      await client.query("rollback");
      return NextResponse.json({ error: "log not found" }, { status: 404 });
    }

    // Mutual-exclusion invariant: clear every flagged row for this bean before
    // setting the target, so the bean never ends up with two best shots.
    await client.query(
      "update dial_in_logs set is_best = false where bean_id = $1 and is_best",
      [id],
    );
    const r = await client.query(
      `update dial_in_logs set is_best = $2 where id = $1 returning ${LOG_COLUMNS}`,
      [logId, !target.rows[0].is_best],
    );

    await client.query("commit");
    return NextResponse.json({ log: r.rows[0] });
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}
