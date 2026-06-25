#!/usr/bin/env bun
import { Command } from "commander";
import pkg from "../package.json" with { type: "json" };
import { runDepsCheck } from "./commands/deps";
import { runHyleIndex } from "./commands/hyle-index";
import { runInit } from "./commands/init";
import { runInstall } from "./commands/install";
import { runLogin, logout } from "./commands/login";
import { runOutdated } from "./commands/outdated";
import { runPublish } from "./commands/publish";
import { runPull } from "./commands/pull";
import { runScan } from "./commands/scan";
import { runSearch } from "./commands/search";
import {
	runIdentitiesStructure,
	runOntologyStructure,
} from "./commands/structure";
import { runUpgrade } from "./commands/upgrade";
import { runValidate } from "./commands/validate";
import { runVerify } from "./commands/verify";

const program = new Command()
	.name("hyle")
	.description("AI context blueprint manager")
	.version(pkg.version)
	.option("--offline", "Skip all network calls (registry checks, etc.)");

// Core commands (programmatic, no LLM)
program
	.command("init")
	.description("Interactive setup, generates hyle.yaml")
	.option("-y, --yes", "Skip prompts, use defaults")
	.action(async (opts: { yes?: boolean }) => {
		const globals = program.opts<{ offline?: boolean }>();
		await runInit({ yes: !!opts.yes, offline: !!globals.offline });
	});

program
	.command("login")
	.description("Authenticate with GitHub")
	.option("--registry <url>", "Custom registry URL")
	.action(async (opts: { registry?: string }) => {
		await runLogin({ registryUrl: opts.registry });
	});

program
	.command("logout")
	.description("Remove stored authentication")
	.action(async () => {
		logout();
	});

program
	.command("validate <file>")
	.description("Validate a hyle.yaml manifest")
	.option("--json", "Output validation result as JSON")
	.action(async (file: string, opts: { json?: boolean }) => {
		await runValidate(file, !!opts.json);
	});

program
	.command("pull [name]")
	.description("Pull blueprint from registry")
	.option("--dry-run", "Preview diff without applying")
	.option("--force", "Overwrite existing files")
	.option("-y, --yes", "Skip confirmations")
	.action(
		async (
			name: string,
			opts: { dryRun?: boolean; force?: boolean; yes?: boolean },
		) => {
			const globals = program.opts<{ offline?: boolean }>();
			await runPull(name, {
				dryRun: !!opts.dryRun,
				force: !!opts.force,
				offline: !!globals.offline,
				yes: !!opts.yes,
			});
		},
	);

program
	.command("outdated")
	.description("Show blueprints with newer versions available")
	.option("--json", "Output JSON")
	.action(async (opts: { json?: boolean }) => {
		const globals = program.opts<{ offline?: boolean }>();
		await runOutdated({
			json: !!opts.json,
			offline: !!globals.offline,
		});
	});

program
	.command("upgrade [name]")
	.description("Upgrade blueprint(s) to latest version")
	.option("-y, --yes", "Skip confirmations")
	.action(async (name: string, opts: { yes?: boolean }) => {
		const globals = program.opts<{ offline?: boolean }>();
		await runUpgrade(name, {
			yes: !!opts.yes,
			offline: !!globals.offline,
		});
	});

program
	.command("verify")
	.description("Verify blueprint integrity against hyle.lock")
	.option("--registry", "Also check versions against registry")
	.option("--json", "Output JSON")
	.action(async (opts: { registry?: boolean; json?: boolean }) => {
		const globals = program.opts<{ offline?: boolean }>();
		await runVerify({
			registry: !!opts.registry,
			json: !!opts.json,
			offline: !!globals.offline,
		});
	});

program
	.command("snapshot")
	.description("Patch bump (x.x.+1), unstable publish")
	.option("--dry-run", "Preview without uploading")
	.option("-y, --yes", "Skip confirmations")
	.action(async (opts: { dryRun?: boolean; yes?: boolean }) => {
		const globals = program.opts<{ offline?: boolean }>();
		await runPublish("snapshot", {
			dryRun: !!opts.dryRun,
			offline: !!globals.offline,
			yes: !!opts.yes,
		});
	});

