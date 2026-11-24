import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ARQUIVO = join(process.cwd(), "supabase/functions/_shared/fetch-with-timeout.ts");
const src = readFileSync(ARQUIVO, "utf8");

/** O bloco de comentario do topo do arquivo (a unica documentacao do helper). */
function cabecalho(): string {
  const fim = src.indexOf("*/");
  expect(fim).toBeGreaterThan(-1);
  return src.slice(0, fim);
}

/** O corpo executavel, sem o comentario do topo. */
function corpo(): string {
  return src.slice(src.indexOf("*/") + 2);
}

describe("fetch-with-timeout: o comentario descreve o que o codigo faz (etapa 201)", () => {
  it("nao promete retentativa", () => {
    const mencoes = (cabecalho().match(/retr/gi) ?? []).map((m) => m.toLowerCase());
    // a unica mencao permitida e a negacao explicita
    expect(mencoes).toHaveLength(1);
    expect(cabecalho()).toContain("does NOT retry");
    expect(cabecalho()).not.toMatch(/retry logic|with retry|retries/i);
  });

  it("declara o tempo limite que o codigo realmente aplica", () => {
    const doComentario = /timeout \(default (\d+)s\)/.exec(cabecalho())?.[1];
    const doCodigo = /const \{ timeout = (\d+) \} = options;/.exec(corpo())?.[1];
    expect(doComentario).toBeTruthy();
    expect(doCodigo).toBeTruthy();
    // comentario em segundos, codigo em milissegundos
    expect(Number(doComentario) * 1000).toBe(Number(doCodigo));
  });

  it("sem referencias de auditoria sem lastro", () => {
    expect(src).not.toContain("Audit 10/10");
    expect(src).not.toContain("Dimension 19");
  });

  it("o corpo nao faz segunda tentativa, entao o comentario esta correto", () => {
    expect(corpo()).not.toMatch(/retr(y|ies)|attempt|backoff/i);
    expect((corpo().match(/await fetch\(/g) ?? [])).toHaveLength(1);
  });
});
