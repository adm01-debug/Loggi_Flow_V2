import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Etapa 179 (achado B-07): a funcao que guarda segredo respondia com
// `Access-Control-Allow-Origin: *` escrito a mao, o que deixa qualquer pagina
// da internet ler a resposta usando a sessao do visitante logado.
const src = readFileSync(
  join(process.cwd(), "supabase/functions/secure-store/index.ts"),
  "utf8",
);

describe("secure-store: CORS resolvido pela origem da requisicao", () => {
  it("nao tem mais o curinga de CORS escrito a mao", () => {
    expect(src).not.toContain("Access-Control-Allow-Origin");
    expect(src).not.toContain("Access-Control-Allow-Headers");
    expect(src).not.toContain('"*"');
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
      src.indexOf('req.method === "OPTIONS"'),
    );
  });

  it("todas as respostas usam os cabecalhos resolvidos", () => {
    const respostas = src.match(/new Response\(/g) ?? [];
    const comHeaders = src.match(/\.\.\.headers/g) ?? [];
    // 10 respostas: OPTIONS usa `{ headers }` direto, as outras 9 espalham.
    expect(respostas).toHaveLength(10);
    expect(comHeaders).toHaveLength(9);
    expect(src).toContain('return new Response("ok", { headers });');
  });

  it("o 429 continua com Retry-After e a origem resolvida", () => {
    const i = src.indexOf("status: 429");
    expect(i).toBeGreaterThan(-1);
    expect(src.slice(i, i + 220)).toContain('"Retry-After": String(rl.retryAfter ?? 60),');
    expect(src.slice(i, i + 220)).toContain("...headers,");
  });

  it("o limite de taxa e a autenticacao continuam antes de ler o corpo", () => {
    expect(src.indexOf('checkRateLimit(req, "secure-store"')).toBeLessThan(
      src.indexOf("await req.json()"),
    );
    expect(src.indexOf('req.headers.get("Authorization")')).toBeLessThan(
      src.indexOf("await req.json()"),
    );
  });

  it("o erro interno do padrao B-06 continua intacto (500, sem dado sensivel)", () => {
    const i = src.indexOf("  } catch (e) {");
    expect(i).toBeGreaterThan(-1);
    const bloco = src.slice(i);
    expect(bloco).toContain('log.error("secure-store error", { error: (e as Error).message });');
    expect(bloco).toContain('JSON.stringify({ error: "internal_error" })');
    expect(bloco).toContain("status: 500,");
    expect(bloco).not.toContain("plaintext");
  });
});
