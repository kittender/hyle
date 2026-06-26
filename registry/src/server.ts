import { SQLiteDatabase } from "./db";
import { LocalStorage } from "./storage";
import { createAuth } from "./auth";
import { loadRegistryConfig } from "./config";
import { route } from "./router";

const cfg = loadRegistryConfig();

const db = new SQLiteDatabase(cfg.dbPath);
const storage = new LocalStorage(cfg.bundlesPath);
const auth = createAuth(cfg.auth);

db.init();
await storage.init();

const corsHeaders = {
  "Access-Control-Allow-Origin": cfg.webOrigin,
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const addCorsHeaders = (response: Response): Response => {
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }
  return response;
};

const authEnabled = cfg.auth.mode !== "none";
const jwtSecret = cfg.auth.mode === "none" ? "" : cfg.auth.jwtSecret;

const server = Bun.serve({
  port: cfg.port,
  fetch: async (req: Request) => {
    if (req.method === "OPTIONS") {
      return addCorsHeaders(new Response(null, { status: 204 }));
    }
    const response = await route(req, db, storage, auth, cfg, jwtSecret, authEnabled);
    return addCorsHeaders(response);
  },
});

console.log(`🚀 Hylé Registry running on ${cfg.baseUrl} (port ${server.port})`);
console.log(`🔐 Auth: ${cfg.auth.mode}${authEnabled ? "" : " (local/dev — no SSO, publish trusts manifest author)"}`);
console.log(`📦 Bundles: ${cfg.bundlesPath}`);
console.log(`🗄️  Database: ${cfg.dbPath}`);
