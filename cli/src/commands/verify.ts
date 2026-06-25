import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { intro, outro } from "@clack/prompts";
import { gt } from "semver";
import { loadConfig } from "../config";
import { readLock } from "../lock";
import { HttpRegistryClient } from "../registry";

export interface VerifyOptions {
	registry?: boolean;
	json?: boolean;
	offline?: boolean;
}

interface VerifyResult {
	entry: string;
	files: Array<{
		path: string;
		ok: boolean;
		expected?: string;
		actual?: string;
	}>;
	versionStatus?: "up-to-date" | "outdated" | "unreachable";
}

export async function runVerify(opts: VerifyOptions): Promise<void> {
	if (process.stdin.isTTY !== false) {
		intro("hyle verify");
	}

	let exitCode = 0;

	try {
		const cwd = process.cwd();
		const entries = readLock(cwd);

		if (entries.length === 0) {
			console.error("No hyle.lock found. Run 'hyle pull' first.");
			process.exit(1);
		}

		const results: VerifyResult[] = [];
		let anyCheckfailure = false;
		let anyOutdated = false;

		const config = loadConfig(cwd);
		const registryUrl = config.remote_url as string;
		let registryClient: HttpRegistryClient | null = null;

		if (opts.registry && !opts.offline) {
			registryClient = new HttpRegistryClient(registryUrl);
		}

		for (const entry of entries) {
			const entryKey = `${entry.author}/${entry.name}@${entry.version}`;
			const fileChecks: VerifyResult["files"] = [];

			// Check local files
			for (const fileEntry of entry.files) {
				try {
					const fullPath = join(cwd, fileEntry.path);
					if (!existsSync(fullPath)) {
						fileChecks.push({
							path: fileEntry.path,
							ok: false,
							expected: fileEntry.checksum,
							actual: "NOT_FOUND",
						});
						anyCheckfailure = true;
						continue;
					}

					const content = readFileSync(fullPath);
					const actual = createHash("sha256").update(content).digest("hex");
					const ok = actual === fileEntry.checksum;

					fileChecks.push({
						path: fileEntry.path,
						ok,
						expected: fileEntry.checksum,
						actual: ok ? undefined : actual,
					});

					if (!ok) {
						anyCheckfailure = true;
					}
				} catch (e) {
					fileChecks.push({
						path: fileEntry.path,
						ok: false,
						expected: fileEntry.checksum,
						actual: `ERROR: ${(e as Error).message}`,
					});
					anyCheckfailure = true;
				}
			}

			// Check registry version if requested
			let versionStatus: "up-to-date" | "outdated" | "unreachable" | undefined;

			if (opts.registry && registryClient) {
				try {
					const latest = await registryClient.fetchLatest(
						entry.author,
						entry.name,
					);
					if (gt(latest.version, entry.version)) {
						versionStatus = "outdated";
						anyOutdated = true;
					} else {
						versionStatus = "up-to-date";
					}
				} catch {
					versionStatus = "unreachable";
					exitCode = Math.max(exitCode, 2);
				}
			}

			results.push({
				entry: entryKey,
				files: fileChecks,
				versionStatus,
			});
		}

		if (opts.json) {
			console.log(JSON.stringify(results, null, 2));
		} else {
			// Print human-readable output
			for (const result of results) {
				const allFilesOk = result.files.every((f) => f.ok);
				const marker = allFilesOk ? "✓" : "✗";
				console.log(`${marker} ${result.entry}`);

				if (!allFilesOk) {
					for (const file of result.files) {
						if (!file.ok) {
							console.log(`  ✗ ${file.path}`);
							if (file.actual && file.actual !== "NOT_FOUND") {
								console.log(
									`    Expected: ${file.expected?.substring(0, 8)}...`,
								);
								console.log(`    Actual:   ${file.actual.substring(0, 8)}...`);
							}
						}
					}
				}

				if (result.versionStatus) {
					if (result.versionStatus === "outdated") {
						console.log(
							`  ⬆️ Version is outdated (use 'hyle upgrade' to update)`,
						);
					} else if (result.versionStatus === "unreachable") {
						console.log("  ⚠️ Could not check version on registry");
					}
				}
			}
		}

		if (anyCheckfailure) {
			exitCode = Math.max(exitCode, 1);
		}
		if (opts.registry && anyOutdated && exitCode !== 1) {
			exitCode = 3;
		}

		if (process.stdin.isTTY !== false) {
			if (exitCode === 0) {
				outro("✓ All blueprints verified successfully.");
			} else if (exitCode === 1) {
				outro("✗ Checksum mismatch detected.");
			} else if (exitCode === 3) {
				outro("⬆️ Blueprints are outdated on registry.");
			} else {
				outro("✗ Verification failed.");
			}
		}

		process.exit(exitCode);
	} catch (e) {
		console.error(`✗ ${(e as Error).message}`);
		process.exit(1);
	}
}
