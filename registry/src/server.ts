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

const server = Bun.serve({
  port: PORT,
  fetch: async (req: Request) => {
    return await route(req, db, storage, auth, BASE_URL);
  },
});

console.log(`🚀 Hylé Registry running on ${BASE_URL}`);
console.log(`📦 Bundles stored in: ${BUNDLES_PATH}`);
console.log(`🗄️  Database: ${DB_PATH}`);
