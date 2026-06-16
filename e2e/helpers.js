/** Dismiss cookie banner and welcome modal so they do not block interactions. */
export async function dismissOverlays(page) {
  await page.addInitScript(() => {
    localStorage.setItem('cookie_consent', 'true');
    localStorage.setItem('hasSeenWelcome', 'true');
  });
}

export async function acceptCookieBannerIfVisible(page) {
  const accept = page.getByRole('button', { name: /accept/i });
  if (await accept.isVisible({ timeout: 2000 }).catch(() => false)) {
    await accept.click();
  }
}
