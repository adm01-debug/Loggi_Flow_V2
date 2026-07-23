import { describe, it, expect, beforeEach } from "vitest";
import {
  listScenarios,
  saveScenario,
  deleteScenario,
  clearScenarios,
  WHATIF_MAX_SCENARIOS,
  type ScenarioStore,
} from "./whatIfScenarios";
import type { WhatIfProjection } from "./whatIfSimulator";

class MemoryStore implements ScenarioStore {
  private data = new Map<string, string>();
  getItem(k: string) { return this.data.get(k) ?? null; }
  setItem(k: string, v: string) { this.data.set(k, v); }
}

function makeProjection(overrides: Partial<WhatIfProjection> = {}): WhatIfProjection {
  return {
    baselineOtif: 80,
    projectedOtif: 88,
    totalGain: 8,
    confidence: 0.6,
    selectedCount: 2,
    contributions: [
      { category: "clima", headline: "Ativar contingência climática", expectedGain: 5, source: "historico", measuredActions: 3 },
      { category: "transportadora", headline: "Renegociar SLA", expectedGain: 3, source: "estimado", measuredActions: 0 },
    ],
    ...overrides,
  };
}

let store: MemoryStore;
beforeEach(() => { store = new MemoryStore(); });

describe("whatIfScenarios", () => {
  it("retorna lista vazia quando storage está vazio ou corrompido", () => {
    expect(listScenarios(store)).toEqual([]);
    store.setItem("logiflow.whatif.scenarios.v1", "{{corrupted");
    expect(listScenarios(store)).toEqual([]);
    store.setItem("logiflow.whatif.scenarios.v1", '"not-array"');
    expect(listScenarios(store)).toEqual([]);
  });

  it("salva um cenário e recupera na lista", () => {
    const now = new Date("2026-07-23T12:00:00Z");
    const next = saveScenario(store, {
      name: "Cenário A",
      projection: makeProjection(),
      now,
      idFactory: () => "id-1",
    });
    expect(next).toHaveLength(1);
    expect(next[0].id).toBe("id-1");
    expect(next[0].createdAt).toBe(now.toISOString());
    expect(listScenarios(store)).toHaveLength(1);
  });

  it("rejeita salvar sem nome ou sem seleção", () => {
    expect(() => saveScenario(store, { name: "  ", projection: makeProjection() })).toThrow();
    expect(() =>
      saveScenario(store, { name: "X", projection: makeProjection({ selectedCount: 0, contributions: [] }) }),
    ).toThrow();
  });

  it("substitui cenário com mesmo nome (case-insensitive) e mantém no topo", () => {
    saveScenario(store, { name: "Blitz", projection: makeProjection(), idFactory: () => "a" });
    saveScenario(store, { name: "Outro", projection: makeProjection({ totalGain: 2 }), idFactory: () => "b" });
    const after = saveScenario(store, {
      name: "blitz",
      projection: makeProjection({ totalGain: 15, projectedOtif: 95 }),
      idFactory: () => "c",
    });
    expect(after).toHaveLength(2);
    expect(after[0].id).toBe("c");
    expect(after[0].totalGain).toBe(15);
    expect(after.find((s) => s.name === "Outro")).toBeDefined();
  });

  it("respeita o limite máximo de cenários salvos", () => {
    for (let i = 0; i < WHATIF_MAX_SCENARIOS + 5; i++) {
      saveScenario(store, {
        name: `S${i}`,
        projection: makeProjection(),
        idFactory: () => `id-${i}`,
      });
    }
    expect(listScenarios(store)).toHaveLength(WHATIF_MAX_SCENARIOS);
    expect(listScenarios(store)[0].name).toBe(`S${WHATIF_MAX_SCENARIOS + 4}`);
  });

  it("remove cenário por id", () => {
    saveScenario(store, { name: "A", projection: makeProjection(), idFactory: () => "a" });
    saveScenario(store, { name: "B", projection: makeProjection(), idFactory: () => "b" });
    const next = deleteScenario(store, "a");
    expect(next).toHaveLength(1);
    expect(next[0].id).toBe("b");
  });

  it("clearScenarios esvazia storage", () => {
    saveScenario(store, { name: "A", projection: makeProjection() });
    clearScenarios(store);
    expect(listScenarios(store)).toEqual([]);
  });
});
