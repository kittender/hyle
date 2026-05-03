import { expect, test, describe } from "bun:test";
import { dump } from "js-yaml";
import { parseManifest, validateManifest, ManifestParseError } from "../src/manifest";

// ---- Helpers ----

function minimalYaml(overrides: Record<string, unknown> = {}): string {
  const base: Record<string, unknown> = {
    name: "my-substrate",
    author: "alice",
    version: "0.1.0",
    models: {
      primary: { provider: "anthropic", model: "claude-sonnet-4-6" },
      secondary: { provider: "anthropic", model: "claude-haiku-4-5" },
    },
    ...overrides,
  };
  return dump(base);
}

// ---- Parse: valid cases ----

describe("parseManifest — valid", () => {
  test("minimal valid manifest", () => {
    const m = parseManifest(minimalYaml());
    expect(m.name).toBe("my-substrate");
    expect(m.author).toBe("alice");
    expect(m.version).toBe("0.1.0");
    expect(m.models.primary.provider).toBe("anthropic");
    expect(m.models.secondary.model).toBe("claude-haiku-4-5");
  });

  test("model_pin present is valid", () => {
    const yaml = minimalYaml({
      models: {
        primary: { provider: "anthropic", model: "claude-sonnet-4-6", model_pin: "claude-sonnet-4-6-20260101" },
        secondary: { provider: "anthropic", model: "claude-haiku-4-5" },
      },
    });
    const m = parseManifest(yaml);
    expect(m.models.primary.model_pin).toBe("claude-sonnet-4-6-20260101");
  });

  test("model_pin absent is valid", () => {
    const m = parseManifest(minimalYaml());
    expect(m.models.primary.model_pin).toBeUndefined();
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

  test("fallback chain with Ollama local entry is valid", () => {
    const yaml = minimalYaml({
      models: {
        primary: {
          provider: "anthropic",
          model: "claude-sonnet-4-6",
          fallback: [{ provider: "ollama", model: "qwen2.5:14b", tags: ["local", "free"] }],
        },
        secondary: {
          provider: "anthropic",
          model: "claude-haiku-4-5",
          fallback: [{ provider: "ollama", model: "qwen2.5:7b", tags: ["local", "free"] }],
        },
      },
    });
    const m = parseManifest(yaml);
    expect(m.models.primary.fallback![0].tags).toContain("local");
  });

  test("all four path arrays with entries", () => {
    const yaml = minimalYaml({
      ontology: ["CLAUDE.md", "docs/*.md"],
      craft: ["SKILLS.md"],
      identities: [".claude/agents/coder.md"],
      ethics: ["policies.cedar"],
    });
    const m = parseManifest(yaml);
    expect(m.ontology).toEqual(["CLAUDE.md", "docs/*.md"]);
    expect(m.craft).toEqual(["SKILLS.md"]);
  });
});

// ---- Parse: invalid (throws ManifestParseError) ----

describe("parseManifest — invalid structure (throws)", () => {
  test("missing name throws", () => {
    expect(() => parseManifest("author: alice\nversion: 0.1.0\nmodels:\n  primary:\n    provider: x\n    model: y\n  secondary:\n    provider: x\n    model: z")).toThrow(ManifestParseError);
  });

  test("missing models throws", () => {
    expect(() => parseManifest("name: foo\nauthor: alice\nversion: 0.1.0")).toThrow(ManifestParseError);
  });

  test("missing models.primary throws", () => {
    expect(() =>
      parseManifest("name: foo\nauthor: alice\nversion: 0.1.0\nmodels:\n  secondary:\n    provider: x\n    model: y")
    ).toThrow(ManifestParseError);
  });

  test("missing models.secondary throws", () => {
    expect(() =>
      parseManifest("name: foo\nauthor: alice\nversion: 0.1.0\nmodels:\n  primary:\n    provider: x\n    model: y")
    ).toThrow(ManifestParseError);
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
    const m = parseManifest(minimalYaml({ name: "MySubstrate" }));
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "name")).toBe(true);
  });

  test("name with spaces produces error", () => {
    const m = parseManifest(minimalYaml({ name: "my substrate" }));
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

  test("models.primary.provider empty produces error", () => {
    const yaml = `name: foo\nauthor: alice\nversion: 0.1.0\nmodels:\n  primary:\n    provider: ""\n    model: bar\n  secondary:\n    provider: x\n    model: y`;
    const m = parseManifest(yaml);
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "models.primary.provider")).toBe(true);
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

  test("ontology entry with absolute path produces error", () => {
    const m = parseManifest(minimalYaml({ ontology: ["/etc/passwd"] }));
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "ontology[0]")).toBe(true);
  });

  test("ontology entry with ../ traversal produces error", () => {
    const m = parseManifest(minimalYaml({ ontology: ["../secrets.md"] }));
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "ontology[0]")).toBe(true);
  });

  test("ontology entry with ~/ path produces error", () => {
    const m = parseManifest(minimalYaml({ ontology: ["~/private/doc.md"] }));
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "ontology[0]")).toBe(true);
  });

  test('ontology entry ".." (no slash) produces error', () => {
    const m = parseManifest(minimalYaml({ ontology: [".."] }));
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "ontology[0]")).toBe(true);
  });

  test('ontology entry "foo/../../etc/passwd" produces error', () => {
    const m = parseManifest(minimalYaml({ ontology: ["foo/../../etc/passwd"] }));
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "ontology[0]")).toBe(true);
  });

  test("ontology entry with Windows backslash separator produces error", () => {
    const m = parseManifest(minimalYaml({ ontology: ["foo\\..\\bar"] }));
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "ontology[0]")).toBe(true);
  });

  test("ontology entry with null byte produces error", () => {
    const m = parseManifest(minimalYaml({ ontology: ["path\x00file"] }));
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "ontology[0]")).toBe(true);
  });

  test('"docs/spec.md" is safe', () => {
    const m = parseManifest(minimalYaml({ ontology: ["docs/spec.md"] }));
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "ontology[0]")).toBe(false);
  });

  test('"CLAUDE.md" is safe', () => {
    const m = parseManifest(minimalYaml({ ontology: ["CLAUDE.md"] }));
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "ontology[0]")).toBe(false);
  });

  test('".hidden/file.md" is safe', () => {
    const m = parseManifest(minimalYaml({ ontology: [".hidden/file.md"] }));
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field === "ontology[0]")).toBe(false);
  });
});

