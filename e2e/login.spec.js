import { test, expect } from '@playwright/test';
import { dismissOverlays } from './helpers.js';

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await dismissOverlays(page);
  });

  test('login page renders email/password form', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('••••••••')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign up free/i })).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByPlaceholder('you@example.com').fill('invalid@example.com');
    await page.getByPlaceholder('••••••••').fill('wrong-password-123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page.locator('text=/invalid/i')).toBeVisible({ timeout: 15_000 });
  });

  test('authenticated login when E2E credentials are configured', async ({ page }) => {
    const email = process.env.E2E_TEST_EMAIL;
    const password = process.env.E2E_TEST_PASSWORD;
    test.skip(!email || !password, 'Set E2E_TEST_EMAIL and E2E_TEST_PASSWORD to run authenticated login');

    await page.goto('/login?redirectTo=/projects');

    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('••••••••').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.waitForURL(/\/projects/, { timeout: 20_000 });
    await expect(page).toHaveURL(/\/projects/);
  });
});
