# cyber-bean

Built and operated by the GhostShift factory (paved road v2, ADR 0001).

- Next.js + Postgres (one database on the operator's shared server) — no Supabase, no platform auth.
- `pnpm gate` = typecheck + tests + build. CI (factory-gate) provides a Postgres service; DATABASE_URL is always set there.
- Migrations: numbered `migrations/*.sql`, applied by `scripts/migrate.mjs` on container start and in CI.
- Deployed as a docker compose stack on the operator's VPS behind nginx-proxy; health at `/api/health`.
