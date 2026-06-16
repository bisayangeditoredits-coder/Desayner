import { test, expect } from '@playwright/test';
import { dismissOverlays, acceptCookieBannerIfVisible } from './helpers.js';

test.describe('Search', () => {
  test.beforeEach(async ({ page }) => {
    await dismissOverlays(page);
  });

  test('search results page loads for a query', async ({ page }) => {
    await page.goto('/search?q=design');
    await acceptCookieBannerIfVisible(page);

    await expect(page).toHaveURL(/\/search\?q=design/);
    await expect(page.getByRole('button', { name: /projects/i })).toBeVisible({ timeout: 15_000 });

    await expect
      .poll(async () => {
        const cards = await page.locator('.project-card').count();
        const empty = await page.getByText(/no projects found/i).isVisible().catch(() => false);
        return cards > 0 || empty;
      })
      .toBe(true);
  });

  test('feed hero search filters the home feed', async ({ page }) => {
    await page.goto('/');
    await acceptCookieBannerIfVisible(page);

    const feedSearch = page.getByPlaceholder(/what type of design/i);
    await expect(feedSearch).toBeVisible({ timeout: 10_000 });

    await feedSearch.fill('logo');
    await expect(page.locator('.projects-masonry .project-card').first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('header search navigates from non-home pages', async ({ page }) => {
    await page.goto('/projects');
    await acceptCookieBannerIfVisible(page);

    const headerSearch = page.locator('#global-search');
    await expect(headerSearch).toBeVisible({ timeout: 10_000 });

    await headerSearch.click();
    await headerSearch.pressSequentially('logo');
    await expect(headerSearch).toHaveValue('logo');

    await Promise.all([
      page.waitForURL(/\/search\?q=logo/, { timeout: 15_000 }),
      headerSearch.press('Enter'),
    ]);
    await expect(page).toHaveURL(/\/search\?q=logo/);
  });
});
