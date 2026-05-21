import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { confirm, intro, outro } from "@clack/prompts";
import { gt } from "semver";
import * as tar from "tar";
import { loadConfig } from "../config";
import { checkInstalled } from "../deps";
import { computeFileChecksums, readLock, upsertLockEntry } from "../lock";
import type { DepEntry } from "../manifest";
import { HttpRegistryClient } from "../registry";

export interface UpgradeOptions {
	yes?: boolean;
	offline?: boolean;
}

export async function runUpgrade(
	name: string | undefined,
	opts: UpgradeOptions,
): Promise<void> {
	if (process.stdin.isTTY !== false) {
		intro("hyle upgrade");
	}

	try {
		if (opts.offline) {
			console.error("Cannot upgrade offline");
			process.exit(1);
		}

		const cwd = process.cwd();
		const entries = readLock(cwd);

		if (entries.length === 0) {
			console.log("No substrates found in hyle.lock. Run 'hyle pull' first.");
			process.exit(0);
		}

		const config = loadConfig(cwd);
		const registryUrl = config.remote_url as string;
		const registryClient = new HttpRegistryClient(registryUrl);

		// Filter entries if name provided
		let toUpgrade = entries;
		if (name) {
			toUpgrade = entries.filter((e) => e.name === name);
			if (toUpgrade.length === 0) {
				console.log(`No substrate named '${name}' found in hyle.lock.`);
				process.exit(0);
			}
		}

		let upgraded = 0;
		let skipped = 0;

		for (const entry of toUpgrade) {
			try {
				const latest = await registryClient.fetchLatest(
					entry.author,
					entry.name,
				);

				if (!gt(latest.version, entry.version)) {
					if (process.stdin.isTTY !== false) {
						console.log(
							`⊘ ${entry.author}/${entry.name}: already up-to-date (${entry.version})`,
						);
					}
					skipped++;
					continue;
				}

				if (process.stdin.isTTY !== false) {
					console.log(
						`\n⬆️ ${entry.author}/${entry.name}: ${entry.version} → ${latest.version}`,
					);
				}

				if (!opts.yes && process.stdin.isTTY !== false) {
					const confirmed = await confirm({
						message: `Upgrade to ${latest.version}?`,
					});

					if (typeof confirmed !== "boolean" || !confirmed) {
						skipped++;
						continue;
					}
				}

				// Download and verify bundle
				if (process.stdin.isTTY !== false) {
					console.log("Downloading...");
				}

				const bundleData = await registryClient.fetchBundle(
					entry.author,
					entry.name,
					latest.version,
				);

				const computedChecksum = createHash("sha256")
					.update(bundleData)
					.digest("hex");
				if (computedChecksum !== latest.checksum) {
					throw new Error(
						`Checksum mismatch: expected ${latest.checksum}, got ${computedChecksum}`,
					);
				}

				// Extract
				if (process.stdin.isTTY !== false) {
					console.log("Extracting...");
				}

				const tmpFile = join(cwd, ".hyle_bundle.tar.gz");
				writeFileSync(tmpFile, bundleData);

				await tar.extract({
					file: tmpFile,
					cwd,
					unlink: true,
					strict: true,
				});

				try {
					require("node:fs").unlinkSync(tmpFile);
				} catch {
					// ignore cleanup errors
				}

				// Update lock entry
				const files = computeFileChecksums(cwd, latest.manifest);
				upsertLockEntry(cwd, {
					name: entry.name,
					author: entry.author,
					version: latest.version,
					bundle_checksum: computedChecksum,
					pulled_at: new Date().toISOString(),
					files,
				});

				// Check dependencies
				if (
					latest.manifest.dependencies &&
					latest.manifest.dependencies.length > 0
				) {
					const missingDeps = await checkMissingDeps(
						latest.manifest.dependencies,
					);
					if (missingDeps.length > 0) {
						if (process.stdin.isTTY !== false) {
							console.log("\nMissing dependencies:");
							for (const dep of missingDeps) {
								console.log(`  - ${dep.name} (${dep.version})`);
							}
						}
					}
				}

				if (process.stdin.isTTY !== false) {
					console.log(`✓ Upgraded to ${latest.version}`);
				}

				upgraded++;
			} catch (e) {
				console.error(
					`✗ ${entry.author}/${entry.name}: ${(e as Error).message}`,
				);
			}
		}

		if (process.stdin.isTTY !== false) {
			outro(`Upgraded ${upgraded}, skipped ${skipped}.`);
		}

		process.exit(upgraded === 0 && skipped === 0 ? 1 : 0);
	} catch (e) {
		console.error(`✗ ${(e as Error).message}`);
		process.exit(1);
	}
}

async function checkMissingDeps(deps: DepEntry[]): Promise<DepEntry[]> {
	const missing: DepEntry[] = [];

	for (const dep of deps) {
		const isInstalled = await checkInstalled(dep.name, dep.version);
		if (!isInstalled) {
			missing.push(dep);
		}
	}

	return missing;
}
