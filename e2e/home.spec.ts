import { test, expect } from '@playwright/test';

test('halaman utama dapat dimuat', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Abi Homestay/i);
});
