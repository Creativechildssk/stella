# Stella — production image
# Build:  docker compose up --build
# Output: Nitro node-server at .output/server/index.mjs

# ---------- deps ----------
FROM node:22-bookworm-slim AS deps
WORKDIR /app
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    npm_config_audit=false \
    npm_config_fund=false
COPY package.json package-lock.json ./
RUN npm ci

# ---------- build ----------
FROM deps AS build
WORKDIR /app
COPY . .
# Long-running Node server (not the Vercel serverless preset).
ENV NITRO_PRESET=node-server \
    VITE_AUTH_ENABLED=true \
    NODE_ENV=production
# Skip migrate during image build — the entrypoint runs it against Compose Postgres.
RUN node scripts/with-app-env.mjs vite build

# ---------- run ----------
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    NITRO_HOST=0.0.0.0 \
    NITRO_PORT=3000 \
    npm_config_audit=false \
    npm_config_fund=false

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Bundled Nitro server + static assets
COPY --from=build /app/.output ./.output
COPY --from=build /app/migrations ./migrations
COPY --from=build /app/scripts/migrate.mjs ./scripts/migrate.mjs
COPY --from=build /app/scripts/migration-plan.mjs ./scripts/migration-plan.mjs
COPY docker/entrypoint.sh /entrypoint.sh

# Migrator needs `pg`. Keep this layer tiny — do not install the full app tree.
RUN printf '{"name":"stella","private":true,"type":"module"}\n' > package.json \
  && npm install --omit=dev pg@8.16.3 \
  && chmod +x /entrypoint.sh \
  && chown -R node:node /app /entrypoint.sh

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/entrypoint.sh"]
