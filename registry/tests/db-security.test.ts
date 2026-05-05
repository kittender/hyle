import { describe, test, expect, beforeEach } from "bun:test";
import { SQLiteDatabase } from "../src/db";
import { scanManifest } from "../src/scan";
import type { HyleManifest } from "../../../cli/src/manifest";

describe("Security database operations", () => {
  let db: SQLiteDatabase;

  beforeEach(() => {
    db = new SQLiteDatabase(":memory:");
    db.init();
  });

  test("inserts and retrieves security scans", () => {
    const manifest: HyleManifest = {
      name: "test",
      author: "author",
      version: "1.0.0",
      models: {
        primary: { provider: "anthropic", model: "claude-3-sonnet" },
        secondary: { provider: "anthropic", model: "claude-3-haiku" },
      },
    };

    // Insert a substrate
    const record = db.insertSubstrate(
      "author",
      "test",
      "1.0.0",
      JSON.stringify(manifest),
      "author/test/1.0.0.tar.gz",
      "abc123",
      undefined,
      [],
      true
    );

    // Insert scan results
    const scanResult = scanManifest(manifest, 1000);
    db.insertScan(record.id, scanResult);

    // Retrieve scan
    const retrieved = db.getScan(record.id);
    expect(retrieved).toBeTruthy();
    expect(retrieved?.scan_status).toBe("clean");
    expect(retrieved?.findings.length).toBe(0);
  });

  test("rate limiting tracks publishes", () => {
    db.recordPublish("author1");
    db.recordPublish("author1");
    db.recordPublish("author2");

    expect(db.countRecentPublishes("author1", 3600)).toBe(2);
    expect(db.countRecentPublishes("author2", 3600)).toBe(1);
    expect(db.countRecentPublishes("author3", 3600)).toBe(0);
  });

  test("flags substrates with reason", () => {
    const manifest: HyleManifest = {
      name: "test",
      author: "author",
      version: "1.0.0",
      models: {
        primary: { provider: "anthropic", model: "claude-3-sonnet" },
        secondary: { provider: "anthropic", model: "claude-3-haiku" },
      },
    };

    const record = db.insertSubstrate(
      "author",
      "test",
      "1.0.0",
      JSON.stringify(manifest),
      "author/test/1.0.0.tar.gz",
      "abc123",
      undefined,
      [],
      true
    );

    expect(record.is_flagged).toBe(false);

    // Flag the substrate
    db.flagSubstrate(record.id, "Contains malicious code");

    // Retrieve and verify flagged
    const updated = db.getVersion("author", "test", "1.0.0");
    expect(updated?.is_flagged).toBe(true);
    expect(updated?.flag_reason).toContain("malicious");
  });
});
