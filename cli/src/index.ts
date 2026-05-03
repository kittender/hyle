#!/usr/bin/env bun
import { Command } from "commander";
import { runInit } from "./commands/init";
import { runScan } from "./commands/scan";
import { runPublish } from "./commands/publish";
import { runPull } from "./commands/pull";
import { runWatch } from "./commands/watch";
import pkg from "../package.json" with { type: "json" };

const program = new Command()
  .name("hyle")
  .description("AI context substrate manager")
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
  .command("pull [name]")
  .description("Pull substrate from registry")
  .option("--dry-run", "Preview diff without applying")
  .option("--force", "Overwrite existing files")
  .option("-y, --yes", "Skip confirmations")
  .action(async (name: string, opts: { dryRun?: boolean; force?: boolean; yes?: boolean }) => {
    const globals = program.opts<{ offline?: boolean }>();
    await runPull(name, { dryRun: !!opts.dryRun, force: !!opts.force, offline: !!globals.offline, yes: !!opts.yes });
  });

program
  .command("snapshot")
  .description("Patch bump (x.x.+1), unstable publish")
  .option("--dry-run", "Preview without uploading")
  .option("-y, --yes", "Skip confirmations")
  .action(async (opts: { dryRun?: boolean; yes?: boolean }) => {
    const globals = program.opts<{ offline?: boolean }>();
    await runPublish("snapshot", { dryRun: !!opts.dryRun, offline: !!globals.offline, yes: !!opts.yes });
  });

program
  .command("push [version]")
  .description("Minor bump (x.+1.0), stable publish")
  .option("--dry-run", "Preview without uploading")
  .option("-y, --yes", "Skip confirmations")
  .action(async (version: string, opts: { dryRun?: boolean; yes?: boolean }) => {
    const globals = program.opts<{ offline?: boolean }>();
    await runPublish("push", { dryRun: !!opts.dryRun, offline: !!globals.offline, version, yes: !!opts.yes });
  });

program
  .command("release [version]")
  .description("Major bump (+1.0.0), stable publish")
  .option("--dry-run", "Preview without uploading")
  .option("-y, --yes", "Skip confirmations")
  .action(async (version: string, opts: { dryRun?: boolean; yes?: boolean }) => {
    const globals = program.opts<{ offline?: boolean }>();
    await runPublish("release", { dryRun: !!opts.dryRun, offline: !!globals.offline, version, yes: !!opts.yes });
  });

program
  .command("ontology [path]")
  .description("Scan and add ontology files to hyle.yaml")
  .option("--dry-run", "Preview without writing")
  .option("--add <file>", "Add single file without scanning")
  .action(async (path: string, cmd) => {
    await runScan("ontology", {
      path,
      dryRun: !!cmd.dryRun,
      add: cmd.add,
    });
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
      console.error("--structure not implemented yet (requires LLM)");
      process.exit(1);
    }
    await runScan("identities", {
      path,
      dryRun: !!cmd.dryRun,
      add: cmd.add,
    });
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
  .action(() => stub("config get"));
config
  .command("set <key> <value>")
  .description("Set config value")
  .action(() => stub("config set"));

const deps = program.command("deps").description("Dependency resolution tools");
deps
  .command("check [name]")
  .description("Show resolution status for declared deps")
  .action(() => stub("deps check"));

program
  .command("search [query]")
  .description("Search registry by name, tag, or description")
  .action(() => stub("search"));

// Extension commands (opt-in via hyle install)
program
  .command("watch")
  .description("Live token consumption monitor (extension)")
  .option("--audit", "Write hash-chained hyle-audit.log")
  .option("--split <threshold>", "Split context at threshold (e.g. 80% or 10000)")
  .action(async (cmd) => {
    const globals = program.opts<{ offline?: boolean }>();
    await runWatch({ audit: !!cmd.audit, split: cmd.split, offline: !!globals.offline });
  });

program
  .command("index")
  .description("LLM-powered metadata index → hyle.json (extension)")
  .option("--dry-run", "Print to stdout instead of writing")
  .option("--domain <name>", "Reindex one domain only")
  .action(() => stub("index"));

program
  .command("install <extension>")
  .description("Install a Hylé extension")
  .action(() => stub("install"));

program.parse();

function stub(cmd: string): never {
  console.error(`hyle ${cmd}: not implemented yet`);
  process.exit(1);
}
