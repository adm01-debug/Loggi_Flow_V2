import { describe, it, expect } from "vitest";
import {
  analyzeRootCauses,
  classifyMotivo,
  delayHoursOf,
  hasDelay,
  normalizeMotivos,
  type PredictionRecord,
  type RootCauseCategory,
} from "./rootCauseAnalyzer";

// PRNG determinístico (mulberry32) para simulações reprodutíveis.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MOTIVOS_POOL: Array<[string, RootCauseCategory]> = [
  ["Forte chuva na região", "clima"],
  ["Alagamento na rodovia", "clima"],
  ["Feriado municipal", "feriado"],
  ["Ponto facultativo do cliente", "feriado"],
  ["Endereço de difícil acesso", "endereco"],
  ["CEP incorreto", "endereco"],
  ["Nota fiscal divergente", "documentacao"],
  ["CT-e pendente", "documentacao"],
  ["Distância superior a 800km", "distancia"],
  ["Rota longa por bloqueio", "distancia"],
  ["Alto volume de black friday", "demanda"],
  ["Pico sazonal de natal", "demanda"],
  ["Greve de motoristas", "transportadora"],
  ["Frota indisponível", "transportadora"],
  ["Motivo indefinido xyz", "outros"],
];

function makeRecord(seed: number, opts: Partial<PredictionRecord> = {}): PredictionRecord {
  const rand = mulberry32(seed);
  const idx = Math.floor(rand() * MOTIVOS_POOL.length);
  const motivosCount = 1 + Math.floor(rand() * 3);
  const motivos = Array.from({ length: motivosCount }, (_, i) => MOTIVOS_POOL[(idx + i) % MOTIVOS_POOL.length][0]);
  return {
    entity_id: `id-${seed}`,
    transportadora: ["Rodonaves", "Melhor Envio", "Lalamove", null][seed % 4],
    was_accurate: rand() > 0.4 ? false : true,
    actual_delay_hours: rand() > 0.5 ? Math.round(rand() * 48) : null,
    horas_estimadas_atraso: Math.round(rand() * 24),
    motivos,
    predicted_at: new Date(2026, 0, 1 + (seed % 30)).toISOString(),
    ...opts,
  };
}

describe("classifyMotivo", () => {
  it.each(MOTIVOS_POOL)("classifica %s corretamente", (motivo, category) => {
    expect(classifyMotivo(motivo)).toBe(category);
  });

  it("retorna 'outros' para strings vazias/nulas", () => {
    expect(classifyMotivo("")).toBe("outros");
    expect(classifyMotivo("   ")).toBe("outros");
  });
});

describe("normalizeMotivos", () => {
  it("normaliza array de strings", () => {
    expect(normalizeMotivos(["a", " b ", ""])).toEqual(["a", "b"]);
  });

  it("normaliza string separada por vírgulas", () => {
    expect(normalizeMotivos("chuva, feriado; cep")).toEqual(["chuva", "feriado", "cep"]);
  });

  it("retorna [] para nulo/objeto inesperado", () => {
    expect(normalizeMotivos(null)).toEqual([]);
    expect(normalizeMotivos(undefined)).toEqual([]);
    expect(normalizeMotivos(42)).toEqual([]);
  });

  it("descarta motivos absurdamente longos (> 500 chars)", () => {
    const long = "x".repeat(600);
    expect(normalizeMotivos([long, "ok"])).toEqual(["ok"]);
  });
});

describe("hasDelay / delayHoursOf", () => {
  it("hasDelay é true quando preditor errou", () => {
    expect(hasDelay(makeRecord(1, { was_accurate: false, actual_delay_hours: null }))).toBe(true);
  });
  it("hasDelay é true quando há atraso real > 0", () => {
    expect(hasDelay(makeRecord(1, { was_accurate: true, actual_delay_hours: 3 }))).toBe(true);
  });
  it("hasDelay é false quando acertou e sem atraso", () => {
    expect(hasDelay(makeRecord(1, { was_accurate: true, actual_delay_hours: 0 }))).toBe(false);
  });
  it("delayHoursOf prefere real, cai para estimativa", () => {
    expect(delayHoursOf(makeRecord(1, { actual_delay_hours: 5, horas_estimadas_atraso: 10 }))).toBe(5);
    expect(delayHoursOf(makeRecord(1, { actual_delay_hours: null, horas_estimadas_atraso: 10 }))).toBe(10);
    expect(delayHoursOf(makeRecord(1, { actual_delay_hours: null, horas_estimadas_atraso: 0 }))).toBe(0);
  });
});

