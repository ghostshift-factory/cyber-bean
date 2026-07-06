// @vitest-environment happy-dom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BeanDetailPhoto } from "@/components/BeanDetailPhoto";
import type { Bean } from "@/lib/types";

const BEAN: Bean = {
  id: "8f14e45f-ea0a-4e64-9c08-4f2f5c9a1b2d",
  brand: "Single O",
  bean_type: "Reservoir",
  photo_url: "/uploads/reservoir.webp",
  created_at: "2026-07-01T09:00:00.000Z",
};

afterEach(cleanup);

describe("BeanDetailPhoto", () => {
  it("renders a full-width object-cover img from photo_url when present", () => {
    render(<BeanDetailPhoto bean={BEAN} />);

    const img = screen.getByRole("img", {
      name: /single o reservoir/i,
    }) as HTMLImageElement;
    expect(img.getAttribute("src")).toBe(BEAN.photo_url);
    expect(img.className).toContain("w-full");
    expect(img.className).toContain("object-cover");
    expect(screen.queryByTestId("bean-photo-placeholder")).toBeNull();
  });

  it("renders a styled placeholder div in the same space when photo_url is absent", () => {
    render(<BeanDetailPhoto bean={{ ...BEAN, photo_url: null }} />);

    const placeholder = screen.getByTestId("bean-photo-placeholder");
    expect(placeholder.tagName.toLowerCase()).toBe("div");
    expect(placeholder.className).toContain("w-full");
    expect(placeholder.className).toContain("aspect-[16/9]");
    expect(screen.queryByRole("img")).toBeNull();
  });
});
