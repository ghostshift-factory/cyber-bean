// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ShotHistory } from "@/components/ShotHistory";
import type { DialInLog } from "@/lib/types";

// Deliberately NOT in reverse-chronological order — the component must sort.
const LOGS: DialInLog[] = [
  {
    id: "0b7f1a2c-3d4e-4f5a-8b6c-7d8e9f0a1b2c",
    bean_id: "8f14e45f-ea0a-4e64-9c08-4f2f5c9a1b2d",
    grind_size: "12",
    dose_in_g: "18",
    yield_out_g: "36",
    extraction_seconds: "24",
    basket_type: "single",
    taste_rating: 2,
    taste_balance: "too-sour",
    notes: null,
    is_best: false,
    logged_at: "2026-07-01T08:00:00.000Z",
  },
  {
    id: "1c8a2b3d-4e5f-4a6b-9c7d-8e9f0a1b2c3d",
    bean_id: "8f14e45f-ea0a-4e64-9c08-4f2f5c9a1b2d",
    grind_size: "16",
    dose_in_g: "18",
    yield_out_g: "38",
    extraction_seconds: "31",
    basket_type: "double",
    taste_rating: 5,
    taste_balance: "balanced",
    notes: "balanced — repeat this",
    is_best: true,
    logged_at: "2026-07-04T07:30:00.000Z",
  },
  {
    id: "2d9b3c4e-5f6a-4b7c-8d9e-9f0a1b2c3d4e",
    bean_id: "8f14e45f-ea0a-4e64-9c08-4f2f5c9a1b2d",
    grind_size: "14",
    dose_in_g: "18",
    yield_out_g: "37",
    extraction_seconds: "27",
    basket_type: "double",
    taste_rating: 3,
    taste_balance: null,
    notes: null,
    is_best: false,
    logged_at: "2026-07-02T09:15:00.000Z",
  },
];

afterEach(cleanup);

describe("ShotHistory", () => {
  it("renders entries in reverse-chronological order by logged_at", () => {
    render(<ShotHistory logs={LOGS} />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    // Newest shot (grind 16) first, oldest (grind 12) last.
    expect(items[0].textContent).toContain("16");
    expect(items[1].textContent).toContain("14");
    expect(items[2].textContent).toContain("12");

    const stamps = items.map((li) =>
      li.querySelector("time")?.getAttribute("datetime"),
    );
    expect(stamps).toEqual([
      "2026-07-04T07:30:00.000Z",
      "2026-07-02T09:15:00.000Z",
      "2026-07-01T08:00:00.000Z",
    ]);
  });

  it("shows grind size and extraction time prominently on every entry", () => {
    render(<ShotHistory logs={LOGS} />);

    for (const log of LOGS) {
      const item = screen
        .getAllByRole("listitem")
        .find((li) => li.querySelector("time")?.getAttribute("datetime") === log.logged_at);
      expect(item).toBeTruthy();
      // The headline readout carries both dial-in numbers.
      const readout = item!.querySelector("[data-readout]");
      expect(readout?.textContent).toContain(String(log.grind_size));
      expect(readout?.textContent).toContain(String(log.extraction_seconds));
    }
  });

  it("shows every log field — dose, yield, rating, balance, basket, date, and notes", () => {
    render(<ShotHistory logs={[LOGS[1]]} />);

    expect(screen.getByText("18g ▸ 38g")).toBeTruthy();
    expect(screen.getByText("★★★★★")).toBeTruthy();
    // Exact match: the balance chip, not the notes line that mentions "balanced".
    expect(screen.getByText("balanced")).toBeTruthy();
    expect(screen.getByText(/double/i)).toBeTruthy();
    expect(screen.getByText("balanced — repeat this")).toBeTruthy();
    const time = screen.getByRole("listitem").querySelector("time");
    expect(time?.getAttribute("datetime")).toBe("2026-07-04T07:30:00.000Z");
    // Best shot is flagged: pressed toggle, pinned reference panel.
    expect(screen.getByRole("button", { name: /unflag best shot/i })).toBeTruthy();
    expect(document.querySelectorAll(".best-shot")).toHaveLength(1);
  });

  it("omits notes when absent", () => {
    render(<ShotHistory logs={[LOGS[0]]} />);

    expect(screen.getByText(/single/i)).toBeTruthy();
    expect(screen.getByText("18g ▸ 36g")).toBeTruthy();
    expect(screen.getByText("★★☆☆☆")).toBeTruthy();
    expect(screen.getByText("too-sour")).toBeTruthy();
    // Unflagged entry: toggle offers to flag, nothing is pinned.
    expect(screen.getByRole("button", { name: /flag as best shot/i })).toBeTruthy();
    expect(document.querySelector(".best-shot")).toBeNull();
  });

  it("omits the taste-balance chip when balance is null", () => {
    render(<ShotHistory logs={[LOGS[2]]} />);

    expect(screen.getByText("★★★☆☆")).toBeTruthy();
    expect(screen.queryByText(/too-sour|too-bitter|balanced/)).toBeNull();
  });

  it("shows a terse empty state when there are no logs", () => {
    render(<ShotHistory logs={[]} />);

    expect(screen.getByText(/no shots/i)).toBeTruthy();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
});
