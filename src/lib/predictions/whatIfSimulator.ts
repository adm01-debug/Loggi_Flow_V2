/**
 * whatIfSimulator — projeta o impacto combinado de mitigações selecionadas.
 * Determinístico e puro para permitir simulação massiva de cenários.
 *
 * Modelo:
 *  - Ganho por categoria = Δ OTIF histórico (quando measured>0) ou estimativa
 *    conservadora baseada em impactScore (impactScore/100 * 5 pts).
 *  - Combinação usa "diminishing returns" (produto complementar) para evitar
 *    somas ingênuas: combinedGain = MAX_CAP * (1 - Π(1 - gᵢ/MAX_CAP)).
 *  - Confiança = média ponderada da quantidade de medidas históricas.
 */
import type { RankedMitigation } from "./mitigationRecommender";
import type { RootCauseCategory } from "./rootCauseAnalyzer";

export const WHATIF_MAX_CAP = 25; // pts de OTIF máximos por rodada de mitigações

export interface WhatIfContribution {
  category: RootCauseCategory;
  headline: string;
  expectedGain: number;      // pts OTIF projetados (isolado)
  source: "historico" | "estimado";
  measuredActions: number;
}

export interface WhatIfProjection {
  baselineOtif: number;
  projectedOtif: number;      // clamp em [0, 100]
  totalGain: number;          // combinado (pts)
  contributions: WhatIfContribution[];
  confidence: number;         // 0..1
  selectedCount: number;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function estimateGain(m: RankedMitigation): { gain: number; source: "historico" | "estimado" } {
  if (m.roiMeasured > 0 && m.roiAvgDelta != null && Number.isFinite(m.roiAvgDelta)) {
    return { gain: clamp(m.roiAvgDelta, -WHATIF_MAX_CAP, WHATIF_MAX_CAP), source: "historico" };
  }
  // Estimativa: até 5 pts para impactScore=100
  return { gain: (m.impactScore / 100) * 5, source: "estimado" };
}

export function simulateWhatIf(
  suggestions: readonly RankedMitigation[],
  selected: ReadonlySet<RootCauseCategory>,
  baselineOtif: number,
): WhatIfProjection {
  const safeBaseline = clamp(Number.isFinite(baselineOtif) ? baselineOtif : 0, 0, 100);
  const picks = suggestions.filter((s) => selected.has(s.category));

  const contributions: WhatIfContribution[] = picks.map((m) => {
    const { gain, source } = estimateGain(m);
    return {
      category: m.category,
      headline: m.headline,
      expectedGain: Number(gain.toFixed(2)),
      source,
      measuredActions: m.roiMeasured,
    };
  });

  // Ganhos positivos usam diminishing returns; perdas somam diretamente
  let complement = 1;
  let negativeSum = 0;
  for (const c of contributions) {
    if (c.expectedGain > 0) {
      complement *= 1 - c.expectedGain / WHATIF_MAX_CAP;
    } else {
      negativeSum += c.expectedGain;
    }
  }
  const positiveCombined = WHATIF_MAX_CAP * (1 - complement);
  const totalGain = Number((positiveCombined + negativeSum).toFixed(2));
  const projectedOtif = Number(clamp(safeBaseline + totalGain, 0, 100).toFixed(2));

  const measuredTotal = contributions.reduce((s, c) => s + c.measuredActions, 0);
  const confidence = contributions.length === 0
    ? 0
    : Number(Math.min(1, measuredTotal / (contributions.length * 3)).toFixed(2));

  return {
    baselineOtif: Number(safeBaseline.toFixed(2)),
    projectedOtif,
    totalGain,
    contributions,
    confidence,
    selectedCount: contributions.length,
  };
}
