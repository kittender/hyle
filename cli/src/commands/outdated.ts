import { gt } from "semver";
import { intro, outro } from "@clack/prompts";
import { loadConfig } from "../config";
import { readLock } from "../lock";
import { HttpRegistryClient } from "../registry";

export interface OutdatedOptions {
  json?: boolean;
  offline?: boolean;
}

export async function runOutdated(opts: OutdatedOptions): Promise<void> {
  if (process.stdin.isTTY !== false) {
    intro("hyle outdated");
  }

  try {
    const cwd = process.cwd();
    const entries = readLock(cwd);

    if (entries.length === 0) {
      console.log("No substrates found in hyle.lock. Run 'hyle pull' first.");
      process.exit(0);
    }

    if (opts.offline) {
      console.error("Cannot check for updates offline");
      process.exit(1);
    }

    const config = loadConfig(cwd);
    const registryUrl = config.remote_url as string;
    const registryClient = new HttpRegistryClient(registryUrl);

    const results: Array<{
      author: string;
      name: string;
      current: string;
      latest: string;
      outdated: boolean;
    }> = [];

    let anyOutdated = false;

    for (const entry of entries) {
      try {
        const latest = await registryClient.fetchLatest(entry.author, entry.name);
        const outdated = gt(latest.version, entry.version);

        results.push({
          author: entry.author,
          name: entry.name,
          current: entry.version,
          latest: latest.version,
          outdated,
        });

        if (outdated) {
          anyOutdated = true;
        }
      } catch (e) {
        results.push({
          author: entry.author,
          name: entry.name,
          current: entry.version,
          latest: "ERROR",
          outdated: false,
        });
      }
    }

    if (opts.json) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      // Print table
      if (process.stdin.isTTY !== false) {
        console.log("\nSubstrate updates:");
      }

      for (const result of results) {
        const status = result.outdated ? "OUTDATED" : "up-to-date";
        const marker = result.outdated ? "⬆️ " : "✓ ";
        console.log(
          `${marker}${result.author}/${result.name}: ${result.current} → ${result.latest} (${status})`,
        );
      }

      if (process.stdin.isTTY !== false) {
        if (anyOutdated) {
          console.log("\nRun 'hyle upgrade' to update.");
          outro("Found outdated substrates.");
        } else {
          outro("All substrates are up-to-date.");
        }
      }
    }

    process.exit(anyOutdated ? 1 : 0);
  } catch (e) {
    console.error(`✗ ${(e as Error).message}`);
    process.exit(1);
  }
}
