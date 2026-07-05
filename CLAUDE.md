# Product conventions

You are building one ticket of this product inside the GhostShift factory. Keep the
diff focused on the ticket, but hold the whole product to the bar below.

## Reference material — read it before building any UI

Project context and design references live in **`.factory/dossier/`** (present when the
operator supplied one at kickoff). Before you build or restyle any user-facing surface:

- Read `.factory/dossier/PRODUCT_CONTEXT.md` — what this product is, who it's for, the tone.
- Read `.factory/dossier/design/brand.md` — palette, typography, voice, do/don't.
- **Look at every image in `.factory/dossier/design/references/`** with the Read tool —
  these are the screenshots / mockups the operator wants this to resemble. Match them.

If `.factory/dossier/` is absent, fall back to the design system already in the template
and make tasteful choices — never ship the unstyled default.

## Design system

- Styling is **Tailwind v4**. Tokens are defined in `src/app/globals.css` under `@theme`
  and the `:root` / dark-mode blocks. Build from the **semantic utilities** — `bg-brand`,
  `text-muted`, `bg-surface`, `border-border`, `text-brand-foreground` — never hard-coded
  hex or `style={{…}}` inline colors.
- To re-skin the product, change the token values in `globals.css` (light + dark) — do not
  scatter one-off colors across components.
- Everything must work in **light and dark** (tokens already flip on `prefers-color-scheme`)
  and be responsive down to a phone. Use `text-balance`, sensible `max-w-*`, and spacing.
- Prefer a small number of well-composed components over ad-hoc markup. Match the visual
  weight, spacing, and polish of the starter `page.tsx` — that is the floor, not the ceiling.

## Stack

Next.js (App Router) + plain Postgres (`pg`) + Stripe, docker-composed. `pg` is server-only.
Tests that run in the gate (`npm test`) must be hermetic — no network, no browser, no dev
server. Put any browser/E2E tests under `e2e/`.
