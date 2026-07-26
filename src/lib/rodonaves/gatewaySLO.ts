/**
 * SLO por gateway Rodonaves: metas de disponibilidade/latência,
 * cálculo de error budget consumido e burn rate.
 *
 * Puro (sem I/O) para permitir fuzz determinístico e reuso em UI/edge.
 */

export interface GatewaySLOTarget {
  /** Meta de disponibilidade em % (0-100). */
  uptimeTargetPct: number;
  /** Latência P95 máxima tolerada em ms. */
  latencyP95BudgetMs: number;
}

export interface GatewaySLOInput {
  gateway: string;
  checks: number;
  uptimePct: number;
  p95LatencyMs: number;
}

export type SLOStatus = "ok" | "atencao" | "violado";

export interface GatewaySLOResult {
  gateway: string;
  checks: number;
  uptimePct: number;
  p95LatencyMs: number;
  /** Percentual do orçamento de erro já consumido (0-100+, limitado a 999). */
  errorBudgetUsedPct: number;
  /** Percentual do orçamento restante (0-100). */
  errorBudgetLeftPct: number;
  /** Excedente de latência P95 sobre o budget, em ms (0 quando dentro da meta). */
  latencyOverBudgetMs: number;
  status: SLOStatus;
}

export const DEFAULT_SLO_TARGET: GatewaySLOTarget = {
  uptimeTargetPct: 99,
  latencyP95BudgetMs: 2000,
};

/** Restringe um número a um intervalo, tratando NaN/Infinity como `min`. */
function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** Normaliza metas vindas de storage/usuário para faixas seguras. */
export function normalizeTarget(target: Partial<GatewaySLOTarget> | null | undefined): GatewaySLOTarget {
  const uptime = clamp(Number(target?.uptimeTargetPct ?? DEFAULT_SLO_TARGET.uptimeTargetPct), 50, 100);
  const latency = clamp(
    Number(target?.latencyP95BudgetMs ?? DEFAULT_SLO_TARGET.latencyP95BudgetMs),
    50,
    120_000,
  );
  return { uptimeTargetPct: uptime, latencyP95BudgetMs: Math.round(latency) };
}

/**
 * Avalia um gateway contra a meta.
 *
 * Error budget = (100 - meta). Consumo = downtime observado / budget.
 * Com meta 100% (budget zero), qualquer downtime consome 100% do orçamento.
 */
export function evaluateSLO(input: GatewaySLOInput, rawTarget?: Partial<GatewaySLOTarget>): GatewaySLOResult {
  const target = normalizeTarget(rawTarget);
  const uptimePct = clamp(input.uptimePct, 0, 100);
  const p95 = Math.max(0, Number.isFinite(input.p95LatencyMs) ? input.p95LatencyMs : 0);

  const budget = 100 - target.uptimeTargetPct;
  const downtime = 100 - uptimePct;

  let usedPct: number;
  if (budget <= 0) usedPct = downtime > 0 ? 100 : 0;
  else usedPct = (downtime / budget) * 100;
  usedPct = clamp(Math.round(usedPct * 10) / 10, 0, 999);

  const latencyOverBudgetMs = Math.max(0, Math.round(p95 - target.latencyP95BudgetMs));

  let status: SLOStatus = "ok";
  if (usedPct >= 100 || latencyOverBudgetMs > 0) status = "violado";
  else if (usedPct >= 75) status = "atencao";

  return {
    gateway: input.gateway,
    checks: Math.max(0, Math.trunc(input.checks) || 0),
    uptimePct: Math.round(uptimePct * 10) / 10,
    p95LatencyMs: Math.round(p95),
    errorBudgetUsedPct: usedPct,
    errorBudgetLeftPct: clamp(Math.round((100 - usedPct) * 10) / 10, 0, 100),
    latencyOverBudgetMs,
    status,
  };
}

/** Avalia todos os gateways, ordenando dos mais críticos para os saudáveis. */
export function evaluateAllSLO(
  inputs: GatewaySLOInput[],
  target?: Partial<GatewaySLOTarget>,
): GatewaySLOResult[] {
  return inputs
    .map((input) => evaluateSLO(input, target))
    .sort((a, b) => b.errorBudgetUsedPct - a.errorBudgetUsedPct || a.gateway.localeCompare(b.gateway));
}

export interface SLOSummary {
  total: number;
  ok: number;
  atencao: number;
  violado: number;
  /** Média de orçamento consumido entre os gateways avaliados. */
  avgBudgetUsedPct: number;
}

export function summarizeSLO(results: GatewaySLOResult[]): SLOSummary {
  const total = results.length;
  if (total === 0) return { total: 0, ok: 0, atencao: 0, violado: 0, avgBudgetUsedPct: 0 };
  const ok = results.filter((r) => r.status === "ok").length;
  const atencao = results.filter((r) => r.status === "atencao").length;
  const violado = results.filter((r) => r.status === "violado").length;
  const avg = results.reduce((sum, r) => sum + r.errorBudgetUsedPct, 0) / total;
  return { total, ok, atencao, violado, avgBudgetUsedPct: Math.round(avg * 10) / 10 };
}

const STORAGE_KEY = "rte-gateway-slo-target";

/** Lê a meta persistida localmente, tolerando storage corrompido. */
export function loadSLOTarget(): GatewaySLOTarget {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SLO_TARGET };
    return normalizeTarget(JSON.parse(raw) as Partial<GatewaySLOTarget>);
  } catch {
    return { ...DEFAULT_SLO_TARGET };
  }
}

export function saveSLOTarget(target: Partial<GatewaySLOTarget>): GatewaySLOTarget {
  const normalized = normalizeTarget(target);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    /* storage indisponível: meta permanece apenas em memória */
  }
  return normalized;
}
