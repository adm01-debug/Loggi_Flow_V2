import { test, expect } from "@playwright/test";
import { FALHA_CRITICA, autenticar, exigirCredenciais } from "./helpers";

test.describe("LogiFlow E2E - caminhos criticos", () => {
  test("rota protegida manda quem nao entrou para o login", async ({
    page,
  }) => {
    await page.goto("/coletas");

    await expect(page).toHaveURL(/\/auth/, { timeout: 20_000 });
    await expect(page.locator("#login-email")).toBeVisible();
  });

  test("login com o usuario semeado chega na home sem Error Boundary", async ({
    page,
  }) => {
    exigirCredenciais();
    await autenticar(page);

    await expect(page.locator("#main-navigation")).toBeVisible();
    await expect(page.locator("body")).not.toContainText(FALHA_CRITICA);
  });

  test("modulos principais abrem sem quebrar a tela", async ({ page }) => {
    exigirCredenciais();
    await autenticar(page);

    for (const rota of [
      "/coletas",
      "/transportadoras",
      "/despachos",
      "/configuracoes",
    ]) {
      await page.goto(rota);
      await expect(page).toHaveURL(new RegExp(`${rota}/?$`), {
        timeout: 20_000,
      });
      await expect(page.locator("body")).not.toContainText(FALHA_CRITICA);
    }
  });
});
