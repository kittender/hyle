import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { registryUp, runHyle, tempProject } from '../helpers/cli';

/**
 * Cross-stack scenario: author publishes via the CLI, a second visitor
 * discovers and tracks the blueprint through the web UI.
 *
 *   1. User A creates a blueprint and pushes it (v0.1.0).
 *   2. User B browses the site and searches the blueprint name.
 *   3. User B finds it and opens its detail page (sees v0.1.0).
 *   4. User A modifies 3 files and pushes a minor release (v0.2.0).
 *   5. User B refreshes the page and sees the new version.
 *
 * Drives the real CLI (bun) against the live registry, then the real web UI.
 */

// Unique per run so repeated suites don't collide on name+author+version.
const stamp = Date.now();
const NAME = `e2e-web-blueprint-${stamp}`;
const AUTHOR = `e2e-web-author-${stamp}`;

const FILES = ['CLAUDE.md', 'SPEC.md', 'NOTES.md'];

const manifest = (version: string) =>
  `name: ${NAME}\nauthor: ${AUTHOR}\nversion: ${version}\n` +
  `description: e2e cross-stack scenario\n` +
  `blueprint:\n  ontology:\n${FILES.map((f) => `    - ${f}`).join('\n')}\n`;

test('author publishes via CLI, visitor finds it and sees the minor release', async ({ page }) => {
  test.skip(!(await registryUp()), 'registry not reachable — run `docker compose up -d`');

  const author = await tempProject();
  try {
    // 1. User A: author a blueprint (manifest + 3 ontology files) and push v0.1.0.
    for (const f of FILES) await writeFile(join(author.dir, f), `# ${f}\nv1 from e2e.\n`);
    await writeFile(join(author.dir, 'hyle.yaml'), manifest('0.1.0'));

    const push1 = await runHyle(['push', '0.1.0', '--yes'], author.dir);
    expect(push1.exitCode, push1.stderr).toBe(0);

    // 2. User B: browse the site and search the blueprint name.
    await page.goto('/search');
    const input = page.locator('input.search-input');
    await input.fill(NAME);
    await input.press('Enter');

    // 3. User B: find the result and open its detail page.
    const result = page.locator('.result-row', { hasText: NAME });
    await expect(result).toBeVisible({ timeout: 10_000 });
    await result.click();

    await expect(page).toHaveURL(new RegExp(`/print/${AUTHOR}/${NAME}`));
    await expect(page.locator('.detail-title')).toContainText(NAME);
    await expect(page.locator('.meta-item--light')).toHaveText('v0.1.0');

    // 4. User A: modify all 3 files and push a minor release.
    //    `push` with no version arg = minor bump from the manifest (0.1.0 → 0.2.0).
    for (const f of FILES) await writeFile(join(author.dir, f), `# ${f}\nv2 from e2e — changed.\n`);
    const push2 = await runHyle(['push', '--yes'], author.dir);
    expect(push2.exitCode, push2.stderr).toBe(0);

    // 5. User B: refresh the page and see the new version.
    await page.reload();
    await expect(page.locator('.meta-item--light')).toHaveText('v0.2.0');
  } finally {
    await author.cleanup();
  }
});
