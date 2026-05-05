import { expect, test, describe } from "bun:test";
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  rmSync,
  mkdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dump, load } from "js-yaml";
import { runScan } from "../src/commands/scan";

function makeTmpDir(): string {
  return mkdtempSync(join(tmpdir(), "hyle-scan-test-"));
}

function createManifest(dir: string) {
  const manifest = {
    name: "test-substrate",
    author: "test-author",
    version: "0.1.0",
    models: {
      primary: {
        provider: "anthropic",
        model: "claude-sonnet-4-6",
      },
      secondary: {
        provider: "anthropic",
        model: "claude-haiku-4-5",
      },
    },
  };
  writeFileSync(join(dir, "hyle.yaml"), dump(manifest, { lineWidth: 80 }));
}

describe("scan commands", () => {
  test("ontology scan finds markdown files", async () => {
    const dir = makeTmpDir();
    try {
      process.chdir(dir);
      createManifest(dir);
      mkdirSync(join(dir, "docs"));
      mkdirSync(join(dir, "src"));
      writeFileSync(join(dir, "CLAUDE.md"), "# Test\n");
      writeFileSync(join(dir, "docs", "architecture.md"), "# Arch\n");
      writeFileSync(join(dir, "src", "app.ts"), "// code\n");

      await runScan("ontology", { dryRun: false });

      const manifest = load(readFileSync(join(dir, "hyle.yaml"), "utf8")) as any;
      expect(manifest.ontology).toBeDefined();
      expect(manifest.ontology).toContain("CLAUDE.md");
      expect(manifest.ontology).toContain("docs/architecture.md");
    } finally {
      rmSync(dir, { recursive: true });
      process.chdir("/");
    }
  });

  test("respects .hyleignore patterns", async () => {
    const dir = makeTmpDir();
    try {
      process.chdir(dir);
      createManifest(dir);
      writeFileSync(join(dir, ".hyleignore"), "*.secret.md\n");
      mkdirSync(join(dir, "docs"), { recursive: true });
      writeFileSync(join(dir, "docs", "api.md"), "# API\n");
      writeFileSync(join(dir, "docs", "config.secret.md"), "# Config\n");

      await runScan("ontology", { dryRun: false });

      const manifest = load(readFileSync(join(dir, "hyle.yaml"), "utf8")) as any;
      expect(manifest.ontology).toContain("docs/api.md");
      expect(manifest.ontology).not.toContain("docs/config.secret.md");
    } finally {
      rmSync(dir, { recursive: true });
      process.chdir("/");
    }
  });

  test("--add single file", async () => {
    const dir = makeTmpDir();
    try {
      process.chdir(dir);
      createManifest(dir);
      writeFileSync(join(dir, "CUSTOM.md"), "# Custom\n");

      await runScan("ontology", { add: "CUSTOM.md" });

      const manifest = load(readFileSync(join(dir, "hyle.yaml"), "utf8")) as any;
      expect(manifest.ontology).toContain("CUSTOM.md");
    } finally {
      rmSync(dir, { recursive: true });
      process.chdir("/");
    }
  });

  test("craft scan finds config files", async () => {
    const dir = makeTmpDir();
    try {
      process.chdir(dir);
      createManifest(dir);
      writeFileSync(join(dir, "package.json"), '{"name":"test"}\n');
      writeFileSync(join(dir, "tsconfig.json"), '{}\n');
      writeFileSync(join(dir, "biome.json"), '{}\n');

      await runScan("craft", { dryRun: false });

      const manifest = load(readFileSync(join(dir, "hyle.yaml"), "utf8")) as any;
      expect(manifest.craft).toContain("package.json");
      expect(manifest.craft).toContain("tsconfig.json");
      expect(manifest.craft).toContain("biome.json");
    } finally {
      rmSync(dir, { recursive: true });
      process.chdir("/");
    }
  });

  test("identities scan finds agent files", async () => {
    const dir = makeTmpDir();
    try {
      process.chdir(dir);
      createManifest(dir);
      mkdirSync(join(dir, ".claude", "agents"), { recursive: true });
      writeFileSync(join(dir, "AGENTS.md"), "# Agents\n");
      writeFileSync(join(dir, ".claude", "agents", "researcher.md"), "# Researcher\n");

      await runScan("identities", { dryRun: false });

      const manifest = load(readFileSync(join(dir, "hyle.yaml"), "utf8")) as any;
      expect(manifest.identities).toContain("AGENTS.md");
      expect(manifest.identities).toContain(".claude/agents/researcher.md");
    } finally {
      rmSync(dir, { recursive: true });
      process.chdir("/");
    }
  });

  test("ethics scan finds compliance files", async () => {
    const dir = makeTmpDir();
    try {
      process.chdir(dir);
      createManifest(dir);
      mkdirSync(join(dir, "evals"), { recursive: true });
      writeFileSync(join(dir, "ETHICS.md"), "# Ethics\n");
      writeFileSync(join(dir, "evals", "fairness.ts"), "// test\n");

      await runScan("ethics", { dryRun: false });

      const manifest = load(readFileSync(join(dir, "hyle.yaml"), "utf8")) as any;
      expect(manifest.ethics).toContain("ETHICS.md");
      expect(manifest.ethics).toContain("evals/fairness.ts");
    } finally {
      rmSync(dir, { recursive: true });
      process.chdir("/");
    }
  });

  test("deduplicates files", async () => {
    const dir = makeTmpDir();
    try {
      process.chdir(dir);
      const manifest = {
        name: "test",
        author: "test",
        version: "0.1.0",
        ontology: ["existing.md"],
        models: {
          primary: {
            provider: "anthropic",
            model: "claude-sonnet-4-6",
          },
          secondary: {
            provider: "anthropic",
            model: "claude-haiku-4-5",
          },
        },
      };
      writeFileSync(join(dir, "hyle.yaml"), dump(manifest, { lineWidth: 80 }));
      writeFileSync(join(dir, "existing.md"), "# Existing\n");

      await runScan("ontology", { add: "existing.md" });

      const updated = load(readFileSync(join(dir, "hyle.yaml"), "utf8")) as any;
      const count = (updated.ontology || []).filter((f: string) => f === "existing.md").length;
      expect(count).toBe(1);
    } finally {
      rmSync(dir, { recursive: true });
      process.chdir("/");
    }
  });

  test("exits with error if no hyle.yaml", async () => {
    const dir = makeTmpDir();
    try {
      process.chdir(dir);
      let exited = false;
      const origExit = process.exit;
      process.exit = () => {
        exited = true;
        throw new Error("exit");
      };

      try {
        await runScan("ontology", { add: "test.md" });
      } catch {
        // Expected
      }

      expect(exited).toBe(true);
      process.exit = origExit;
    } finally {
      rmSync(dir, { recursive: true });
      process.chdir("/");
    }
  });
});
