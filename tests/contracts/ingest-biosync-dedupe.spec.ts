import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { bodyHash, buildEventKey } from "../../supabase/functions/_shared/eventKey";

const EDGE = join(process.cwd(), "supabase/functions/ingest-biosync/index.ts");
const src = readFileSync(EDGE, "utf8");

/** Trecho do parse ate a reivindicacao da chave: onde a identidade e montada. */
function trechoChave(): string {
  const inicio = src.indexOf("const eventTime =");
  expect(inicio).toBeGreaterThan(-1);
  const fim = src.indexOf("if (!eventKey)");
  expect(fim).toBeGreaterThan(inicio);
  return src.slice(inicio, fim);
}

describe("ingest-biosync: dedupe da telemetria (etapa 199, B-08)", () => {
  it("usa o helper compartilhado em vez de dedupe proprio", () => {
    expect(src).toContain(
      'import {\n  bodyHash,\n  buildEventKey,\n  claimIdempotencyKey,\n} from "../_shared/idempotency.ts";',
    );
    expect(src).toContain("await claimIdempotencyKey(eventKey.provider, eventKey.id)");
    // Nao inventa tabela de marcador nem chave caseira.
    expect(src).not.toContain("idempotency_keys");
    expect(src).not.toMatch(/const\s+\w*[Kk]ey\s*=\s*\$\{/);
  });

  it("a chave vem de identificadores estaveis e do horario DO EVENTO", async () => {
    const trecho = trechoChave();
    expect(trecho).toContain('await buildEventKey("biosync"');
    expect(trecho).toContain("vehicle_id,");
    expect(trecho).toContain("driver_id,");
    expect(trecho).toContain("identidade,");
    // Horario do corpo, nunca o relogio do servidor (esse anula a dedupe - B-02).
    expect(trecho).toContain("body.event_time");
    expect(trecho).toContain("body.timestamp");
    expect(trecho).not.toContain("new Date(");

    // Mesmo evento, duas chamadas: a chave tem de bater.
    const a = await buildEventKey("biosync", ["veic-1", "mot-1", "2026-11-25T10:00:00Z"]);
    const b = await buildEventKey("biosync", ["veic-1", "mot-1", "2026-11-25T10:00:00Z"]);
    expect(a?.key).toBe(b?.key);
    expect(a?.key).toBe("biosync:veic-1-mot-1-2026-11-25T10:00:00Z");
  });

  it("sem horario de evento a identidade e o hash do corpo, nao o fallback do helper", async () => {
    // O fallback do helper so age quando NENHUMA parte tem valor; com veiculo e
    // motorista sempre presentes ele nunca seria usado e toda leitura daquele
    // motorista viraria duplicata da primeira. Por isso o hash entra como parte.
    expect(trechoChave()).toContain("eventTime ?? `sha256-${await bodyHash(body)}`");

    const corpo = { driver_id: "mot-1", vehicle_id: "veic-1", heart_rate: 130 };
    const chave = async (b: unknown) =>
      (await buildEventKey("biosync", ["veic-1", "mot-1", `sha256-${await bodyHash(b)}`]))?.id;

    expect(await chave(corpo)).toMatch(/^veic-1-mot-1-sha256-[0-9a-f]{32}$/);
    // Reenvio do mesmo payload: mesma chave.
    expect(await chave(corpo)).toBe(await chave(corpo));
    // Batimento legitimo diferente: chave diferente.
    expect(await chave({ ...corpo, heart_rate: 131 })).not.toBe(await chave(corpo));
  });

  it("reivindica a chave ANTES de gravar telemetria, alerta e Bitrix24", () => {
    const posChave = src.indexOf("await claimIdempotencyKey(");
    const posTelemetria = src.indexOf('from("bio_sync_telemetry")');
    const posTactical = src.indexOf('from("nexus_tactical_logs")');
    const posBitrix = src.indexOf('invokeFunction("bitrix24-integration"');
    for (const pos of [posTelemetria, posTactical, posBitrix]) expect(pos).toBeGreaterThan(-1);
    expect(posChave).toBeLessThan(posTelemetria);
    expect(posChave).toBeLessThan(posTactical);
    expect(posChave).toBeLessThan(posBitrix);
  });

  it("duplicata responde 200 com duplicate:true, para o dispositivo nao reenviar", () => {
    const inicio = src.indexOf("const idem = await claimIdempotencyKey(");
    expect(inicio).toBeGreaterThan(-1);
    const trecho = src.slice(inicio, src.indexOf('from("bio_sync_alert_rules")', inicio));
    expect(trecho).toContain("if (idem.duplicate) {");
    expect(trecho).toContain("duplicate: true");
    expect(trecho).toContain("status: 200");
    expect(trecho).not.toMatch(/status: (4\d\d|5\d\d)/);
  });

  it("nao expoe o valor medido em texto claro na chave (LGPD)", () => {
    const trecho = trechoChave();
    expect(trecho).not.toContain("heart_rate");
    expect(trecho).not.toContain("fatigue_index");
  });

  it("a telemetria continua sendo gravada e devolvida", () => {
    expect(src).toContain("heart_rate, // validado");
    expect(src).toContain('return new Response(JSON.stringify(telemetry)');
  });
});
