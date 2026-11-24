import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Fechamento do achado B-07: as cinco funcoes que ficaram com o curinga de CORS
// escrito a mao e nao tinham etapa de CORS no plano. Como nas dezenove da onda
// 5, qualquer pagina da internet lia a resposta usando a sessao do visitante
// logado; agora a origem e resolvida pelo helper compartilhado, que so devolve
// origem quando ela esta na allowlist.
const FUNCOES: Record<string, { respostas: number; comHeaders: number }> = {
  "health": { respostas: 3, comHeaders: 2 },
  "rodonaves-webhook": { respostas: 8, comHeaders: 7 },
  "carrier-webhook-receiver": { respostas: 8, comHeaders: 7 },
  "nexus-webhook-receiver": { respostas: 13, comHeaders: 7 },
  "get-weather-data": { respostas: 3, comHeaders: 2 },
};

const ler = (fn: string) =>
  readFileSync(join(process.cwd(), `supabase/functions/${fn}/index.ts`), "utf8");

describe("B-07 fechado: as cinco ultimas funcoes tampouco escrevem o curinga", () => {
  for (const [fn, contagem] of Object.entries(FUNCOES)) {
    describe(fn, () => {
      const src = ler(fn);

      it("nao tem mais cabecalho de CORS escrito a mao", () => {
        expect(src).not.toContain("Access-Control-Allow-Origin");
        expect(src).not.toContain("Access-Control-Allow-Headers");
        expect(src).not.toMatch(/Access-Control-Allow-[A-Za-z]+/);
      });

      it("usa o helper compartilhado, nao a constante estatica", () => {
        expect(src).toContain('import { getCorsHeaders } from "../_shared/cors.ts";');
        expect(src).toContain("const headers = getCorsHeaders(req);");
        expect(src).not.toMatch(/\bcorsHeaders\b/);
        expect(src).not.toContain("corsResponse");
      });

      it("resolve a origem antes do preflight, senao o OPTIONS sai sem CORS", () => {
        expect(src.indexOf("getCorsHeaders(req)")).toBeGreaterThan(-1);
        expect(src.indexOf("getCorsHeaders(req)")).toBeLessThan(
          src.indexOf("OPTIONS"),
        );
      });

      it("nenhuma resposta perdeu o CORS resolvido", () => {
        expect(src.match(/new Response\(/g) ?? []).toHaveLength(contagem.respostas);
        expect(src.match(/\.\.\.headers/g) ?? []).toHaveLength(contagem.comHeaders);
      });
    });
  }

  it("o preflight responde com os cabecalhos resolvidos", () => {
    for (const fn of Object.keys(FUNCOES)) {
      const src = ler(fn);
      const i = src.indexOf("OPTIONS");
      expect(i, fn).toBeGreaterThan(-1);
      const trecho = src.slice(i, i + 160);
      expect(trecho, fn).toMatch(/new Response\(.*\{ headers \}/);
      expect(trecho, fn).not.toContain("...headers");
    }
  });

  it("nenhuma das cinco ficou com o curinga em qualquer cabecalho", () => {
    for (const fn of Object.keys(FUNCOES)) {
      expect(ler(fn), fn).not.toMatch(
        /['"]Access-Control-Allow-[A-Za-z]+['"]\s*:\s*['"]\*['"]/,
      );
    }
  });
});
