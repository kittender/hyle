import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { dump, load } from "js-yaml";
import { isMatch } from "micromatch";
import { IgnorePatterns } from "../ignore";
import type { HyleManifest } from "../manifest";
import { parseManifest, validateManifest } from "../manifest";

type Category = "ontology" | "craft" | "identities" | "ethics";

const PATTERNS: Record<Category, string[]> = {
	ontology: [
		"CLAUDE.md",
		"*.md",
		"docs/**/*.md",
		"spec/**/*.md",
		"requirements/**/*.md",
		"architecture/**/*.md",
	],
	craft: [
		"package.json",
		"tsconfig.json",
		"SKILLS.md",
		"ARCHITECTURE.md",
		".claude/**/*.md",
		"config/**/*.json",
		".eslintrc*",
		".prettierrc*",
		"biome.json",
	],
	identities: [
		"AGENTS.md",
		".claude/agents/**/*.md",
		"agents/**/*.md",
		"identities/**/*.md",
	],
	ethics: [
		"*.cedar",
		"evals/**/*.ts",
		"evals/**/*.js",
		"ETHICS.md",
		"COMPLIANCE.md",
		"policies/**/*.md",
	],
};

function findFiles(
	dir: string,
	patterns: string[],
	ignore: IgnorePatterns,
): string[] {
	const found = new Set<string>();
	const excludeDirs = new Set([
		"node_modules",
		".git",
		"dist",
		"build",
		".next",
		"out",
	]);

	function walk(currentDir: string, basePath = "") {
		try {
			const entries = readdirSync(currentDir, { withFileTypes: true });

			for (const entry of entries) {
				const relPath = basePath ? join(basePath, entry.name) : entry.name;

				if (entry.isDirectory()) {
					if (!excludeDirs.has(entry.name) && !ignore.matches(`${relPath}/`)) {
						walk(join(currentDir, entry.name), relPath);
					}
				} else if (entry.isFile()) {
					// Check if file matches any pattern
					for (const pattern of patterns) {
						if (isMatch(relPath, pattern, { matchBase: true })) {
							if (!ignore.matches(relPath)) {
								found.add(relPath);
							}
							break;
						}
					}
				}
			}
		} catch {
			// Skip directories we can't read
		}
	}

	walk(dir);
	return Array.from(found).sort();
}

export async function runScan(
	category: Category,
	opts: { path?: string; dryRun?: boolean; add?: string },
): Promise<void> {
	const cwd = process.cwd();
	const manifestPath = join(cwd, "hyle.yaml");

	if (!existsSync(manifestPath)) {
		console.error("hyle.yaml not found. Run 'hyle init' first.");
		process.exit(1);
	}

	const yaml = readFileSync(manifestPath, "utf8");
	const manifest = parseManifest(yaml);

	// Handle --add single file
	if (opts.add) {
		const files = [opts.add];
		updateManifest(manifest, category, files, !!opts.dryRun);
		return;
	}

	// Scan directory
	const scanPath = opts.path || ".";
	const ignorePath = join(cwd, ".hyleignore");
	const ignore = IgnorePatterns.loadFromPath(ignorePath);

	const patterns = PATTERNS[category];
	const files = findFiles(join(cwd, scanPath), patterns, ignore);

	updateManifest(manifest, category, files, !!opts.dryRun);
}

function updateManifest(
	manifest: HyleManifest,
	category: Category,
	newFiles: string[],
	dryRun: boolean,
): void {
	const current = manifest[category] || [];
	const allFiles = Array.from(new Set([...current, ...newFiles])).sort();

	if (dryRun) {
		console.log(`Would update ${category}:`);
		for (const f of allFiles) {
			console.log(`  + ${f}`);
		}
		return;
	}

	manifest[category] = allFiles;

	const validation = validateManifest(manifest);
	if (validation.errors.length > 0) {
		console.error(`Validation errors after adding ${category}:`);
		for (const e of validation.errors) {
			console.error(`  ${e.field}: ${e.message}`);
		}
		process.exit(1);
	}

	const cwd = process.cwd();
	const manifestPath = join(cwd, "hyle.yaml");
	writeFileSync(manifestPath, dump(manifest, { lineWidth: 80 }));

	console.log(`Updated ${category}: added ${allFiles.length} file(s)`);
	for (const f of allFiles) {
		console.log(`  ✓ ${f}`);
	}
}
