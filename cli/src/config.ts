import { readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { load } from "js-yaml";

export interface HyleConfig {
  remote_url: string;
  [key: string]: unknown;
}

const DEFAULTS: HyleConfig = {
  remote_url: "https://registry.hyle.eu",
};

export function loadConfig(cwd = process.cwd()): HyleConfig {
  const sources = [join(homedir(), ".hyle"), join(cwd, ".hyle")];
  let merged: HyleConfig = { ...DEFAULTS };
  for (const src of sources) {
    if (!existsSync(src) || !statSync(src).isFile()) continue;
    const raw = load(readFileSync(src, "utf8"));
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      merged = { ...merged, ...(raw as object) };
    }
  }
  validateRemoteUrl(merged.remote_url);
  return merged;
}

function validateRemoteUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid remote_url in .hyle config: "${url}" is not a valid URL`);
  }
  if (parsed.protocol !== "https:") {
    throw new Error(`Invalid remote_url in .hyle config: must use https (got "${parsed.protocol}")`);
  }
  if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
    throw new Error(`Invalid remote_url in .hyle config: localhost not allowed`);
  }
}
