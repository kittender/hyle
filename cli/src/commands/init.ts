import { execSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { cancel, confirm, intro, isCancel, outro, text } from "@clack/prompts";
import { dump } from "js-yaml";
import { loadConfig } from "../config";
import type { HyleManifest } from "../manifest";
import { SLUG_RE, validateManifest } from "../manifest";

const DEFAULT_HYLE_CONFIG = `# Hylé local config — overrides ~/.hyle
default_model: claude-haiku-4-5
`;

const DEFAULT_HYLEIGNORE = `.env
*.env.*
*.key
*.pem
*.p12
secrets/
`;

export async function runInit(opts: {
	yes: boolean;
	offline?: boolean;
}): Promise<void> {
	const cwd = process.cwd();
	const manifestPath = join(cwd, "hyle.yaml");

	if (!opts.yes) intro("hyle init");

	if (existsSync(manifestPath)) {
		if (!opts.yes) {
			const overwrite = await confirm({
				message: "hyle.yaml already exists. Overwrite?",
			});
			if (isCancel(overwrite) || !overwrite) {
				cancel("Aborted.");
				process.exit(0);
			}
		}
	}

	const defaultName = slugify(basename(cwd)) || "my-substrate";
	const defaultAuthor = getGitAuthor() || "author";

	let name: string;
	let author: string;
	let description: string | undefined;
	let tags: string[] | undefined;
	let version: string;

	if (opts.yes) {
		name = defaultName;
		author = defaultAuthor;
		version = "0.1.0";
	} else {
		name = await prompt("Substrate name", defaultName, validateSlug);
		author = await prompt(
			"Author (GitHub username)",
			defaultAuthor,
			validateSlug,
		);

		const rawDesc = await prompt("Description (optional)", "", () => undefined);
		description = rawDesc || undefined;

		version = await prompt("Initial version", "0.1.0", (v) =>
			/^\d+\.\d+\.\d+$/.test(v) ? undefined : "Must be x.y.z",
		);

		const rawTags = await prompt(
			"Tags (comma-separated, optional)",
			"",
			() => undefined,
		);
		tags = rawTags
			? rawTags
					.split(",")
					.map((t) => t.trim())
					.filter(Boolean)
			: undefined;
	}

	if (!opts.offline) {
		await checkRegistry(name, author, cwd);
	}

	const manifest: HyleManifest = {
		name,
		author,
		version,
		...(description ? { description } : {}),
		...(tags?.length ? { tags } : {}),
	};

	const validation = validateManifest(manifest);
	if (validation.errors.length > 0) {
		console.error("Generated manifest failed validation:");
		for (const e of validation.errors) {
			console.error(`  ${e.field}: ${e.message}`);
		}
		process.exit(1);
	}

	writeFileSync(manifestPath, dump(manifest, { lineWidth: 80 }));

	const hylePath = join(cwd, ".hyle");
	if (!existsSync(hylePath)) writeFileSync(hylePath, DEFAULT_HYLE_CONFIG);

	const ignorePath = join(cwd, ".hyleignore");
	if (!existsSync(ignorePath)) writeFileSync(ignorePath, DEFAULT_HYLEIGNORE);

	if (opts.yes) {
		console.log(`Created hyle.yaml (${name} by ${author} v${version})`);
	} else {
		outro(
			"Created hyle.yaml — scan files and add recommendations, then run `hyle push` to publish.",
		);
	}
}

// ---- Helpers ----

async function prompt(
	message: string,
	defaultValue: string,
	validate: (v: string) => string | undefined,
): Promise<string> {
	const result = await text({
		message,
		defaultValue,
		placeholder: defaultValue,
		validate,
	});
	if (isCancel(result)) {
		cancel("Aborted.");
		process.exit(0);
	}
	return result as string;
}

function validateSlug(v: string): string | undefined {
	return SLUG_RE.test(v)
		? undefined
		: "Must be lowercase alphanumeric with hyphens, max 64 chars (e.g. my-substrate)";
}

function slugify(s: string): string {
	return s
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 64);
}

function getGitAuthor(): string {
	try {
		const name = execSync("git config user.name", {
			encoding: "utf8",
			stdio: ["pipe", "pipe", "pipe"],
		}).trim();
		return slugify(name);
	} catch {
		return "";
	}
}


type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

export async function checkRegistry(
	name: string,
	author: string,
	cwd: string,
	fetcher: Fetcher = globalThis.fetch,
): Promise<void> {
	try {
		const config = loadConfig(cwd);
		const res = await fetcher(
			`${config.remote_url}/substrates/${author}/${name}`,
			{
				signal: AbortSignal.timeout(3000),
			},
		);
		if (res.ok) {
			console.warn(
				`Advisory: "${author}/${name}" already exists in registry (server-side enforcement is authoritative on push).`,
			);
		}
	} catch {
		// Advisory check only — server-side push validation is the source of truth
	}
}
