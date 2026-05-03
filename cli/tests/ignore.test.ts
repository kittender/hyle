import { expect, test, describe } from "bun:test";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { IgnorePatterns } from "../src/ignore";

describe("IgnorePatterns", () => {
  test("constructor filters comments", () => {
    const patterns = new IgnorePatterns([
      ".env",
      "# comment",
      "*.key",
      "",
      "secrets/",
    ]);
    expect(patterns.patterns.length).toBe(3);
    expect(patterns.patterns).toContain(".env");
    expect(patterns.patterns).toContain("*.key");
    expect(patterns.patterns).toContain("secrets/");
  });

  test("matches simple filename", () => {
    const patterns = new IgnorePatterns([".env", "*.key"]);
    expect(patterns.matches(".env")).toBe(true);
    expect(patterns.matches("app.key")).toBe(true);
    expect(patterns.matches("app.ts")).toBe(false);
  });

  test("matches directory glob", () => {
    const patterns = new IgnorePatterns(["secrets/**", "dist/**"]);
    expect(patterns.matches("secrets/passwords.txt")).toBe(true);
    expect(patterns.matches("dist/main.js")).toBe(true);
    expect(patterns.matches("app.ts")).toBe(false);
  });

  test("matches nested paths", () => {
    const patterns = new IgnorePatterns([".env.*", "node_modules/**"]);
    expect(patterns.matches(".env.local")).toBe(true);
    expect(patterns.matches("config/.env.production")).toBe(true);
    expect(patterns.matches("node_modules/foo/bar.js")).toBe(true);
    expect(patterns.matches("src/app.ts")).toBe(false);
  });

  test("loadFromPath returns defaults when file missing", () => {
    const dir = mkdtempSync(join(tmpdir(), "hyle-ignore-test-"));
    try {
      const patterns = IgnorePatterns.loadFromPath(
        join(dir, ".hyleignore")
      );
      expect(patterns.patterns.length).toBe(0);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  test("loadFromPath parses file", () => {
    const dir = mkdtempSync(join(tmpdir(), "hyle-ignore-test-"));
    try {
      writeFileSync(
        join(dir, ".hyleignore"),
        `.env
*.key
# comment
secrets/**
`
      );
      const patterns = IgnorePatterns.loadFromPath(
        join(dir, ".hyleignore")
      );
      expect(patterns.patterns.length).toBe(3);
      expect(patterns.matches(".env")).toBe(true);
      expect(patterns.matches("app.key")).toBe(true);
      expect(patterns.matches("secrets/data")).toBe(true);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });
});
