import { test, expect } from '@playwright/test';

test.describe('Fluxos Críticos do Sistema', () => {
  test.beforeEach(async ({ page }) => {
    // Em produção, aqui faríamos o login. Para testes E2E básicos, acessamos a home.
    await page.goto('/');
  });

  test('Deve navegar entre as principais rotas do Dashboard', async ({ page }) => {
    // Dashboard principal
    await expect(page).toHaveURL('/');
    
    // Navegação para Cotação de Frete
    await page.click('text=Cotação de Frete');
    await expect(page).toHaveURL('/cotacao');

    // Navegação para Central de Rastreamento
    await page.click('text=Rastreamento');
    await expect(page).toHaveURL('/rastreamento');

    // Navegação para Analytics
    await page.click('text=Analytics');
    await expect(page).toHaveURL('/analytics');
  });

  test('Deve realizar fluxo de cotação simulado', async ({ page }) => {
    await page.goto('/cotacao');
    
    // Preenche CEP de origem
    await page.fill('input[placeholder*="Origem"]', '01001-000');
    
    // Preenche CEP de destino
    await page.fill('input[placeholder*="Destino"]', '20040-002');
    
    // Clica em calcular
    await page.click('button:has-text("Calcular")');
    
    // Verifica se os cards de resultado aparecem (Skeleton desaparece)
    await expect(page.locator('.shipping-card')).toBeVisible({ timeout: 10000 });
  });

  test('Deve verificar integridade do Dashboard Executivo', async ({ page }) => {
    await page.goto('/dashboard-executivo');
    await expect(page.locator('text=Visão Geral do Negócio')).toBeVisible();
    await expect(page.locator('canvas')).toHaveCount.atLeast(1); // Gráficos renderizados
  });

  test('Deve validar painel de segurança e auditoria', async ({ page }) => {
    await page.goto('/seguranca');
    await expect(page.locator('text=Logs de Segurança')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });
});
