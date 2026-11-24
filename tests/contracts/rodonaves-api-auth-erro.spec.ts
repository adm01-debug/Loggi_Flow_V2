import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const EDGE = join(process.cwd(), "supabase/functions/rodonaves-api/index.ts");
const src = readFileSync(EDGE, "utf8");

function entre(inicio: string, fim: string): string {
  const i = src.indexOf(inicio);
  expect(i).toBeGreaterThan(-1);
  const j = src.indexOf(fim, i);
  expect(j).toBeGreaterThan(i);
  return src.slice(i, j);
}

const blocoLogin = entre(
  "const response = await fetchWithTimeout",
  "const data = await response.json();",
);

describe("rodonaves-api: erro de login nao carrega dado do parceiro", () => {
  it("a mensagem do erro de login nao interpola status nem corpo do parceiro", () => {
    expect(blocoLogin).not.toContain("Auth failed");
    expect(blocoLogin).not.toContain("${text}");
    expect(blocoLogin).not.toContain("${response.status}");
    expect(blocoLogin).toContain('"Falha de autenticacao na transportadora",');
  });

  it("o status e o corpo do parceiro vao para o log, com corte de tamanho", () => {
    expect(blocoLogin).toContain(
      'log.error("[rodonaves-api] Falha no login na RTE:", {',
    );
    expect(blocoLogin).toContain("status: response.status,");
    expect(blocoLogin).toContain("body: text.slice(0, 500),");
  });

  it("o erro de login mantem codigo, status HTTP e gateway do contrato", () => {
    expect(blocoLogin).toContain(
      '"Falha de autenticacao na transportadora",\n      "RTE_AUTH_FAILED",\n      502,\n      gateway,',
    );
  });

  it("o corpo do parceiro so aparece uma vez, no log", () => {
    expect(blocoLogin.split("await response.text()").length - 1).toBe(1);
    expect(blocoLogin.split("text").length - 1).toBe(3);
    expect(src).not.toContain("[${response.status}]");
  });

  it("o fluxo de token nao mudou: cache, validade e credencial obrigatoria", () => {
    expect(src).toContain(
      'throw new Error("RODONAVES credentials not configured");',
    );
    expect(src).toContain("expiresAt: Date.now() + 290 * 60_000,");
    expect(src).toContain("tokenCache[gateway] = {");
    expect(src).toContain(
      "if (cached && Date.now() < cached.expiresAt) return cached.token;",
    );
  });
});
