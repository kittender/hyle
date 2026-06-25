import { expect, test, describe } from "bun:test";
import { dump } from "js-yaml";
import { parseManifest, validateManifest, validateExtendsRef, parseBlueprintRef, mergeManifests, ManifestParseError } from "../src/manifest";

// ---- Helpers ----

function minimalYaml(overrides: Record<string, unknown> = {}): string {
  const base: Record<string, unknown> = {
    name: "my-blueprint",
    author: "alice",
    version: "0.1.0",
    ...overrides,
  };
  return dump(base);
}

// ---- Parse: valid cases ----

describe("parseManifest — valid", () => {
  test("minimal valid manifest", () => {
    const m = parseManifest(minimalYaml());
    expect(m.name).toBe("my-blueprint");
    expect(m.author).toBe("alice");
    expect(m.version).toBe("0.1.0");
    expect(m.blueprint).toBeUndefined();
    expect(m.recommendations).toBeUndefined();
  });

  test("recommendations with multiple categories is valid", () => {
    const yaml = minimalYaml({
      recommendations: {
        universal: ["anthropic/claude-sonnet-4-6", "openai/gpt-4o"],
        budget: ["anthropic/claude-haiku-4-5", "openai/gpt-4o-mini"],
      },
    });
    const m = parseManifest(yaml);
    expect(m.recommendations?.universal).toContain("anthropic/claude-sonnet-4-6");
    expect(m.recommendations?.budget).toContain("anthropic/claude-haiku-4-5");
  });

  test("blueprint with all four categories is valid", () => {
    const yaml = minimalYaml({
      blueprint: {
        ontology: ["CLAUDE.md"],
        craft: ["ARCHITECTURE.md"],
        identities: ["AGENTS.md"],
        ethics: ["policies/*.cedar"],
      },
    });
    const m = parseManifest(yaml);
    expect(m.blueprint?.ontology).toEqual(["CLAUDE.md"]);
    expect(m.blueprint?.craft).toEqual(["ARCHITECTURE.md"]);
  });

  test("dependencies with structured install is valid", () => {
    const yaml = minimalYaml({
      dependencies: [
        {
          name: "node",
          version: ">=18.0.0",
          url: "https://nodejs.org",
          install: {
            macos: { manager: "brew", pkg: "node" },
            linux: { manager: "apt", pkg: "nodejs" },
          },
        },
      ],
    });
    const m = parseManifest(yaml);
    expect(m.dependencies![0].install?.macos).toEqual({ manager: "brew", pkg: "node" });
    expect(m.dependencies![0].install?.linux).toEqual({ manager: "apt", pkg: "nodejs" });
  });

  test("npm install method sets global: true", () => {
    const yaml = minimalYaml({
      dependencies: [
        {
          name: "typescript",
          version: ">=5.0.0",
          url: "https://typescriptlang.org",
          install: { macos: { manager: "npm", pkg: "typescript" } },
        },
      ],
    });
    const m = parseManifest(yaml);
    expect(m.dependencies![0].install?.macos).toEqual({ manager: "npm", pkg: "typescript", global: true });
  });

  test("script install with url and sha256 is valid", () => {
    const yaml = minimalYaml({
      dependencies: [
        {
          name: "custom-tool",
          version: "1.0.0",
          url: "https://example.com/tool",
          install: {
            linux: { manager: "script", url: "https://example.com/install.sh", sha256: "abc123def456" },
          },
        },
      ],
    });
    const m = parseManifest(yaml);
    expect(m.dependencies![0].install?.linux).toEqual({
      manager: "script",
      url: "https://example.com/install.sh",
      sha256: "abc123def456",
    });
  });

  test("extends as single string (backward compat) is valid", () => {
    const yaml = minimalYaml({
      extends: "alice/base@1.0.0",
    });
    const m = parseManifest(yaml);
    expect(m.extends).toEqual(["alice/base@1.0.0"]);
  });

  test("extends as array is valid", () => {
    const yaml = minimalYaml({
      extends: ["alice/base@1.0.0", "alice/policies@2.0.0"],
    });
    const m = parseManifest(yaml);
    expect(m.extends).toEqual(["alice/base@1.0.0", "alice/policies@2.0.0"]);
  });

  test("blueprint with overrides array is valid", () => {
    const yaml = minimalYaml({
      blueprint: {
        ontology: ["CLAUDE.md", "docs/*.md"],
        overrides: ["CLAUDE.md"],
      },
    });
    const m = parseManifest(yaml);
    expect(m.blueprint?.overrides).toEqual(["CLAUDE.md"]);
  });
});