// ---- Validate: warnings ----

describe("validateManifest — warnings", () => {
  test("no local fallback on primary produces warning", () => {
    const m = parseManifest(minimalYaml());
    const { errors, warnings } = validateManifest(m);
    expect(errors).toHaveLength(0);
    expect(warnings.some((w) => w.field === "models.primary.fallback")).toBe(true);
  });

  test("no local fallback on secondary produces warning", () => {
    const m = parseManifest(minimalYaml());
    const { warnings } = validateManifest(m);
    expect(warnings.some((w) => w.field === "models.secondary.fallback")).toBe(true);
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

  test("local fallback on both models clears fallback warnings", () => {
    const yaml = minimalYaml({
      description: "A substrate",
      models: {
        primary: {
          provider: "anthropic",
          model: "claude-sonnet-4-6",
          fallback: [{ provider: "ollama", model: "qwen2.5:14b", tags: ["local", "free"] }],
        },
        secondary: {
          provider: "anthropic",
          model: "claude-haiku-4-5",
          fallback: [{ provider: "ollama", model: "qwen2.5:7b", tags: ["local", "free"] }],
        },
      },
    });
    const m = parseManifest(yaml);
    const { errors, warnings } = validateManifest(m);
    expect(errors).toHaveLength(0);
    expect(warnings.filter((w) => w.field.includes("fallback"))).toHaveLength(0);
  });

  test("fallback chain within depth limit is valid", () => {
    const yaml = minimalYaml({
      description: "A substrate",
      models: {
        primary: {
          provider: "anthropic",
          model: "claude-sonnet-4-6",
          fallback: [
            {
              provider: "openai",
              model: "gpt-4o",
              fallback: [
                {
                  provider: "openai",
                  model: "gpt-4o-mini",
                  fallback: [{ provider: "ollama", model: "qwen2.5:14b", tags: ["local"] }],
                },
              ],
            },
          ],
        },
        secondary: { provider: "anthropic", model: "claude-haiku-4-5" },
      },
    });
    const m = parseManifest(yaml);
    const { errors } = validateManifest(m);
    expect(errors.filter((e) => e.field.includes("fallback"))).toHaveLength(0);
  });

  test("fallback chain exceeding depth limit produces error", () => {
    const yaml = minimalYaml({
      description: "A substrate",
      models: {
        primary: {
          provider: "anthropic",
          model: "claude-sonnet-4-6",
          fallback: [
            {
              provider: "openai",
              model: "gpt-4o",
              fallback: [
                {
                  provider: "openai",
                  model: "gpt-4o-mini",
                  fallback: [
                    {
                      provider: "openai",
                      model: "text-davinci-003",
                      fallback: [
                        {
                          provider: "openai",
                          model: "text-davinci-002",
                          fallback: [
                            {
                              provider: "ollama",
                              model: "qwen2.5:14b",
                              tags: ["local"],
                              fallback: [
                                { provider: "ollama", model: "llama2", tags: ["local"] },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        secondary: { provider: "anthropic", model: "claude-haiku-4-5" },
      },
    });
    const m = parseManifest(yaml);
    const { errors } = validateManifest(m);
    expect(errors.some((e) => e.field.includes("fallback") && e.message.includes("too deep"))).toBe(true);
  });
});
