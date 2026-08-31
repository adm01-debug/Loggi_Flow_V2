/**
 * mitigationROI — agrega mitigações concluídas em métricas de ROI por categoria.
 * Puro/determinístico, coberto por testes com centenas de cenários fuzz.
 */
import type { RootCauseCategory } from "./rootCauseAnalyzer";
import type { MitigationPriority } from "./mitigationRecommender";

export interface MitigationRecord {
  category: RootCauseCategory;
  priority: MitigationPriority;
  status: "planejada" | "em_execucao" | "concluida" | "cancelada";
  impact_score: number;
  otif_before: number | null;
  otif_after: number | null;
  otif_delta: number | null;
}

export interface CategoryROI {
  category: RootCauseCategory;
  totalActions: number;
  measuredActions: number;
  avgDelta: number;
  bestDelta: number;
  worstDelta: number;
  successRate: number;
  roiScore: number;
}

export interface ROIReport {
  byCategory: CategoryROI[];
  totalMeasured: number;
  overallAvgDelta: number;
  topCategory: RootCauseCategory | null;
  worstCategory: RootCauseCategory | null;
}

const clamp = (v: number, min: number, max: number): number => Math.min(max, Math.max(min, v));

export function computeROI(records: readonly MitigationRecord[]): ROIReport {
  const map = new Map<RootCauseCategory, MitigationRecord[]>();
  for (const r of records) {
    if (r.status !== "concluida") continue;
    if (r.otif_delta == null || !Number.isFinite(r.otif_delta)) continue;
    const list = map.get(r.category) ?? [];
    list.push(r);
    map.set(r.category, list);
  }

  const byCategory: CategoryROI[] = [];
  let totalDelta = 0;
  let totalMeasured = 0;

  for (const [category, list] of map.entries()) {
    const deltas = list.map((r) => r.otif_delta as number);
    const sum = deltas.reduce((a, b) => a + b, 0);
    const avg = sum / deltas.length;
    const positives = deltas.filter((d) => d > 0).length;
    const successRate = (positives / deltas.length) * 100;
    const normalized = clamp((avg + 10) / 20, 0, 1) * 100;
    const roiScore = Math.round(normalized * 0.6 + successRate * 0.4);

    byCategory.push({
      category,
      totalActions: records.filter((r) => r.category === category).length,
      measuredActions: list.length,
      avgDelta: Number(avg.toFixed(2)),
      bestDelta: Number(Math.max(...deltas).toFixed(2)),
      worstDelta: Number(Math.min(...deltas).toFixed(2)),
      successRate: Number(successRate.toFixed(1)),
      roiScore,
    });

    totalDelta += sum;
    totalMeasured += deltas.length;
  }

  byCategory.sort((a, b) => b.roiScore - a.roiScore);
  const overallAvgDelta = totalMeasured > 0 ? Number((totalDelta / totalMeasured).toFixed(2)) : 0;

  return {
    byCategory,
    totalMeasured,
    overallAvgDelta,
    topCategory: byCategory[0]?.category ?? null,
    worstCategory: byCategory.length > 0 ? byCategory[byCategory.length - 1].category : null,
  };
}
