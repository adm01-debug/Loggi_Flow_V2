/**
 * whatIfScenarios — persistência local de cenários What-if favoritos.
 * Puro sobre um `Storage` injetável (facilita testes determinísticos).
 */
import type { RootCauseCategory } from "./rootCauseAnalyzer";
import type { WhatIfProjection } from "./whatIfSimulator";

const STORAGE_KEY = "logiflow.whatif.scenarios.v1";
const MAX_SCENARIOS = 20;

export interface SavedScenario {
  id: string;
  name: string;
  createdAt: string; // ISO
  categories: RootCauseCategory[];
  baselineOtif: number;
  projectedOtif: number;
  totalGain: number;
  confidence: number;
}

export interface ScenarioStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function safeParse(raw: string | null): SavedScenario[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidScenario);
  } catch {
    return [];
  }
}

function isValidScenario(v: unknown): v is SavedScenario {
  if (!v || typeof v !== "object") return false;
  const s = v as Record<string, unknown>;
  return (
    typeof s.id === "string" &&
    typeof s.name === "string" &&
    typeof s.createdAt === "string" &&
    Array.isArray(s.categories) &&
    typeof s.baselineOtif === "number" &&
    typeof s.projectedOtif === "number" &&
    typeof s.totalGain === "number" &&
    typeof s.confidence === "number"
  );
}

export function listScenarios(store: ScenarioStore): SavedScenario[] {
  return safeParse(store.getItem(STORAGE_KEY));
}

export interface SaveInput {
  name: string;
  projection: WhatIfProjection;
  now?: Date;
  idFactory?: () => string;
}

export function saveScenario(store: ScenarioStore, input: SaveInput): SavedScenario[] {
  const name = input.name.trim();
  if (!name) throw new Error("Nome do cenário é obrigatório");
  if (input.projection.selectedCount === 0) {
    throw new Error("Selecione ao menos uma mitigação antes de salvar");
  }
  const now = input.now ?? new Date();
  const id = input.idFactory ? input.idFactory() : cryptoRandom();
  const scenario: SavedScenario = {
    id,
    name,
    createdAt: now.toISOString(),
    categories: input.projection.contributions.map((c) => c.category),
    baselineOtif: input.projection.baselineOtif,
    projectedOtif: input.projection.projectedOtif,
    totalGain: input.projection.totalGain,
    confidence: input.projection.confidence,
  };
  const current = listScenarios(store);
  const deduped = current.filter((s) => s.name.toLowerCase() !== name.toLowerCase());
  const next = [scenario, ...deduped].slice(0, MAX_SCENARIOS);
  store.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function deleteScenario(store: ScenarioStore, id: string): SavedScenario[] {
  const current = listScenarios(store);
  const next = current.filter((s) => s.id !== id);
  store.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function clearScenarios(store: ScenarioStore): void {
  store.setItem(STORAGE_KEY, "[]");
}

export const WHATIF_STORAGE_KEY = STORAGE_KEY;
export const WHATIF_MAX_SCENARIOS = MAX_SCENARIOS;

function cryptoRandom(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  return `wif_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
