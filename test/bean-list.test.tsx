// @vitest-environment happy-dom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BeanList } from "@/components/BeanList";
import type { Bean } from "@/lib/types";

const BEANS: Bean[] = [
  {
    id: "8f14e45f-ea0a-4e64-9c08-4f2f5c9a1b2d",
    brand: "Single O",
    name: "Reservoir",
    roast_level: "medium",
    origin: "Ethiopia",
    created_at: "2026-07-01T09:00:00.000Z",
  },
  {
    id: "2c1743a3-91b8-4f2e-a1c0-6a9d3f7b4e5a",
    brand: "Proud Mary",
    name: "Ghost Rider",
    roast_level: "dark",
    origin: "Colombia",
    created_at: "2026-06-20T09:00:00.000Z",
  },
];

afterEach(cleanup);

describe("BeanList", () => {
  it("renders every bean's brand, name, roast level and origin", () => {
    render(<BeanList beans={BEANS} onDelete={() => {}} />);

    for (const bean of BEANS) {
      expect(screen.getByText(bean.brand)).toBeTruthy();
      expect(screen.getByText(bean.name)).toBeTruthy();
      expect(screen.getByText(new RegExp(bean.roast_level, "i"))).toBeTruthy();
      expect(screen.getByText(bean.origin)).toBeTruthy();
    }
    expect(screen.getAllByRole("listitem")).toHaveLength(BEANS.length);
  });

  it("shows a terse empty state when the catalogue is empty", () => {
    render(<BeanList beans={[]} onDelete={() => {}} />);

    expect(screen.getByText(/no beans/i)).toBeTruthy();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("arms on first tap, fires onDelete with the bean id on confirm", () => {
    const onDelete = vi.fn();
    render(<BeanList beans={[BEANS[0]]} onDelete={onDelete} />);

    const del = screen.getByRole("button", { name: /delete single o reservoir/i });
    fireEvent.click(del);
    // First tap only arms — destructive delete needs a second confirming tap.
    expect(onDelete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /confirm delete/i }));
    expect(onDelete).toHaveBeenCalledExactlyOnceWith(BEANS[0].id);
  });
});
