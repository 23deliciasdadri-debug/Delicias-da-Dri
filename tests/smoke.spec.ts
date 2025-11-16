import { test, expect } from '@playwright/test';

const shouldSkip = process.env.PLAYWRIGHT_BASE_URL == null && process.env.CI === 'true';

test.describe('Smoke flows', () => {
  test.skip(shouldSkip, 'Configure PLAYWRIGHT_BASE_URL apontando para uma instância rodando do app.');

  test('Carrega a página inicial', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Catálogo', { exact: false })).toBeVisible();
  });
});
