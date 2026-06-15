import { relative, resolve } from "node:path";
import { load } from "js-yaml";
import * as semver from "semver";

// ---- Types ----

export interface Recommendations {
	universal?: string[];
	budget?: string[];
	offline?: string[];
	advanced?: string[];
	harness?: string[];
	[key: string]: string[] | undefined;
}

export interface Blueprint {
	ontology?: string[];
	craft?: string[];
	identities?: string[];
	ethics?: string[];
	overrides?: string[];
}

export type MergeStrategy = "replace" | "append" | "merge-by-name";

export interface MergePolicy {
	dependencies?: MergeStrategy;
	recommendations?: MergeStrategy;
	blueprint?: {
		ontology?: MergeStrategy;
		craft?: MergeStrategy;
		identities?: MergeStrategy;
		ethics?: MergeStrategy;
		overrides?: MergeStrategy;
	};
}

export type InstallMethod =
	| { manager: "brew"; pkg: string }
	| { manager: "apt"; pkg: string }
	| { manager: "winget"; pkg: string }
	| { manager: "choco"; pkg: string }
	| { manager: "cargo"; pkg: string }
	| { manager: "npm"; pkg: string; global: true }
	| { manager: "script"; url: string; sha256: string };

export interface DepEntry {
	name: string;
	version: string;
	url: string;
	install?: {
		macos?: InstallMethod;
		linux?: InstallMethod;
		windows?: InstallMethod;
	};
}

export interface HyleManifest {
	name: string;
	author: string;
	description?: string;
	version: string;
	tags?: string[];
	url?: string;
	license?: string;
	forks?: string[];
	extends?: string[];

	recommendations?: Recommendations;

	dependencies?: DepEntry[];

	blueprint?: Blueprint;

	merge_policy?: MergePolicy;
}

// ---- Errors ----

export interface ValidationError {
	field: string;
	message: string;
}

export interface ValidationWarning {
	field: string;
	message: string;
}

export interface ValidationResult {
	errors: ValidationError[];
	warnings: ValidationWarning[];
}

export class ManifestParseError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ManifestParseError";
	}
}

// ---- Parsing ----

export const SLUG_RE = /^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$/;

export function parseManifest(yaml: string): HyleManifest {
	let raw: unknown;
	try {
		raw = load(yaml);
	} catch (e) {
		throw new ManifestParseError(`YAML parse error: ${(e as Error).message}`);
	}

	if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
		throw new ManifestParseError("Manifest must be a YAML object");
	}

	const obj = raw as Record<string, unknown>;

	const name = coerceString(obj.name);
	if (!name) throw new ManifestParseError("Missing required field: name");

	const author = coerceString(obj.author);
	if (!author) throw new ManifestParseError("Missing required field: author");

	const version = coerceString(obj.version);
	if (!version) throw new ManifestParseError("Missing required field: version");

	const blueprint = parseBlueprint(obj.blueprint);
	const recommendations = parseRecommendations(obj.recommendations);
	const mergePolicy = parseMergePolicy(obj.merge_policy);
	const extendsRaw = obj.extends;
	let extendsArray: string[] | undefined;
	if (extendsRaw !== undefined) {
		if (typeof extendsRaw === "string") {
			extendsArray = [extendsRaw];
		} else if (Array.isArray(extendsRaw)) {
			extendsArray = extendsRaw.map((v) => {
				const s = coerceString(v);
				if (!s) throw new ManifestParseError("extends entries must be non-empty strings");
				return s;
			});
		} else {
			throw new ManifestParseError("extends must be a string or array of strings");
		}
	}

	return {
		name,
		author,
		version,
		description: coerceString(obj.description),
		tags: coerceStringArray(obj.tags),
		url: coerceString(obj.url),
		license: coerceString(obj.license),
		forks: coerceStringArray(obj.forks),
		extends: extendsArray,
		recommendations,
		dependencies: parseDeps(obj.dependencies),
		blueprint,
		merge_policy: mergePolicy,
	};
}

