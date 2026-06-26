import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const REGISTRY_URL = process.env.HYLE_REGISTRY_URL ?? 'http://localhost:3000';

// Source entry of the CLI we drive for author-side actions (run via bun).
const CLI_ENTRY = resolve(__dirname, '../../../cli/src/index.ts');

/** True if the docker-compose registry is reachable, so specs can skip cleanly. */
export async function registryUp(): Promise<boolean> {
  try {
    const res = await fetch(`${REGISTRY_URL}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export interface RunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

/** Run the CLI with args in `cwd`, pointed at the e2e registry. */
export function runHyle(args: string[], cwd: string): Promise<RunResult> {
  return new Promise((resolvePromise, reject) => {
    const proc = spawn('bun', ['run', CLI_ENTRY, ...args], {
      cwd,
      env: { ...process.env, HYLE_REGISTRY_URL: REGISTRY_URL },
    });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => (stdout += d.toString()));
    proc.stderr.on('data', (d) => (stderr += d.toString()));
    proc.on('error', reject);
    proc.on('close', (code) => resolvePromise({ exitCode: code ?? -1, stdout, stderr }));
  });
}

/** Fresh temp project dir; caller disposes via the returned cleanup. */
export async function tempProject(): Promise<{ dir: string; cleanup: () => Promise<void> }> {
  const dir = await mkdtemp(join(tmpdir(), 'hyle-e2e-web-'));
  return { dir, cleanup: () => rm(dir, { recursive: true, force: true }) };
}
