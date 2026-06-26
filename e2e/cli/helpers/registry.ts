import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

export const REGISTRY_URL = process.env.HYLE_REGISTRY_URL ?? 'http://localhost:3000';

// Source entry of the CLI we exercise (run from source via bun).
const CLI_ENTRY = resolve(import.meta.dir, '../../../cli/src/index.ts');

/** True if the docker-compose registry is reachable, so suites can skip cleanly. */
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
export async function runHyle(
  args: string[],
  cwd: string,
  input?: string,
): Promise<RunResult> {
  const proc = Bun.spawn(['bun', 'run', CLI_ENTRY, ...args], {
    cwd,
    env: { ...process.env, HYLE_REGISTRY_URL: REGISTRY_URL },
    stdin: input ? new TextEncoder().encode(input) : 'ignore',
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  const exitCode = await proc.exited;
  return { exitCode, stdout, stderr };
}

/** Fresh temp project dir; caller disposes via the returned cleanup. */
export async function tempProject(): Promise<{ dir: string; cleanup: () => Promise<void> }> {
  const dir = await mkdtemp(join(tmpdir(), 'hyle-e2e-'));
  return { dir, cleanup: () => rm(dir, { recursive: true, force: true }) };
}
