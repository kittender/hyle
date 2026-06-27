/**
 * Hylé mock seeder — auto-discovers and dynamically generates mock data.
 *
 * 1. Scans ./blueprints to discover all blueprints (no hardcoded seed-data.json).
 * 2. For each blueprint, generates multiple versions with seeded random stats.
 * 3. Publishes all versions through the registry API.
 * 4. Writes social graph (users, stars, reviews, installs, etc.) to SQLite.
 * 5. Re-runs completely each time (clears blueprints table first).
 *
 * Env:
 *   HYLE_REGISTRY_URL  registry base URL          (default http://localhost:3000)
 *   DB_PATH            shared sqlite db path       (default /data/hyle-registry.db)
 *   MOCK_DIR           folder holding this script  (default script dir)
 */
import { Database } from "bun:sqlite";
import { load, dump } from "js-yaml";
import { readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { mkdtempSync, rmSync } from "node:fs";
import * as tar from "tar";

const REGISTRY = (process.env.HYLE_REGISTRY_URL ?? "http://localhost:3000").replace(/\/$/, "");
const DB_PATH = process.env.DB_PATH ?? "/data/hyle-registry.db";
const MOCK_DIR = process.env.MOCK_DIR ?? dirname(new URL(import.meta.url).pathname);
const BLUEPRINTS_DIR = join(MOCK_DIR, "blueprints");
const MOCK_USER_AUTHOR = "mock";

const DAY = 24 * 60 * 60 * 1000;

// Simple seeded random for reproducible stats
class SeededRandom {
  constructor(private seed: number) {}
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  choice<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

interface DiscoveredBlueprint {
  author: string;
  name: string;
  dir: string;
  manifest: any;
}

interface GeneratedBlueprint {
  author: string;
  name: string;
  featured: number | null;
  versions: Array<{ version: string; created_at: string; notes: string; stable?: boolean; manifest: any }>;
  stars: number;
  starred_by: string[];
  reviews: Array<{ username: string; rating: number; body: string; created_at: string }>;
  installs: { month: number; half: number; year: number; older: number };
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

/** Discover all blueprints in the blueprints directory. */
async function discoverBlueprints(): Promise<DiscoveredBlueprint[]> {
  const discovered: DiscoveredBlueprint[] = [];
  const authorsDir = BLUEPRINTS_DIR;

  if (!existsSync(authorsDir)) return discovered;

  for (const author of readdirSync(authorsDir)) {
    const authorPath = join(authorsDir, author);
    if (!statSync(authorPath).isDirectory()) continue;

    for (const name of readdirSync(authorPath)) {
      const bpDir = join(authorPath, name);
      if (!statSync(bpDir).isDirectory()) continue;

      const hylePath = join(bpDir, "hyle.yaml");
      if (!existsSync(hylePath)) continue;

      const yaml = await Bun.file(hylePath).text();
      const manifest = load(yaml) as any;
      discovered.push({ author, name, dir: bpDir, manifest });
    }
  }

  return discovered;
}

/** Generate fake version history for a blueprint. Generates 2-3 versions. */
function generateVersions(discovered: DiscoveredBlueprint, rng: SeededRandom): any[] {
  const baseV = discovered.manifest.version || "1.0.0";
  const versionCount = Math.floor(rng.range(2, 4)); // 2-3 versions
  const versions: any[] = [];

  for (let i = 0; i < versionCount; i++) {
    const parts = baseV.split(".");
    const major = parseInt(parts[0]) + (i > 1 ? 1 : 0);
    const minor = i === 1 ? 1 : 0;
    const patch = i;
    const version = `${major}.${minor}.${patch}`;

    const createdAt = new Date(Date.now() - (versionCount - i) * 60 * DAY);
    const manifest = { ...discovered.manifest, version };

    // Slightly modify description per version for diffs
    if (i > 0) {
      manifest.description = discovered.manifest.description + ` [v${version}]`;
    }

    versions.push({
      version,
      created_at: createdAt.toISOString(),
      notes: `Version ${version} release with updates.`,
      stable: i < versionCount - 1 || Math.random() > 0.3,
      manifest
    });
  }

  return versions;
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

async function publishVersion(manifest: any, bundle: Uint8Array): Promise<void> {
  const fd = new FormData();
  fd.append("manifest", new Blob([JSON.stringify(manifest)], { type: "application/json" }));
  fd.append("bundle", new Blob([bundle], { type: "application/gzip" }));
  const res = await fetch(`${REGISTRY}/blueprints`, { method: "POST", body: fd });
  if (!res.ok) throw new Error(`publish ${manifest.author}/${manifest.name}@${manifest.version} failed: ${res.status} ${await res.text()}`);
}

async function publishAll(blueprints: GeneratedBlueprint[], discoveredMap: Map<string, DiscoveredBlueprint>): Promise<void> {
  for (const bp of blueprints) {
    const key = `${bp.author}/${bp.name}`;
    const discovered = discoveredMap.get(key);
    if (!discovered) {
      console.warn(`[seed] blueprint directory missing for ${key}`);
      continue;
    }

    const files = bundleFiles(discovered.manifest);
    const bundle = await buildBundle(discovered.dir, files);

    for (const v of bp.versions) {
      await publishVersion(v.manifest, bundle);
      console.log(`[seed] published ${bp.author}/${bp.name}@${v.version}`);
    }
  }
}

/** Spread N install events across [minDaysAgo, maxDaysAgo] and insert them. */
function seedInstalls(
  insertEvent: any, author: string, name: string, n: number, minDaysAgo: number, maxDaysAgo: number, now: number, rng: SeededRandom,
): void {
  for (let i = 0; i < n; i++) {
    const at = new Date(now - rng.range(minDaysAgo, maxDaysAgo) * DAY).toISOString();
    insertEvent.run(author, name, at);
  }
}

/** Generate mock data for all discovered blueprints. */
function generateMockData(discovered: DiscoveredBlueprint[]): GeneratedBlueprint[] {
  const generated: GeneratedBlueprint[] = [];
  const rng = new SeededRandom(42); // Seed for reproducibility

  for (const bp of discovered) {
    const bpSeed = bp.author.charCodeAt(0) + bp.name.charCodeAt(0);
    const bpRng = new SeededRandom(bpSeed);

    const stars = Math.floor(bpRng.range(50, 2000));
    const reviewCount = Math.floor(bpRng.range(1, 5));
    const starsThisMonth = Math.floor(bpRng.range(100, 500));
    const starsLastSix = Math.floor(bpRng.range(200, 800));
    const starsLastYear = Math.floor(bpRng.range(150, 600));

    const versions = generateVersions(bp, bpRng);

    generated.push({
      author: bp.author,
      name: bp.name,
      featured: null, // Could randomize this too
      versions,
      stars,
      starred_by: [],
      reviews: Array.from({ length: reviewCount }, (_, i) => ({
        username: `reviewer-${bp.author}-${i}`,
        rating: Math.floor(bpRng.range(3, 6)),
        body: `Great blueprint! Really useful for ${bp.name}.`,
        created_at: new Date(Date.now() - Math.floor(bpRng.range(10, 100)) * DAY).toISOString(),
      })),
      installs: {
        month: starsThisMonth,
        half: starsLastSix,
        year: starsLastYear,
        older: Math.max(0, stars - starsThisMonth - starsLastSix - starsLastYear),
      }
    });
  }

  return generated;
}

function seedSocialGraph(blueprints: GeneratedBlueprint[]): void {
  const db = new Database(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA busy_timeout = 5000;");

  // Clear existing data for fresh seed
  console.log("[seed] clearing existing blueprints...");
  db.exec("DELETE FROM stars");
  db.exec("DELETE FROM reviews");
  db.exec("DELETE FROM install_events");
  db.exec("DELETE FROM install_counts");
  db.exec("DELETE FROM featured");
  db.exec("DELETE FROM activity_events");
  db.exec("DELETE FROM blueprints");

  const now = Date.now();
  const rng = new SeededRandom(42);

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
  const insertActivity = db.prepare("INSERT INTO activity_events (type, blueprint_author, blueprint_name, version, note, actor_username, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
  const updateCreated = db.prepare("UPDATE blueprints SET created_at = ? WHERE author = ? AND name = ? AND version = ?");

  const tx = db.transaction(() => {
    // Create mock user and link blueprints
    const mockUserBio = "Mock user for local testing and development";
    insertUser.run("mock-user", "mock-user", "mock@localhost", "https://avatars.githubusercontent.com/u/0?v=4", mockUserBio, "", "{}");

    let stargazerSeq = 0;
    const idOf = (username: string): number | null => {
      const row = userId.get(username) as any;
      return row ? row.id : null;
    };

    // Have mock-user star good-java
    const mockUserId = idOf("mock-user");
    if (mockUserId) {
      const goodJava = blueprints.find(b => b.author === "andrej-kirskyn" && b.name === "good-java");
      if (goodJava) {
        insertStar.run(mockUserId, goodJava.author, goodJava.name);
      }
    }

    for (const bp of blueprints) {
      // Backdate each published version's created_at.
      for (const v of bp.versions) {
        updateCreated.run(v.created_at, bp.author, bp.name, v.version);
      }

      // Reviews from synthetic users.
      for (const rv of bp.reviews) {
        const username = rv.username;
        insertUser.run(`seed-${username}`, username, `${username}@example.com`, null, null, null, "{}");
        const uid = idOf(username);
        if (uid) insertReview.run(uid, bp.author, bp.name, rv.rating, rv.body, rv.created_at);
      }

      // Stars: synthetic stargazers.
      for (let i = 0; i < bp.stars; i++) {
        const gh = `seed-sg-${++stargazerSeq}`;
        insertUser.run(gh, `stargazer-${stargazerSeq}`, null, null, null, null, "{}");
        const uid = (userId.get(`stargazer-${stargazerSeq}`) as any).id;
        insertStar.run(uid, bp.author, bp.name);
      }

      // Install events bucketed so period queries are correct.
      const { month, half, year, older } = bp.installs;
      seedInstalls(insertEvent, bp.author, bp.name, month, 0, 30, now, rng);
      seedInstalls(insertEvent, bp.author, bp.name, half, 31, 182, now, rng);
      seedInstalls(insertEvent, bp.author, bp.name, year, 183, 365, now, rng);
      seedInstalls(insertEvent, bp.author, bp.name, older, 366, 900, now, rng);
      upsertCount.run(bp.author, bp.name, month + half + year + older);

      // Activity event for each blueprint
      insertActivity.run("push", bp.author, bp.name, bp.versions[bp.versions.length - 1].version, `Released ${bp.versions[bp.versions.length - 1].version}`, bp.author, new Date(now - 7 * DAY).toISOString());
    }
  });

  tx();
  db.close();
  console.log("[seed] social graph written");
}

async function main(): Promise<void> {
  const discovered = await discoverBlueprints();
  console.log(`[seed] discovered ${discovered.length} blueprints`);

  if (discovered.length === 0) {
    console.error("[seed] no blueprints found in", BLUEPRINTS_DIR);
    process.exit(1);
  }

  const discoveredMap = new Map(discovered.map(d => [`${d.author}/${d.name}`, d]));
  const generated = generateMockData(discovered);
  console.log(`[seed] generated mock data for ${generated.length} blueprints`);

  await waitForRegistry();
  await publishAll(generated, discoveredMap);
  seedSocialGraph(generated);
  console.log("[seed] done ✓");
}

main().catch((e) => {
  console.error(`[seed] FAILED: ${e.message}`);
  process.exit(1);
});
