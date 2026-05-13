import { test, expect } from '@playwright/test';

test.describe('LogiFlow Smoke Tests', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    // Check for some common text or element
    await expect(page).toHaveTitle(/LogiFlow/i);
  });

  test('should redirect to auth if not logged in', async ({ page }) => {
    await page.goto('/dashboard');
    // Assuming /dashboard is protected
    await expect(page).toHaveURL(/\/auth/);
  });
});
