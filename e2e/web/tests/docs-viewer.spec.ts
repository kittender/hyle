import { test, expect } from '@playwright/test';

// Covers the markdown viewer that exposes the whole web/docs tree.
test.describe('docs viewer', () => {
  test('renders the grouped sidebar with many sections', async ({ page }) => {
    await page.goto('/docs');
    await expect(page.locator('.docs-nav-group').first()).toBeVisible();
    // Whole tree is exposed, so expect well more than the old 7 hand-picked items.
    await expect.poll(() => page.locator('.docs-nav-item').count()).toBeGreaterThan(10);
  });

  test('deep-links to a section via ?section=', async ({ page }) => {
    await page.goto('/docs?section=reference/CLI_COMMANDS');
    await expect(page.locator('.docs-content')).toContainText(/hyle/i);
  });

  test('clicking a sidebar item swaps the content', async ({ page }) => {
    await page.goto('/docs');
    const content = page.locator('.docs-content');
    const before = (await content.textContent()) ?? '';
    await page.locator('.docs-nav-item').nth(3).click();
    await expect.poll(async () => (await content.textContent()) ?? '').not.toBe(before);
  });
});