// ---- Parse: invalid (throws ManifestParseError) ----

describe("parseManifest — invalid structure (throws)", () => {
  test("missing name throws", () => {
    expect(() => parseManifest("author: alice\nversion: 0.1.0")).toThrow(ManifestParseError);
  });

  test("missing author throws", () => {
    expect(() => parseManifest("name: foo\nversion: 0.1.0")).toThrow(ManifestParseError);
  });

  test("missing version throws", () => {
    expect(() => parseManifest("name: foo\nauthor: alice")).toThrow(ManifestParseError);
  });

  test("invalid YAML throws", () => {
    expect(() => parseManifest("{{invalid yaml{{")).toThrow(ManifestParseError);
  });

  test("non-object YAML throws", () => {
    expect(() => parseManifest("- item1\n- item2")).toThrow(ManifestParseError);
  });

  test("install as raw string (top-level) throws", () => {
    expect(() =>
      parseManifest(
        minimalYaml({
          dependencies: [{ name: "node", version: ">=18", url: "https://nodejs.org", install: "brew install node" }],
        })
      )
    ).toThrow(ManifestParseError);
  });

  test("install.macos as raw shell string throws", () => {
    expect(() =>
      parseManifest(
        minimalYaml({
          dependencies: [
            { name: "node", version: ">=18", url: "https://nodejs.org", install: { macos: "brew install node" } },
          ],
        })
      )
    ).toThrow(ManifestParseError);
  });

  test("script install missing sha256 throws", () => {
    expect(() =>
      parseManifest(
        minimalYaml({
          dependencies: [
            {
              name: "tool",
              version: "1.0.0",
              url: "https://example.com",
              install: { linux: { manager: "script", url: "https://example.com/install.sh" } },
            },
          ],
        })
      )
    ).toThrow(ManifestParseError);
  });

  test("script install missing url throws", () => {
    expect(() =>
      parseManifest(
        minimalYaml({
          dependencies: [
            {
              name: "tool",
              version: "1.0.0",
              url: "https://example.com",
              install: { linux: { manager: "script", sha256: "abc123" } },
            },
          ],
        })
      )
    ).toThrow(ManifestParseError);
  });

  test("unknown manager throws", () => {
    expect(() =>
      parseManifest(
        minimalYaml({
          dependencies: [
            {
              name: "tool",
              version: "1.0.0",
              url: "https://example.com",
              install: { macos: { manager: "pacman", pkg: "tool" } },
            },
          ],
        })
      )
    ).toThrow(ManifestParseError);
  });

  test("missing manager field throws", () => {
    expect(() =>
      parseManifest(
        minimalYaml({
          dependencies: [
            {
              name: "tool",
              version: "1.0.0",
              url: "https://example.com",
              install: { macos: { pkg: "tool" } },
            },
          ],
        })
      )
    ).toThrow(ManifestParseError);
  });

  test("missing pkg field throws", () => {
    expect(() =>
      parseManifest(
        minimalYaml({
          dependencies: [
            {
              name: "tool",
              version: "1.0.0",
              url: "https://example.com",
              install: { macos: { manager: "brew" } },
            },
          ],
        })
      )
    ).toThrow(ManifestParseError);
  });
});

// ---- Validate: errors ----

