import { test, expect } from '@playwright/test';
import { createE2ECredentials, registerUserViaUi, loginViaUi } from './utils';

/**
 * End-to-end auth flow tests.
 *
 * These tests run against a live stack (frontend + backend + DB).
 * The baseURL is configured via PLAYWRIGHT_BASE_URL in playwright.config.ts.
 * They assume the backend is available at /api (proxied through nginx/Vite).
 */

test.describe('Auth flow', () => {
  test('user can register and is redirected to dashboard', async ({ page }) => {
    const credentials = createE2ECredentials('auth_register');

    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();

    await registerUserViaUi(page, credentials);
  });

  test('user can log in after registration', async ({ page }) => {
    const credentials = createE2ECredentials('auth_login');

    await registerUserViaUi(page, credentials);

    // Log out via the UI button
    await page.getByRole('button', { name: /log out/i }).click();
    await expect(page).toHaveURL(/\/login/);

    await loginViaUi(page, credentials);
  });

  test('shows validation errors on empty login form', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText('Username is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('shows error message on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill('nonexistent_user');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.getByText('Invalid username or password')).toBeVisible();
  });

  test('protected route redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
