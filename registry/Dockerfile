# Hylé registry — Bun HTTP server.
FROM oven/bun:1-alpine

WORKDIR /app

# Install deps first for layer caching.
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production || bun install --production

COPY src ./src

# Data lives on a mounted volume (sqlite db + bundle blobs).
ENV DB_PATH=/data/hyle-registry.db \
    BUNDLES_PATH=/data/bundles \
    PORT=3000
# Create the mountpoint owned by the non-root runtime user BEFORE declaring the
# volume, so an empty named volume inherits bun ownership on first creation.
# Otherwise /data is root-owned and bun can't open the sqlite db (SQLITE_CANTOPEN).
RUN mkdir -p /data && chown bun:bun /data
VOLUME ["/data"]
EXPOSE 3000

# Run as the non-root user the base image provides.
USER bun

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun -e "fetch('http://localhost:'+ (process.env.PORT||3000) +'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["bun", "run", "src/server.ts"]
