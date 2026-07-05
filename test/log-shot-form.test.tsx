// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LogShotForm } from "@/components/LogShotForm";
import type { DialInLog } from "@/lib/types";

const BEAN_ID = "8f14e45f-ea0a-4e64-9c08-4f2f5c9a1b2d";

const CREATED: DialInLog = {
  id: "1c8a2b3d-4e5f-4a6b-9c7d-8e9f0a1b2c3d",
  bean_id: BEAN_ID,
  grind_size: "16",
  extraction_seconds: "31",
  basket_type: "double",
  notes: null,
  is_best: false,
  logged_at: "2026-07-04T07:30:00.000Z",
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
  fireEvent.change(screen.getByLabelText(/grind/i), { target: { value: "16" } });
  fireEvent.change(screen.getByLabelText(/time/i), { target: { value: "31" } });
  fireEvent.click(screen.getByRole("radio", { name: /double/i }));
  fireEvent.change(screen.getByLabelText(/shot date/i), {
    target: { value: "2026-07-04T07:30" },
  });
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: /log shot/i }));
}

describe("LogShotForm", () => {
  // The shot date is prefilled with "now", so each case clears its own field.
  const CASES: Array<[string, () => void]> = [
    [
      "grind_size",
      () =>
        fireEvent.change(screen.getByLabelText(/grind/i), {
          target: { value: "" },
        }),
    ],
    [
      "extraction_seconds",
      () =>
        fireEvent.change(screen.getByLabelText(/time/i), {
          target: { value: "" },
        }),
    ],
    [
      "basket_type",
      // Radios can't be unchecked once set; render fresh and simply never pick one.
      () => {},
    ],
    [
      "logged_at",
      () =>
        fireEvent.change(screen.getByLabelText(/shot date/i), {
          target: { value: "" },
        }),
    ],
  ];

  for (const [field, clear] of CASES) {
    it(`blocks submit when ${field} is missing`, () => {
      render(<LogShotForm beanId={BEAN_ID} onLogged={() => {}} />);

      if (field !== "basket_type") fillValidForm();
      clear();
      submit();

      expect(screen.getByRole("alert").textContent).toMatch(/required/i);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  }

  it("POSTs the log to the bean's logs route on valid input", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ log: CREATED }), { status: 201 }),
    );
    const onLogged = vi.fn();
    render(<LogShotForm beanId={BEAN_ID} onLogged={onLogged} />);

    fillValidForm();
    fireEvent.change(screen.getByLabelText(/notes/i), {
      target: { value: "balanced" },
    });
    submit();

    await waitFor(() => expect(onLogged).toHaveBeenCalledExactlyOnceWith(CREATED));

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`/api/beans/${BEAN_ID}/logs`);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      grind_size: 16,
      extraction_seconds: 31,
      basket_type: "double",
      // datetime-local values are local time; the form ships them as ISO.
      logged_at: new Date("2026-07-04T07:30").toISOString(),
      notes: "balanced",
    });
  });

  it("omits notes from the payload when blank", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ log: CREATED }), { status: 201 }),
    );
    const onLogged = vi.fn();
    render(<LogShotForm beanId={BEAN_ID} onLogged={onLogged} />);

    fillValidForm();
    submit();

    await waitFor(() => expect(onLogged).toHaveBeenCalled());
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).not.toHaveProperty("notes");
  });

  it("surfaces an API error instead of calling onLogged", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "nope" }), { status: 500 }),
    );
    const onLogged = vi.fn();
    render(<LogShotForm beanId={BEAN_ID} onLogged={onLogged} />);

    fillValidForm();
    submit();

    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(onLogged).not.toHaveBeenCalled();
  });
});