describe("validateManifest — errors", () => {
  test("name with uppercase produces error", () => {
    const m = parseManifest(minimalYaml({ name: "MyBlueprint" }));
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "name")).toBe(true);
  });

  test("name with spaces produces error", () => {
    const m = parseManifest(minimalYaml({ name: "my blueprint" }));
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "name")).toBe(true);
  });

  test("name too long (65 chars) produces error", () => {
    const m = parseManifest(minimalYaml({ name: "a".repeat(65) }));
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "name")).toBe(true);
  });

  test("version not strict semver '1.0' produces error", () => {
    const m = parseManifest(minimalYaml({ version: "1.0" }));
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "version")).toBe(true);
  });

  test("version with v prefix 'v1.0.0' produces error", () => {
    const m = parseManifest(minimalYaml({ version: "v1.0.0" }));
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "version")).toBe(true);
  });

  test("version with snapshot suffix is valid", () => {
    const m = parseManifest(minimalYaml({ version: "1.0.0-snapshot" }));
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "version")).toBe(false);
  });

  test("recommendations with invalid model format produces error", () => {
    const m = parseManifest(
      minimalYaml({
        recommendations: {
          universal: ["invalid-model-format"],
        },
      })
    );
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "recommendations.universal[0]")).toBe(true);
  });

  test("dependencies[0].version invalid range produces error", () => {
    const m = parseManifest(
      minimalYaml({
        dependencies: [{ name: "foo", version: "not-a-range", url: "https://example.com" }],
      })
    );
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "dependencies[0].version")).toBe(true);
  });

  test("dependencies[0].url not a URL produces error", () => {
    const m = parseManifest(
      minimalYaml({
        dependencies: [{ name: "foo", version: ">=1.0.0", url: "just-a-string" }],
      })
    );
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "dependencies[0].url")).toBe(true);
  });

  test("blueprint.ontology entry with absolute path produces error", () => {
    const m = parseManifest(minimalYaml({ blueprint: { ontology: ["/etc/passwd"] } }));
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "blueprint.ontology[0]")).toBe(true);
  });

  test("blueprint.ontology entry with ../ traversal produces error", () => {
    const m = parseManifest(minimalYaml({ blueprint: { ontology: ["../secrets.md"] } }));
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "blueprint.ontology[0]")).toBe(true);
  });

  test("blueprint.ontology entry with ~/ path produces error", () => {
    const m = parseManifest(minimalYaml({ blueprint: { ontology: ["~/private/doc.md"] } }));
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "blueprint.ontology[0]")).toBe(true);
  });

  test('blueprint.ontology entry ".." (no slash) produces error', () => {
    const m = parseManifest(minimalYaml({ blueprint: { ontology: [".."] } }));
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "blueprint.ontology[0]")).toBe(true);
  });

  test('blueprint.ontology entry "foo/../../etc/passwd" produces error', () => {
    const m = parseManifest(minimalYaml({ blueprint: { ontology: ["foo/../../etc/passwd"] } }));
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "blueprint.ontology[0]")).toBe(true);
  });

  test("blueprint.ontology entry with Windows backslash separator produces error", () => {
    const m = parseManifest(minimalYaml({ blueprint: { ontology: ["foo\\..\\bar"] } }));
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "blueprint.ontology[0]")).toBe(true);
  });

  test("blueprint.ontology entry with null byte produces error", () => {
    const m = parseManifest(minimalYaml({ blueprint: { ontology: ["path\x00file"] } }));
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "blueprint.ontology[0]")).toBe(true);
  });

  test('"docs/spec.md" in blueprint.ontology is safe', () => {
    const m = parseManifest(minimalYaml({ blueprint: { ontology: ["docs/spec.md"] } }));
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "blueprint.ontology[0]")).toBe(false);
  });

  test('"CLAUDE.md" in blueprint.ontology is safe', () => {
    const m = parseManifest(minimalYaml({ blueprint: { ontology: ["CLAUDE.md"] } }));
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "blueprint.ontology[0]")).toBe(false);
  });

  test('".hidden/file.md" in blueprint.ontology is safe', () => {
    const m = parseManifest(minimalYaml({ blueprint: { ontology: [".hidden/file.md"] } }));
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "blueprint.ontology[0]")).toBe(false);
  });
});

// ---- Validate: warnings ----

describe("validateManifest — warnings", () => {
  test("missing description produces warning", () => {
    const m = parseManifest(minimalYaml());
    const { errors, warnings } = validateManifest(m);
    expect(errors).toHaveLength(0);
    expect(warnings.some((w) => w.field === "description")).toBe(true);
  });

  test("valid recommendations with description clears description warning", () => {
    const m = parseManifest(
      minimalYaml({
        description: "My blueprint",
        recommendations: { universal: ["anthropic/claude-sonnet-4-6"] },
      })
    );
    const { warnings } = validateManifest(m);
    expect(warnings.some((w) => w.field === "description")).toBe(false);
  });

  test("script install method produces warning", () => {
    const m = parseManifest(
      minimalYaml({
        dependencies: [
          {
            name: "tool",
            version: "1.0.0",
            url: "https://example.com",
            install: {
              linux: { manager: "script", url: "https://example.com/install.sh", sha256: "abc123" },
            },
          },
        ],
      })
    );
    const { warnings } = validateManifest(m);
    expect(warnings.some((w) => w.field === "dependencies[0].install.linux")).toBe(true);
  });

  test("HTTP dep URL produces warning", () => {
    const m = parseManifest(
      minimalYaml({
        dependencies: [{ name: "foo", version: ">=1.0.0", url: "http://example.com" }],
      })
    );
    const { warnings } = validateManifest(m);
    expect(warnings.some((w) => w.field === "dependencies[0].url")).toBe(true);
  });

  test("missing description produces warning", () => {
    const m = parseManifest(minimalYaml());
    const { warnings } = validateManifest(m);
    expect(warnings.some((w) => w.field === "description")).toBe(true);
  });

});

