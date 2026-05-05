import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { checkInstalled, resolveInstallCommand } from "../deps";
import type { DepEntry } from "../manifest";
import { parseManifest } from "../manifest";

export async function runDepsCheck(name?: string): Promise<void> {
	const cwd = process.cwd();
	const manifestPath = join(cwd, "hyle.yaml");

	if (!existsSync(manifestPath)) {
		console.error("✗ hyle.yaml not found. Run 'hyle init' first.");
		process.exit(1);
	}

	const yaml = readFileSync(manifestPath, "utf8");
	const manifest = parseManifest(yaml);

	const deps = manifest.dependencies || [];
	if (deps.length === 0) {
		console.log("No dependencies defined in hyle.yaml");
		return;
	}

	let filtered = deps;
	if (name) {
		filtered = deps.filter((d) => d.name === name);
		if (filtered.length === 0) {
			console.error(`✗ Dependency "${name}" not found in hyle.yaml`);
			process.exit(1);
		}
	}

	const os = getOS();
	let allInstalled = true;

	for (const dep of filtered) {
		const installed = await checkInstalled(dep.name, dep.version);

		if (installed) {
			console.log(`✓ ${dep.name}`);
		} else {
			allInstalled = false;
			const installCmd = await resolveInstallCommand(dep, os);
			if (installCmd) {
				console.log(`✗ ${dep.name} — install: ${installCmd}`);
			} else {
				console.log(`✗ ${dep.name} — no install method available for ${os}`);
			}
		}
	}

	if (!allInstalled && !name) {
		process.exit(1);
	}
}

function getOS(): "macos" | "linux" | "windows" {
	const platform = process.platform;
	if (platform === "darwin") return "macos";
	if (platform === "linux") return "linux";
	if (platform === "win32") return "windows";
	return "linux";
}
