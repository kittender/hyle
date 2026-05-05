import { loadConfig } from "../config";
import { HttpRegistryClient, type SubstrateInfo } from "../registry";

export interface SearchOptions {
	tag?: string;
	author?: string;
	json?: boolean;
	limit?: number;
}

export async function runSearch(
	query: string,
	opts: SearchOptions,
): Promise<void> {
	const config = loadConfig();
	const client = new HttpRegistryClient(config.remote_url);

	const limit = opts.limit || 20;

	try {
		const results = await client.search(
			query,
			opts.tag ? [opts.tag] : undefined,
		);

		let filtered = results;
		if (opts.author) {
			filtered = results.filter((r) => r.author === opts.author);
		}

		const trimmed = filtered.slice(0, limit);

		if (opts.json) {
			console.log(JSON.stringify(trimmed, null, 2));
			return;
		}

		if (trimmed.length === 0) {
			console.log("No substrates found.");
			return;
		}

		// Table header
		console.log(
			`${"NAME".padEnd(25)}${"AUTHOR".padEnd(15)}${"VER".padEnd(10)}${"TAGS".padEnd(25)}DESCRIPTION`,
		);
		console.log("─".repeat(95));

		// Table rows
		for (const substrate of trimmed) {
			const name = (substrate.name || "").slice(0, 24).padEnd(25);
			const author = (substrate.author || "").slice(0, 14).padEnd(15);
			const version = (substrate.version || "").slice(0, 9).padEnd(10);
			const tags = (substrate.tags?.join(", ") || "").slice(0, 24).padEnd(25);
			const desc = (substrate.description || "").slice(0, 40);

			console.log(name + author + version + tags + desc);
		}

		console.log("─".repeat(95));
		console.log(
			`Results: ${trimmed.length} of ${filtered.length}${opts.author ? ` (author: ${opts.author})` : ""}${opts.tag ? ` (tag: ${opts.tag})` : ""}`,
		);
	} catch (e) {
		const message = e instanceof Error ? e.message : String(e);
		console.error(`✗ Search failed: ${message}`);
		process.exit(1);
	}
}