// ---- parseBlueprintRef ----

describe("parseBlueprintRef", () => {
  test("author/name → [author, name, undefined]", () => {
    expect(parseBlueprintRef("alice/my-blueprint")).toEqual(["alice", "my-blueprint", undefined]);
  });

  test("author/name@version → [author, name, version]", () => {
    expect(parseBlueprintRef("alice/my-blueprint@1.2.3")).toEqual(["alice", "my-blueprint", "1.2.3"]);
  });

  test("no slash → empty author", () => {
    const [author] = parseBlueprintRef("noauthor");
    expect(author).toBe("");
  });
});

// ---- validateExtendsRef ----

describe("validateExtendsRef", () => {
  test("valid author/name → no error", () => {
    expect(validateExtendsRef("alice/my-blueprint")).toBeUndefined();
  });

  test("valid author/name@version → no error", () => {
    expect(validateExtendsRef("alice/my-blueprint@1.0.0")).toBeUndefined();
  });

  test("missing slash → error", () => {
    expect(validateExtendsRef("noauthor")).toBeDefined();
  });

  test("invalid author slug → error", () => {
    expect(validateExtendsRef("ALICE/my-blueprint")).toBeDefined();
  });

  test("invalid name slug → error", () => {
    expect(validateExtendsRef("alice/My Blueprint")).toBeDefined();
  });

  test("invalid semver version → error", () => {
    expect(validateExtendsRef("alice/my-blueprint@notasemver")).toBeDefined();
  });
});

// ---- validateManifest: extends field ----

describe("validateManifest — extends field", () => {
  test("valid extends with single author/name passes", () => {
    const m = parseManifest(minimalYaml({ extends: ["alice/base-blueprint"] }));
    const { errors } = validateManifest(m);
    expect(errors.filter((e) => e.field.includes("extends"))).toHaveLength(0);
  });

  test("valid extends with author/name@version passes", () => {
    const m = parseManifest(minimalYaml({ extends: ["alice/base-blueprint@1.2.3"] }));
    const { errors } = validateManifest(m);
    expect(errors.filter((e) => e.field.includes("extends"))).toHaveLength(0);
  });

  test("valid extends with multiple parents passes", () => {
    const m = parseManifest(minimalYaml({ extends: ["alice/base@1.0.0", "alice/policies@2.0.0"] }));
    const { errors } = validateManifest(m);
    expect(errors.filter((e) => e.field.includes("extends"))).toHaveLength(0);
  });

  test("invalid extends format → error", () => {
    const m = parseManifest(minimalYaml({ extends: ["not-valid"] }));
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "extends[0]")).toBe(true);
  });

  test("circular extends (self) → error", () => {
    const m = parseManifest(minimalYaml({ extends: ["alice/my-blueprint"] }));
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "extends[0]" && e.message.includes("Circular"))).toBe(true);
  });

  test("extends depth exceeding 2 → error", () => {
    const m = parseManifest(minimalYaml({ extends: ["alice/a@1.0.0", "alice/b@2.0.0", "alice/c@3.0.0"] }));
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "extends" && e.message.includes("Max inheritance depth"))).toBe(true);
  });

  test("extends with invalid version → error", () => {
    const m = parseManifest(minimalYaml({ extends: ["alice/base-blueprint@bad"] }));
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field.includes("extends"))).toBe(true);
  });
});

// ---- mergeManifests ----

