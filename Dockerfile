FROM node:22-alpine
WORKDIR /app
# packageManager pin in package.json + no-prompt: corepack works non-interactively in docker build
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
# Migrate then serve — restart: unless-stopped in compose retries until shared-postgres is reachable.
CMD ["sh", "-c", "node scripts/migrate.mjs && pnpm start"]