function parseBlueprint(raw: unknown): Blueprint | undefined {
	if (raw === undefined || raw === null) return undefined;
	if (typeof raw !== "object" || Array.isArray(raw)) {
		throw new ManifestParseError("blueprint must be an object");
	}
	const obj = raw as Record<string, unknown>;

	return {
		ontology: coerceStringArray(obj.ontology),
		craft: coerceStringArray(obj.craft),
		identities: coerceStringArray(obj.identities),
		ethics: coerceStringArray(obj.ethics),
		overrides: coerceStringArray(obj.overrides),
	};
}

function parseRecommendations(raw: unknown): Recommendations | undefined {
	if (raw === undefined || raw === null) return undefined;
	if (typeof raw !== "object" || Array.isArray(raw)) {
		throw new ManifestParseError("recommendations must be an object");
	}
	const obj = raw as Record<string, unknown>;

	const result: Recommendations = {};
	for (const [key, value] of Object.entries(obj)) {
		const arr = coerceStringArray(value);
		if (arr) {
			result[key] = arr;
		}
	}
	return Object.keys(result).length > 0 ? result : undefined;
}

function parseMergePolicy(raw: unknown): MergePolicy | undefined {
	if (raw === undefined || raw === null) return undefined;
	if (typeof raw !== "object" || Array.isArray(raw)) {
		throw new ManifestParseError("merge_policy must be an object");
	}
	const obj = raw as Record<string, unknown>;

	const validateStrategy = (s: unknown): MergeStrategy | undefined => {
		if (s === "replace" || s === "append" || s === "merge-by-name")
			return s;
		return undefined;
	};

	const policy: MergePolicy = {};

	if (obj.dependencies !== undefined) {
		const deps = validateStrategy(obj.dependencies);
		if (!deps)
			throw new ManifestParseError(
				'merge_policy.dependencies must be "replace", "append", or "merge-by-name"',
			);
		policy.dependencies = deps;
	}

	if (obj.recommendations !== undefined) {
		const recs = validateStrategy(obj.recommendations);
		if (!recs)
			throw new ManifestParseError(
				'merge_policy.recommendations must be "replace", "append", or "merge-by-name"',
			);
		policy.recommendations = recs;
	}

	if (obj.blueprint !== undefined) {
		if (typeof obj.blueprint !== "object" || Array.isArray(obj.blueprint)) {
			throw new ManifestParseError("merge_policy.blueprint must be an object");
		}
		const bp = obj.blueprint as Record<string, unknown>;
		policy.blueprint = {};

		for (const [key, value] of Object.entries(bp)) {
			const valid = validateStrategy(value);
			if (!valid)
				throw new ManifestParseError(
					`merge_policy.blueprint.${key} must be "replace", "append", or "merge-by-name"`,
				);
			(policy.blueprint as Record<string, MergeStrategy>)[key] = valid;
		}
	}

	return Object.keys(policy).length > 0 ? policy : undefined;
}

function parseInstallMethod(raw: unknown, path: string): InstallMethod {
	if (typeof raw === "string") {
		throw new ManifestParseError(
			`${path} must be a structured object ({ manager, pkg }) — raw shell strings are not allowed`,
		);
	}
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
		throw new ManifestParseError(
			`${path} must be an object with a "manager" field`,
		);
	}
	const obj = raw as Record<string, unknown>;
	const manager = coerceString(obj.manager);
	if (!manager) throw new ManifestParseError(`${path}.manager is required`);

	if (manager === "script") {
		const url = coerceString(obj.url);
		if (!url)
			throw new ManifestParseError(
				`${path}.url is required for manager "script"`,
			);
		const sha256 = coerceString(obj.sha256);
		if (!sha256) {
			throw new ManifestParseError(
				`${path}.sha256 is required for manager "script" (supply-chain safety — hash the installer before publishing)`,
			);
		}
		return { manager: "script", url, sha256 };
	}

	if (
		manager === "brew" ||
		manager === "apt" ||
		manager === "winget" ||
		manager === "choco" ||
		manager === "cargo"
	) {
		const pkg = coerceString(obj.pkg);
		if (!pkg) throw new ManifestParseError(`${path}.pkg is required`);
		return { manager, pkg };
	}

	if (manager === "npm") {
		const pkg = coerceString(obj.pkg);
		if (!pkg) throw new ManifestParseError(`${path}.pkg is required`);
		return { manager: "npm", pkg, global: true };
	}

	throw new ManifestParseError(
		`${path}.manager "${manager}" is not supported. Valid: brew, apt, winget, choco, cargo, npm, script`,
	);
}

