import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** The Ship station's health gate polls this. ok:false / 503 fails the deploy and triggers rollback. */
export async function GET() {
  try {
    await db().query("select 1");
    return NextResponse.json({ ok: true, sha: process.env.GIT_SHA ?? "dev" });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 503 });
  }
}
