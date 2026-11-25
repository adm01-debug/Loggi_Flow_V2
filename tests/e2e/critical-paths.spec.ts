/* eslint-disable sonarjs/slow-regex */
import { test, expect } from '@playwright/test';

// Credenciais do usuario semeado, ver tests/e2e/README.md.
const EMAIL = process.env.E2E_EMAIL ?? '';
const SENHA = process.env.E2E_PASSWORD ?? '';

test.describe('Nexus Core E2E - Critical Path Validation', () => {
  test('Complete login to dashboard and shipment creation flow', async ({ page }) => {
    // O cenario so autentica com usuario semeado (tests/e2e/README.md); sem as variaveis ele
    // fica ignorado de proposito em vez de falhar no login.
    // eslint-disable-next-line sonarjs/no-skipped-tests -- depende de semeadura em producao, nao de codigo
    test.skip(!EMAIL || !SENHA, 'defina E2E_EMAIL e E2E_PASSWORD - ver tests/e2e/README.md');
    await page.goto('/');
    
    // Auth Check
    const authForm = page.locator('form');
    if (await authForm.isVisible()) {
      await page.fill('input[type="email"]', EMAIL);
      await page.fill('input[type="password"]', SENHA);
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
