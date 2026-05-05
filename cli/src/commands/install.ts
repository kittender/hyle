import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { confirm, password } from "@clack/prompts";
import { dump, load } from "js-yaml";

const KNOWN_EXTENSIONS: Record<string, string[]> = {
	watch: [],
	"watch-audit": [],
	"watch-split": [],
	index: ["ANTHROPIC_API_KEY"],
	"identities-structure": ["ANTHROPIC_API_KEY"],
	"ontology-structure": ["ANTHROPIC_API_KEY"],
};

export async function runInstall(name: string): Promise<void> {
	if (!KNOWN_EXTENSIONS[name]) {
		console.error(`✗ Unknown extension: ${name}`);
		console.error(`  Known extensions: ${Object.keys(KNOWN_EXTENSIONS).join(", ")}`);
		process.exit(1);
	}

	const deps = KNOWN_EXTENSIONS[name];

	// Check/prompt for required env vars
	for (const dep of deps) {
		if (dep === "ANTHROPIC_API_KEY") {
			const existing = process.env.ANTHROPIC_API_KEY;
			if (!existing) {
				console.log(`Extension "${name}" requires ANTHROPIC_API_KEY`);
				const shouldSet = await confirm({
					message: "Save API key to ~/.hyle for future use?",
				});

				if (shouldSet === false) {
					console.log("Installation cancelled.");
					process.exit(1);
				}

				const apiKey = await password({
					message: "Enter ANTHROPIC_API_KEY:",
				});

				if (!apiKey || typeof apiKey !== "string") {
					console.error("✗ API key required");
					process.exit(1);
				}

				saveConfigValue("anthropic_api_key", apiKey);
				console.log("✓ API key saved to ~/.hyle");
			}
		}
	}

	// Load/update installed_extensions in local .hyle
	const localHylePath = join(process.cwd(), ".hyle");
	let config: Record<string, unknown> = {};

	if (existsSync(localHylePath)) {
		const content = readFileSync(localHylePath, "utf8");
		config = (load(content) as Record<string, unknown>) || {};
	}

	const installed = (config.installed_extensions as string[]) || [];
	if (!installed.includes(name)) {
		installed.push(name);
		config.installed_extensions = installed;

		writeFileSync(localHylePath, dump(config, { lineWidth: 80 }));
	}

	console.log(`✓ Extension "${name}" installed`);
}

function saveConfigValue(key: string, value: string): void {
	const globalHylePath = join(homedir(), ".hyle");
	let config: Record<string, unknown> = {};

	if (existsSync(globalHylePath)) {
		const content = readFileSync(globalHylePath, "utf8");
		config = (load(content) as Record<string, unknown>) || {};
	}

	config[key] = value;
	writeFileSync(globalHylePath, dump(config, { lineWidth: 80 }));
}
