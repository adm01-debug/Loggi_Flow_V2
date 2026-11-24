import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { listCapabilities } from "./capabilities";

const EDGE = join(
  process.cwd(),
  "supabase/functions/rodonaves-api/index.ts",
);

function acoesDoGateway(): string[] {
  const src = readFileSync(EDGE, "utf8");
  return [...src.matchAll(/case "([a-z0-9-]+)":/g)].map((m) => m[1]);
}

describe("matriz de capacidades x gateway", () => {
  it("toda acao exposta pelo gateway tem entrada na matriz", () => {
    const naMatriz = new Set(listCapabilities().map((c) => c.action));
    const semEntrada = acoesDoGateway().filter((a) => !naMatriz.has(a));
    expect(semEntrada).toEqual([]);
  });

  it("nenhuma entrada da matriz aponta para acao inexistente", () => {
    const gateway = new Set(acoesDoGateway());
    const fantasmas = listCapabilities().map((c) => c.action).filter(
      (a) => !gateway.has(a),
    );
    expect(fantasmas).toEqual([]);
  });

  it("o gateway expoe pelo menos 60 acoes", () => {
    expect(acoesDoGateway().length).toBeGreaterThanOrEqual(60);
  });
});
