import { describe, it, expect, beforeEach } from "bun:test";
import { SQLiteDatabase } from "../src/db";
import { handleDiff } from "../src/handlers/diff";
import type { HyleManifest, DiffResponse } from "../src/types";

let db: SQLiteDatabase;

const baseManifest: HyleManifest = {
  name: "test-substrate",
  author: "test-author",
  version: "1.0.0",
  models: {
    primary: {
      provider: "anthropic",
      model: "claude-opus-4-7",
    },
    secondary: {
      provider: "anthropic",
      model: "claude-haiku-4-5",
    },
  },
  ontology: ["CLAUDE.md"],
};

const v2Manifest: HyleManifest = {
  name: "test-substrate",
  author: "test-author",
  version: "2.0.0",
  models: {
    primary: {
      provider: "openai",
      model: "gpt-4",
    },
    secondary: {
      provider: "anthropic",
      model: "claude-haiku-4-5",
    },
  },
  dependencies: [{ name: "node", version: "18.0.0", url: "https://nodejs.org" }],
  ontology: ["CLAUDE.md", "docs/api.md"],
};

describe("diff handler", () => {
  beforeEach(() => {
    db = new SQLiteDatabase(":memory:");
    db.init();

    // Insert test substrates
    db.insertSubstrate(
      "test-author",
      "test-substrate",
      "1.0.0",
      JSON.stringify(baseManifest),
      "test/bundle.tar.gz",
      "abc123",
      "Base substrate",
      [],
      true
    );

    db.insertSubstrate(
      "test-author",
      "test-substrate",
      "2.0.0",
      JSON.stringify(v2Manifest),
      "test/bundle-v2.tar.gz",
      "def456",
      "Updated substrate",
      [],
      true
    );
  });

  it("returns diff with breaking changes", async () => {
    const response = handleDiff("test-author", "test-substrate", "2.0.0", "1.0.0", db);

    expect(response.status).toBe(200);
    const text = await response.text();
    const data = JSON.parse(text) as DiffResponse;

    expect(data.v1).toBe("2.0.0");
    expect(data.v2).toBe("1.0.0");
    expect(data.breaking_changes).toBeDefined();
    expect(data.breaking_changes!.length).toBeGreaterThan(0);

    const providerChange = data.breaking_changes!.find((c) => c.category === "provider_change");
    expect(providerChange).toBeDefined();
    expect(providerChange?.severity).toBe("breaking");
  });

  it("includes both left and right YAML", async () => {
    const response = handleDiff("test-author", "test-substrate", "2.0.0", "1.0.0", db);
    const text = await response.text();
    const data = JSON.parse(text) as DiffResponse;

    expect(data.left).toBeDefined();
    expect(data.left).toContain("claude-opus-4-7");
    expect(data.right).toBeDefined();
    expect(data.right).toContain("gpt-4");
  });

  it("returns 404 for non-existent versions", () => {
    const response = handleDiff("test-author", "test-substrate", "99.0.0", "1.0.0", db);
    expect(response.status).toBe(404);
  });

  it("returns no breaking changes for identical versions", async () => {
    db.insertSubstrate(
      "test-author",
      "test-substrate",
      "1.0.1",
      JSON.stringify(baseManifest),
      "test/bundle-patch.tar.gz",
      "ghi789",
      "Patch substrate",
      [],
      true
    );

    const response = handleDiff("test-author", "test-substrate", "1.0.1", "1.0.0", db);
    const text = await response.text();
    const data = JSON.parse(text) as DiffResponse;

    expect(data.breaking_changes).toBeUndefined(); // No breaking changes field if empty
  });
});
