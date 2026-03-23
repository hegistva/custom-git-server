import { expect, type APIRequestContext, type Page } from '@playwright/test';

function uniqueSuffix(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

export interface E2ECredentials {
  username: string;
  email: string;
  password: string;
}

export function createE2ECredentials(prefix = 'e2euser'): E2ECredentials {
  const suffix = uniqueSuffix();
  const username = `${prefix}_${suffix}`;

  return {
    username,
    email: `${username}@example.com`,
    password: 'SecurePass1!',
  };
}

export function createE2ERepoName(prefix = 'test-repo'): string {
  const suffix = uniqueSuffix();
  return `${prefix}-${suffix}`;
}

export async function registerUserViaApi(
  request: APIRequestContext,
  credentials: E2ECredentials,
): Promise<void> {
  const response = await request.post('/api/auth/register', {
    data: {
      username: credentials.username,
      email: credentials.email,
      password: credentials.password,
      confirmPassword: credentials.password,
    },
  });

  if (!response.ok()) {
    const body = await response.text();
    throw new Error(`Registration failed (${response.status()}): ${body}`);
  }
}

export async function registerUserViaUi(page: Page, credentials: E2ECredentials): Promise<void> {
  await page.goto('/register');

  await page.getByLabel('Username').fill(credentials.username);
  await page.getByLabel('Email').fill(credentials.email);
  await page.getByLabel('Password', { exact: true }).fill(credentials.password);
  await page.getByLabel('Confirm password').fill(credentials.password);
  await page.getByRole('button', { name: /create account/i }).click();

  await expect(page).toHaveURL(/\/dashboard/);
}

export async function loginViaUi(page: Page, credentials: E2ECredentials): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Username').fill(credentials.username);
  await page.getByLabel('Password').fill(credentials.password);
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page).toHaveURL('/dashboard');
}
