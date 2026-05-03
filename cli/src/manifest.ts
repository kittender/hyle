import { load } from "js-yaml";
import * as semver from "semver";
import { resolve, relative } from "node:path";

// ---- Types ----

export interface ModelConfig {
  provider: string;
  model: string;
  model_pin?: string;
  tags?: string[];
  fallback?: ModelConfig[];
}

export interface Models {
  primary: ModelConfig;
  secondary: ModelConfig;
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
  forks?: string[];

  models: Models;

  dependencies?: DepEntry[];

  ontology?: string[];
  craft?: string[];
  identities?: string[];
  ethics?: string[];
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

  if (!obj.models || typeof obj.models !== "object" || Array.isArray(obj.models)) {
    throw new ManifestParseError("Missing required field: models");
  }

  const modelsRaw = obj.models as Record<string, unknown>;

  if (!modelsRaw.primary) {
    throw new ManifestParseError("Missing required field: models.primary");
  }
  if (!modelsRaw.secondary) {
    throw new ManifestParseError("Missing required field: models.secondary");
  }

  return {
    name,
    author,
    version,
    description: coerceString(obj.description),
    tags: coerceStringArray(obj.tags),
    url: coerceString(obj.url),
    forks: coerceStringArray(obj.forks),
    models: {
      primary: parseModelConfig(modelsRaw.primary, "models.primary"),
      secondary: parseModelConfig(modelsRaw.secondary, "models.secondary"),
    },
    dependencies: parseDeps(obj.dependencies),
    ontology: coerceStringArray(obj.ontology),
    craft: coerceStringArray(obj.craft),
    identities: coerceStringArray(obj.identities),
    ethics: coerceStringArray(obj.ethics),
  };
}

function parseModelConfig(raw: unknown, path: string): ModelConfig {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new ManifestParseError(`${path} must be an object`);
  }
  const obj = raw as Record<string, unknown>;

  // Require key presence (structural), but allow empty strings — validation catches content issues
  if (!("provider" in obj)) throw new ManifestParseError(`Missing required field: ${path}.provider`);
  if (!("model" in obj)) throw new ManifestParseError(`Missing required field: ${path}.model`);

  const provider = obj.provider === null || obj.provider === undefined ? "" : String(obj.provider);
  const model = obj.model === null || obj.model === undefined ? "" : String(obj.model);

  const result: ModelConfig = { provider, model };

  const pin = coerceString(obj.model_pin);
  if (pin) result.model_pin = pin;

  const tags = coerceStringArray(obj.tags);
  if (tags) result.tags = tags;

  if (Array.isArray(obj.fallback)) {
    result.fallback = obj.fallback.map((entry, i) =>
      parseModelConfig(entry, `${path}.fallback[${i}]`)
    );
  }

  return result;
}

