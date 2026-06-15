import { createHash } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { confirm, intro, outro } from "@clack/prompts";
import * as tar from "tar";
import { loadConfig } from "../config";
import { checkInstalled } from "../deps";
import { computeFileChecksums, upsertLockEntry, type ExtendsEntry } from "../lock";
import type { DepEntry, HyleManifest } from "../manifest";
import { parseSubstrateRef, mergeManifests } from "../manifest";
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
			if (substrate.manifest.extends && substrate.manifest.extends.length > 0) {
				console.log(`  extends: ${substrate.manifest.extends.join(", ")}`);
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

		// Pre-fetch and validate all extends chain (detect cycles, verify checksums)
		const extendsFromArray: ExtendsEntry[] = [];
		const parentManifests: HyleManifest[] = [];
		const parentBundles: Map<string, Buffer> = new Map();

		if (substrate.manifest.extends && substrate.manifest.extends.length > 0) {
			// Cycle detection: track visited (author, name) to detect circular deps
			const visited = new Set<string>();
			visited.add(`${author}/${substrName}`);

			for (const extRef of substrate.manifest.extends) {
				const [parentAuthor, parentName, parentVersion] = parseSubstrateRef(
					extRef,
				);

				// Cycle check
				const parentKey = `${parentAuthor}/${parentName}`;
				if (visited.has(parentKey)) {
					throw new Error(
						`Circular extends detected: ${author}/${substrName} extends ${parentKey} which extends back to chain`,
					);
				}
				visited.add(parentKey);

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

				if (parentSubstrate.manifest.extends && parentSubstrate.manifest.extends.length > 0) {
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

				extendsFromArray.push({
					author: parentAuthor,
					name: parentName,
					version: parentSubstrate.version,
				});
				parentManifests.push(parentSubstrate.manifest);
				parentBundles.set(parentKey, parentBundleData);
			}

			// Conflict detection: check for file overlaps before extraction
			const filesByParent = new Map<string, Set<string>>();
			for (const [parentKey, bundleData] of parentBundles.entries()) {
				const parentTmpFile = join(cwd, `.hyle_check_${parentKey.replace("/", "_")}.tar.gz`);
				writeFileSync(parentTmpFile, bundleData);

				const filesInBundle = new Set<string>();
				await tar.list({
					file: parentTmpFile,
					onentry: (entry) => {
						if (entry.type === "File") {
							filesInBundle.add(entry.name);
						}
					},
				});

				filesByParent.set(parentKey, filesInBundle);

				try {
					require("node:fs").unlinkSync(parentTmpFile);
				} catch {
					/* ignore */
				}
			}

			// Report overlaps
			const allParentFiles = new Set<string>();
			const childBundleFiles = new Set<string>();

			// Get child files
			{
				const childTmpFile = join(cwd, ".hyle_child_check.tar.gz");
				writeFileSync(childTmpFile, bundleData);

				await tar.list({
					file: childTmpFile,
					onentry: (entry) => {
						if (entry.type === "File") {
							childBundleFiles.add(entry.name);
						}
					},
				});

				try {
					require("node:fs").unlinkSync(childTmpFile);
				} catch {
					/* ignore */
				}
			}

			for (const [parentKey, parentFiles] of filesByParent.entries()) {
				const overlaps = new Set<string>();

				// Check overlaps with other parents
				for (const [otherKey, otherFiles] of filesByParent.entries()) {
					if (parentKey !== otherKey) {
						for (const file of parentFiles) {
							if (otherFiles.has(file)) {
								overlaps.add(file);
							}
						}
					}
				}

				// Check overlaps with child
				for (const file of parentFiles) {
					if (childBundleFiles.has(file)) {
						overlaps.add(file);
					}
				}

				if (overlaps.size > 0) {
					if (process.stdin.isTTY !== false) {
						console.log(
							`⚠ File overlap in ${parentKey}: ${Array.from(overlaps).slice(0, 3).join(", ")}${overlaps.size > 3 ? ` (+${overlaps.size - 3} more)` : ""}`,
						);
						console.log(
							`  Child or other parents will overwrite these files. Set --force to proceed.`,
						);
					}
				}

				if (overlaps.size > 0 && !opts.force) {
					throw new Error(
						`File conflicts detected in inheritance chain. Use --force to overwrite.`,
					);
				}

				parentFiles.forEach((f) => allParentFiles.add(f));
			}

			// Extract all parents first, then child (last-write-wins after merge)
			if (process.stdin.isTTY !== false) {
				console.log("Extracting parents...");
			}

			for (const [parentKey, bundleData] of parentBundles.entries()) {
				const parentTmpFile = join(cwd, `.hyle_parent_${parentKey.replace("/", "_")}.tar.gz`);
				writeFileSync(parentTmpFile, bundleData);
				await tar.extract({ file: parentTmpFile, cwd, strict: true });
				try {
					require("node:fs").unlinkSync(parentTmpFile);
				} catch {
					/* ignore */
				}

				if (process.stdin.isTTY !== false) {
					console.log(`✓ Extracted parent ${parentKey}`);
				}
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

		// Merge manifests using child's merge_policy
		const mergedManifest =
			parentManifests.length > 0
				? mergeManifests(parentManifests, substrate.manifest)
				: substrate.manifest;

		// Write lock entry (files reflect merged state after parent+child extraction)
		const files = computeFileChecksums(cwd, mergedManifest);
		upsertLockEntry(cwd, {
			name: substrName,
			author,
			version: substrate.version,
			bundle_checksum: computedChecksum,
			pulled_at: new Date().toISOString(),
			extends_from: extendsFromArray.length > 0 ? extendsFromArray : undefined,
			merged_manifest: mergedManifest,
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
