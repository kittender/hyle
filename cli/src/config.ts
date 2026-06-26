import { existsSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { load } from "js-yaml";

export interface HyleConfig {
	remote_url: string;
	[key: string]: unknown;
}

// Default to a local registry so `docker compose up` + CLI works out of the box.
// Point at a remote registry by setting remote_url in .hyle or HYLE_REGISTRY_URL.
const DEFAULTS: HyleConfig = {
	remote_url: "http://localhost:3000",
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

	// Env override (CI, scripts, multi-env workflows).
	if (process.env.HYLE_REGISTRY_URL) {
		merged.remote_url = process.env.HYLE_REGISTRY_URL;
	}

	validateRemoteUrl(merged.remote_url);
	return merged;
}

function isLoopback(hostname: string): boolean {
	return (
		hostname === "localhost" ||
		hostname === "127.0.0.1" ||
		hostname === "::1" ||
		hostname === "0.0.0.0"
	);
}

function validateRemoteUrl(url: string): void {
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		throw new Error(
			`Invalid remote_url in .hyle config: "${url}" is not a valid URL`,
		);
	}

	const allowInsecure = process.env.HYLE_ALLOW_INSECURE === "1";
	const loopback = isLoopback(parsed.hostname);

	// Loopback over http is always fine — that's the local-test path.
	// Non-loopback must use https unless explicitly overridden.
	if (parsed.protocol !== "https:" && !loopback && !allowInsecure) {
		throw new Error(
			`Invalid remote_url in .hyle config: must use https for non-local hosts ` +
				`(got "${parsed.protocol}//${parsed.hostname}"). ` +
				`Set HYLE_ALLOW_INSECURE=1 to override.`,
		);
	}
}
