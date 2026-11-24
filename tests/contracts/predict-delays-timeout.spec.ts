import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const raiz = process.cwd();
const principal = readFileSync(
  join(raiz, "supabase/functions/predict-delays/index.ts"),
  "utf8",
);
const agendada = readFileSync(
  join(raiz, "supabase/functions/predict-delays-scheduled/index.ts"),
  "utf8",
);

function blocoDoAviso(): string {
  const inicio = principal.indexOf("let falhasAlerta = 0;");
  expect(inicio).toBeGreaterThan(-1);
  const fim = principal.indexOf("return new Response", inicio);
  expect(fim).toBeGreaterThan(inicio);
  return principal.slice(inicio, fim);
}

describe("predict-delays: aviso interno com tempo limite", () => {
  it("nao usa mais functions.invoke nos dois arquivos", () => {
    for (const src of [principal, agendada]) {
      expect(src).not.toMatch(/\.functions\.invoke\(/);
      expect(src).toContain(
        'import { invokeFunction } from "../_shared/invokeFunction.ts";',
      );
    }
  });

  it("mantem o corpo do aviso e conta cada envio que falhou", () => {
    const trecho = blocoDoAviso();
    expect(trecho).toContain('await invokeFunction("whatsapp-notification", {');
    expect(trecho).toContain('action: "send_delay_alert"');
    expect(trecho).toContain("phone,");
    expect(trecho).toContain("entrega_id:");
    expect(trecho).toContain("coleta_id:");
    expect(trecho).toContain("numero: prediction.numero,");
    expect(trecho).toMatch(/if \(!envio\.ok\) falhasAlerta \+= 1;/);
  });

  it("registra o resumo dos avisos que falharam, sem lancar", () => {
    expect(principal).toMatch(
      /if \(falhasAlerta > 0\) \{\s*log\("WARN", "Delay alerts not delivered", \{ falhas: falhasAlerta \}\);\s*\}/,
    );
    expect(blocoDoAviso()).not.toContain("throw ");
  });

  it("a execucao agendada usa tempo limite finito de 30 s", () => {
    expect(agendada).toMatch(/const PREDICT_TIMEOUT_MS = 30_000;/);
    expect(agendada).toMatch(/await invokeFunction\(\s*"predict-delays",/);
    expect(agendada).toContain("{ timeoutMs: PREDICT_TIMEOUT_MS },");
    expect(agendada).not.toContain("throw predErr");
  });

  it("a execucao agendada registra a falha com motivo e contagem", () => {
    expect(agendada).toMatch(
      /log\("ERROR", "Scheduled invocation of predict-delays failed", \{\s*reason: predResp\.reason,\s*status: predResp\.status,\s*falhas: 1,\s*\}\);/,
    );
    expect(agendada).toContain("?.predictions ?? [];");
  });
});
