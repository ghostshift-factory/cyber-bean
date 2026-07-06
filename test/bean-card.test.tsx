// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BeanCard } from "@/components/BeanCard";
import type { Bean } from "@/lib/types";

const BEAN: Bean = {
  id: "8f14e45f-ea0a-4e64-9c08-4f2f5c9a1b2d",
  brand: "Single O",
  bean_type: "Reservoir",
  photo_url: "/uploads/reservoir.webp",
  created_at: "2026-07-01T09:00:00.000Z",
};

afterEach(cleanup);

describe("BeanCard", () => {
  it("renders the bean photo as the icon when photo_url is present", () => {
    render(<BeanCard bean={BEAN} onDelete={() => {}} />);

    const img = screen.getByRole("img", {
      name: /single o reservoir/i,
    }) as HTMLImageElement;
    expect(img.getAttribute("src")).toBe(BEAN.photo_url);
    expect(screen.queryByTestId("bean-icon-default")).toBeNull();
  });

  it("renders the default bean icon SVG when photo_url is absent", () => {
    render(<BeanCard bean={{ ...BEAN, photo_url: null }} onDelete={() => {}} />);

    expect(screen.getByTestId("bean-icon-default").tagName.toLowerCase()).toBe(
      "svg",
    );
    expect(screen.queryByRole("img")).toBeNull();
  });
});
