import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as tar from "tar";
import { SQLiteDatabase } from "../src/db";
import { LocalStorage } from "../src/storage";
import { handleFileContent } from "../src/handlers/files";
import { handleMostPulled, handleTeamPicks, handleOverview } from "../src/handlers/stats";
import { handleUserStars } from "../src/handlers/users";

function insert(db: SQLiteDatabase, author: string, name: string, version = "1.0.0") {
  const manifest = { name, author, version, license: "MIT", language: "TypeScript" };
  return db.insertBlueprint(
    author, name, version, JSON.stringify(manifest),
    `${author}/${name}/${version}.tar.gz`, "deadbeef", `${name} desc`, ["tag"], true
  );
}

describe("install events + most-pulled ranking", () => {
  let db: SQLiteDatabase;
  beforeEach(() => { db = new SQLiteDatabase(":memory:"); db.init(); });

  test("ranks blueprints by pull count in window", () => {
    insert(db, "alice", "popular");
    insert(db, "bob", "quiet");

    for (let i = 0; i < 5; i++) db.recordInstallEvent("alice", "popular");
    db.recordInstallEvent("bob", "quiet");

    const ranked = db.getMostPulled(null, 10);
    expect(ranked[0].record.name).toBe("popular");
    expect(ranked[0].pull_count).toBe(5);
    expect(ranked[1].pull_count).toBe(1);
  });

  test("period window excludes old events", () => {
    insert(db, "alice", "old");
    const longAgo = new Date(Date.now() - 400 * 864e5).toISOString();
    db.recordInstallEvent("alice", "old", longAgo);
    db.recordInstallEvent("alice", "old"); // now

    const since = new Date(Date.now() - 30 * 864e5).toISOString();
    expect(db.getPullCountSince("alice", "old", since)).toBe(1);
    expect(db.getPullCountSince("alice", "old", null)).toBe(2);
  });

  test("most-pulled handler returns pull_count", async () => {
    insert(db, "alice", "popular");
    db.recordInstallEvent("alice", "popular");
    const res = handleMostPulled("all", 4, db, "http://x");
    const body = await res.json();
    expect(body[0].pull_count).toBe(1);
    expect(body[0].name).toBe("popular");
  });
});

describe("featured / team picks", () => {
  let db: SQLiteDatabase;
  beforeEach(() => { db = new SQLiteDatabase(":memory:"); db.init(); });

  test("returns featured blueprints ordered by rank", async () => {
    insert(db, "alice", "second");
    insert(db, "bob", "first");
    db.setFeatured("alice", "second", 2);
    db.setFeatured("bob", "first", 1);

    const res = handleTeamPicks(db, "http://x");
    const body = await res.json();
    expect(body.map((b: any) => b.name)).toEqual(["first", "second"]);
    expect(body[0].is_team_pick).toBe(true);
  });
});

describe("overview + user stars", () => {
  let db: SQLiteDatabase;
  beforeEach(() => { db = new SQLiteDatabase(":memory:"); db.init(); });

  test("overview counts distinct blueprints, authors, stars", async () => {
    insert(db, "alice", "one");
    insert(db, "alice", "two");
    insert(db, "bob", "three");
    const u = db.upsertUser("gh1", "carol");
    db.toggleStar(u.id, "alice", "one");

    const res = handleOverview(db);
    const body = await res.json();
    expect(body.total_blueprints).toBe(3);
    expect(body.total_authors).toBe(2);
    expect(body.total_stars).toBe(1);
  });

  test("user stars handler lists starred blueprints", async () => {
    insert(db, "alice", "one");
    const u = db.upsertUser("gh1", "carol");
    db.toggleStar(u.id, "alice", "one");

    const res = await handleUserStars("carol", db, "http://x");
    const body = await res.json();
    expect(body.length).toBe(1);
    expect(body[0].name).toBe("one");
  });

  test("user stars 404 for unknown user", async () => {
    const res = await handleUserStars("nobody", db, "http://x");
    expect(res.status).toBe(404);
  });
});

describe("file content extraction", () => {
  let db: SQLiteDatabase;
  let storage: LocalStorage;
  let tmp: string;

  beforeEach(async () => {
    db = new SQLiteDatabase(":memory:"); db.init();
    tmp = mkdtempSync(join(tmpdir(), "hyle-files-"));
    storage = new LocalStorage(join(tmp, "bundles"));
    await storage.init();

    // Build a real gzipped tar bundle.
    const src = join(tmp, "src");
    mkdirSync(join(src, "ontology"), { recursive: true });
    writeFileSync(join(src, "hyle.yaml"), "name: demo\nauthor: alice\nversion: 1.0.0\n");
    writeFileSync(join(src, "ontology", "CLAUDE.md"), "# Hello\nWorld");
    const bundlePath = join(tmp, "b.tar.gz");
    await tar.create({ gzip: true, cwd: src, file: bundlePath }, ["hyle.yaml", "ontology/CLAUDE.md"]);
    const bytes = new Uint8Array(await Bun.file(bundlePath).arrayBuffer());
    await storage.storeBundle("alice/demo/1.0.0.tar.gz", bytes);

    insert(db, "alice", "demo");
  });

  afterEach(() => { rmSync(tmp, { recursive: true, force: true }); });

  test("extracts a nested file", async () => {
    const res = await handleFileContent("alice", "demo", undefined, "ontology/CLAUDE.md", db, storage);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.content).toContain("World");
    expect(body.language).toBe("markdown");
  });

  test("404 for missing file", async () => {
    const res = await handleFileContent("alice", "demo", undefined, "nope.txt", db, storage);
    expect(res.status).toBe(404);
  });

  test("rejects path traversal", async () => {
    const res = await handleFileContent("alice", "demo", undefined, "../../etc/passwd", db, storage);
    expect(res.status).toBe(400);
  });

  test("400 when path missing", async () => {
    const res = await handleFileContent("alice", "demo", undefined, null, db, storage);
    expect(res.status).toBe(400);
  });
});
