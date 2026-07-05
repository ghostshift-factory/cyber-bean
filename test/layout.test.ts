import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import RootLayout from "@/app/layout";

const globalsCss = readFileSync(
  new URL("../src/app/globals.css", import.meta.url),
  "utf8",
);

function renderLayout(): string {
  return renderToStaticMarkup(
    createElement(RootLayout, {
      children: createElement("main", null, "HUD"),
    }),
  );
}

describe("cyberpunk design system tokens (globals.css)", () => {
  it("defines the expected CSS variable names", () => {
    expect(globalsCss).toContain("--color-bg:");
    expect(globalsCss).toContain("--color-neon-primary:");
    expect(globalsCss).toContain("--font-glitch:");
  });

  it("keeps the semantic utility tokens the product builds from", () => {
    for (const token of [
      "--color-surface:",
      "--color-foreground:",
      "--color-muted:",
      "--color-border:",
      "--color-brand:",
      "--color-brand-foreground:",
      "--color-accent:",
    ]) {
      expect(globalsCss).toContain(token);
    }
  });

  it("is dark-only — no @media (prefers-color-scheme) rule anywhere", () => {
    expect(globalsCss).not.toMatch(/@media[^{]*prefers-color-scheme/);
  });
});

describe("root layout", () => {
  it("marks the root element as explicitly dark", () => {
    const html = renderLayout();
    expect(html).toMatch(/<html[^>]*\bclass="[^"]*\bdark\b[^"]*"/);
    expect(html).toMatch(/<html[^>]*\bdata-theme="dark"/);
  });

  it("rendered output contains no prefers-color-scheme rule", () => {
    expect(renderLayout()).not.toContain("prefers-color-scheme");
  });

  it("matches the snapshot", () => {
    expect(renderLayout()).toMatchSnapshot();
  });
});
