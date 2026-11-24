import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const EDGE = join(process.cwd(), "supabase/functions/ingest-biosync/index.ts");
const src = readFileSync(EDGE, "utf8");

function trechoDoAlerta(): string {
  const inicio = src.indexOf('await invokeFunction("bitrix24-integration"');
  expect(inicio).toBeGreaterThan(-1);
  const fim = src.indexOf("if (!aviso.ok)", inicio);
  expect(fim).toBeGreaterThan(inicio);
  return src.slice(inicio, src.indexOf("}", fim) + 1);
}

describe("ingest-biosync: aviso crítico ao Bitrix24", () => {
  it("usa o helper com tempo limite e não tem fetch cru", () => {
    expect(src).not.toMatch(/await fetch\(/);
    expect(src).toContain(
      'import { invokeFunction } from "../_shared/invokeFunction.ts";',
    );
    expect(trechoDoAlerta()).toContain(
      'await invokeFunction("bitrix24-integration", {',
    );
  });

  it("mantém o corpo que o CRM já recebia", () => {
    const trecho = trechoDoAlerta();
    expect(trecho).toContain('action: "notify_alert"');
    expect(trecho).toContain("CRITICAL HEART RATE DETECTED: ${heart_rate} BPM");
    expect(trecho).toContain('severity: "crit"');
    expect(trecho).toContain("vehicle_id,");
    expect(trecho).toContain("driver_id,");
  });

  it("falha do CRM só registra o motivo, sem lançar e sem batimento no log", () => {
    expect(src).toMatch(
      /if \(!aviso\.ok\) \{\s*log\.error\("Failed to notify Bitrix24:", \{ reason: aviso\.reason \}\);\s*\}/,
    );
    expect(src).not.toContain("Failed to notify Bitrix24: ${heart_rate}");
    expect(src).not.toContain(
      'log.error("Failed to notify Bitrix24:", heart_rate',
    );
  });

  it("a resposta de sucesso continua sendo a telemetria gravada", () => {
    const posAlerta = src.indexOf('invokeFunction("bitrix24-integration"');
    const posResposta = src.indexOf(
      "return new Response(JSON.stringify(telemetry)",
    );
    expect(posResposta).toBeGreaterThan(posAlerta);
    const entreAlertaEResposta = src.slice(posAlerta, posResposta);
    expect(entreAlertaEResposta).toContain(
      'log.error("Failed to notify Bitrix24:", { reason: aviso.reason });',
    );
    expect(entreAlertaEResposta).not.toContain("throw ");
  });
});
