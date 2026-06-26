#!/bin/sh
# Regenerate the runtime config from env on container start. Lets one image
# point at any registry URL without rebuilding the Angular bundle.
set -e

REGISTRY_URL="${HYLE_REGISTRY_URL:-http://localhost:3000}"
TARGET="/usr/share/nginx/html/config.js"

cat > "$TARGET" <<EOF
window.__HYLE_CONFIG__ = {
  apiBaseUrl: "${REGISTRY_URL}",
};
EOF

echo "[hyle] config.js -> apiBaseUrl=${REGISTRY_URL}"
