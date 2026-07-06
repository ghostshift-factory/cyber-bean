// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AddBeanForm } from "@/components/AddBeanForm";
import type { Bean } from "@/lib/types";

const CREATED: Bean = {
  id: "8f14e45f-ea0a-4e64-9c08-4f2f5c9a1b2d",
  brand: "Single O",
  bean_type: "Reservoir",
  photo_url: null,
  created_at: "2026-07-01T09:00:00.000Z",
};

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function fillValidForm() {
  fireEvent.change(screen.getByLabelText(/brand/i), {
    target: { value: "Single O" },
  });
  fireEvent.change(screen.getByLabelText(/bean type/i), {
    target: { value: "Reservoir" },
  });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: /add bean/i }));
}

const PHOTO_FILE = new File(
  [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
  "bean.png",
  { type: "image/png" },
);

function selectPhoto() {
  fireEvent.change(screen.getByLabelText(/photo/i), {
    target: { files: [PHOTO_FILE] },
  });
}

function uploadOk(url = "/uploads/abc.png") {
  return new Response(JSON.stringify({ url }), { status: 200 });
}

describe("AddBeanForm", () => {
  it("blocks submit and flags brand and bean type when the form is empty", () => {
    render(<AddBeanForm onAdded={() => {}} />);

    submit();

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/required/i);
    expect(alert.textContent).toMatch(/brand/i);
    expect(alert.textContent).toMatch(/bean type/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks submit when only brand is filled", () => {
    render(<AddBeanForm onAdded={() => {}} />);
    fireEvent.change(screen.getByLabelText(/brand/i), {
      target: { value: "Single O" },
    });

    submit();

    expect(screen.getByRole("alert").textContent).toMatch(/bean type/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("treats whitespace-only input as missing", () => {
    render(<AddBeanForm onAdded={() => {}} />);
    fillValidForm();
    fireEvent.change(screen.getByLabelText(/bean type/i), {
      target: { value: "   " },
    });

    submit();

    expect(screen.getByRole("alert")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("POSTs to /api/beans and reports the created bean on valid input", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ bean: CREATED }), { status: 201 }),
    );
    const onAdded = vi.fn();
    render(<AddBeanForm onAdded={onAdded} />);

    fillValidForm();
    submit();

    await waitFor(() => expect(onAdded).toHaveBeenCalledExactlyOnceWith(CREATED));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/beans");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      brand: "Single O",
      bean_type: "Reservoir",
    });

    // Fields reset for the next bean.
    expect((screen.getByLabelText(/brand/i) as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText(/bean type/i) as HTMLInputElement).value).toBe("");
  });

  it("surfaces an API error instead of calling onAdded", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "nope" }), { status: 500 }),
    );
    const onAdded = vi.fn();
    render(<AddBeanForm onAdded={onAdded} />);

    fillValidForm();
    submit();

    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(onAdded).not.toHaveBeenCalled();
  });
});

describe("AddBeanForm photo picker", () => {
  it("renders a file input that accepts images without forcing camera capture", () => {
    render(<AddBeanForm onAdded={() => {}} />);

    const input = screen.getByLabelText(/photo/i) as HTMLInputElement;
    expect(input.type).toBe("file");
    expect(input.getAttribute("accept")).toBe("image/*");
    expect(input.hasAttribute("capture")).toBe(false);
  });

  it("POSTs the selected file to /api/upload and shows a preview thumbnail", async () => {
    fetchMock.mockResolvedValueOnce(uploadOk());
    render(<AddBeanForm onAdded={() => {}} />);

    selectPhoto();

    const preview = await screen.findByAltText(/bean photo preview/i);
    expect(preview.getAttribute("src")).toBe("/uploads/abc.png");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/upload");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
    const sent = (init.body as FormData).get("file");
    expect(sent).toBeInstanceOf(File);
    expect((sent as File).name).toBe("bean.png");
  });

  it("disables submit while the upload is in-flight and re-enables on success", async () => {
    let resolveUpload!: (r: Response) => void;
    fetchMock.mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveUpload = resolve;
      }),
    );
    render(<AddBeanForm onAdded={() => {}} />);
    fillValidForm();

    selectPhoto();

    const button = screen.getByRole("button", {
      name: /add bean/i,
    }) as HTMLButtonElement;
    await waitFor(() => expect(button.disabled).toBe(true));

    submit();
    // Only the upload call — no bean create while the photo is in-flight.
    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveUpload(uploadOk());
    await waitFor(() => expect(button.disabled).toBe(false));
  });

  it("shows an inline error when the upload is rejected and blocks submit", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "file exceeds the 5 MB limit" }), {
        status: 400,
      }),
    );
    const onAdded = vi.fn();
    render(<AddBeanForm onAdded={onAdded} />);
    fillValidForm();

    selectPhoto();

    const alert = await screen.findByText(/file exceeds the 5 MB limit/i);
    expect(alert.getAttribute("role")).toBe("alert");

    submit();
    await screen.findByText(/photo upload failed/i);
    // Still only the upload call — the failed photo blocks bean creation.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onAdded).not.toHaveBeenCalled();
  });

  it("shows an inline error on network failure", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));
    render(<AddBeanForm onAdded={() => {}} />);

    selectPhoto();

    const alert = await screen.findByText(/photo not uploaded/i);
    expect(alert.getAttribute("role")).toBe("alert");
    expect(screen.queryByAltText(/bean photo preview/i)).toBeNull();
  });

  it("includes photo_url in the create payload after a successful upload", async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url === "/api/upload"
        ? uploadOk()
        : new Response(JSON.stringify({ bean: CREATED }), { status: 201 }),
    );
    const onAdded = vi.fn();
    render(<AddBeanForm onAdded={onAdded} />);
    fillValidForm();

    selectPhoto();
    await screen.findByAltText(/bean photo preview/i);

    submit();
    await waitFor(() => expect(onAdded).toHaveBeenCalled());

    const createCall = fetchMock.mock.calls.find(([u]) => u === "/api/beans");
    expect(createCall).toBeTruthy();
    expect(JSON.parse(createCall![1].body)).toEqual({
      brand: "Single O",
      bean_type: "Reservoir",
      photo_url: "/uploads/abc.png",
    });

    // Photo state resets for the next bean.
    await waitFor(() =>
      expect(screen.queryByAltText(/bean photo preview/i)).toBeNull(),
    );
  });

  it("clears the pending photo so the bean can be created without it", async () => {
    fetchMock.mockResolvedValueOnce(uploadOk());
    render(<AddBeanForm onAdded={() => {}} />);

    selectPhoto();
    await screen.findByAltText(/bean photo preview/i);

    fireEvent.click(screen.getByRole("button", { name: /clear/i }));

    expect(screen.queryByAltText(/bean photo preview/i)).toBeNull();
  });
});
