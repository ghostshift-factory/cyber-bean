import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Remove a bean; its dial-in logs go with it via ON DELETE CASCADE. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // A malformed id can't match any bean — 404 without tripping Postgres's uuid cast error.
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "bean not found" }, { status: 404 });
  }

  const r = await db().query("delete from beans where id = $1", [id]);
  if (r.rowCount === 0) {
    return NextResponse.json({ error: "bean not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
