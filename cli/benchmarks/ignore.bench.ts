import { IgnorePatterns } from "../src/ignore";
import { writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";

const testDir = "/tmp/hyle-bench-ignore";
const hyléignorePath = join(testDir, ".hyleignore");

const ignorePatterns = `
*.log
node_modules/
.git/
*.tmp
dist/
coverage/
.env
secrets/
*.key
*.pem
build/
out/
.DS_Store
*.swp
*.swo
`;

try {
  rmSync(testDir, { recursive: true });
} catch {}
mkdirSync(testDir, { recursive: true });
writeFileSync(hyléignorePath, ignorePatterns);

console.log("=== ignore pattern matching benchmarks ===\n");

const patterns = IgnorePatterns.loadFromPath(hyléignorePath);

const testPaths = [
  "file.js",
  "file.log",
  "node_modules/pkg/index.js",
  ".git/config",
  "src/main.ts",
  "src/main.tmp",
  "dist/bundle.js",
  "coverage/index.html",
  ".env",
  "secrets/api.key",
  "cert.pem",
];

const iterations = 10000;

console.time(`shouldIgnore - single file (log) x${iterations}`);
for (let i = 0; i < iterations; i++) {
  patterns.matches("file.log");
}
console.timeEnd(`shouldIgnore - single file (log) x${iterations}`);

console.time(`shouldIgnore - directory path x${iterations}`);
for (let i = 0; i < iterations; i++) {
  patterns.matches("node_modules/pkg/index.js");
}
console.timeEnd(`shouldIgnore - directory path x${iterations}`);

console.time(`shouldIgnore - safe path x${iterations}`);
for (let i = 0; i < iterations; i++) {
  patterns.matches("src/main.ts");
}
console.timeEnd(`shouldIgnore - safe path x${iterations}`);

console.time(`shouldIgnore - all test paths x${iterations}`);
for (let i = 0; i < iterations; i++) {
  testPaths.forEach((p) => patterns.matches(p));
}
console.timeEnd(`shouldIgnore - all test paths x${iterations}`);

try {
  rmSync(testDir, { recursive: true });
} catch {}
