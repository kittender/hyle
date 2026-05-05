import { spawnSync } from "child_process";
import { readdirSync } from "fs";
import { join } from "path";

const benchDir = join(import.meta.dir, "..", "benchmarks");
const benchFiles = readdirSync(benchDir)
  .filter((f) => f.endsWith(".bench.ts"))
  .sort();

if (benchFiles.length === 0) {
  console.log("No benchmark files found.");
  process.exit(0);
}

console.log(`Found ${benchFiles.length} benchmark(s):\n`);

let failed = false;

for (const file of benchFiles) {
  const filePath = join(benchDir, file);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Running: ${file}`);
  console.log(`${"=".repeat(60)}\n`);

  const result = spawnSync("bun", ["run", filePath], {
    stdio: "inherit",
  });

  if (result.status !== 0) {
    failed = true;
    console.error(`\n❌ ${file} failed with exit code ${result.status}`);
  } else {
    console.log(`\n✓ ${file} completed`);
  }
}

console.log(`\n${"=".repeat(60)}`);
if (failed) {
  console.error("Some benchmarks failed.");
  process.exit(1);
} else {
  console.log("All benchmarks completed.");
  process.exit(0);
}
