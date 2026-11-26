import { test, expect } from "@playwright/test";
import { autenticar, exigirCredenciais } from "./helpers";

test.describe("LogiFlow E2E - shell e dashboard", () => {
  test("a home autentica e carrega o shell do produto", async ({ page }) => {
    exigirCredenciais();
    await autenticar(page);

    await expect(page).toHaveTitle(/LogiFlow/i, { timeout: 20_000 });
    await expect(page.locator("#main-navigation")).toBeVisible();
  });

  test("rota inexistente mostra a tela de 404", async ({ page }) => {
    await page.goto("/rota-que-nao-existe");

    await expect(page.getByText("404").first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test("a tela de login funciona em viewport de celular", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/auth");

    await expect(page.locator("#login-email")).toBeVisible();
    await expect(page.locator("#login-password")).toBeVisible();
  });
});
