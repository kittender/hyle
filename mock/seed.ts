/**
 * Hylé mock seeder.
 *
 * 1. Publishes every blueprint version in ./blueprints through the public
 *    registry API (works because the local stack runs HYLE_AUTH_PROVIDER=none).
 * 2. Writes the social graph the publish API can't set — users, stars, reviews,
 *    timestamped install events, featured picks, activity feed — directly into
 *    the shared SQLite database, and backdates created_at for realistic ordering.
 *
 * Safe to re-run: publishing is idempotent (409 = already present) and the social
 * graph is only seeded once (guarded on the install_events table being empty).
 *
 * Env:
 *   HYLE_REGISTRY_URL  registry base URL          (default http://localhost:3000)
 *   DB_PATH            shared sqlite db path       (default /data/hyle-registry.db)
 *   MOCK_DIR           folder holding this script  (default script dir)
 */
import { Database } from "bun:sqlite";
import { load } from "js-yaml";
import { readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { mkdtempSync, rmSync } from "node:fs";
import * as tar from "tar";

const REGISTRY = (process.env.HYLE_REGISTRY_URL ?? "http://localhost:3000").replace(/\/$/, "");
const DB_PATH = process.env.DB_PATH ?? "/data/hyle-registry.db";
const MOCK_DIR = process.env.MOCK_DIR ?? dirname(new URL(import.meta.url).pathname);
const BLUEPRINTS_DIR = join(MOCK_DIR, "blueprints");
const SEED_DATA = join(MOCK_DIR, "seed-data.json");

const DAY = 24 * 60 * 60 * 1000;

interface SeedVersion { version: string; created_at: string; notes: string; stable?: boolean }
interface SeedBlueprint {
  author: string; name: string; featured: number | null;
  versions: SeedVersion[]; stars: number; starred_by: string[];
  reviews: { username: string; rating: number; body: string; created_at: string }[];
  installs: { month: number; half: number; year: number; older: number };
}
interface SeedUser {
  username: string; github_id: string; email: string; avatar_url: string;
  bio: string; website: string; socials: Record<string, string>;
}
interface SeedData {
  users: SeedUser[];
  blueprints: SeedBlueprint[];
  activity: { type: string; author: string; name: string; version: string; actor: string; note: string; created_at: string }[];
}

async function waitForRegistry(): Promise<void> {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${REGISTRY}/health`);
      if (r.ok) { console.log(`[seed] registry ready at ${REGISTRY}`); return; }
    } catch { /* not up yet */ }
    await Bun.sleep(1000);
  }
  throw new Error(`registry never became healthy at ${REGISTRY}/health`);
}

/** Collect the files a manifest references, plus hyle.yaml itself. */
function bundleFiles(manifest: any): string[] {
  const files = new Set<string>(["hyle.yaml"]);
  const bp = manifest.blueprint ?? {};
  for (const cat of ["ontology", "craft", "identities", "ethics"]) {
    for (const p of bp[cat] ?? []) files.add(p);
  }
  return [...files].sort();
}

async function buildBundle(dir: string, files: string[]): Promise<Uint8Array> {
  const tmp = mkdtempSync(join(tmpdir(), "hyle-seed-"));
  const out = join(tmp, "bundle.tar.gz");
  try {
    await tar.create({ gzip: true, cwd: dir, file: out }, files);
    return new Uint8Array(await Bun.file(out).arrayBuffer());
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

async function publishVersion(manifest: any, bundle: Uint8Array): Promise<"ok" | "exists"> {
  const fd = new FormData();
  fd.append("manifest", new Blob([JSON.stringify(manifest)], { type: "application/json" }));
  fd.append("bundle", new Blob([bundle], { type: "application/gzip" }));
  const res = await fetch(`${REGISTRY}/blueprints`, { method: "POST", body: fd });
  if (res.status === 409) return "exists";
  if (!res.ok) throw new Error(`publish ${manifest.author}/${manifest.name}@${manifest.version} failed: ${res.status} ${await res.text()}`);
  return "ok";
}

async function publishAll(data: SeedData): Promise<void> {
  for (const bp of data.blueprints) {
    const dir = join(BLUEPRINTS_DIR, bp.author, bp.name);
    if (!existsSync(join(dir, "hyle.yaml"))) {
      console.warn(`[seed] missing hyle.yaml for ${bp.author}/${bp.name}, skipping`);
      continue;
    }
    const baseManifest = load(await Bun.file(join(dir, "hyle.yaml")).text()) as any;
    const files = bundleFiles(baseManifest);
    const bundle = await buildBundle(dir, files);

    for (const v of bp.versions) {
      const manifest = { ...baseManifest, version: v.version, description: baseManifest.description };
      const r = await publishVersion(manifest, bundle);
      console.log(`[seed] ${r === "ok" ? "published" : "exists  "} ${bp.author}/${bp.name}@${v.version}`);
    }
  }
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Spread N install events across [minDaysAgo, maxDaysAgo] and insert them. */
function seedInstalls(
  insertEvent: any, author: string, name: string, n: number, minDaysAgo: number, maxDaysAgo: number, now: number,
): void {
  for (let i = 0; i < n; i++) {
    const at = new Date(now - rand(minDaysAgo, maxDaysAgo) * DAY).toISOString();
    insertEvent.run(author, name, at);
  }
}

function seedSocialGraph(data: SeedData): void {
  const db = new Database(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA busy_timeout = 5000;");

  const already = (db.prepare("SELECT COUNT(*) AS c FROM install_events").get() as any).c;
  if (already > 0) {
    console.log("[seed] social graph already present — skipping (delete the volume to re-seed)");
    db.close();
    return;
  }

  const now = Date.now();

  const insertUser = db.prepare(`
    INSERT INTO users (github_id, username, email, email_verified, avatar_url, bio, website, socials)
    VALUES (?, ?, ?, 1, ?, ?, ?, ?)
    ON CONFLICT(github_id) DO UPDATE SET
      email = excluded.email, avatar_url = excluded.avatar_url,
      bio = excluded.bio, website = excluded.website, socials = excluded.socials
  `);
  const userId = db.prepare("SELECT id FROM users WHERE username = ?");
  const insertStar = db.prepare("INSERT OR IGNORE INTO stars (user_id, blueprint_author, blueprint_name) VALUES (?, ?, ?)");
  const insertReview = db.prepare("INSERT OR IGNORE INTO reviews (user_id, blueprint_author, blueprint_name, rating, body, created_at) VALUES (?, ?, ?, ?, ?, ?)");
  const insertEvent = db.prepare("INSERT INTO install_events (blueprint_author, blueprint_name, installed_at) VALUES (?, ?, ?)");
  const upsertCount = db.prepare("INSERT INTO install_counts (blueprint_author, blueprint_name, count) VALUES (?, ?, ?) ON CONFLICT(blueprint_author, blueprint_name) DO UPDATE SET count = excluded.count");
  const insertFeatured = db.prepare("INSERT OR REPLACE INTO featured (blueprint_author, blueprint_name, rank) VALUES (?, ?, ?)");
  const insertActivity = db.prepare("INSERT INTO activity_events (type, blueprint_author, blueprint_name, version, note, actor_username, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
  const updateCreated = db.prepare("UPDATE blueprints SET created_at = ? WHERE author = ? AND name = ? AND version = ?");

  const tx = db.transaction(() => {
    // Named users (authors + reviewers).
    for (const u of data.users) {
      insertUser.run(u.github_id, u.username, u.email, u.avatar_url, u.bio, u.website, JSON.stringify(u.socials ?? {}));
    }

    let stargazerSeq = 0;
    const idOf = (username: string): number | null => {
      const row = userId.get(username) as any;
      return row ? row.id : null;
    };

    for (const bp of data.blueprints) {
      // Backdate each published version's created_at.
      for (const v of bp.versions) {
        updateCreated.run(v.created_at, bp.author, bp.name, v.version);
      }

      // Featured / team pick.
      if (bp.featured != null) insertFeatured.run(bp.author, bp.name, bp.featured);

      // Reviews (named users).
      for (const rv of bp.reviews) {
        const uid = idOf(rv.username);
        if (uid) insertReview.run(uid, bp.author, bp.name, rv.rating, rv.body, rv.created_at);
      }

      // Stars: named first, then synthetic stargazers to hit the target count.
      const named = new Set(bp.starred_by);
      for (const uname of named) {
        const uid = idOf(uname);
        if (uid) insertStar.run(uid, bp.author, bp.name);
      }
      const synthetic = Math.max(0, bp.stars - named.size);
      for (let i = 0; i < synthetic; i++) {
        const gh = `seed-sg-${++stargazerSeq}`;
        insertUser.run(gh, `stargazer-${stargazerSeq}`, null, null, null, null, "{}");
        const uid = (userId.get(`stargazer-${stargazerSeq}`) as any).id;
        insertStar.run(uid, bp.author, bp.name);
      }

      // Install events bucketed so period queries are correct.
      const { month, half, year, older } = bp.installs;
      seedInstalls(insertEvent, bp.author, bp.name, month, 0, 30, now);
      seedInstalls(insertEvent, bp.author, bp.name, half, 31, 182, now);
      seedInstalls(insertEvent, bp.author, bp.name, year, 183, 365, now);
      seedInstalls(insertEvent, bp.author, bp.name, older, 366, 900, now);
      upsertCount.run(bp.author, bp.name, month + half + year + older);
    }

    // Activity feed.
    for (const a of data.activity) {
      insertActivity.run(a.type, a.author, a.name, a.version || null, a.note, a.actor, a.created_at);
    }
  });

  tx();
  db.close();
  console.log("[seed] social graph written");
}

async function main(): Promise<void> {
  const data = JSON.parse(await Bun.file(SEED_DATA).text()) as SeedData;
  console.log(`[seed] ${data.blueprints.length} blueprints, ${data.users.length} users`);
  await waitForRegistry();
  await publishAll(data);
  seedSocialGraph(data);
  console.log("[seed] done ✓");
}

main().catch((e) => {
  console.error(`[seed] FAILED: ${e.message}`);
  process.exit(1);
});
