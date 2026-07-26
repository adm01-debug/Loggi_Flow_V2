/**
 * Relatório diário de conformidade de SLO por gateway Rodonaves.
 *
 * A partir do histórico bruto de verificações (`rte_gateway_health`), agrega
 * por dia (UTC) e gateway, avalia cada dia contra a meta vigente e produz:
 *  - linhas diárias (uptime, P95, error budget, status);
 *  - resumo consolidado do período (dias em conformidade vs. violados);
 *  - serialização CSV pronta para download.
 *
 * Motor puro (sem I/O) — permite fuzz determinístico e reuso em edge functions.
 *
 * Invariantes garantidas por testes:
 *  - linhas sempre ordenadas por (dia asc, gateway asc);
 *  - `avgLatencyMs <= p95LatencyMs`;
 *  - `0 <= uptimePct <= 100`;
 *  - soma de `checks` == número de amostras válidas consideradas.
 */

import { evaluateSLO, type GatewaySLOTarget, type SLOStatus } from "./gatewaySLO";

/** Amostra bruta de verificação de gateway. */
export interface SLOReportSample {
  gateway: string;
  online: boolean;
  latency_ms: number;
  checked_at: string;
}

/** Linha do relatório: um gateway em um dia. */
export interface SLODailyRow {
  /** Data no formato YYYY-MM-DD (UTC). */
  day: string;
  gateway: string;
  checks: number;
  failures: number;
  uptimePct: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  errorBudgetUsedPct: number;
  status: SLOStatus;
}

export interface SLOReportSummary {
  days: number;
  gateways: number;
  rows: number;
  compliantRows: number;
  violatedRows: number;
  /** Percentual de linhas dentro da meta (0-100). */
  compliancePct: number;
  avgUptimePct: number;
  worstGateway: string | null;
}

export interface SLOReport {
  rows: SLODailyRow[];
  summary: SLOReportSummary;
}

function isValidSample(sample: SLOReportSample | null | undefined): sample is SLOReportSample {
  if (!sample || typeof sample.gateway !== "string" || sample.gateway.length === 0) return false;
  const time = Date.parse(sample.checked_at);
  return Number.isFinite(time);
}

function dayKey(iso: string): string {
  return new Date(Date.parse(iso)).toISOString().slice(0, 10);
}

function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const index = Math.min(
    sortedAsc.length - 1,
    Math.max(0, Math.ceil((p / 100) * sortedAsc.length) - 1),
  );
  return sortedAsc[index];
}

function safeLatency(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/** Constrói o relatório diário agregado por gateway. */
export function buildSLOReport(
  samples: readonly SLOReportSample[],
  target?: Partial<GatewaySLOTarget>,
): SLOReport {
  const buckets = new Map<string, { day: string; gateway: string; latencies: number[]; failures: number }>();

  for (const sample of samples ?? []) {
    if (!isValidSample(sample)) continue;
    const day = dayKey(sample.checked_at);
    const key = `${day}|${sample.gateway}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { day, gateway: sample.gateway, latencies: [], failures: 0 };
      buckets.set(key, bucket);
    }
    bucket.latencies.push(safeLatency(Number(sample.latency_ms)));
    if (!sample.online) bucket.failures += 1;
  }

  const rows: SLODailyRow[] = [...buckets.values()]
    .map((bucket) => {
      const checks = bucket.latencies.length;
      const sorted = [...bucket.latencies].sort((a, b) => a - b);
      const avg = checks > 0 ? sorted.reduce((sum, value) => sum + value, 0) / checks : 0;
      const p95 = Math.max(percentile(sorted, 95), avg);
      const uptimePct = checks > 0 ? ((checks - bucket.failures) / checks) * 100 : 0;

      const evaluation = evaluateSLO(
        { gateway: bucket.gateway, checks, uptimePct, p95LatencyMs: p95 },
        target,
      );

      return {
        day: bucket.day,
        gateway: bucket.gateway,
        checks,
        failures: bucket.failures,
        uptimePct: Math.round(uptimePct * 10) / 10,
        avgLatencyMs: Math.round(avg),
        p95LatencyMs: Math.round(p95),
        errorBudgetUsedPct: evaluation.errorBudgetUsedPct,
        status: evaluation.status,
      };
    })
    .sort((a, b) => a.day.localeCompare(b.day) || a.gateway.localeCompare(b.gateway));

  return { rows, summary: summarizeSLOReport(rows) };
}

/** Consolida as linhas diárias em indicadores de período. */
export function summarizeSLOReport(rows: readonly SLODailyRow[]): SLOReportSummary {
  const total = rows.length;
  if (total === 0) {
    return {
      days: 0,
      gateways: 0,
      rows: 0,
      compliantRows: 0,
      violatedRows: 0,
      compliancePct: 0,
      avgUptimePct: 0,
      worstGateway: null,
    };
  }

  const violated = rows.filter((row) => row.status === "violado").length;
  const compliant = total - violated;
  const avgUptime = rows.reduce((sum, row) => sum + row.uptimePct, 0) / total;

  const budgetByGateway = new Map<string, number>();
  for (const row of rows) {
    budgetByGateway.set(row.gateway, (budgetByGateway.get(row.gateway) ?? 0) + row.errorBudgetUsedPct);
  }
  const worst = [...budgetByGateway.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  )[0];

  return {
    days: new Set(rows.map((row) => row.day)).size,
    gateways: budgetByGateway.size,
    rows: total,
    compliantRows: compliant,
    violatedRows: violated,
    compliancePct: Math.round((compliant / total) * 1000) / 10,
    avgUptimePct: Math.round(avgUptime * 10) / 10,
    worstGateway: worst ? worst[0] : null,
  };
}

const CSV_HEADER = [
  "dia",
  "gateway",
  "verificacoes",
  "falhas",
  "uptime_pct",
  "latencia_media_ms",
  "latencia_p95_ms",
  "error_budget_usado_pct",
  "status",
] as const;

/** Escapa um campo para CSV (RFC 4180) evitando injeção de fórmula. */
function csvField(value: string | number): string {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/** Serializa o relatório em CSV com separador `;` (compatível com Excel PT-BR). */
export function sloReportToCSV(rows: readonly SLODailyRow[]): string {
  const lines = [CSV_HEADER.join(";")];
  for (const row of rows) {
    lines.push(
      [
        csvField(row.day),
        csvField(row.gateway),
        csvField(row.checks),
        csvField(row.failures),
        csvField(row.uptimePct.toFixed(1)),
        csvField(row.avgLatencyMs),
        csvField(row.p95LatencyMs),
        csvField(row.errorBudgetUsedPct.toFixed(1)),
        csvField(row.status),
      ].join(";"),
    );
  }
  return lines.join("\r\n");
}
