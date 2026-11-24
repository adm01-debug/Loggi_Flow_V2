import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const EDGE = join(
  process.cwd(),
  "supabase/functions/db-health-weekly-report/index.ts",
);
const src = readFileSync(EDGE, "utf8");

function entre(inicio: string, fim: string): string {
  const i = src.indexOf(inicio);
  expect(i).toBeGreaterThan(-1);
  const j = src.indexOf(fim, i);
  expect(j).toBeGreaterThan(i);
  return src.slice(i, j);
}

const blocoProvedor = entre(
  "const response = await safeFetch(",
  "const data = await response.json();",
);
const blocoCatch = entre("  } catch (err) {", "\n});");

describe("db-health-weekly-report: erro do provedor nao sai no relatorio", () => {
  it("a resposta do provedor nao vira mensagem da excecao", () => {
    expect(src).not.toContain("errBody");
    expect(src).not.toContain("Resend error [");
    expect(blocoProvedor).toContain(
      'throw new Error("Falha ao enviar o relatorio pelo provedor");',
    );
  });

  it("o corpo do provedor vai para o log, com o status e corte de tamanho", () => {
    expect(blocoProvedor).toContain(
      'log.error("[db-health-weekly-report] Provedor recusou o envio:", {',
    );
    expect(blocoProvedor).toContain("status: response.status,");
    expect(blocoProvedor).toContain(
      "body: (await response.text()).slice(0, 500),",
    );
  });

  it("o texto do provedor nao entra na mensagem nem no log do catch", () => {
    expect(blocoCatch).not.toContain("err.message");
    expect(blocoCatch).not.toContain("String(err)");
    expect(src).not.toContain("ok: false, error: msg");
  });

  it("o catch usa o helper da etapa 164", () => {
    expect(blocoCatch).toContain(
      'return internalErrorResponse(err, corsHeaders, "db-health-weekly-report");',
    );
  });

  it("a funcao continua sem CORS proprio (chamada por agendamento)", () => {
    expect(src).not.toContain("Access-Control-Allow-Origin");
    expect(src).not.toContain("getCorsHeaders");
  });

  it("o conteúdo do relatorio nao mudou", () => {
    expect(src).toContain("const buildHtml = (params: {");
    expect(src).toContain('admin.rpc("get_capacity_forecast_fast"');
    expect(src).toContain("from: \"LogiFlow <notificacoes@promobrindes.com.br>\",");
    expect(src).toContain(
      "JSON.stringify({ ok: true, sent: emails.length, resend_id: data.id })",
    );
  });

  it("a chave do provedor continua obrigatoria antes do envio", () => {
    expect(src).toContain('throw new Error("RESEND_API_KEY not configured")');
    expect(src.indexOf("RESEND_API_KEY not configured")).toBeLessThan(
      src.indexOf("api.resend.com"),
    );
  });
});
