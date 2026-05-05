import { parseManifest, validateManifest } from "../src/manifest";
import { writeFileSync, mkdirSync, rmSync, readFileSync } from "fs";
import { join } from "path";

const testDir = "/tmp/hyle-bench-manifest";
const hyléPath = join(testDir, "hyle.yaml");

// Setup
const testManifest = `
name: bench-test
author: bench
description: Benchmark test substrate
version: 0.1.0
models:
  primary:
    provider: anthropic
    model: claude-opus
    tags: [paid]
    fallback: []
  secondary:
    provider: anthropic
    model: claude-haiku
    tags: [paid]
    fallback: []
ontology: []
craft: []
identities: []
ethics: []
`;

try {
  rmSync(testDir, { recursive: true });
} catch {}
mkdirSync(testDir, { recursive: true });
writeFileSync(hyléPath, testManifest);

console.log("=== manifest loading benchmarks ===\n");

const iterations = 1000;
const yaml = readFileSync(hyléPath, "utf8");

// Track timing with manual measurement
console.time(`parseManifest x${iterations}`);
for (let i = 0; i < iterations; i++) {
  parseManifest(yaml);
}
console.timeEnd(`parseManifest x${iterations}`);

console.time(`validateManifest x${iterations}`);
for (let i = 0; i < iterations; i++) {
  const manifest = parseManifest(yaml);
  validateManifest(manifest);
}
console.timeEnd(`validateManifest x${iterations}`);

try {
  rmSync(testDir, { recursive: true });
} catch {}
