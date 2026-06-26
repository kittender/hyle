// Runtime configuration for the Hylé web UI.
// This file is served as a static asset and is NOT bundled — edit it (or
// regenerate it at container start) to repoint the UI without a rebuild.
// Default targets a local registry started via docker compose / `bun dev`.
window.__HYLE_CONFIG__ = {
  apiBaseUrl: "http://localhost:3000",
};
