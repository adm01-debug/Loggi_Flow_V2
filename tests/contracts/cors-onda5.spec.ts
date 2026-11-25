import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Etapas 180-198 (achado B-07): dezenove funcoes respondiam com o curinga de
// CORS escrito a mao (`Access-Control-Allow-Origin: *`), o que permite que
// qualquer pagina da internet leia a resposta usando a sessao do visitante.
// Agora a origem e resolvida pelo helper compartilhado, que so devolve origem
// quando ela esta na allowlist.
const FUNCOES: Record<string, number> = {
  "resend-email": 3,
  "whatsapp-notification": 14,
  "push-send": 10,
  "new-device-alert": 4,
  "send-password-reset": 10,
  "validate-login": 8,
  "log-login-attempt": 4,
  "log-security-event": 6,
  "check-password-breach": 5,
  "bitrix24-integration": 18,
  "execute-protocol": 5,
  "ingest-biosync": 4,
  "ocr-receipt-processor": 4,
  "webhook-status": 5,
  "normalize-freight-response": 4,
  "nexus-auto-healing": 3,
  "accuracy-weekly-digest": 7,
  "geocode-address": 2,
};

const ler = (fn: string) =>
  readFileSync(join(process.cwd(), `supabase/functions/${fn}/index.ts`), "utf8");

describe("onda 5 de CORS: nenhuma funcao escreve mais o curinga a mao", () => {
  for (const [fn, respostas] of Object.entries(FUNCOES)) {
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

      it("nenhuma resposta perdeu o CORS resolvido (todas as respostas, menos o OPTIONS)", () => {
        expect(src.match(/new Response\(/g) ?? []).toHaveLength(respostas);
        expect(src.match(/\.\.\.headers/g) ?? []).toHaveLength(respostas - 1);
      });
    });
  }

  it("o preflight responde com os cabecalhos resolvidos", () => {
    for (const [fn] of Object.entries(FUNCOES)) {
      const src = ler(fn);
      const i = src.indexOf("OPTIONS");
      expect(i, fn).toBeGreaterThan(-1);
      const trecho = src.slice(i, i + 160);
      expect(trecho, fn).toMatch(/new Response\(.*\{ headers \}/);
      expect(trecho, fn).not.toContain("...headers");
    }
  });

  it("nenhuma das dezenove ficou com o curinga em qualquer cabecalho", () => {
    for (const [fn] of Object.entries(FUNCOES)) {
      expect(ler(fn), fn).not.toMatch(
        /['"]Access-Control-Allow-[A-Za-z]+['"]\s*:\s*['"]\*['"]/,
      );
    }
  });
});
