import { test, expect } from '@playwright/test';

test.describe('landing', () => {
  test('loads and shows the product name', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Hyl/i);
    await expect(page.getByText(/Hyl/i).first()).toBeVisible();
  });

  test('can navigate to docs', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /docs/i }).first().click();
    await expect(page).toHaveURL(/\/docs/);
  });
});
