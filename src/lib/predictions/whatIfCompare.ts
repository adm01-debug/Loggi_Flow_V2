/**
 * whatIfCompare — comparação determinística entre cenários What-if salvos
 * e/ou baseline atual. Puro e livre de I/O.
 */
import type { RootCauseCategory } from "./rootCauseAnalyzer";
import type { SavedScenario } from "./whatIfScenarios";

export interface ScenarioLike {
  id: string;
  name: string;
  baselineOtif: number;
  projectedOtif: number;
  totalGain: number;
  confidence: number;
  categories: readonly RootCauseCategory[];
}

export interface ScenarioDiff {
  a: ScenarioLike;
  b: ScenarioLike;
  gainDelta: number;            // b.totalGain - a.totalGain
  projectedDelta: number;       // b.projectedOtif - a.projectedOtif
  confidenceDelta: number;      // b.confidence - a.confidence
  baselineDrift: number;        // b.baselineOtif - a.baselineOtif (⚠ se ≠0)
  sharedCategories: RootCauseCategory[];
  onlyInA: RootCauseCategory[];
  onlyInB: RootCauseCategory[];
  jaccard: number;              // similaridade 0..1
  winner: "a" | "b" | "tie";    // por projectedOtif; empate → maior confiança
}

const r2 = (n: number) => Number(n.toFixed(2));

function decideWinner(a: ScenarioLike, b: ScenarioLike): "a" | "b" | "tie" {
  if (a.projectedOtif > b.projectedOtif + 1e-6) return "a";
  if (b.projectedOtif > a.projectedOtif + 1e-6) return "b";
  if (a.confidence > b.confidence + 1e-6) return "a";
  if (b.confidence > a.confidence + 1e-6) return "b";
  return "tie";
}

export function compareScenarios(a: ScenarioLike, b: ScenarioLike): ScenarioDiff {
  const setA = new Set(a.categories);
  const setB = new Set(b.categories);
  const shared: RootCauseCategory[] = [];
  const onlyA: RootCauseCategory[] = [];
  const onlyB: RootCauseCategory[] = [];
  for (const c of setA) (setB.has(c) ? shared : onlyA).push(c);
  for (const c of setB) if (!setA.has(c)) onlyB.push(c);
  const union = setA.size + setB.size - shared.length;
  const jaccard = union === 0 ? 1 : Number((shared.length / union).toFixed(3));

  return {
    a,
    b,
    gainDelta: r2(b.totalGain - a.totalGain),
    projectedDelta: r2(b.projectedOtif - a.projectedOtif),
    confidenceDelta: r2(b.confidence - a.confidence),
    baselineDrift: r2(b.baselineOtif - a.baselineOtif),
    sharedCategories: shared.sort(),
    onlyInA: onlyA.sort(),
    onlyInB: onlyB.sort(),
    jaccard,
    winner: decideWinner(a, b),
  };
}

export function toScenarioLike(s: SavedScenario): ScenarioLike {
  return {
    id: s.id,
    name: s.name,
    baselineOtif: s.baselineOtif,
    projectedOtif: s.projectedOtif,
    totalGain: s.totalGain,
    confidence: s.confidence,
    categories: s.categories,
  };
}
