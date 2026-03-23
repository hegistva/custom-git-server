import { expect, test } from '@playwright/test';

test('landing page is reachable', async ({ page }) => {
  await page.goto('/app');
  await expect(page.getByRole('heading', { name: 'Custom Git Hosting' })).toBeVisible();
});
