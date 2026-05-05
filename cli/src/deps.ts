import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { DepEntry, InstallMethod } from "./manifest";

type OS = "macos" | "linux" | "windows";

interface DepCacheEntry {
	cmd: string;
	verified: boolean;
	ts: number;
}

interface DepCache {
	[key: string]: DepCacheEntry;
}

function getOS(): OS {
	const platform = process.platform;
	if (platform === "darwin") return "macos";
	if (platform === "linux") return "linux";
	if (platform === "win32") return "windows";
	throw new Error(`Unsupported platform: ${platform}`);
}

function getDepCachePath(): string {
	return join(homedir(), ".hyle", "dep-cache.json");
}

function loadDepCache(): DepCache {
	const cachePath = getDepCachePath();
	if (!existsSync(cachePath)) return {};

	try {
		return JSON.parse(readFileSync(cachePath, "utf8"));
	} catch {
		return {};
	}
}

function saveDepCache(cache: DepCache): void {
	const cachePath = getDepCachePath();
	const dir = cachePath.substring(0, cachePath.lastIndexOf("/"));
	if (!existsSync(dir)) {
		try {
			require("node:fs").mkdirSync(dir, { recursive: true });
		} catch {
			// ignore
		}
	}
	writeFileSync(cachePath, JSON.stringify(cache, null, 2));
}

function getCacheKey(url: string, os: OS): string {
	return `${url}@${os}`;
}

export async function checkInstalled(
	name: string,
	versionConstraint: string,
): Promise<boolean> {
	try {
		execSync(`which ${name}`, { stdio: "ignore" });
		return true;
	} catch {
		return false;
	}
}

export async function resolveInstallCommand(
	dep: DepEntry,
	os: OS,
	_fetcher?: (url: string) => Promise<Response>,
): Promise<string | null> {
	const cacheKey = getCacheKey(dep.url, os);

	const cache = loadDepCache();
	if (cache[cacheKey]) {
		return cache[cacheKey].cmd;
	}

	if (dep.install?.[os]) {
		const method = dep.install[os];
		if (method && typeof method === "object" && "manager" in method) {
			const installMethod = method as InstallMethod;
			if (installMethod.manager === "brew") {
				return `brew install ${installMethod.pkg}`;
			}
			if (installMethod.manager === "apt") {
				return `sudo apt-get install ${installMethod.pkg}`;
			}
			if (installMethod.manager === "winget") {
				return `winget install ${installMethod.pkg}`;
			}
			if (installMethod.manager === "npm") {
				return `npm install -g ${installMethod.pkg}`;
			}
		}
	}

	return null;
}

export async function runDepInstall(cmd: string): Promise<boolean> {
	try {
		execSync(cmd, { stdio: "inherit" });
		return true;
	} catch {
		return false;
	}
}

export async function checkDeps(
	deps: DepEntry[] | undefined,
	verbose = false,
): Promise<boolean> {
	if (!deps || deps.length === 0) return true;

	let allMissing = false;

	for (const dep of deps) {
		const installed = await checkInstalled(dep.name, dep.version);
		if (installed) {
			if (verbose) console.log(`✓ ${dep.name} installed`);
		} else {
			console.log(`✗ ${dep.name} missing (required: ${dep.version})`);
			allMissing = true;
		}
	}

	return !allMissing;
}