program
	.command("push [version]")
	.description("Minor bump (x.+1.0), stable publish")
	.option("--dry-run", "Preview without uploading")
	.option("-y, --yes", "Skip confirmations")
	.action(
		async (version: string, opts: { dryRun?: boolean; yes?: boolean }) => {
			const globals = program.opts<{ offline?: boolean }>();
			await runPublish("push", {
				dryRun: !!opts.dryRun,
				offline: !!globals.offline,
				version,
				yes: !!opts.yes,
			});
		},
	);

program
	.command("release [version]")
	.description("Major bump (+1.0.0), stable publish")
	.option("--dry-run", "Preview without uploading")
	.option("-y, --yes", "Skip confirmations")
	.action(
		async (version: string, opts: { dryRun?: boolean; yes?: boolean }) => {
			const globals = program.opts<{ offline?: boolean }>();
			await runPublish("release", {
				dryRun: !!opts.dryRun,
				offline: !!globals.offline,
				version,
				yes: !!opts.yes,
			});
		},
	);

program
	.command("ontology [path]")
	.description("Scan and add ontology files to hyle.yaml")
	.option("--dry-run", "Preview without writing")
	.option("--add <file>", "Add single file without scanning")
	.option("--structure", "LLM-powered: generate ontology index")
	.action(async (path: string, cmd) => {
		if (cmd.structure) {
			await runOntologyStructure({ dryRun: !!cmd.dryRun });
		} else {
			await runScan("ontology", {
				path,
				dryRun: !!cmd.dryRun,
				add: cmd.add,
			});
		}
	});

program
	.command("craft [path]")
	.description("Scan and add craft files to hyle.yaml")
	.option("--dry-run", "Preview without writing")
	.option("--add <file>", "Add single file without scanning")
	.action(async (path: string, cmd) => {
		await runScan("craft", {
			path,
			dryRun: !!cmd.dryRun,
			add: cmd.add,
		});
	});

program
	.command("identities [path]")
	.description("Scan and add identity files to hyle.yaml")
	.option("--dry-run", "Preview without writing")
	.option("--add <file>", "Add single file without scanning")
	.option("--structure", "LLM-powered: refactor into hierarchical topology")
	.action(async (path: string, cmd) => {
		if (cmd.structure) {
			await runIdentitiesStructure({ dryRun: !!cmd.dryRun });
		} else {
			await runScan("identities", {
				path,
				dryRun: !!cmd.dryRun,
				add: cmd.add,
			});
		}
	});

program
	.command("ethics [path]")
	.description("Scan and add ethics files to hyle.yaml")
	.option("--dry-run", "Preview without writing")
	.option("--add <file>", "Add single file without scanning")
	.action(async (path: string, cmd) => {
		await runScan("ethics", {
			path,
			dryRun: !!cmd.dryRun,
			add: cmd.add,
		});
	});

const config = program.command("config").description("Read/write .hyle config");
config
	.command("get <key>")
	.description("Get config value")
	.action(() => {
		console.error("hyle config get: not implemented yet");
		process.exit(1);
	});
config
	.command("set <key> <value>")
	.description("Set config value")
	.action(() => {
		console.error("hyle config set: not implemented yet");
		process.exit(1);
	});

const deps = program.command("deps").description("Dependency resolution tools");
deps
	.command("check [name]")
	.description("Show resolution status for declared deps")
	.action(async (name: string) => {
		await runDepsCheck(name);
	});

program
	.command("search [query]")
	.description("Search registry by name, tag, or description")
	.option("--tag <tag>", "Filter by tag")
	.option("--author <author>", "Filter by author")
	.option("--limit <n>", "Max results (default 20)")
	.option("--json", "Output JSON")
	.action(async (query: string, cmd) => {
		await runSearch(query || "", {
			tag: cmd.tag,
			author: cmd.author,
			json: !!cmd.json,
			limit: cmd.limit ? Number.parseInt(cmd.limit) : 20,
		});
	});

// Extension commands (opt-in via hyle install)
program
	.command("index")
	.description("LLM-powered metadata index → hyle.json (extension)")
	.option("--dry-run", "Print to stdout instead of writing")
	.option("--domain <name>", "Reindex one domain only")
	.action(async (cmd) => {
		await runHyleIndex({ dryRun: !!cmd.dryRun, domain: cmd.domain });
	});

program
	.command("install <extension>")
	.description("Install a Hylé extension")
	.action(async (extension: string) => {
		await runInstall(extension);
	});

program.parse();