function parseInstallMethod(raw: unknown, path: string): InstallMethod {
  if (typeof raw === "string") {
    throw new ManifestParseError(
      `${path} must be a structured object ({ manager, pkg }) — raw shell strings are not allowed`
    );
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new ManifestParseError(`${path} must be an object with a "manager" field`);
  }
  const obj = raw as Record<string, unknown>;
  const manager = coerceString(obj.manager);
  if (!manager) throw new ManifestParseError(`${path}.manager is required`);

  if (manager === "script") {
    const url = coerceString(obj.url);
    if (!url) throw new ManifestParseError(`${path}.url is required for manager "script"`);
    const sha256 = coerceString(obj.sha256);
    if (!sha256) {
      throw new ManifestParseError(
        `${path}.sha256 is required for manager "script" (supply-chain safety — hash the installer before publishing)`
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
    `${path}.manager "${manager}" is not supported. Valid: brew, apt, winget, choco, cargo, npm, script`
  );
}

function parseDeps(raw: unknown): DepEntry[] | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (!Array.isArray(raw)) throw new ManifestParseError("dependencies must be an array");

  return raw.map((entry, i) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new ManifestParseError(`dependencies[${i}] must be an object`);
    }
    const obj = entry as Record<string, unknown>;

    const name = coerceString(obj.name);
    if (!name) throw new ManifestParseError(`Missing required field: dependencies[${i}].name`);

    const version = coerceString(obj.version);
    if (!version) throw new ManifestParseError(`Missing required field: dependencies[${i}].version`);

    const url = coerceString(obj.url);
    if (!url) throw new ManifestParseError(`Missing required field: dependencies[${i}].url`);

    const dep: DepEntry = { name, version, url };

    if (obj.install !== undefined) {
      if (typeof obj.install !== "object" || obj.install === null || Array.isArray(obj.install)) {
        throw new ManifestParseError(
          `dependencies[${i}].install must be an object with macos/linux/windows keys`
        );
      }
      const inst = obj.install as Record<string, unknown>;
      dep.install = {};
      if (inst.macos !== undefined) {
        dep.install.macos = parseInstallMethod(inst.macos, `dependencies[${i}].install.macos`);
      }
      if (inst.linux !== undefined) {
        dep.install.linux = parseInstallMethod(inst.linux, `dependencies[${i}].install.linux`);
      }
      if (inst.windows !== undefined) {
        dep.install.windows = parseInstallMethod(inst.windows, `dependencies[${i}].install.windows`);
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
    errors.push({ field: "name", message: "Must be a URL-safe slug: lowercase alphanumeric and hyphens, max 64 chars" });
  }

  // author
  if (!SLUG_RE.test(m.author) || m.author.length > 64) {
    errors.push({ field: "author", message: "Must be a URL-safe slug: lowercase alphanumeric and hyphens, max 64 chars" });
  }

  // version — x.y.z or x.y.z-snapshot (for snapshot builds)
  if (!/^\d+\.\d+\.\d+(-snapshot)?$/.test(m.version) || !semver.valid(m.version)) {
    errors.push({ field: "version", message: "Must be a valid semver string: x.y.z (or x.y.z-snapshot)" });
  }

  // description warning
  if (!m.description) {
    warnings.push({ field: "description", message: "Missing description" });
  }

  // models — true = check local fallback warning (only at top level)
  validateModelConfig(m.models.primary, "models.primary", errors, warnings, true);
  validateModelConfig(m.models.secondary, "models.secondary", errors, warnings, true);

  // dependencies
  if (m.dependencies) {
    for (let i = 0; i < m.dependencies.length; i++) {
      const dep = m.dependencies[i];
      const prefix = `dependencies[${i}]`;

      if (!dep.name) {
        errors.push({ field: `${prefix}.name`, message: "Required" });
      }

      if (!semver.validRange(dep.version)) {
        errors.push({ field: `${prefix}.version`, message: "Must be a valid semver range" });
      }

      try {
        const parsed = new URL(dep.url);
        if (parsed.protocol === "http:") {
          warnings.push({ field: `${prefix}.url`, message: "URL uses HTTP instead of HTTPS" });
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

  // path arrays
  for (const category of ["ontology", "craft", "identities", "ethics"] as const) {
    const paths = m[category];
    if (paths) {
      for (let i = 0; i < paths.length; i++) {
        if (isUnsafePath(paths[i])) {
          errors.push({
            field: `${category}[${i}]`,
            message: "Must be a relative path (no absolute paths, no ../ traversal)",
          });
        }
      }
    }
  }

  return { errors, warnings };
}

function validateModelConfig(
  m: ModelConfig,
  path: string,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  warnLocalFallback = false
): void {
  if (!m.provider) {
    errors.push({ field: `${path}.provider`, message: "Required, must be non-empty" });
  }
  if (!m.model) {
    errors.push({ field: `${path}.model`, message: "Required, must be non-empty" });
  }
  if (m.model_pin !== undefined && !m.model_pin) {
    errors.push({ field: `${path}.model_pin`, message: "If present, must be non-empty" });
  }

  const fallback = m.fallback ?? [];

  if (warnLocalFallback) {
    const hasLocalFallback = fallback.some((f) => f.tags?.includes("local"));
    if (!hasLocalFallback) {
      warnings.push({
        field: `${path}.fallback`,
        message: "No local fallback declared (recommend adding an Ollama entry with tags: [local, free])",
      });
    }
  }

  for (let i = 0; i < fallback.length; i++) {
    // Don't recurse warnLocalFallback — fallback entries don't need their own local fallback
    validateModelConfig(fallback[i], `${path}.fallback[${i}]`, errors, warnings, false);
  }
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

function isUnsafePath(p: string, root = "."): boolean {
  if (!p || p.includes("\x00") || p.includes("\\") || p.startsWith("~")) return true;
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
    const errors = validation.errors.map((e) => `  ${e.field}: ${e.message}`).join("\n");
    throw new Error(`Invalid manifest at ${path}:\n${errors}`);
  }

  return manifest;
}
