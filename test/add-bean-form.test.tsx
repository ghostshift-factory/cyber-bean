// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AddBeanForm } from "@/components/AddBeanForm";
import type { Bean } from "@/lib/types";

const CREATED: Bean = {
  id: "8f14e45f-ea0a-4e64-9c08-4f2f5c9a1b2d",
  brand: "Single O",
  bean_type: "Reservoir",
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
