import { createHash } from "node:crypto";
import { createReadStream, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createGzip } from "node:zlib";
import * as tar from "tar";
import * as semver from "semver";
import { dump } from "js-yaml";
import { intro, outro, cancel, confirm } from "@clack/prompts";
import type { HyleManifest } from "../manifest";
import { loadManifest, validateManifest } from "../manifest";
import { loadConfig } from "../config";
import { IgnorePatterns } from "../ignore";
import { HttpRegistryClient } from "../registry";

type PublishType = "snapshot" | "push" | "release";

export interface PublishOptions {
  dryRun?: boolean;
  offline?: boolean;
  version?: string;
  yes?: boolean;
}

export async function runPublish(type: PublishType, opts: PublishOptions): Promise<void> {
  if (process.stdin.isTTY !== false) {
    intro(`hyle ${type}`);
  }

  try {
    const cwd = process.cwd();
    const manifestPath = join(cwd, "hyle.yaml");

    const manifest = await loadManifest(manifestPath);
    const config = loadConfig(cwd);

    const newVersion = computeNewVersion(manifest.version, type, opts.version);

    if (!opts.dryRun && !opts.yes && process.stdin.isTTY !== false) {
      const confirmed = await confirm({
        message: `Publish ${manifest.author}/${manifest.name} as version ${newVersion}?`,
      });

      if (typeof confirmed !== "boolean" || !confirmed) {
        outro("Cancelled.");
        process.exit(0);
      }
    }

    if (opts.dryRun) {
      console.log(`Would publish: ${manifest.author}/${manifest.name}@${newVersion}`);
      console.log(`Manifest version: ${manifest.version} → ${newVersion}`);
      return;
    }

    if (opts.offline) {
      console.error("Cannot publish offline");
      process.exit(1);
    }

    const ignorePatterns = await IgnorePatterns.loadFromPath(join(cwd, ".hyleignore"));

    const filesToInclude = collectFilesForBundle(manifest, cwd, ignorePatterns);

    const bundleBuffer = await createBundle(cwd, filesToInclude, manifest);

    const checksum = createHash("sha256").update(bundleBuffer).digest("hex");

    const updatedManifest = { ...manifest, version: newVersion };

    const isStable = !newVersion.includes("-snapshot");

    if (process.stdin.isTTY !== false) {
      console.log(`Bundle size: ${Math.round(bundleBuffer.length / 1024)} KB`);
      console.log(`Checksum: ${checksum}`);
    }

    const registryUrl = config.remote_url as string;
    const authToken = config.auth_token as string | undefined;

    const client = new HttpRegistryClient(registryUrl, authToken);

    if (process.stdin.isTTY !== false) {
      console.log(`Uploading to registry...`);
    }

    const result = await client.publish(bundleBuffer, updatedManifest, isStable);

    writeFileSync(manifestPath, dump(updatedManifest, { lineWidth: 80 }));

    outro(
      `✓ Published ${manifest.author}/${manifest.name}@${newVersion}\n  Registry: ${registryUrl}`
    );
  } catch (e) {
    console.error(`✗ ${(e as Error).message}`);
    process.exit(1);
  }
}

function computeNewVersion(current: string, type: PublishType, override?: string): string {
  if (override) {
    return override;
  }

  const cleaned = current.replace(/-snapshot$/, "");

  switch (type) {
    case "snapshot":
      const patchBumped = semver.inc(cleaned, "patch");
      if (!patchBumped) throw new Error("Failed to bump version");
      return `${patchBumped}-snapshot`;

    case "push":
      const minorBumped = semver.inc(cleaned, "minor");
      if (!minorBumped) throw new Error("Failed to bump version");
      return minorBumped;

    case "release":
      const majorBumped = semver.inc(cleaned, "major");
      if (!majorBumped) throw new Error("Failed to bump version");
      return majorBumped;

    default:
      throw new Error(`Unknown publish type: ${type}`);
  }
}

function collectFilesForBundle(
  manifest: HyleManifest,
  cwd: string,
  ignorePatterns: IgnorePatterns
): string[] {
  const files: Set<string> = new Set();

  for (const category of ["ontology", "craft", "identities", "ethics"] as const) {
    const paths = manifest[category];
    if (paths) {
      for (const p of paths) {
        if (!ignorePatterns.matches(p)) {
          files.add(p);
        }
      }
    }
  }

  // Always include hyle.yaml
  files.add("hyle.yaml");

  return Array.from(files).sort();
}

async function createBundle(
  cwd: string,
  files: string[],
  manifest: HyleManifest
): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];

  const writable = {
    write(chunk: Uint8Array) {
      chunks.push(chunk);
    },
  };

  const gzip = createGzip();
  const tarStream = tar.create(
    {
      cwd,
      strict: true,
    },
    files
  );

  await new Promise((resolve, reject) => {
    tarStream
      .pipe(gzip)
      .on("data", (chunk: Uint8Array) => {
        chunks.push(chunk);
      })
      .on("end", resolve)
      .on("error", reject);
  });

  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const buffer = new Uint8Array(totalSize);
  let offset = 0;

  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }

  return buffer;
}
