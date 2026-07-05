// @vitest-environment happy-dom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BeanShotLog } from "@/components/BeanShotLog";
import { BestShotToggle } from "@/components/BestShotToggle";
import { ShotHistory } from "@/components/ShotHistory";
import type { Bean, DialInLog } from "@/lib/types";

// Pin the shot-date stamps rendered into the snapshot to a fixed zone.
process.env.TZ = "UTC";

const BEAN_ID = "8f14e45f-ea0a-4e64-9c08-4f2f5c9a1b2d";

const BEAN: Bean = {
  id: BEAN_ID,
  brand: "Night City Roasters",
  name: "Chrome Blend",
  roast_level: "dark",
  origin: "Brazil",
  created_at: "2026-06-01T00:00:00.000Z",
};

// Middle entry is the flagged best; newest entry is not.
const LOGS: DialInLog[] = [
  {
    id: "0b7f1a2c-3d4e-4f5a-8b6c-7d8e9f0a1b2c",
    bean_id: BEAN_ID,
    grind_size: "12",
    extraction_seconds: "24",
    basket_type: "single",
    notes: null,
    is_best: false,
    logged_at: "2026-07-01T08:00:00.000Z",
  },
  {
    id: "1c8a2b3d-4e5f-4a6b-9c7d-8e9f0a1b2c3d",
    bean_id: BEAN_ID,
    grind_size: "16",
    extraction_seconds: "31",
    basket_type: "double",
    notes: "balanced — repeat this",
    is_best: true,
    logged_at: "2026-07-02T09:15:00.000Z",
  },
  {
    id: "2d9b3c4e-5f6a-4b7c-8d9e-9f0a1b2c3d4e",
    bean_id: BEAN_ID,
    grind_size: "14",
    extraction_seconds: "27",
    basket_type: "double",
    notes: null,
    is_best: false,
    logged_at: "2026-07-04T07:30:00.000Z",
  },
];

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("BestShotToggle", () => {
  it("fires the PATCH best-shot handler for the tapped shot", async () => {
    const updated: DialInLog = { ...LOGS[0], is_best: true };
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ log: updated }), { status: 200 }),
    );
    const onToggled = vi.fn();
    render(<BestShotToggle log={LOGS[0]} isBest={false} onToggled={onToggled} />);

    fireEvent.click(screen.getByRole("button", { name: /flag as best shot/i }));

    await waitFor(() => expect(onToggled).toHaveBeenCalledExactlyOnceWith(updated));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`/api/beans/${BEAN_ID}/logs/${LOGS[0].id}/best`);
    expect(init.method).toBe("PATCH");
  });

  it("surfaces an alert instead of calling onToggled when the PATCH fails", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "nope" }), { status: 500 }),
    );
    const onToggled = vi.fn();
    render(<BestShotToggle log={LOGS[0]} isBest={false} onToggled={onToggled} />);

    fireEvent.click(screen.getByRole("button", { name: /flag as best shot/i }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(onToggled).not.toHaveBeenCalled();
  });

  it("keeps at most one entry per bean on the best-shot class after re-flagging", async () => {
    const target = LOGS[2]; // currently unflagged; LOGS[1] holds the flag
    fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
      if (url === "/api/beans") {
        return new Response(JSON.stringify({ beans: [BEAN] }), { status: 200 });
      }
      if (url === `/api/beans/${BEAN_ID}/logs`) {
        return new Response(JSON.stringify({ logs: LOGS }), { status: 200 });
      }
      if (
        url === `/api/beans/${BEAN_ID}/logs/${target.id}/best` &&
        init?.method === "PATCH"
      ) {
        return new Response(
          JSON.stringify({ log: { ...target, is_best: true } }),
          { status: 200 },
        );
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    render(<BeanShotLog beanId={BEAN_ID} />);
    await waitFor(() =>
      expect(screen.getAllByRole("listitem")).toHaveLength(LOGS.length),
    );

    // The previously flagged entry holds the only best-shot panel.
    let best = document.querySelectorAll(".best-shot");
    expect(best).toHaveLength(1);
    expect(best[0].querySelector("time")?.getAttribute("datetime")).toBe(
      LOGS[1].logged_at,
    );

    // Tap the flag on a different entry.
    const targetItem = screen
      .getAllByRole("listitem")
      .find(
        (li) => li.querySelector("time")?.getAttribute("datetime") === target.logged_at,
      )!;
    fireEvent.click(
      within(targetItem).getByRole("button", { name: /flag as best shot/i }),
    );

    // The flag moves: still exactly one best-shot entry, now the tapped one.
    await waitFor(() => {
      best = document.querySelectorAll(".best-shot");
      expect(best).toHaveLength(1);
      expect(best[0].querySelector("time")?.getAttribute("datetime")).toBe(
        target.logged_at,
      );
    });
    const patchCalls = fetchMock.mock.calls.filter(
      (call) => (call[1] as RequestInit | undefined)?.method === "PATCH",
    );
    expect(patchCalls).toHaveLength(1);
  });
});

describe("ShotHistory best-shot pinning", () => {
  it("pins the best shot above the chronological list without repeating it", () => {
    const { container } = render(<ShotHistory logs={LOGS} />);

    // Exactly one pinned reference panel, holding the flagged entry.
    const pinned = container.querySelectorAll(".best-shot");
    expect(pinned).toHaveLength(1);
    expect(pinned[0].querySelector("time")?.getAttribute("datetime")).toBe(
      LOGS[1].logged_at,
    );

    // Pinned callout renders before the chronological list in DOM order.
    const callout = screen.getByRole("region", { name: /best dial-in/i });
    const lists = container.querySelectorAll("ul");
    expect(lists).toHaveLength(2); // callout's single-item list + chronological list
    const chronological = lists[1];
    expect(
      callout.compareDocumentPosition(chronological) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    // The chronological list holds only the other shots, newest first —
    // the best entry is not repeated inside it.
    const chronoStamps = Array.from(chronological.querySelectorAll("time")).map(
      (t) => t.getAttribute("datetime"),
    );
    expect(chronoStamps).toEqual([LOGS[2].logged_at, LOGS[0].logged_at]);

    expect(container.firstChild).toMatchSnapshot();
  });

  it("renders no pinned callout when no shot is flagged", () => {
    const { container } = render(
      <ShotHistory logs={LOGS.map((l) => ({ ...l, is_best: false }))} />,
    );

    expect(container.querySelector(".best-shot")).toBeNull();
    expect(screen.queryByRole("region", { name: /best dial-in/i })).toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(LOGS.length);
  });
});
