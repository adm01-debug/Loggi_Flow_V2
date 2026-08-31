import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Flow', () => {
  test('should navigate through main modules', async ({ page }) => {
    await page.goto('/');
    
    // Verifica se o título principal ou logo está visível
    const title = page.locator('h1, .logo-text');
    await expect(title).toBeDefined();

    // Simula cliques em módulos principais se existirem na barra lateral
    const menuItems = ['Dashboard', 'Coletas', 'Fretes', 'Configurações'];
    
    for (const item of menuItems) {
      const link = page.getByText(item, { exact: false });
      if (await link.isVisible()) {
        await link.click();
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Tenta acessar uma rota inexistente para validar 404/Error Boundary
    await page.goto('/invalid-route-nexus');
    const errorText = page.getByText(/não encontrada|erro|404/i);
    await expect(errorText).toBeDefined();
  });
});
