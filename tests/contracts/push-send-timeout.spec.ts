import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const EDGE = join(process.cwd(), "supabase/functions/push-send/index.ts");
const src = readFileSync(EDGE, "utf8");
const HELPER = join(process.cwd(), "supabase/functions/_shared/fetch-with-timeout.ts");

/** O laço de envio, do `for` ate o fim do `catch`. */
function trechoEnvio(): string {
  const inicio = src.indexOf("for (const sub of subs)");
  expect(inicio).toBeGreaterThan(-1);
  const fim = src.indexOf("log.info(", inicio);
  expect(fim).toBeGreaterThan(inicio);
  return src.slice(inicio, fim);
}

describe("push-send: tempo limite no envio ao provedor de push (etapa 200, B-09)", () => {
  it("passa tempo limite explicito em cada envio", () => {
    const trecho = trechoEnvio();
    expect(trecho).toContain("await webpush.sendNotification(");
    // terceiro argumento: as opcoes que a biblioteca repassa ao request HTTPS
    expect(trecho).toMatch(/\},\s*payload,\s*\{ timeout: PUSH_TIMEOUT_MS \},/);
    expect(src).toContain("const PUSH_TIMEOUT_MS = 10000;");
  });

  it("usa o mesmo valor do helper compartilhado de tempo limite", () => {
    const helper = readFileSync(HELPER, "utf8");
    const doHelper = /const \{ timeout = (\d+) \} = options;/.exec(helper);
    const daEdge = /const PUSH_TIMEOUT_MS = (\d+);/.exec(src);
    expect(doHelper?.[1]).toBeTruthy();
    expect(daEdge?.[1]).toBe(doHelper?.[1]);
  });

  it("o estouro vira falha da inscricao, nao do lote", () => {
    const trecho = trechoEnvio();
    expect(trecho).toContain("const estourou = isPushTimeout(e);");
    expect(trecho).toContain('error: estourou');
    expect(trecho).toContain('? "timeout"');
    // o laco continua com as demais inscricoes depois do erro
    expect(trecho).not.toContain("throw ");
    expect(trecho).not.toContain("break;");
  });

  it("reconhece o estouro sem confundir com resposta do provedor", () => {
    const trecho = src.slice(0, src.indexOf("serve(async"));
    expect(trecho).toContain("function isPushTimeout(e: unknown): boolean {");
    expect(trecho).toContain('if (err?.statusCode) return false;');
    expect(trecho).toContain('/timeout/i.test(err?.message ?? "")');
  });

  it("tempo limite nao apaga inscricao - so 404/410 apagam", () => {
    const trecho = trechoEnvio();
    const posDelete = trecho.indexOf('from("push_subscriptions")');
    expect(posDelete).toBeGreaterThan(-1);
    const guarda = trecho.slice(trecho.indexOf("if (err.statusCode === 404"), posDelete);
    expect(guarda).toContain("err.statusCode === 410");
    // o delete esta dentro da guarda de 404/410, nao no caminho do estouro
    expect(trecho.indexOf("const estourou")).toBeLessThan(
      trecho.indexOf("if (err.statusCode === 404"),
    );
  });

  it("nao retenta o envio que estourou (cada reenvio e notificacao repetida)", () => {
    const trecho = trechoEnvio();
    const envios = trecho.match(/webpush\.sendNotification\(/g) ?? [];
    expect(envios).toHaveLength(1);
    expect(trecho).not.toMatch(/retry|retentativa|attempt/);
    expect(src).not.toMatch(/while \(|for \(let attempt/);
  });

  it("a resposta do lote continua com sent/failed/errors", () => {
    expect(src).toContain("sent,");
    expect(src).toContain("failed,");
    expect(src).toContain("errors: errors.slice(0, 10),");
  });
});
