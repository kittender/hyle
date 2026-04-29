import { $ } from "bun";

const targets = [
  { target: "bun-linux-x64",   out: "dist/hyle-linux-x64" },
  { target: "bun-linux-arm64", out: "dist/hyle-linux-arm64" },
  { target: "bun-darwin-x64",  out: "dist/hyle-macos-x64" },
  { target: "bun-darwin-arm64",out: "dist/hyle-macos-arm64" },
  { target: "bun-windows-x64", out: "dist/hyle-windows-x64.exe" },
];

await $`mkdir -p dist`;

for (const { target, out } of targets) {
  console.log(`Building ${out}...`);
  await $`bun build src/index.ts --compile --target=${target} --outfile ${out}`;
}

console.log("All targets built.");
