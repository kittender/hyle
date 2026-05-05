import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { dump } from "js-yaml";
import { callLLM } from "../llm";
import { parseManifest } from "../manifest";

export interface StructureOptions {
	dryRun?: boolean;
}

export async function runIdentitiesStructure(
	opts: StructureOptions,
): Promise<void> {
	const cwd = process.cwd();
	const manifestPath = join(cwd, "hyle.yaml");

	if (!existsSync(manifestPath)) {
		console.error("✗ hyle.yaml not found. Run 'hyle init' first.");
		process.exit(1);
	}

	const yaml = readFileSync(manifestPath, "utf8");
	const manifest = parseManifest(yaml);

	const identityFiles = manifest.identities || [];
	if (identityFiles.length === 0) {
		console.error("✗ No identity files defined in hyle.yaml");
		process.exit(1);
	}

	// Read identity file contents
	const identities: Record<string, string> = {};
	for (const file of identityFiles) {
		const filePath = join(cwd, file);
		if (existsSync(filePath)) {
			const content = readFileSync(filePath, "utf8");
			identities[file] = content;
		}
	}

	if (Object.keys(identities).length === 0) {
		console.error("✗ No readable identity files found");
		process.exit(1);
	}

	// Build prompt
	const fileContents = Object.entries(identities)
		.map(([path, content]) => `=== ${path} ===\n${content}`)
		.join("\n\n");

	const prompt = `Analyze these agent identity files and propose a hierarchical multi-agent topology:

${fileContents}

Return ONLY valid JSON (no markdown, no extra text) with this structure:
{
  "topology": {
    "primary": ["agent_names..."],
    "secondary": ["agent_names..."],
    "specialized": { "role_name": ["agent_names..."] }
  },
  "rationale": "explanation of the topology",
  "suggested_splits": [
    { "file": "current_file.md", "roles": ["role1", "role2"] }
  ]
}`;

	console.log("Analyzing identities with Claude...");
	const response = await callLLM(prompt);

	// Parse JSON from response
	let topology: unknown;
	try {
		// Try to extract JSON from response (in case there's extra text)
		const jsonMatch = response.match(/\{[\s\S]*\}/);
		if (!jsonMatch) {
			throw new Error("No JSON found in response");
		}
		topology = JSON.parse(jsonMatch[0]);
	} catch (e) {
		console.error(
			`✗ Failed to parse LLM response as JSON: ${e instanceof Error ? e.message : String(e)}`,
		);
		process.exit(1);
	}

	if (opts.dryRun) {
		console.log("\n=== Proposed Topology ===");
		console.log(JSON.stringify(topology, null, 2));
		return;
	}

	// Write agents-topology.json
	const outputPath = join(cwd, "agents-topology.json");
	writeFileSync(outputPath, JSON.stringify(topology, null, 2));

	console.log("✓ Topology written to agents-topology.json");
	const t = topology as Record<string, unknown>;
	console.log(`  Primary agents: ${String(t.topology).split(",").length}`);
}

export async function runOntologyStructure(
	opts: StructureOptions,
): Promise<void> {
	const cwd = process.cwd();
	const manifestPath = join(cwd, "hyle.yaml");

	if (!existsSync(manifestPath)) {
		console.error("✗ hyle.yaml not found. Run 'hyle init' first.");
		process.exit(1);
	}

	const yaml = readFileSync(manifestPath, "utf8");
	const manifest = parseManifest(yaml);

	const ontologyFiles = manifest.ontology || [];
	if (ontologyFiles.length === 0) {
		console.error("✗ No ontology files defined in hyle.yaml");
		process.exit(1);
	}

	// Read ontology file contents (first 200 lines each)
	const ontologies: Record<string, string> = {};
	for (const file of ontologyFiles) {
		const filePath = join(cwd, file);
		if (existsSync(filePath)) {
			let content = readFileSync(filePath, "utf8");
			const lines = content.split("\n");
			if (lines.length > 200) {
				content = `${lines.slice(0, 200).join("\n")}\n... (truncated)`;
			}
			ontologies[file] = content;
		}
	}

	if (Object.keys(ontologies).length === 0) {
		console.error("✗ No readable ontology files found");
		process.exit(1);
	}

	// Build prompt
	const fileContents = Object.entries(ontologies)
		.map(([path, content]) => `=== ${path} ===\n${content}`)
		.join("\n\n");

	const prompt = `Analyze these ontology/documentation files and generate a metadata index:

${fileContents}

Return ONLY valid JSON (no markdown, no extra text) with this structure:
{
  "files": {
    "filename": {
      "tags": ["tag1", "tag2"],
      "scope": "global|local|module",
      "weight": 0.0-1.0,
      "summary": "one line summary"
    }
  },
  "lineage": {
    "filename": ["dependency1", "dependency2"]
  }
}`;

	console.log("Analyzing ontology with Claude...");
	const response = await callLLM(prompt);

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
		console.log("\n=== Ontology Index ===");
		console.log(JSON.stringify(index, null, 2));
		return;
	}

	// Write ontology.json
	const outputPath = join(cwd, "ontology.json");
	writeFileSync(outputPath, JSON.stringify(index, null, 2));

	console.log("✓ Ontology index written to ontology.json");
	const idx = index as Record<string, Record<string, unknown>>;
	const fileCount = Object.keys(idx.files || {}).length;
	console.log(`  Indexed ${fileCount} file(s)`);
}
