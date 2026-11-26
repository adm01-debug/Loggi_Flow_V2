import { expect, type Page } from "@playwright/test";

// Usuario semeado dedicado ao E2E. As credenciais vem dos secrets do repositorio
// (E2E_EMAIL / E2E_PASSWORD) - ver tests/e2e/README.md.
export const EMAIL = process.env.E2E_EMAIL ?? "";
export const SENHA = process.env.E2E_PASSWORD ?? "";

export function exigirCredenciais() {
  if (!EMAIL || !SENHA) {
    throw new Error(
      "defina E2E_EMAIL e E2E_PASSWORD (secrets do repositorio) - ver tests/e2e/README.md",
    );
  }
}

/** Login pela tela real (/auth) ate a sessao entrar. */
export async function autenticar(page: Page) {
  exigirCredenciais();
  await page.goto("/auth");
  await page.fill("#login-email", EMAIL);
  await page.fill("#login-password", SENHA);
  await page.locator('form:has(#login-email) button[type="submit"]').click();
  await expect(page).not.toHaveURL(/\/auth/, { timeout: 20_000 });
}

/** Titulo da tela de falha do ErrorBoundary - a suite usa a ausencia dele como sinal de saude. */
export const FALHA_CRITICA = "Recuperação de Falha Crítica";
