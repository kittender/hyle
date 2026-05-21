import { SQLiteDatabase } from "./db";
import { LocalStorage } from "./storage";
import { createAuthFromEnv } from "./auth";
import { route } from "./router";

const PORT = parseInt(process.env.PORT || "3000");
const DB_PATH = process.env.DB_PATH || "./hyle-registry.db";
const BUNDLES_PATH = process.env.BUNDLES_PATH || "./bundles";
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

const db = new SQLiteDatabase(DB_PATH);
const storage = new LocalStorage(BUNDLES_PATH);
const auth = createAuthFromEnv();

db.init();
await storage.init();

const corsOrigin = process.env.HYLE_WEB_ORIGIN || "*";

const corsHeaders = {
  "Access-Control-Allow-Origin": corsOrigin,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const addCorsHeaders = (response: Response): Response => {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
};

const server = Bun.serve({
  port: PORT,
  fetch: async (req: Request) => {
    if (req.method === "OPTIONS") {
      const response = new Response(null, { status: 204 });
      return addCorsHeaders(response);
    }
    const response = await route(req, db, storage, auth, BASE_URL);
    return addCorsHeaders(response);
  },
});

console.log(`🚀 Hylé Registry running on ${BASE_URL}`);
console.log(`📦 Bundles stored in: ${BUNDLES_PATH}`);
console.log(`🗄️  Database: ${DB_PATH}`);
