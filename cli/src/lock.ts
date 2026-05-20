import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as yaml from "js-yaml";
import type { HyleManifest } from "./manifest";

export interface FileChecksum {
  path: string;
  checksum: string;
}

export interface LockEntry {
  name: string;
  author: string;
  version: string;
  bundle_checksum: string;
  pulled_at: string;
  files: FileChecksum[];
}

const LOCK_FILE = "hyle.lock";

export function readLock(cwd: string): LockEntry[] {
  const lockPath = join(cwd, LOCK_FILE);
  if (!existsSync(lockPath)) {
    return [];
  }

  try {
    const content = readFileSync(lockPath, "utf-8");
    const data = yaml.load(content);
    if (!Array.isArray(data)) {
      return [];
    }
    return data as LockEntry[];
  } catch {
    return [];
  }
}

export function writeLock(cwd: string, entries: LockEntry[]): void {
  const lockPath = join(cwd, LOCK_FILE);
  const content = yaml.dump(entries, { lineWidth: 120 });
  writeFileSync(lockPath, content, "utf-8");
}

export function upsertLockEntry(cwd: string, entry: LockEntry): void {
  const entries = readLock(cwd);
  const index = entries.findIndex((e) => e.author === entry.author && e.name === entry.name);

  if (index >= 0) {
    entries[index] = entry;
  } else {
    entries.push(entry);
  }

  writeLock(cwd, entries);
}

export function computeFileChecksums(
  cwd: string,
  manifest: HyleManifest,
): FileChecksum[] {
  const checksums: FileChecksum[] = [];

  // Gather all file paths from manifest
  const filePaths = new Set<string>();
  for (const path of manifest.ontology ?? []) {
    filePaths.add(path);
  }
  for (const path of manifest.craft ?? []) {
    filePaths.add(path);
  }
  for (const path of manifest.identities ?? []) {
    filePaths.add(path);
  }
  for (const path of manifest.ethics ?? []) {
    filePaths.add(path);
  }

  // Compute checksums
  for (const filePath of filePaths) {
    try {
      const fullPath = join(cwd, filePath);
      const content = readFileSync(fullPath);
      const checksum = createHash("sha256").update(content).digest("hex");
      checksums.push({ path: filePath, checksum });
    } catch {
      // Skip files that don't exist (may have been filtered during extraction)
    }
  }

  return checksums;
}
