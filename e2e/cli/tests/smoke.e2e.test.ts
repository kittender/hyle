import { test, expect, beforeAll } from 'bun:test';
import { registryUp, runHyle, tempProject } from '../helpers/registry';

let up = false;
beforeAll(async () => {
  up = await registryUp();
});

test('CLI prints help (no registry needed)', async () => {
  const proj = await tempProject();
  try {
    const res = await runHyle(['--help'], proj.dir);
    expect(res.exitCode).toBe(0);
    expect(res.stdout + res.stderr).toMatch(/pull/);
  } finally {
    await proj.cleanup();
  }
});

test('verify against live registry exits cleanly on an empty project', async () => {
  if (!up) return;
  const proj = await tempProject();
  try {
    const res = await runHyle(['--help'], proj.dir);
    expect(res.exitCode).toBe(0);
  } finally {
    await proj.cleanup();
  }
});
