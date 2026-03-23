import { test, expect } from '@playwright/test';
import { createE2ECredentials, createE2ERepoName, loginViaUi, registerUserViaApi } from './utils';

test.describe('Repository Management', () => {
  let credentials = createE2ECredentials('repo_user');

  test.beforeEach(async ({ page, request }) => {
    credentials = createE2ECredentials('repo_user');

    await registerUserViaApi(request, credentials);
    await loginViaUi(page, credentials);
  });

  test('creates a repository and deletes it', async ({ page }) => {
    const repoName = createE2ERepoName();

    // Navigate to new repository
    await page.getByRole('button', { name: /new repository/i }).click();
    await expect(page).toHaveURL('/repositories/new');

    // Fill form
    await page.getByLabel(/repository name \*/i).fill(repoName);
    await page.getByLabel(/description/i).fill('End to end testing repo');
    await page.getByRole('button', { name: /create repository/i }).click();

    // Redirection to repo page
    await expect(page).toHaveURL(`/repositories/${repoName}`);

    // Expect clone URLs
    await expect(page.getByText(`git clone ssh://`)).toBeVisible();
    await expect(page.getByText(`git clone http`)).toBeVisible();
    await expect(page.getByText('End to end testing repo')).toBeVisible();

    // Check dashboard has the repo
    await page.getByRole('link', { name: /back to dashboard/i }).click();
    await expect(page.getByRole('link', { name: repoName })).toBeVisible();

    // Navigate back to repo page
    await page.getByRole('link', { name: repoName }).click();
    await expect(page).toHaveURL(`/repositories/${repoName}`);

    // Delete repository
    await page.getByRole('button', { name: /delete repository/i, exact: true }).click();
    await expect(page.getByText(/are you sure/i)).toBeVisible();
    await page.getByRole('button', { name: /yes, delete/i }).click();

    // Redirected to dashboard and repo is gone
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('link', { name: repoName })).not.toBeVisible();
  });
});
