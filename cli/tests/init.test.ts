import { expect, test, describe } from "bun:test";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadConfig } from "../src/config";
import { checkRegistry } from "../src/commands/init";

function makeTmpDir(): string {
  return mkdtempSync(join(tmpdir(), "hyle-config-test-"));
}

describe("loadConfig", () => {
  test("no .hyle file → returns defaults", () => {
    const dir = makeTmpDir();
    try {
      const config = loadConfig(dir);
      expect(config.remote_url).toBe("https://registry.hyle.eu");
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  test("local .hyle overrides remote_url", () => {
    const dir = makeTmpDir();
    try {
      writeFileSync(join(dir, ".hyle"), "remote_url: https://custom.registry.example.com\n");
      const config = loadConfig(dir);
      expect(config.remote_url).toBe("https://custom.registry.example.com");
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  test("local .hyle preserves other defaults", () => {
    const dir = makeTmpDir();
    try {
      writeFileSync(join(dir, ".hyle"), "default_model: claude-opus-4-7\n");
      const config = loadConfig(dir);
      expect(config.remote_url).toBe("https://registry.hyle.eu");
      expect(config.default_model).toBe("claude-opus-4-7");
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  test("http:// remote_url → throws", () => {
    const dir = makeTmpDir();
    try {
      writeFileSync(join(dir, ".hyle"), "remote_url: http://insecure.example.com\n");
      expect(() => loadConfig(dir)).toThrow(/must use https/);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  test("file:// remote_url → throws", () => {
    const dir = makeTmpDir();
    try {
      writeFileSync(join(dir, ".hyle"), "remote_url: file:///etc/passwd\n");
      expect(() => loadConfig(dir)).toThrow(/must use https/);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  test("https://localhost remote_url → throws", () => {
    const dir = makeTmpDir();
    try {
      writeFileSync(join(dir, ".hyle"), "remote_url: https://localhost/api\n");
      expect(() => loadConfig(dir)).toThrow(/localhost not allowed/);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  test("https://127.0.0.1 remote_url → throws", () => {
    const dir = makeTmpDir();
    try {
      writeFileSync(join(dir, ".hyle"), "remote_url: https://127.0.0.1/api\n");
      expect(() => loadConfig(dir)).toThrow(/localhost not allowed/);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  test("non-URL remote_url → throws", () => {
    const dir = makeTmpDir();
    try {
      writeFileSync(join(dir, ".hyle"), "remote_url: not-a-url\n");
      expect(() => loadConfig(dir)).toThrow(/not a valid URL/);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });
});

describe("checkRegistry", () => {
  test("mock 200 → logs warning, does not throw", async () => {
    const mockFetcher = async () => new Response(null, { status: 200 });
    const logs: string[] = [];
    const origWarn = console.warn;
    console.warn = (msg: string) => logs.push(msg);
    try {
      await checkRegistry("foo", "alice", "https://registry.hyle.eu", mockFetcher);
      expect(logs.some((l) => l.includes("already exists"))).toBe(true);
    } finally {
      console.warn = origWarn;
    }
  });

  test("mock 404 → silent pass", async () => {
    const mockFetcher = async () => new Response(null, { status: 404 });
    const logs: string[] = [];
    const origWarn = console.warn;
    console.warn = (msg: string) => logs.push(msg);
    try {
      await checkRegistry("foo", "alice", "https://registry.hyle.eu", mockFetcher);
      expect(logs.length).toBe(0);
    } finally {
      console.warn = origWarn;
    }
  });

  test("mock fetch throws → logs warning, does not throw", async () => {
    const mockFetcher = async (): Promise<Response> => {
      throw new Error("network error");
    };
    const logs: string[] = [];
    const origWarn = console.warn;
    console.warn = (msg: string) => logs.push(msg);
    try {
      await checkRegistry("foo", "alice", "https://registry.hyle.eu", mockFetcher);
      expect(logs.some((l) => l.includes("unreachable"))).toBe(true);
    } finally {
      console.warn = origWarn;
    }
  });
});
