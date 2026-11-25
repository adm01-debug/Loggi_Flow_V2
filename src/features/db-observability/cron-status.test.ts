import { describe, it, expect } from "vitest";
import { avaliarCronJob, avaliarCronJobs, interpretarSchedule, proximaOcorrencia } from "./cron-status";
import type { CronJobStatus } from "./types";

const job = (p: Partial<CronJobStatus> = {}): CronJobStatus => ({
  jobid: 1,
  jobname: "job",
  schedule: "* * * * *",
  active: true,
  last_start: null,
  last_status: null,
  last_duration_ms: null,
  ...p,
});

const iso = (s: string) => new Date(`${s}Z`);

describe("interpretarSchedule", () => {
  it("aceita os formatos que o banco usa hoje", () => {
    // Agendas reais conferidas em inventario/estado/banco.json (28 jobs).
    for (const agenda of [
      "* * * * *",
      "*/5 * * * *",
      "*/15 * * * *",
      "*/30 * * * *",
      "15 * * * *",
      "0 * * * *",
      "5 */6 * * *",
      "0 */6 * * *",
      "30 4 * * *",
      "0 9 * * 1",
      "0 5 * * 0",
      "0 2 1 * *",
      "0 3 1 * *",
    ]) {
      expect(interpretarSchedule(agenda), agenda).not.toBeNull();
    }
  });

  it("expande passo, faixa e lista", () => {
    expect([...interpretarSchedule("*/15 * * * *")!.minutos]).toEqual([0, 15, 30, 45]);
    expect([...interpretarSchedule("0 2-4 * * *")!.horas]).toEqual([2, 3, 4]);
    expect([...interpretarSchedule("0 1,13 * * *")!.horas]).toEqual([1, 13]);
  });

  it("recusa formato invalido em vez de chutar", () => {
    for (const invalido of ["", "@daily", "0 2 1 *", "60 * * * *", "0 25 * * *", "0 0 0 * *", "0 0 32 * *", "0 0 * 13 *", "0 0 * * 7", "*/0 * * * *", "1-5/0 * * * *", "5-1 * * * *"]) {
      expect(interpretarSchedule(invalido), invalido).toBeNull();
    }
  });
});

describe("proximaOcorrencia", () => {
  it("minuto, quarto de hora e diario", () => {
    expect(proximaOcorrencia("* * * * *", iso("2026-11-25T10:00:30"))!.toISOString()).toBe("2026-11-25T10:01:00.000Z");
    expect(proximaOcorrencia("*/15 * * * *", iso("2026-11-25T10:07:00"))!.toISOString()).toBe("2026-11-25T10:15:00.000Z");
    expect(proximaOcorrencia("30 4 * * *", iso("2026-11-25T04:30:00"))!.toISOString()).toBe("2026-11-26T04:30:00.000Z");
  });

  it("mensal espera o dia 1 do mes seguinte", () => {
    expect(proximaOcorrencia("0 2 1 * *", iso("2026-11-01T02:00:00"))!.toISOString()).toBe("2026-12-01T02:00:00.000Z");
    expect(proximaOcorrencia("0 3 1 * *", iso("2026-11-01T03:00:00"))!.toISOString()).toBe("2026-12-01T03:00:00.000Z");
  });

  it("semanal cai na proxima segunda", () => {
    expect(proximaOcorrencia("0 9 * * 1", iso("2026-11-27T12:00:00"))!.toISOString()).toBe("2026-11-30T09:00:00.000Z");
  });

  it("dia do mes e dia da semana restritos valem OR (regra do cron)", () => {
    // 2026-11-25 e quarta: a proxima segunda (30) vem antes do dia 1 (01/12).
    expect(proximaOcorrencia("0 0 1 * 1", iso("2026-11-25T12:00:00"))!.toISOString()).toBe("2026-11-30T00:00:00.000Z");
  });

  it("data que nunca existe devolve null", () => {
    expect(proximaOcorrencia("0 0 30 2 *", iso("2026-11-25T12:00:00"))).toBeNull();
  });
});

describe("avaliarCronJob", () => {
  const agora = iso("2026-11-25T12:00:00");

  it("ultima execucao com falha vira falha", () => {
    const r = avaliarCronJob(job({ last_status: "failed", last_start: "2026-11-25T11:45:00Z" }), agora);
    expect(r.situacao).toBe("falha");
  });

  it("*/15 sem rodar ha 40 min esta atrasado; ha 10 min esta ok", () => {
    const atrasado = job({ schedule: "*/15 * * * *", last_status: "succeeded", last_start: "2026-11-25T11:20:00Z" });
    expect(avaliarCronJob(atrasado, agora).situacao).toBe("atrasado");
    const ok = job({ schedule: "*/15 * * * *", last_status: "succeeded", last_start: "2026-11-25T11:50:00Z" });
    expect(avaliarCronJob(ok, agora).situacao).toBe("ok");
  });

  it("cron diario parado ha 2 dias esta atrasado (heartbeat)", () => {
    const parado = job({ schedule: "15 8 * * *", last_status: "succeeded", last_start: "2026-11-23T08:15:00Z" });
    expect(avaliarCronJob(parado, agora).situacao).toBe("atrasado");
  });

  it("mensal sem execucao no mes corrente NAO e atraso", () => {
    // Caso real de ensure-future-partitions-monthly e nexus_partition_retention (dia 1).
    const mensal = job({ schedule: "0 2 1 * *", last_status: "succeeded", last_start: "2026-11-01T02:00:00Z" });
    expect(avaliarCronJob(mensal, agora).situacao).toBe("ok");
  });

  it("inativo e parado; sem execucao e sem_historico; schedule ilegivel nao inventa atraso", () => {
    expect(avaliarCronJob(job({ active: false, last_status: "failed" }), agora).situacao).toBe("parado");
    expect(avaliarCronJob(job({ last_start: null }), agora).situacao).toBe("sem_historico");
    expect(avaliarCronJob(job({ schedule: "@daily", last_start: "2026-11-25T11:59:00Z" }), agora).situacao).toBe("ok");
    expect(avaliarCronJob(job({ last_start: "nao-e-data" }), agora).situacao).toBe("sem_historico");
  });
});

describe("avaliarCronJobs", () => {
  it("poe os problemas primeiro e resume o que a tela mostra", () => {
    const { itens, resumo } = avaliarCronJobs(
      [
        job({ jobid: 1, jobname: "ok", last_status: "succeeded", last_start: "2026-11-25T11:59:00Z" }),
        job({ jobid: 2, jobname: "velho", schedule: "0 3 * * *", last_status: "succeeded", last_start: "2026-11-01T03:00:00Z" }),
        job({ jobid: 3, jobname: "falhou", last_status: "failed", last_start: "2026-11-25T11:58:00Z" }),
        job({ jobid: 4, jobname: "inativo", active: false }),
        job({ jobid: 5, jobname: "novo" }),
      ],
      iso("2026-11-25T12:00:00"),
    );
    // "velho" (diario sem rodar ha 24 dias) tambem esta atrasado: falha -> atrasado -> resto.
    expect(itens.map((i) => i.job.jobname)).toEqual(["falhou", "velho", "novo", "inativo", "ok"]);
    expect(resumo).toEqual({
      total: 5,
      falha: 1,
      atrasado: 1,
      sem_historico: 1,
      parado: 1,
      ok: 1,
      em_alerta: 3,
    });
  });
});
