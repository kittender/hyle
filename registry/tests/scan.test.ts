import { describe, test, expect } from "bun:test";
import { scanManifest } from "../src/scan";
import type { HyleManifest } from "../../../cli/src/manifest";

describe("Security scanner", () => {
  test("detects eval() pattern", () => {
    const manifest: HyleManifest = {
      name: "malicious",
      author: "attacker",
      version: "1.0.0",
      models: {
        primary: { provider: "anthropic", model: "claude-3-sonnet" },
        secondary: { provider: "anthropic", model: "claude-3-haiku" },
      },
      description: "This contains eval(dangerous)",
    };

    const result = scanManifest(manifest, 1000);
    expect(result.scan_status).toBe("flagged");
    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.findings.some((f) => f.severity === "critical")).toBe(true);
  });

  test("detects file:// URLs", () => {
    const manifest: HyleManifest = {
      name: "bad-url",
      author: "author",
      version: "1.0.0",
      models: {
        primary: { provider: "anthropic", model: "claude-3-sonnet" },
        secondary: { provider: "anthropic", model: "claude-3-haiku" },
      },
      url: "file:///etc/passwd",
    };

    const result = scanManifest(manifest, 1000);
    expect(result.scan_status).toBe("flagged");
    expect(
      result.findings.some(
        (f) => f.category === "invalid_url" && f.severity === "critical"
      )
    ).toBe(true);
  });

  test("warns on http:// URLs", () => {
    const manifest: HyleManifest = {
      name: "insecure",
      author: "author",
      version: "1.0.0",
      models: {
        primary: { provider: "anthropic", model: "claude-3-sonnet" },
        secondary: { provider: "anthropic", model: "claude-3-haiku" },
      },
      url: "http://example.com",
    };

    const result = scanManifest(manifest, 1000);
    expect(result.scan_status).toBe("warning");
    expect(
      result.findings.some(
        (f) => f.category === "invalid_url" && f.severity === "warning"
      )
    ).toBe(true);
  });

  test("detects spam (tiny bundle)", () => {
    const manifest: HyleManifest = {
      name: "spam",
      author: "spammer",
      version: "1.0.0",
      models: {
        primary: { provider: "anthropic", model: "claude-3-sonnet" },
        secondary: { provider: "anthropic", model: "claude-3-haiku" },
      },
    };

    const result = scanManifest(manifest, 100);
    expect(result.findings.some((f) => f.category === "spam")).toBe(true);
  });

  test("passes clean manifest", () => {
    const manifest: HyleManifest = {
      name: "legit",
      author: "trusted",
      version: "1.0.0",
      models: {
        primary: { provider: "anthropic", model: "claude-3-sonnet" },
        secondary: { provider: "anthropic", model: "claude-3-haiku" },
      },
      ontology: ["README.md"],
      description: "A legitimate substrate with proper files",
    };

    const result = scanManifest(manifest, 10000);
    expect(result.scan_status).toBe("clean");
    expect(result.findings.length).toBe(0);
  });
});
