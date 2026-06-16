import { test, expect } from '@playwright/test';
import { dismissOverlays, acceptCookieBannerIfVisible } from './helpers.js';

test.describe('Feed', () => {
  test.beforeEach(async ({ page }) => {
    await dismissOverlays(page);
  });

  test('home feed loads project cards', async ({ page }) => {
    await page.goto('/');
    await acceptCookieBannerIfVisible(page);

    const feedSearch = page.getByPlaceholder(/what type of design/i);
    await expect(feedSearch).toBeVisible();

    const masonry = page.locator('.projects-masonry');
    await expect(masonry).toBeVisible({ timeout: 20_000 });

    const cards = page.locator('.project-card');
    await expect(cards.first()).toBeVisible({ timeout: 20_000 });
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('category filter updates the feed', async ({ page }) => {
    await page.goto('/');
    await acceptCookieBannerIfVisible(page);

    await page.getByRole('button', { name: 'Design', exact: true }).click();

    await expect(page.locator('.projects-masonry .project-card').first()).toBeVisible({
      timeout: 20_000,
    });
  });
});