function parseDeps(raw: unknown): DepEntry[] | undefined {
	if (raw === undefined || raw === null) return undefined;
	if (!Array.isArray(raw))
		throw new ManifestParseError("dependencies must be an array");

	return raw.map((entry, i) => {
		if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
			throw new ManifestParseError(`dependencies[${i}] must be an object`);
		}
		const obj = entry as Record<string, unknown>;

		const name = coerceString(obj.name);
		if (!name)
			throw new ManifestParseError(
				`Missing required field: dependencies[${i}].name`,
			);

		const version = coerceString(obj.version);
		if (!version)
			throw new ManifestParseError(
				`Missing required field: dependencies[${i}].version`,
			);

		const url = coerceString(obj.url);
		if (!url)
			throw new ManifestParseError(
				`Missing required field: dependencies[${i}].url`,
			);

		const dep: DepEntry = { name, version, url };

		if (obj.install !== undefined) {
			if (
				typeof obj.install !== "object" ||
				obj.install === null ||
				Array.isArray(obj.install)
			) {
				throw new ManifestParseError(
					`dependencies[${i}].install must be an object with macos/linux/windows keys`,
				);
			}
			const inst = obj.install as Record<string, unknown>;
			dep.install = {};
			if (inst.macos !== undefined) {
				dep.install.macos = parseInstallMethod(
					inst.macos,
					`dependencies[${i}].install.macos`,
				);
			}
			if (inst.linux !== undefined) {
				dep.install.linux = parseInstallMethod(
					inst.linux,
					`dependencies[${i}].install.linux`,
				);
			}
			if (inst.windows !== undefined) {
				dep.install.windows = parseInstallMethod(
					inst.windows,
					`dependencies[${i}].install.windows`,
				);
			}
		}

		return dep;
	});
}

// ---- Validation ----

export function validateManifest(m: HyleManifest): ValidationResult {
	const errors: ValidationError[] = [];
	const warnings: ValidationWarning[] = [];

	// name
	if (!SLUG_RE.test(m.name) || m.name.length > 64) {
		errors.push({
			field: "name",
			message:
				"Must be a URL-safe slug: lowercase alphanumeric and hyphens, max 64 chars",
		});
	}

	// author
	if (!SLUG_RE.test(m.author) || m.author.length > 64) {
		errors.push({
			field: "author",
			message:
				"Must be a URL-safe slug: lowercase alphanumeric and hyphens, max 64 chars",
		});
	}

	// version — x.y.z or x.y.z-snapshot (for snapshot builds)
	if (
		!/^\d+\.\d+\.\d+(-snapshot)?$/.test(m.version) ||
		!semver.valid(m.version)
	) {
		errors.push({
			field: "version",
			message: "Must be a valid semver string: x.y.z (or x.y.z-snapshot)",
		});
	}

	// description warning
	if (!m.description) {
		warnings.push({ field: "description", message: "Missing description" });
	}

	// extends
	if (m.extends !== undefined) {
		const extendsDepth = m.extends.length;
		if (extendsDepth > 2) {
			errors.push({
				field: "extends",
				message: `Max inheritance depth is 2 (you have ${extendsDepth})`,
			});
		}
		for (let i = 0; i < m.extends.length; i++) {
			const extRef = m.extends[i];
			const extendsErr = validateExtendsRef(extRef);
			if (extendsErr) {
				errors.push({ field: `extends[${i}]`, message: extendsErr });
			} else {
				const [extAuthor, extName] = parseSubstrateRef(extRef);
				if (extAuthor === m.author && extName === m.name) {
					errors.push({
						field: `extends[${i}]`,
						message: "Circular extends: substrate cannot extend itself",
					});
				}
			}
		}
	}

	// forks
	if (m.forks !== undefined) {
		for (let i = 0; i < m.forks.length; i++) {
			const forkRef = m.forks[i];
			const forkErr = validateExtendsRef(forkRef);
			if (forkErr) {
				errors.push({ field: `forks[${i}]`, message: forkErr });
			}
		}
	}

	// recommendations
	if (m.recommendations !== undefined) {
		validateRecommendations(m.recommendations, errors);
	}

	// dependencies
	if (m.dependencies) {
		for (let i = 0; i < m.dependencies.length; i++) {
			const dep = m.dependencies[i];
			const prefix = `dependencies[${i}]`;

			if (!dep.name) {
				errors.push({ field: `${prefix}.name`, message: "Required" });
			}

			if (!semver.validRange(dep.version)) {
				errors.push({
					field: `${prefix}.version`,
					message: "Must be a valid semver range",
				});
			}

			try {
				const parsed = new URL(dep.url);
				if (parsed.protocol === "http:") {
					warnings.push({
						field: `${prefix}.url`,
						message: "URL uses HTTP instead of HTTPS",
					});
				}
			} catch {
				errors.push({ field: `${prefix}.url`, message: "Must be a valid URL" });
			}

			if (dep.install) {
				for (const platform of ["macos", "linux", "windows"] as const) {
					if (dep.install[platform]?.manager === "script") {
						warnings.push({
							field: `${prefix}.install.${platform}`,
							message: `"script" install method requires manual review before executing`,
						});
					}
				}
			}
		}
	}

	// path arrays in blueprint
	if (m.blueprint) {
		for (const category of [
			"ontology",
			"craft",
			"identities",
			"ethics",
			"overrides",
		] as const) {
			const paths = m.blueprint[category];
			if (paths) {
				for (let i = 0; i < paths.length; i++) {
					if (isUnsafePath(paths[i])) {
						errors.push({
							field: `blueprint.${category}[${i}]`,
							message:
								"Must be a relative path (no absolute paths, no ../ traversal)",
						});
					}
				}
			}
		}
	}

	return { errors, warnings };
}

