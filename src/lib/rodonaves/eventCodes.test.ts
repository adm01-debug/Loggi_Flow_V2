import { describe, it, expect } from "vitest";
import {
  collectExceptions,
  exceptionFromProcedaCode,
  isDelivered,
  lastNormalizedEvent,
  normalizeCode,
  normalizeRTEEvent,
  normalizeRTEEvents,
  phaseFromEventCode,
  phaseFromStepCode,
  type RTEPhase,
  type RTERawEvent,
} from "./eventCodes";

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

describe("normalizeCode", () => {
  it("normaliza nulos e vazios", () => {
    expect(normalizeCode(null)).toBe("");
    expect(normalizeCode(undefined)).toBe("");
    expect(normalizeCode("   ")).toBe("");
  });

  it("preserva subníveis decimais", () => {
    expect(normalizeCode("1.1")).toBe("1.1");
    expect(normalizeCode("1.10")).toBe("1.1");
    expect(normalizeCode(6)).toBe("6");
  });

  it("mantém códigos não numéricos intactos", () => {
    expect(normalizeCode("CTC")).toBe("CTC");
  });
});

describe("phaseFromEventCode", () => {
  const cases: Array<[string, RTEPhase]> = [
    ["0", "coletado"],
    ["1", "transferencia"],
    ["1.1", "distribuicao"],
    ["2", "no_destino"],
    ["3", "em_rota"],
    ["6", "entregue"],
  ];

  it.each(cases)("mapeia EventCode %s", (code, phase) => {
    expect(phaseFromEventCode(code)).toBe(phase);
  });

  it("usa o nível raiz para subníveis desconhecidos", () => {
    expect(phaseFromEventCode("3.7")).toBe("em_rota");
  });

  it("retorna desconhecido para código inválido", () => {
    expect(phaseFromEventCode("99")).toBe("desconhecido");
    expect(phaseFromEventCode(null)).toBe("desconhecido");
  });
});

describe("phaseFromStepCode", () => {
  it("mapeia a série 200", () => {
    expect(phaseFromStepCode("204")).toBe("coletado");
    expect(phaseFromStepCode("205")).toBe("transferencia");
    expect(phaseFromStepCode("209")).toBe("no_destino");
    expect(phaseFromStepCode("206")).toBe("em_rota");
    expect(phaseFromStepCode("1")).toBe("entregue");
  });

  it("não aplica fallback de subnível", () => {
    expect(phaseFromStepCode("205.1")).toBe("desconhecido");
  });
});

describe("exceptionFromProcedaCode", () => {
  it("ignora códigos operacionais", () => {
    for (const code of ["0", "1", "98", "99"]) {
      expect(exceptionFromProcedaCode(code)).toBeNull();
    }
  });

  it("classifica sinistros", () => {
    expect(exceptionFromProcedaCode("8")).toBe("avaria");
    expect(exceptionFromProcedaCode("9")).toBe("extravio");
    expect(exceptionFromProcedaCode("11")).toBe("devolucao");
  });

  it("retorna null para código não mapeado", () => {
    expect(exceptionFromProcedaCode("77")).toBeNull();
  });
});

describe("normalizeRTEEvent", () => {
  it("normaliza evento de entrega finalizada", () => {
    const event = normalizeRTEEvent({
      system: "event",
      eventCode: "6",
      procedaCode: "1",
      description: "Entrega finalizada (Recebedor: Maria)",
      date: "2026-05-01T12:00:00Z",
    });
    expect(event.phase).toBe("entregue");
    expect(event.exception).toBeNull();
    expect(event.isFinal).toBe(true);
    expect(event.severity).toBe("info");
    expect(event.rawCode).toBe("6/1");
  });

  it("prioriza o rótulo da exceção sobre a descrição bruta", () => {
    const event = normalizeRTEEvent({
      system: "event",
      eventCode: "3",
      procedaCode: "8",
      description: "texto qualquer da API",
    });
    expect(event.exception).toBe("avaria");
    expect(event.severity).toBe("critico");
    expect(event.label).toBe("Avaria na mercadoria");
    expect(event.isFinal).toBe(false);
  });

  it("nunca gera exceção no sistema de steps", () => {
    const event = normalizeRTEEvent({
      system: "step",
      stepCode: "206",
      procedaCode: "8",
    });
    expect(event.exception).toBeNull();
    expect(event.phase).toBe("em_rota");
    expect(event.rawCode).toBe("206");
  });
});

