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
  dose_in_g: "18",
  yield_out_g: "38",
  extraction_seconds: "31",
  basket_type: "double",
  taste_rating: 4,
  taste_balance: "balanced",
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

const FILL: Record<string, () => void> = {
  grind_size: () =>
    fireEvent.change(screen.getByLabelText(/grind/i), { target: { value: "16" } }),
  dose_in_g: () =>
    fireEvent.change(screen.getByLabelText(/dose/i), { target: { value: "18" } }),
  yield_out_g: () =>
    fireEvent.change(screen.getByLabelText(/yield/i), { target: { value: "38" } }),
  extraction_seconds: () =>
    fireEvent.change(screen.getByLabelText(/time/i), { target: { value: "31" } }),
  basket_type: () => fireEvent.click(screen.getByRole("radio", { name: /double/i })),
  taste_rating: () => fireEvent.click(screen.getByRole("radio", { name: /4 stars/i })),
  logged_at: () =>
    fireEvent.change(screen.getByLabelText(/shot date/i), {
      target: { value: "2026-07-04T07:30" },
    }),
};

function fillValidForm(except?: string) {
  for (const [field, fill] of Object.entries(FILL)) {
    if (field !== except) fill();
  }
}

function submit() {
  fireEvent.click(screen.getByRole("button", { name: /log shot/i }));
}

describe("LogShotForm", () => {
  // One case per required field. Skipping a text input leaves it blank;
  // skipping a radio group (basket, rating) leaves nothing picked. The shot
  // date is prefilled with "now", so that case clears it explicitly.
  for (const field of Object.keys(FILL)) {
    it(`blocks submit when ${field} is missing`, () => {
      render(<LogShotForm beanId={BEAN_ID} onLogged={() => {}} />);

      fillValidForm(field);
      if (field === "logged_at") {
        fireEvent.change(screen.getByLabelText(/shot date/i), {
          target: { value: "" },
        });
      }
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
    fireEvent.click(screen.getByRole("button", { name: "balanced" }));
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
      dose_in_g: 18,
      yield_out_g: 38,
      extraction_seconds: 31,
      basket_type: "double",
      taste_rating: 4,
      taste_balance: "balanced",
      // datetime-local values are local time; the form ships them as ISO.
      logged_at: new Date("2026-07-04T07:30").toISOString(),
      notes: "balanced",
    });
  });

  it("omits notes and taste_balance from the payload when blank", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ log: CREATED }), { status: 201 }),
    );
    const onLogged = vi.fn();
    render(<LogShotForm beanId={BEAN_ID} onLogged={onLogged} />);

    fillValidForm();
    submit();

    await waitFor(() => expect(onLogged).toHaveBeenCalled());
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).not.toHaveProperty("notes");
    expect(body).not.toHaveProperty("taste_balance");
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