function validateRecommendations(
	recs: Recommendations,
	errors: ValidationError[],
): void {
	const modelPattern = /^[a-z0-9-]+\/[a-z0-9-:._@/]+$/i;

	for (const [category, models] of Object.entries(recs)) {
		if (!models) continue;
		for (let i = 0; i < models.length; i++) {
			const model = models[i];
			if (!modelPattern.test(model)) {
				errors.push({
					field: `recommendations.${category}[${i}]`,
					message: `Must be in format 'provider/model-id' (e.g., 'anthropic/claude-sonnet-4-6', 'ollama/qwen2.5:14b')`,
				});
			}
		}
	}
}


// ---- Manifest Merging ----

export function mergeManifests(
	parentManifests: HyleManifest[],
	childManifest: HyleManifest,
): HyleManifest {
	// Merge in order: parent1, parent2, ..., child (child wins on default strategy)
	const policy = childManifest.merge_policy || {};
	let merged: HyleManifest = { ...childManifest };

	// Start with all parents in order, then apply child
	const allManifests = [...parentManifests, childManifest];

	// Initialize collections
	let allDeps: DepEntry[] = [];
	let allRecs: Recommendations = {};
	let allBlueprint: Record<string, string[]> = {
		ontology: [],
		craft: [],
		identities: [],
		ethics: [],
		overrides: [],
	};

	// Collect all values in order
	for (const manifest of allManifests) {
		if (manifest.dependencies) allDeps.push(...manifest.dependencies);
		if (manifest.recommendations) allRecs = { ...allRecs, ...manifest.recommendations };
		if (manifest.blueprint) {
			for (const cat of ["ontology", "craft", "identities", "ethics", "overrides"] as const) {
				if (manifest.blueprint[cat]) {
					allBlueprint[cat].push(...manifest.blueprint[cat]);
				}
			}
		}
	}

	// Apply merge strategy
	const depStrategy = policy.dependencies || "replace";
	if (depStrategy === "append") {
		merged.dependencies = allDeps;
	} else if (depStrategy === "merge-by-name") {
		const depMap = new Map<string, DepEntry>();
		for (const dep of allDeps) {
			depMap.set(dep.name, dep);
		}
		merged.dependencies = Array.from(depMap.values());
	} else {
		// "replace" — child wins
		merged.dependencies = childManifest.dependencies;
	}

	const recStrategy = policy.recommendations || "replace";
	if (recStrategy === "append" || recStrategy === "merge-by-name") {
		merged.recommendations = allRecs;
	} else {
		// "replace" — child wins
		merged.recommendations = childManifest.recommendations;
	}

	// Blueprint paths
	const bpPolicy = policy.blueprint || {};
	merged.blueprint = merged.blueprint || {};
	for (const cat of ["ontology", "craft", "identities", "ethics", "overrides"] as const) {
		const catStrategy = bpPolicy[cat] || "replace";
		if (catStrategy === "append") {
			merged.blueprint[cat] = allBlueprint[cat];
		} else if (catStrategy === "merge-by-name") {
			merged.blueprint[cat] = Array.from(new Set(allBlueprint[cat]));
		} else {
			// "replace" — child wins
			merged.blueprint[cat] = childManifest.blueprint?.[cat];
		}
	}

	return merged;
}

