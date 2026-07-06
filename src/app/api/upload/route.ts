import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

function startsWith(bytes: Uint8Array, leading: number[], offset = 0) {
  return leading.every((b, i) => bytes[offset + i] === b);
}

/** Sniff the real image type from leading bytes — the client-supplied
 *  content-type and filename are untrusted. */
function sniffImageExt(bytes: Uint8Array): string | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "jpg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    return "png";
  if (
    startsWith(bytes, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) || // GIF87a
    startsWith(bytes, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]) // GIF89a
  )
    return "gif";
  if (
    startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && // RIFF
    startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8) // WEBP
  )
    return "webp";
  return null;
}

/** Store an uploaded bean photo under public/uploads/. */
export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "body must be multipart/form-data" },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file field required" }, { status: 400 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "file exceeds the 5 MB limit" },
      { status: 400 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = sniffImageExt(bytes);
  if (ext === null) {
    return NextResponse.json(
      { error: "file is not a supported image (jpeg, png, webp, gif)" },
      { status: 400 },
    );
  }

  await mkdir(UPLOADS_DIR, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  await writeFile(path.join(UPLOADS_DIR, filename), bytes);

  return NextResponse.json({ url: `/uploads/${filename}` });
}
