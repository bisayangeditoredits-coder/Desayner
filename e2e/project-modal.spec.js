import { test, expect } from '@playwright/test';
import { dismissOverlays, acceptCookieBannerIfVisible } from './helpers.js';

test.describe('Project modal', () => {
  test.beforeEach(async ({ page }) => {
    await dismissOverlays(page);
  });

  test('opens project in modal from feed and closes with back', async ({ page }) => {
    await page.goto('/');
    await acceptCookieBannerIfVisible(page);

    const firstCard = page.locator('.project-card__thumb-link').first();
    await expect(firstCard).toBeVisible({ timeout: 20_000 });

    const href = await firstCard.getAttribute('href');
    expect(href).toMatch(/^\/projects\//);

    await firstCard.click();

    const modalOverlay = page.locator('.modal-overlay');
    await expect(modalOverlay).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('button', { name: 'Close' })).toBeVisible();

    await page.getByRole('button', { name: 'Close' }).click();
    await expect(modalOverlay).toBeHidden({ timeout: 10_000 });
  });

  test('project detail loads inside modal', async ({ page }) => {
    await page.goto('/');
    await acceptCookieBannerIfVisible(page);

    await page.locator('.project-card__thumb-link').first().click();

    await expect(page.locator('.modal-overlay')).toBeVisible({ timeout: 15_000 });
    await expect(
      page.locator('.project-detail__gallery, .project-detail__loading, .project-detail__not-found').first()
    ).toBeVisible({ timeout: 20_000 });
  });
});