describe("normalizeRTEEvents", () => {
  it("descarta eventos de sistema divergente", () => {
    const events: RTERawEvent[] = [
      { system: "event", eventCode: "0", procedaCode: "0" },
      { system: "step", stepCode: "205" },
      { system: "event", eventCode: "6", procedaCode: "1" },
    ];
    const normalized = normalizeRTEEvents(events);
    expect(normalized).toHaveLength(2);
    expect(normalized.every((e) => e.system === "event")).toBe(true);
  });

  it("retorna vazio para lista vazia", () => {
    expect(normalizeRTEEvents([])).toEqual([]);
    expect(lastNormalizedEvent([])).toBeNull();
  });
});

describe("isDelivered / collectExceptions", () => {
  it("detecta trilha entregue", () => {
    expect(
      isDelivered([
        { system: "event", eventCode: "0", procedaCode: "0" },
        { system: "event", eventCode: "6", procedaCode: "1" },
      ]),
    ).toBe(true);
  });

  it("entrega com exceção não conta como final", () => {
    expect(
      isDelivered([{ system: "event", eventCode: "6", procedaCode: "12" }]),
    ).toBe(false);
  });

  it("coleta apenas eventos de exceção", () => {
    const exceptions = collectExceptions([
      { system: "event", eventCode: "0", procedaCode: "0" },
      { system: "event", eventCode: "3", procedaCode: "3" },
      { system: "event", eventCode: "3", procedaCode: "9" },
    ]);
    expect(exceptions.map((e) => e.exception)).toEqual(["recusa", "extravio"]);
  });
});

describe("fuzz — 500 cenários determinísticos", () => {
  const EVENT_CODES = ["0", "1", "1.1", "2", "3", "6", "7", "1.4", "", "abc"];
  const PROCEDA_CODES = [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "98",
    "99",
    "77",
    "",
  ];
  const STEP_CODES = ["1", "204", "205", "206", "209", "300", ""];

  // eslint-disable-next-line sonarjs/cognitive-complexity
  it("mantém invariantes em 500 trilhas aleatórias", () => {
    const rand = mulberry32(20260726);
    let processed = 0;

    for (let scenario = 0; scenario < 500; scenario += 1) {
      const useSteps = rand() < 0.5;
      const size = 1 + Math.floor(rand() * 8);
      const events: RTERawEvent[] = [];

      for (let i = 0; i < size; i += 1) {
        if (useSteps) {
          events.push({
            system: "step",
            stepCode: STEP_CODES[Math.floor(rand() * STEP_CODES.length)],
            date: new Date(1767225600000 + i * 3600000).toISOString(),
          });
        } else {
          events.push({
            system: "event",
            eventCode: EVENT_CODES[Math.floor(rand() * EVENT_CODES.length)],
            procedaCode:
              PROCEDA_CODES[Math.floor(rand() * PROCEDA_CODES.length)],
            date: new Date(1767225600000 + i * 3600000).toISOString(),
          });
        }
      }

      const normalized = normalizeRTEEvents(events);
      expect(normalized).toHaveLength(events.length);

      for (const event of normalized) {
        // Sistema preservado e homogêneo.
        expect(event.system).toBe(useSteps ? "step" : "event");
        // Steps jamais produzem exceção.
        if (useSteps) expect(event.exception).toBeNull();
        // Severidade crítica só existe com exceção crítica.
        if (event.severity === "critico") {
          expect(["avaria", "extravio", "devolucao"]).toContain(
            event.exception,
          );
        }
        // isFinal implica fase entregue sem exceção.
        if (event.isFinal) {
          expect(event.phase).toBe("entregue");
          expect(event.exception).toBeNull();
        }
        // Rótulo nunca vazio.
        expect(event.label.length).toBeGreaterThan(0);
        processed += 1;
      }

      // Exceções são subconjunto dos eventos normalizados.
      expect(collectExceptions(events).length).toBeLessThanOrEqual(
        normalized.length,
      );
    }

    expect(processed).toBeGreaterThan(500);
  });

  it("é determinístico entre execuções repetidas", () => {
    const build = () => {
      const rand = mulberry32(42);
      const events: RTERawEvent[] = Array.from({ length: 50 }, () => ({
        system: "event" as const,
        eventCode: EVENT_CODES[Math.floor(rand() * EVENT_CODES.length)],
        procedaCode: PROCEDA_CODES[Math.floor(rand() * PROCEDA_CODES.length)],
      }));
      return normalizeRTEEvents(events);
    };
    expect(build()).toEqual(build());
  });
});
