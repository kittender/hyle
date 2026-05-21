import { describe, it, expect } from "bun:test";
import type { HyleManifest } from "../../../cli/src/manifest";
import { detectBreakingChanges } from "../src/breaking-changes";

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
  dependencies: [
    { name: "node", version: "18.0.0", url: "https://nodejs.org" },
    { name: "bun", version: "1.0.0", url: "https://bun.sh" },
  ],
  ontology: ["CLAUDE.md", "docs/api.md"],
  craft: ["package.json"],
  identities: ["AGENTS.md"],
};

describe("breaking-changes", () => {
  it("detects primary model provider change", () => {
    const newManifest: HyleManifest = {
      ...baseManifest,
      models: {
        primary: { provider: "openai", model: "gpt-4" },
        secondary: baseManifest.models.secondary,
      },
    };

    const changes = detectBreakingChanges(baseManifest, newManifest);
    expect(changes).toContainEqual(
      expect.objectContaining({
        severity: "breaking",
        category: "provider_change",
        detail: expect.stringContaining("primary model"),
      })
    );
  });

  it("detects primary model change", () => {
    const newManifest: HyleManifest = {
      ...baseManifest,
      models: {
        primary: { provider: "anthropic", model: "claude-sonnet-4-6" },
        secondary: baseManifest.models.secondary,
      },
    };

    const changes = detectBreakingChanges(baseManifest, newManifest);
    expect(changes).toContainEqual(
      expect.objectContaining({
        severity: "breaking",
        category: "model_change",
        detail: expect.stringContaining("primary model"),
      })
    );
  });

  it("detects dependency removal", () => {
    const newManifest: HyleManifest = {
      ...baseManifest,
      dependencies: [{ name: "node", version: "18.0.0", url: "https://nodejs.org" }],
    };

    const changes = detectBreakingChanges(baseManifest, newManifest);
    expect(changes).toContainEqual(
      expect.objectContaining({
        severity: "breaking",
        category: "dependency_removed",
        detail: expect.stringContaining('Dependency removed: "bun'),
      })
    );
  });

  it("detects dependency downgrade", () => {
    const newManifest: HyleManifest = {
      ...baseManifest,
      dependencies: [
        { name: "node", version: "16.0.0", url: "https://nodejs.org" },
        { name: "bun", version: "1.0.0", url: "https://bun.sh" },
      ],
    };

    const changes = detectBreakingChanges(baseManifest, newManifest);
    expect(changes).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        category: "dependency_downgrade",
        detail: expect.stringContaining("Dependency downgraded"),
      })
    );
  });

  it("detects ontology file removal", () => {
    const newManifest: HyleManifest = {
      ...baseManifest,
      ontology: ["CLAUDE.md"],
    };

    const changes = detectBreakingChanges(baseManifest, newManifest);
    expect(changes).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        category: "files_removed",
        detail: expect.stringContaining("ontology"),
      })
    );
  });

  it("detects craft file removal", () => {
    const newManifest: HyleManifest = {
      ...baseManifest,
      craft: [],
    };

    const changes = detectBreakingChanges(baseManifest, newManifest);
    expect(changes).toContainEqual(
      expect.objectContaining({
        severity: "warning",
        category: "files_removed",
        detail: expect.stringContaining("craft"),
      })
    );
  });

  it("detects extends field change", () => {
    const newManifest: HyleManifest = {
      ...baseManifest,
      extends: "parent-substrate@1.0.0",
    };

    const changes = detectBreakingChanges(baseManifest, newManifest);
    expect(changes).toContainEqual(
      expect.objectContaining({
        severity: "breaking",
        category: "extends_changed",
      })
    );
  });

  it("returns no changes for identical manifests", () => {
    const changes = detectBreakingChanges(baseManifest, baseManifest);
    expect(changes).toEqual([]);
  });

  it("detects secondary model change", () => {
    const newManifest: HyleManifest = {
      ...baseManifest,
      models: {
        primary: baseManifest.models.primary,
        secondary: { provider: "openai", model: "gpt-4o-mini" },
      },
    };

    const changes = detectBreakingChanges(baseManifest, newManifest);
    expect(changes).toContainEqual(
      expect.objectContaining({
        severity: "breaking",
        category: "provider_change",
      })
    );
  });

  it("handles undefined dependencies gracefully", () => {
    const oldManifest: HyleManifest = { ...baseManifest, dependencies: undefined };
    const newManifest: HyleManifest = { ...baseManifest, dependencies: undefined };

    const changes = detectBreakingChanges(oldManifest, newManifest);
    expect(changes).toEqual([]);
  });

  it("handles undefined file arrays gracefully", () => {
    const oldManifest: HyleManifest = { ...baseManifest, ontology: undefined };
    const newManifest: HyleManifest = { ...baseManifest, ontology: undefined };

    const changes = detectBreakingChanges(oldManifest, newManifest);
    expect(changes).not.toContainEqual(
      expect.objectContaining({
        category: "files_removed",
      })
    );
  });

  it("aggregates multiple breaking changes", () => {
    const newManifest: HyleManifest = {
      ...baseManifest,
      models: {
        primary: { provider: "openai", model: "gpt-4" },
        secondary: { provider: "openai", model: "gpt-4-turbo" },
      },
      dependencies: [], // All deps removed
      ontology: [], // All files removed
    };

    const changes = detectBreakingChanges(baseManifest, newManifest);
    expect(changes.length).toBeGreaterThan(5); // Multiple changes detected
    expect(changes.some((c) => c.category === "provider_change")).toBe(true);
    expect(changes.some((c) => c.category === "dependency_removed")).toBe(true);
    expect(changes.some((c) => c.category === "files_removed")).toBe(true);
  });
});
