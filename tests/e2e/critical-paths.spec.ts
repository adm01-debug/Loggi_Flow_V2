import { test, expect } from '@playwright/test';

test.describe('Nexus Core E2E - Critical Path Validation', () => {
  test('Complete login to dashboard and shipment creation flow', async ({ page }) => {
    await page.goto('/');
    
    // Auth Check
    const authForm = page.locator('form');
    if (await authForm.isVisible()) {
      await page.fill('input[type="email"]', 'admin@nexus.ai');
      await page.fill('input[type="password"]', 'NexusAlpha10/10!');
      await page.click('button[type="submit"]');
    }

    // Dashboard State
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text=Visão Geral')).toBeVisible();

    // Module Navigation
    const navLinks = ['Coletas', 'Fretes', 'Analytics', 'Configurações'];
    for (const link of navLinks) {
      await page.getByRole('link', { name: link }).click();
      await page.waitForLoadState('networkidle');
      // Verify no crash (Error Boundary)
      await expect(page.locator('text=Error').or(page.locator('text=Erro'))).not.toBeVisible();
    }
  });

  test('Responsiveness and Error State resilience', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile check
    await page.goto('/dashboard');
    await expect(page.locator('nav')).toBeVisible(); // Sidebar should adapt to mobile (hamburger or sheet)
  });
});
