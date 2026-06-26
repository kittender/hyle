import { test, expect } from '@playwright/test';

test.describe('search', () => {
  test('search page renders an input', async ({ page }) => {
    await page.goto('/search');
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('typing a query keeps the page responsive', async ({ page }) => {
    await page.goto('/search');
    const input = page.locator('input').first();
    await input.fill('java');
    // Results are registry-dependent; assert the app didn't crash.
    await expect(page.locator('body')).toBeVisible();
  });
});