describe("analyzeRootCauses", () => {
  it("retorna relatório vazio para input vazio", () => {
    const report = analyzeRootCauses([]);
    expect(report.totalAnalyzed).toBe(0);
    expect(report.totalWithDelay).toBe(0);
    expect(report.buckets).toEqual([]);
    expect(report.topCarrier).toBeNull();
    expect(report.topCategory).toBeNull();
  });

  it("ignora registros sem atraso", () => {
    const recs = [
      makeRecord(1, { was_accurate: true, actual_delay_hours: 0 }),
      makeRecord(2, { was_accurate: false, motivos: ["chuva forte"] }),
    ];
    const report = analyzeRootCauses(recs);
    expect(report.totalAnalyzed).toBe(2);
    expect(report.totalWithDelay).toBe(1);
    expect(report.topCategory).toBe("clima");
  });

  it("agrega múltiplos motivos em buckets distintos por registro", () => {
    const recs: PredictionRecord[] = [
      {
        entity_id: "a",
        transportadora: "Rodonaves",
        was_accurate: false,
        actual_delay_hours: 6,
        horas_estimadas_atraso: null,
        motivos: ["chuva forte", "greve de motoristas"],
        predicted_at: new Date().toISOString(),
      },
    ];
    const report = analyzeRootCauses(recs);
    const cats = report.buckets.map((b) => b.category).sort();
    expect(cats).toEqual(["clima", "transportadora"]);
    expect(report.buckets.every((b) => b.totalDelayHours === 6)).toBe(true);
  });

  it("classifica motivos vazios como 'outros'", () => {
    const recs: PredictionRecord[] = [
      {
        entity_id: "a",
        transportadora: null,
        was_accurate: false,
        actual_delay_hours: 2,
        horas_estimadas_atraso: null,
        motivos: [],
        predicted_at: new Date().toISOString(),
      },
    ];
    const report = analyzeRootCauses(recs);
    expect(report.buckets).toHaveLength(1);
    expect(report.buckets[0].category).toBe("outros");
    expect(report.topCarrier).toBe("desconhecida");
  });

  it("ordena buckets por contagem decrescente", () => {
    const recs = Array.from({ length: 10 }, (_, i) =>
      makeRecord(i + 100, {
        was_accurate: false,
        motivos: i < 7 ? ["chuva"] : ["greve"],
        actual_delay_hours: 1,
      }),
    );
    const report = analyzeRootCauses(recs);
    expect(report.buckets[0].category).toBe("clima");
    expect(report.buckets[0].count).toBeGreaterThan(report.buckets[1].count);
  });
});

describe("Fuzz — 500 cenários determinísticos", () => {
  it("mantém invariantes em 500 execuções aleatórias", () => {
    for (let seed = 1; seed <= 500; seed++) {
      const size = 1 + (seed % 25);
      const recs = Array.from({ length: size }, (_, i) => makeRecord(seed * 31 + i));
      const report = analyzeRootCauses(recs);
      // Invariantes:
      expect(report.totalAnalyzed).toBe(recs.length);
      expect(report.totalWithDelay).toBeLessThanOrEqual(recs.length);
      expect(report.totalWithDelay).toBeGreaterThanOrEqual(0);
      const sumCounts = report.buckets.reduce((acc, b) => acc + b.count, 0);
      // sum >= totalWithDelay (um registro pode contar em >=1 bucket)
      expect(sumCounts).toBeGreaterThanOrEqual(report.totalWithDelay);
      // buckets ordenados desc
      for (let i = 1; i < report.buckets.length; i++) {
        expect(report.buckets[i - 1].count).toBeGreaterThanOrEqual(report.buckets[i].count);
      }
      // Todas as horas não-negativas
      for (const b of report.buckets) {
        expect(b.totalDelayHours).toBeGreaterThanOrEqual(0);
        expect(b.sampleMotivos.length).toBeLessThanOrEqual(5);
      }
      // Se houve delay, deve existir topCategory + topCarrier
      if (report.totalWithDelay > 0) {
        expect(report.topCategory).not.toBeNull();
        expect(report.topCarrier).not.toBeNull();
      }
    }
  });
});
