import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Hermetic: the route writes through mocked fs, never the real disk.
const { mkdir, writeFile } = vi.hoisted(() => ({
  mkdir: vi.fn(),
  writeFile: vi.fn(),
}));
vi.mock("node:fs/promises", () => ({
  mkdir,
  writeFile,
  default: { mkdir, writeFile },
}));

import { POST } from "../src/app/api/upload/route";

const MAX_BYTES = 5 * 1024 * 1024;

const MAGIC: Record<string, number[]> = {
  jpg: [0xff, 0xd8, 0xff, 0xe0],
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  gif: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  webp: [
    0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, // RIFF + size
    0x57, 0x45, 0x42, 0x50, // WEBP
  ],
};

function imageBytes(leading: number[], total = 64) {
  const bytes = new Uint8Array(new ArrayBuffer(total));
  bytes.set(leading);
  return bytes;
}

function uploadRequest(bytes: Uint8Array<ArrayBuffer>, name = "photo.bin") {
  const form = new FormData();
  form.append("file", new File([bytes], name));
  return new Request("http://test/api/upload", { method: "POST", body: form });
}

beforeEach(() => {
  mkdir.mockReset().mockResolvedValue(undefined);
  writeFile.mockReset().mockResolvedValue(undefined);
});

describe("POST /api/upload", () => {
  it.each(Object.keys(MAGIC))(
    "accepts a %s file, writes it, and returns its public url",
    async (ext) => {
      const res = await POST(uploadRequest(imageBytes(MAGIC[ext])));

      expect(res.status).toBe(200);
      const { url } = await res.json();
      expect(url).toMatch(new RegExp(`^/uploads/[0-9a-f-]+\\.${ext}$`));

      // uploads dir is created if absent, then the file lands inside it
      expect(mkdir).toHaveBeenCalledWith(
        expect.stringMatching(/public[/\\]uploads$/),
        { recursive: true },
      );
      const [writtenPath, written] = writeFile.mock.calls[0];
      expect(writtenPath).toContain(url.slice(1).replace("/", path.sep));
      expect(new Uint8Array(written)).toEqual(imageBytes(MAGIC[ext]));
    },
  );

  it("rejects a file over 5 MB with 400", async () => {
    const big = imageBytes(MAGIC.png, MAX_BYTES + 1);

    const res = await POST(uploadRequest(big));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/5 ?MB/i);
    expect(writeFile).not.toHaveBeenCalled();
  });

  it("rejects a file whose leading bytes match no image signature with 400", async () => {
    const notAnImage = imageBytes(
      [...new TextEncoder().encode("<!doctype html><script>")],
      24,
    );

    const res = await POST(uploadRequest(notAnImage, "sneaky.png"));

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/image/i);
    expect(writeFile).not.toHaveBeenCalled();
  });

  it("rejects a body without a file field with 400", async () => {
    const form = new FormData();
    const res = await POST(
      new Request("http://test/api/upload", { method: "POST", body: form }),
    );

    expect(res.status).toBe(400);
    expect(writeFile).not.toHaveBeenCalled();
  });

  it("rejects a non-multipart body with 400", async () => {
    const res = await POST(
      new Request("http://test/api/upload", { method: "POST", body: "raw" }),
    );

    expect(res.status).toBe(400);
    expect(writeFile).not.toHaveBeenCalled();
  });
});
