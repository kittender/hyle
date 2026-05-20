import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { confirm, intro, outro } from "@clack/prompts";
import * as tar from "tar";
import { loadConfig } from "../config";
import { checkInstalled } from "../deps";
import { computeFileChecksums, upsertLockEntry } from "../lock";
import type { DepEntry } from "../manifest";
import { parseSubstrateRef } from "../manifest";
import { HttpRegistryClient } from "../registry";

export interface PullOptions {
	dryRun?: boolean;
	force?: boolean;
	offline?: boolean;
	yes?: boolean;
}

export async function runPull(name: string, opts: PullOptions): Promise<void> {
	if (process.stdin.isTTY !== false) {
		intro("hyle pull");
	}

	try {
		if (opts.offline) {
			console.error("Cannot pull offline");
			process.exit(1);
		}

		const cwd = process.cwd();
		const config = loadConfig(cwd);
		const registryUrl = config.remote_url as string;

		const [author, substrName, version] = parsePullName(name);

		const registryClient = new HttpRegistryClient(registryUrl);

		if (process.stdin.isTTY !== false) {
			console.log(`Fetching ${author}/${substrName}...`);
		}

		const substrate = version
			? await registryClient.fetchVersion(author, substrName, version)
			: await registryClient.fetchLatest(author, substrName);

		if (process.stdin.isTTY !== false) {
			console.log(`Found version ${substrate.version}`);
			if (substrate.description) {
				console.log(`${substrate.description}`);
			}
		}

		const bundleData = await registryClient.fetchBundle(
			author,
			substrName,
			version,
		);

		const computedChecksum = createHash("sha256")
			.update(bundleData)
			.digest("hex");
		if (computedChecksum !== substrate.checksum) {
			throw new Error(
				`Checksum mismatch: expected ${substrate.checksum}, got ${computedChecksum}`,
			);
		}

		if (opts.dryRun) {
			console.log(
				`Would extract ${substrate.version} (${bundleData.length} bytes)`,
			);
			if (substrate.manifest.extends) {
				console.log(`  extends: ${substrate.manifest.extends}`);
			}
			return;
		}

		if (!opts.yes && process.stdin.isTTY !== false) {
			const confirmed = await confirm({
				message: `Apply ${author}/${substrName}@${substrate.version} to current directory?`,
			});

			if (typeof confirmed !== "boolean" || !confirmed) {
				outro("Cancelled.");
				process.exit(0);
			}
		}

		// If extends: extract parent first, then child overwrites
		let extendsFrom: string | undefined;
		if (substrate.manifest.extends) {
			const [parentAuthor, parentName, parentVersion] = parseSubstrateRef(
				substrate.manifest.extends,
			);

			if (process.stdin.isTTY !== false) {
				console.log(
					`Fetching parent ${parentAuthor}/${parentName}${parentVersion ? `@${parentVersion}` : ""}...`,
				);
			}

			const parentSubstrate = parentVersion
				? await registryClient.fetchVersion(
						parentAuthor,
						parentName,
						parentVersion,
					)
				: await registryClient.fetchLatest(parentAuthor, parentName);

			if (parentSubstrate.manifest.extends) {
				throw new Error(
					`Inheritance depth exceeded: ${parentAuthor}/${parentName} also has extends (max depth: 2)`,
				);
			}

			const parentBundleData = await registryClient.fetchBundle(
				parentAuthor,
				parentName,
				parentVersion,
			);
			const parentChecksum = createHash("sha256")
				.update(parentBundleData)
				.digest("hex");
			if (parentChecksum !== parentSubstrate.checksum) {
				throw new Error(
					`Parent bundle checksum mismatch for ${parentAuthor}/${parentName}`,
				);
			}

			if (process.stdin.isTTY !== false) {
				console.log("Extracting parent...");
			}

			const parentTmpFile = join(cwd, ".hyle_parent_bundle.tar.gz");
			writeFileSync(parentTmpFile, parentBundleData);
			await tar.extract({ file: parentTmpFile, cwd, strict: true });
			try {
				require("node:fs").unlinkSync(parentTmpFile);
			} catch {
				/* ignore */
			}

			extendsFrom = `${parentAuthor}/${parentName}@${parentSubstrate.version}`;

			if (process.stdin.isTTY !== false) {
				console.log(`✓ Applied parent ${extendsFrom}`);
			}
		}

		if (process.stdin.isTTY !== false) {
			console.log("Extracting...");
		}

		const tmpFile = join(cwd, ".hyle_bundle.tar.gz");
		writeFileSync(tmpFile, bundleData);

		await tar.extract({
			file: tmpFile,
			cwd,
			unlink: !!opts.force,
			strict: true,
		});

		try {
			require("node:fs").unlinkSync(tmpFile);
		} catch {
			// ignore cleanup errors
		}

		if (process.stdin.isTTY !== false) {
			console.log(`✓ Extracted ${substrate.version}`);
		}

		// Write lock entry (files reflect merged state after parent+child extraction)
		const files = computeFileChecksums(cwd, substrate.manifest);
		upsertLockEntry(cwd, {
			name: substrName,
			author,
			version: substrate.version,
			bundle_checksum: computedChecksum,
			pulled_at: new Date().toISOString(),
			extends_from: extendsFrom,
			files,
		});

		if (process.stdin.isTTY !== false) {
			console.log("✓ hyle.lock updated");
		}

		const manifestData = substrate.manifest;
		if (manifestData.dependencies && manifestData.dependencies.length > 0) {
			const missingDeps = await checkMissingDeps(manifestData.dependencies);
			if (missingDeps.length > 0 && !opts.offline) {
				if (process.stdin.isTTY !== false) {
					console.log("\nMissing dependencies:");
					for (const dep of missingDeps) {
						console.log(`  - ${dep.name} (${dep.version})`);
					}
				}
			}
		}

		outro(`✓ Pull complete: ${author}/${substrName}@${substrate.version}`);
	} catch (e) {
		console.error(`✗ ${(e as Error).message}`);
		process.exit(1);
	}
}

function parsePullName(name: string): [string, string, string | undefined] {
	if (!name) {
		throw new Error(
			"Pull name required (format: author/name or author/name@version)",
		);
	}

	let version: string | undefined;
	let target = name;

	if (target.includes("@")) {
		const parts = target.split("@");
		target = parts[0];
		version = parts[1];
	}

	if (!target.includes("/")) {
		throw new Error(
			"Pull name must be in format author/name (with optional @version)",
		);
	}

	const [author, substrName] = target.split("/");

	if (!author || !substrName) {
		throw new Error("Pull name must be in format author/name");
	}

	return [author, substrName, version];
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
