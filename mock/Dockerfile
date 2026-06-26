# Hylé mock seeder — one-shot Bun container.
# Publishes mock blueprints via the registry API, then writes the social graph
# directly into the shared SQLite volume. Enabled via `--profile mock`.
FROM oven/bun:1-alpine

WORKDIR /mock

# Install deps first for layer caching.
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile || bun install

# Blueprint sources + seed script + data.
COPY . .

ENV HYLE_REGISTRY_URL=http://registry:3000 \
    DB_PATH=/data/hyle-registry.db \
    MOCK_DIR=/mock

CMD ["bun", "run", "seed.ts"]
