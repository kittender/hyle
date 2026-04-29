import { expect, test } from "bun:test";
import { spawnSync } from "bun";
import { mkdtempSync, existsSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pkg from "../package.json" with { type: "json" };

const ENTRY_SCRIPT = join(import.meta.dir, "../src/index.ts");
const ENTRY = ["bun", "run", ENTRY_SCRIPT];

test("--version exits 0", () => {
  const { exitCode, stdout } = spawnSync([...ENTRY, "--version"]);
  expect(exitCode).toBe(0);
  expect(new TextDecoder().decode(stdout)).toContain(pkg.version);
});

test("--help exits 0", () => {
  const { exitCode } = spawnSync([...ENTRY, "--help"]);
  expect(exitCode).toBe(0);
});

test("unknown command exits non-zero", () => {
  const { exitCode } = spawnSync([...ENTRY, "doesnotexist"]);
  expect(exitCode).not.toBe(0);
});

test("stub commands exit non-zero with message", () => {
  const stubs = ["snapshot", "push", "release", "search"];
  for (const cmd of stubs) {
    const { exitCode, stderr } = spawnSync([...ENTRY, cmd]);
    expect(exitCode).toBe(1);
    expect(new TextDecoder().decode(stderr)).toContain(`hyle ${cmd}: not implemented yet`);
  }
});

test("init --yes creates hyle.yaml, .hyle, .hyleignore", () => {
  const dir = mkdtempSync(join(tmpdir(), "hyle-init-test-"));
  try {
    const { exitCode } = spawnSync([...ENTRY, "init", "--yes", "--offline"], { cwd: dir });
    expect(exitCode).toBe(0);
    expect(existsSync(join(dir, "hyle.yaml"))).toBe(true);
    expect(existsSync(join(dir, ".hyle"))).toBe(true);
    expect(existsSync(join(dir, ".hyleignore"))).toBe(true);
  } finally {
    rmSync(dir, { recursive: true });
  }
});

test("init --yes hyle.yaml contains name derived from dir", () => {
  const dir = mkdtempSync(join(tmpdir(), "hyle-my-proj-"));
  try {
    spawnSync([...ENTRY, "init", "--yes", "--offline"], { cwd: dir });
    const manifest = readFileSync(join(dir, "hyle.yaml"), "utf8");
    expect(manifest).toContain("version: 0.1.0");
    expect(manifest).toContain("provider: anthropic");
    expect(manifest).toContain("provider: ollama");
  } finally {
    rmSync(dir, { recursive: true });
  }
});

test("init --yes is idempotent (re-run overwrites)", () => {
  const dir = mkdtempSync(join(tmpdir(), "hyle-init-idem-"));
  try {
    spawnSync([...ENTRY, "init", "--yes", "--offline"], { cwd: dir });
    const { exitCode } = spawnSync([...ENTRY, "init", "--yes", "--offline"], { cwd: dir });
    expect(exitCode).toBe(0);
  } finally {
    rmSync(dir, { recursive: true });
  }
});