describe("mergeManifests", () => {
  test("no parents returns child unchanged", () => {
    const child = parseManifest(minimalYaml({ name: "child" }));
    const result = mergeManifests([], child);
    expect(result.name).toBe("child");
  });

  test("dependencies default replace strategy (child wins)", () => {
    const parent = parseManifest(
      minimalYaml({
        name: "parent",
        dependencies: [{ name: "node", version: ">=18.0.0", url: "https://nodejs.org" }],
      })
    );
    const child = parseManifest(
      minimalYaml({
        name: "child",
        dependencies: [{ name: "bun", version: ">=1.0.0", url: "https://bun.sh" }],
      })
    );
    const result = mergeManifests([parent], child);
    expect(result.dependencies).toHaveLength(1);
    expect(result.dependencies![0].name).toBe("bun");
  });

  test("dependencies append strategy concatenates", () => {
    const parent = parseManifest(
      minimalYaml({
        name: "parent",
        dependencies: [{ name: "node", version: ">=18.0.0", url: "https://nodejs.org" }],
      })
    );
    const child = parseManifest(
      minimalYaml({
        name: "child",
        dependencies: [{ name: "bun", version: ">=1.0.0", url: "https://bun.sh" }],
        merge_policy: { dependencies: "append" },
      })
    );
    const result = mergeManifests([parent], child);
    expect(result.dependencies).toHaveLength(2);
    expect(result.dependencies![0].name).toBe("node");
    expect(result.dependencies![1].name).toBe("bun");
  });

  test("dependencies merge-by-name deduplicates by name", () => {
    const parent = parseManifest(
      minimalYaml({
        name: "parent",
        dependencies: [
          { name: "node", version: ">=18.0.0", url: "https://nodejs.org" },
          { name: "bun", version: ">=0.5.0", url: "https://bun.sh" },
        ],
      })
    );
    const child = parseManifest(
      minimalYaml({
        name: "child",
        dependencies: [{ name: "bun", version: ">=1.0.0", url: "https://bun.sh" }],
        merge_policy: { dependencies: "merge-by-name" },
      })
    );
    const result = mergeManifests([parent], child);
    expect(result.dependencies).toHaveLength(2);
    const bunDep = result.dependencies!.find((d) => d.name === "bun");
    expect(bunDep!.version).toBe(">=1.0.0");
  });

  test("recommendations child overwrites parent by default", () => {
    const parent = parseManifest(
      minimalYaml({
        name: "parent",
        recommendations: {
          universal: ["anthropic/claude-sonnet-4-6"],
        },
      })
    );
    const child = parseManifest(
      minimalYaml({
        name: "child",
        recommendations: {
          budget: ["anthropic/claude-haiku-4-5"],
        },
      })
    );
    const result = mergeManifests([parent], child);
    expect(result.recommendations?.universal).toBeUndefined();
    expect(result.recommendations?.budget).toEqual(["anthropic/claude-haiku-4-5"]);
  });

  test("blueprint paths append strategy concatenates", () => {
    const parent = parseManifest(
      minimalYaml({
        name: "parent",
        blueprint: { ontology: ["parent-docs.md"] },
      })
    );
    const child = parseManifest(
      minimalYaml({
        name: "child",
        blueprint: { ontology: ["child-docs.md"] },
        merge_policy: { blueprint: { ontology: "append" } },
      })
    );
    const result = mergeManifests([parent], child);
    expect(result.blueprint?.ontology).toEqual(["parent-docs.md", "child-docs.md"]);
  });

  test("blueprint paths merge-by-name deduplicates", () => {
    const parent = parseManifest(
      minimalYaml({
        name: "parent",
        blueprint: { ontology: ["docs.md", "api.md"] },
      })
    );
    const child = parseManifest(
      minimalYaml({
        name: "child",
        blueprint: { ontology: ["docs.md"] },
        merge_policy: { blueprint: { ontology: "merge-by-name" } },
      })
    );
    const result = mergeManifests([parent], child);
    expect(result.blueprint?.ontology?.sort()).toEqual(["api.md", "docs.md"].sort());
    expect(result.blueprint?.ontology).toHaveLength(2);
  });

  test("multiple parents compose in order", () => {
    const parent1 = parseManifest(
      minimalYaml({
        name: "parent1",
        dependencies: [{ name: "node", version: ">=18.0.0", url: "https://nodejs.org" }],
      })
    );
    const parent2 = parseManifest(
      minimalYaml({
        name: "parent2",
        dependencies: [{ name: "bun", version: ">=1.0.0", url: "https://bun.sh" }],
      })
    );
    const child = parseManifest(
      minimalYaml({
        name: "child",
        merge_policy: { dependencies: "append" },
      })
    );
    const result = mergeManifests([parent1, parent2], child);
    expect(result.dependencies).toHaveLength(2);
    expect(result.dependencies![0].name).toBe("node");
    expect(result.dependencies![1].name).toBe("bun");
  });

  test("parse merge_policy from YAML", () => {
    const yaml = minimalYaml({
      merge_policy: {
        dependencies: "append",
        recommendations: "merge-by-name",
        blueprint: { ontology: "append", craft: "replace" },
      },
    });
    const m = parseManifest(yaml);
    expect(m.merge_policy?.dependencies).toBe("append");
    expect(m.merge_policy?.recommendations).toBe("merge-by-name");
    expect(m.merge_policy?.blueprint?.ontology).toBe("append");
    expect(m.merge_policy?.blueprint?.craft).toBe("replace");
  });
});
