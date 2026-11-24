import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const HOOK = readFileSync(
  join(process.cwd(), "src/hooks/logistics/useAccuracyMetaCycle.ts"),
  "utf8",
);

/** Corpo do `rows.map(...)` — onde a consulta por transportadora acontecia. */
function corpoDoMap(): string {
  const inicio = HOOK.indexOf("const items: CycleItem[] = await Promise.all(");
  expect(inicio).toBeGreaterThan(-1);
  const fim = HOOK.indexOf("}),\n      );", inicio);
  expect(fim).toBeGreaterThan(inicio);
  return HOOK.slice(inicio, fim);
}

/** Sem as linhas de comentario: contagem de chamadas nao pode depender do texto do comentario. */
const SEM_COMENTARIOS = HOOK.split("\n")
  .filter((linha) => !linha.trim().startsWith("//"))
  .join("\n");

/** A consulta agregada, que fica antes do map. */
function consultaAgregada(): string {
  const inicio = HOOK.indexOf('.from("notifications")');
  expect(inicio).toBeGreaterThan(-1);
  const fim = HOOK.indexOf(";", inicio);
  return HOOK.slice(inicio, fim + 1);
}

describe("useAccuracyMetaCycle: uma consulta a notifications (etapa 217, P-03)", () => {
  it("nao consulta notifications dentro do laco por transportadora", () => {
    expect(corpoDoMap()).not.toContain('.from("notifications")');
    expect(corpoDoMap()).not.toContain('.limit(1)');
  });

  it("busca o historico uma vez, antes do laco", () => {
    const q = consultaAgregada();
    const consulta = HOOK.indexOf('.from("notifications")');
    const laco = HOOK.indexOf("const items: CycleItem[] = await Promise.all(");
    expect(consulta).toBeGreaterThan(-1);
    expect(laco).toBeGreaterThan(-1);
    expect(consulta).toBeLessThan(laco);
    expect(q).toContain('.eq("user_id", uid)');
    expect(q).toContain('.gte("created_at", dayAgoIso)');
    expect(q).toContain('.contains("metadata", { source: "accuracy-meta-monitor" })');
  });

  it("traz so o campo usado e com teto ordenado", () => {
    const q = consultaAgregada();
    expect(q).toContain('.select("metadata")');
    expect(q).toContain(".limit(500)");
    // teto sobre conjunto sem ordem corta de forma nao deterministica
    const ordem = q.indexOf('.order("created_at", { ascending: false })');
    expect(ordem).toBeGreaterThan(-1);
    expect(ordem).toBeLessThan(q.indexOf(".limit(500)"));
  });

  it("continua com duas consultas no arquivo: a agregada e a do ultimo alerta", () => {
    expect(HOOK.match(/from\("notifications"\)/g)?.length).toBe(2);
    expect(HOOK).toContain('.contains("metadata", { source: "accuracy-meta-monitor" })');
    expect(HOOK).toContain(".maybeSingle();");
  });

  it("compara em memoria pela mesma chave gravada pelo monitor", () => {
    expect(HOOK).toContain("const carriersNotificados = new Set<string | null>(");
    expect(HOOK).toContain("return meta?.carrier ?? null;");
    expect(HOOK).toContain(
      'const notified_in_cycle = carriersNotificados.has(s.transportadora ?? "__all__");',
    );
  });

  it("nao monta um contains por transportadora (limite de URL do PostgREST)", () => {
    expect(HOOK).not.toMatch(/\.contains\(\s*"metadata",\s*\{[^}]*carrier/);
    expect(SEM_COMENTARIOS.match(/\.contains\(/g)?.length).toBe(2);
  });

  it("nao toca na chamada de rpc (etapa 218, DDL)", () => {
    const corpo = corpoDoMap();
    expect(corpo).toContain("count_prediction_breach_days");
    expect(corpo).toContain("_target: s.target_pct,");
    expect(corpo).toContain("_carrier: s.transportadora,");
  });

  it("mantem a logica de status byte a byte", () => {
    expect(corpoDoMap()).toContain(
      [
        '          let status: CycleItem["status"] = "ok";',
        "          if (breach_days >= s.consecutive_days_alert) {",
        '            status = notified_in_cycle ? "notified" : "pending";',
        "          } else if (breach_days > 0) {",
        '            status = "warming";',
        "          }",
      ].join("\n"),
    );
  });

  it("mantem a janela de 24h e a recarga de 60s", () => {
    expect(HOOK).toContain("Date.now() - 24 * 60 * 60 * 1000");
    expect(HOOK).toContain("staleTime: 60_000,");
    expect(HOOK).toContain("refetchInterval: 60_000,");
  });
});
