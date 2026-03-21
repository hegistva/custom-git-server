import { test, expect } from '@playwright/test'
import crypto from 'crypto'

/**
 * End-to-end auth flow tests.
 *
 * These tests run against a live stack (frontend + backend + DB).
 * The baseURL is configured via PLAYWRIGHT_BASE_URL in playwright.config.ts.
 * They assume the backend is available at /api (proxied through nginx/Vite).
 */

test.describe('Auth flow', () => {
  // Generate a unique username per test run to avoid conflicts
  const uniqueSuffix = crypto.randomBytes(4).toString('hex')
  const testUsername = `e2euser_${uniqueSuffix}`
  const testEmail = `e2euser_${uniqueSuffix}@example.com`
  const testPassword = 'SecurePass1!'

  test('user can register and is redirected to dashboard', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible()

    await page.getByLabel('Username').fill(testUsername)
    await page.getByLabel('Email').fill(testEmail)
    await page.getByLabel('Password', { exact: true }).fill(testPassword)
    await page.getByLabel('Confirm password').fill(testPassword)
    await page.getByRole('button', { name: /create account/i }).click()

    // Should be redirected to dashboard after successful registration
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('user can log in after registration', async ({ page }) => {
    // Register first
    await page.goto('/register')
    await page.getByLabel('Username').fill(testUsername)
    await page.getByLabel('Email').fill(testEmail)
    await page.getByLabel('Password', { exact: true }).fill(testPassword)
    await page.getByLabel('Confirm password').fill(testPassword)
    await page.getByRole('button', { name: /create account/i }).click()
    await expect(page).toHaveURL(/\/dashboard/)

    // Log out via the UI button
    await page.getByRole('button', { name: /log out/i }).click()
    await expect(page).toHaveURL(/\/login/)

    // Log in
    await page.getByLabel('Username').fill(testUsername)
    await page.getByLabel('Password').fill(testPassword)
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('shows validation errors on empty login form', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page.getByText('Username is required')).toBeVisible()
    await expect(page.getByText('Password is required')).toBeVisible()
  })

  test('shows error message on invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Username').fill('nonexistent_user')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page.getByText('Invalid username or password')).toBeVisible()
  })

  test('protected route redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })
})
