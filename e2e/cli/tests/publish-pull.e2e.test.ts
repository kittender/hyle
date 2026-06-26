import { test, expect, beforeAll } from 'bun:test';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { registryUp, runHyle, tempProject } from '../helpers/registry';

let up = false;
beforeAll(async () => {
  up = await registryUp();
  if (!up) console.warn('⚠ registry not reachable — skipping CLI e2e (run `docker compose up -d`)');
});

// Unique per run so repeated suites don't collide on name+author+version.
const stamp = Date.now();
const NAME = `e2e-blueprint-${stamp}`;
const AUTHOR = `e2e-author-${stamp}`;

test('publish → pull round-trip against the live registry', async () => {
  if (!up) return;

  // 1. Author project: a manifest + one ontology file.
  const author = await tempProject();
  try {
    await writeFile(join(author.dir, 'CLAUDE.md'), `# ${NAME}\nHello from e2e.\n`);
    await writeFile(
      join(author.dir, 'hyle.yaml'),
      `name: ${NAME}\nauthor: ${AUTHOR}\nversion: 0.1.0\nmodels:\n  primary:\n    provider: anthropic\n    model: claude-sonnet-4-6\n  secondary:\n    provider: anthropic\n    model: claude-haiku-4-5-20251001\nblueprint:\n  ontology:\n    - CLAUDE.md\n`,
    );

    const push = await runHyle(['push', '0.1.0', '--yes'], author.dir);
    expect(push.exitCode).toBe(0);

    // 2. Consumer project: pull it back, expect the file to land.
    const consumer = await tempProject();
    try {
      const pull = await runHyle(['pull', `${AUTHOR}/${NAME}`, '--yes'], consumer.dir);
      expect(pull.exitCode).toBe(0);
      const pulled = await Bun.file(join(consumer.dir, 'CLAUDE.md')).text();
      expect(pulled).toContain('Hello from e2e.');
    } finally {
      await consumer.cleanup();
    }
  } finally {
    await author.cleanup();
  }
}, 60_000);
