import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { callLLM } from "../llm";
import { parseManifest } from "../manifest";

export interface IndexOptions {
	dryRun?: boolean;
	domain?: string;
}

type Domain = "ontology" | "craft" | "identities" | "ethics";

const ALL_DOMAINS: Domain[] = ["ontology", "craft", "identities", "ethics"];

export async function runHyleIndex(opts: IndexOptions): Promise<void> {
	const cwd = process.cwd();
	const manifestPath = join(cwd, "hyle.yaml");

	if (!existsSync(manifestPath)) {
		console.error("✗ hyle.yaml not found. Run 'hyle init' first.");
		process.exit(1);
	}

	const yaml = readFileSync(manifestPath, "utf8");
	const manifest = parseManifest(yaml);

	// Determine which domains to index
	let domainsToIndex = ALL_DOMAINS;
	if (opts.domain) {
		if (!ALL_DOMAINS.includes(opts.domain as Domain)) {
			console.error(`✗ Unknown domain: ${opts.domain}`);
			console.error(`  Valid domains: ${ALL_DOMAINS.join(", ")}`);
			process.exit(1);
		}
		domainsToIndex = [opts.domain as Domain];
	}

	// Collect file contents per domain
	const filesByDomain: Record<Domain, Record<string, string>> = {
		ontology: {},
		craft: {},
		identities: {},
		ethics: {},
	};

	for (const domain of domainsToIndex) {
		const files = manifest[domain] || [];

		for (const file of files) {
			const filePath = join(cwd, file);
			if (existsSync(filePath)) {
				let content = readFileSync(filePath, "utf8");
				// Limit to first 150 lines
				const lines = content.split("\n");
				if (lines.length > 150) {
					content = `${lines.slice(0, 150).join("\n")}\n... (truncated)`;
				}
				filesByDomain[domain][file] = content;
			}
		}
	}

	// Check that we have files
	const hasFiles = Object.values(filesByDomain).some(
		(d) => Object.keys(d).length > 0,
	);
	if (!hasFiles) {
		console.error("✗ No readable files found in specified domains");
		process.exit(1);
	}

	// Build prompt
	const fileSections = domainsToIndex
		.map((domain) => {
			const files = filesByDomain[domain];
			const count = Object.keys(files).length;
			if (count === 0) return `[${domain}: no files]`;

			const contents = Object.entries(files)
				.map(([path, content]) => `=== ${domain}/${path} ===\n${content}`)
				.join("\n\n");

			return `## ${domain.toUpperCase()}\n\n${contents}`;
		})
		.join("\n\n");

	const prompt = `Generate a unified metadata index for these files across multiple domains:

${fileSections}

Return ONLY valid JSON (no markdown, no extra text) with this structure:
{
  "generated": "ISO8601 timestamp",
  "domains": {
    "ontology": {
      "filename": {
        "summary": "one line",
        "tags": ["tag1"],
        "scope": "global|local|module",
        "weight": 0.0-1.0
      }
    },
    "craft": { ... },
    "identities": { ... },
    "ethics": { ... }
  }
}`;

	console.log("Generating unified metadata index...");
	const response = await callLLM(prompt, { maxTokens: 8192 });

	// Parse JSON
	let index: unknown;
	try {
		const jsonMatch = response.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			throw new Error("No JSON found in response");
		}
		index = JSON.parse(jsonMatch[0]);
	} catch (e) {
		console.error(
			`✗ Failed to parse LLM response as JSON: ${e instanceof Error ? e.message : String(e)}`,
		);
		process.exit(1);
	}

	if (opts.dryRun) {
		console.log("\n=== Hyle Index ===");
		console.log(JSON.stringify(index, null, 2));
		return;
	}

	// Write hyle.json
	const outputPath = join(cwd, "hyle.json");
	writeFileSync(outputPath, JSON.stringify(index, null, 2));

	console.log("✓ Index written to hyle.json");

	// Count files per domain
	const idx = index as Record<string, Record<string, Record<string, unknown>>>;
	for (const domain of domainsToIndex) {
		const count = Object.keys(idx.domains?.[domain] || {}).length;
		if (count > 0) {
			console.log(`  ${domain}: ${count} file(s)`);
		}
	}
}