function mergeRecommendations(
	parent: Recommendations,
	child: Recommendations | undefined,
): Recommendations {
	const result: Recommendations = { ...parent };
	if (!child) return result;

	for (const [key, values] of Object.entries(child)) {
		if (values) {
			result[key] = values;
		}
	}
	return result;
}

// ---- Helpers ----

function coerceString(v: unknown): string | undefined {
	if (typeof v === "string" && v.length > 0) return v;
	if (typeof v === "number" || typeof v === "boolean") return String(v);
	return undefined;
}

function coerceStringArray(v: unknown): string[] | undefined {
	if (!Array.isArray(v)) return undefined;
	return v.map((item) => String(item));
}

// Parses "author/name" or "author/name@version" → [author, name, version?]
export function parseSubstrateRef(
	ref: string,
): [string, string, string | undefined] {
	let version: string | undefined;
	let target = ref;

	if (target.includes("@")) {
		const at = target.lastIndexOf("@");
		version = target.slice(at + 1);
		target = target.slice(0, at);
	}

	const slash = target.indexOf("/");
	if (slash === -1) return ["", "", undefined];

	const author = target.slice(0, slash);
	const name = target.slice(slash + 1);
	return [author, name, version];
}

// Returns an error string if the ref is invalid, undefined if valid
export function validateExtendsRef(ref: string): string | undefined {
	const [author, name, version] = parseSubstrateRef(ref);

	if (!author || !name) {
		return "Must be in format 'author/name' or 'author/name@version'";
	}
	if (!SLUG_RE.test(author)) {
		return `Author part '${author}' must be a URL-safe slug (lowercase alphanumeric and hyphens)`;
	}
	if (!SLUG_RE.test(name)) {
		return `Name part '${name}' must be a URL-safe slug (lowercase alphanumeric and hyphens)`;
	}
	if (version !== undefined) {
		if (!semver.valid(version)) {
			return `Version '${version}' must be a valid semver string (x.y.z)`;
		}
	}
	return undefined;
}

function isUnsafePath(p: string, root = "."): boolean {
	if (!p || p.includes("\x00") || p.includes("\\") || p.startsWith("~"))
		return true;
	// Reject paths that start with .. or contain /.. or \..
	if (p.startsWith("..") || p.includes("/..") || p.includes("\\.."))
		return true;
	const resolvedRoot = resolve(root);
	const abs = resolve(resolvedRoot, p);
	const rel = relative(resolvedRoot, abs);
	return rel.startsWith("..") || abs === resolvedRoot;
}

export async function loadManifest(path: string): Promise<HyleManifest> {
	const { readFileSync } = await import("node:fs");
	const yaml = readFileSync(path, "utf8");
	const manifest = parseManifest(yaml);
	const validation = validateManifest(manifest);

	if (validation.errors.length > 0) {
		const errors = validation.errors
			.map((e) => `  ${e.field}: ${e.message}`)
			.join("\n");
		throw new Error(`Invalid manifest at ${path}:\n${errors}`);
	}

	return manifest;
}
