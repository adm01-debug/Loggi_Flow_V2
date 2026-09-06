/**
 * Motor de alertas de SLO por gateway Rodonaves.
 *
 * Puro (sem I/O) para permitir fuzz determinístico: recebe os resultados de SLO
 * já avaliados e o estado de disparos anteriores, e decide o que alertar
 * respeitando severidade, cooldown e deduplicação por gateway.
 */

import type { GatewaySLOResult, SLOStatus } from "./gatewaySLO";

export type AlertSeverity = "info" | "warning" | "critical";

export interface SLOAlert {
  gateway: string;
  severity: AlertSeverity;
  /** Mensagem pronta para exibição/envio (PT-BR). */
  message: string;
  /** Percentual do error budget consumido no momento do disparo. */
  errorBudgetUsedPct: number;
  /** Excedente de latência P95 sobre o budget (ms). */
  latencyOverBudgetMs: number;
  /** Momento do disparo (epoch ms). */
  firedAt: number;
}

/** Último disparo conhecido por gateway (para cooldown/dedupe). */
export interface AlertState {
  gateway: string;
  severity: AlertSeverity;
  firedAt: number;
}

export interface SLOAlertOptions {
  /** Tempo mínimo entre alertas repetidos do mesmo gateway/severidade (ms). Padrão: 1h. */
  cooldownMs?: number;
  /** Referência temporal (epoch ms). Padrão: Date.now(). */
  now?: number;
  /** Severidade mínima a emitir. Padrão: "warning". */
  minSeverity?: AlertSeverity;
}

const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  info: 0,
  warning: 1,
  critical: 2,
};

export const DEFAULT_COOLDOWN_MS = 60 * 60 * 1000;

/** Mapeia o status de SLO para a severidade do alerta. */
export function severityForStatus(status: SLOStatus): AlertSeverity {
  if (status === "violado") return "critical";
  if (status === "atencao") return "warning";
  return "info";
}

function sanitizeTimestamp(
  value: number | undefined,
  fallback: number,
): number {
  return Number.isFinite(value) ? (value as number) : fallback;
}

function buildMessage(
  result: GatewaySLOResult,
  severity: AlertSeverity,
  label: string,
): string {
  const parts: string[] = [];
  if (severity === "critical") parts.push(`SLO violado em ${label}`);
  else if (severity === "warning") parts.push(`SLO em risco em ${label}`);
  else parts.push(`SLO estável em ${label}`);

  parts.push(`uptime ${result.uptimePct.toFixed(1)}%`);
  parts.push(`budget consumido ${result.errorBudgetUsedPct.toFixed(1)}%`);
  if (result.latencyOverBudgetMs > 0) {
    parts.push(`P95 ${result.latencyOverBudgetMs}ms acima da meta`);
  }
  return parts.join(" · ");
}

function isSuppressed(
  last: AlertState,
  severity: AlertSeverity,
  now: number,
  cooldownMs: number,
): boolean {
  const escalated = SEVERITY_ORDER[severity] > SEVERITY_ORDER[last.severity];
  const withinCooldown = now - last.firedAt < cooldownMs;
  return !escalated && withinCooldown;
}

/**
 * Decide quais alertas devem ser disparados.
 *
 * Regras:
 * - severidade abaixo de `minSeverity` nunca dispara;
 * - repetição do mesmo gateway só passa após o cooldown;
 * - escalonamento de severidade (warning -> critical) ignora o cooldown;
 * - de-escalonamento (critical -> warning) respeita o cooldown.
 */
export function evaluateSLOAlerts(
  results: GatewaySLOResult[],
  previous: AlertState[] = [],
  options: SLOAlertOptions = {},
  labels: Record<string, string> = {},
): SLOAlert[] {
  const now = sanitizeTimestamp(options.now, Date.now());
  const rawCooldown = Number(options.cooldownMs ?? DEFAULT_COOLDOWN_MS);
  const cooldownMs =
    Number.isFinite(rawCooldown) && rawCooldown >= 0
      ? rawCooldown
      : DEFAULT_COOLDOWN_MS;
  const minSeverity = options.minSeverity ?? "warning";

  const lastByGateway = new Map<string, AlertState>();
  for (const state of previous) {
    if (!state?.gateway) continue;
    const existing = lastByGateway.get(state.gateway);
    const firedAt = sanitizeTimestamp(state.firedAt, 0);
    if (!existing || firedAt >= sanitizeTimestamp(existing.firedAt, 0)) {
      lastByGateway.set(state.gateway, { ...state, firedAt });
    }
  }

  const alerts: SLOAlert[] = [];
  for (const result of results) {
    const severity = severityForStatus(result.status);
    if (SEVERITY_ORDER[severity] < SEVERITY_ORDER[minSeverity]) continue;

    const last = lastByGateway.get(result.gateway);
    if (last && isSuppressed(last, severity, now, cooldownMs)) continue;

    alerts.push({
      gateway: result.gateway,
      severity,
      message: buildMessage(
        result,
        severity,
        labels[result.gateway] ?? result.gateway,
      ),
      errorBudgetUsedPct: result.errorBudgetUsedPct,
      latencyOverBudgetMs: result.latencyOverBudgetMs,
      firedAt: now,
    });
  }

  return alerts.sort(
    (a, b) =>
      SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity] ||
      b.errorBudgetUsedPct - a.errorBudgetUsedPct ||
      a.gateway.localeCompare(b.gateway),
  );
}

/** Aplica os alertas disparados sobre o estado anterior, retornando o novo estado. */
export function applyAlerts(
  previous: AlertState[],
  alerts: SLOAlert[],
): AlertState[] {
  const map = new Map<string, AlertState>();
  for (const state of previous) {
    if (state?.gateway) map.set(state.gateway, state);
  }
  for (const alert of alerts) {
    map.set(alert.gateway, {
      gateway: alert.gateway,
      severity: alert.severity,
      firedAt: alert.firedAt,
    });
  }
  return Array.from(map.values()).sort((a, b) =>
    a.gateway.localeCompare(b.gateway),
  );
}

export interface AlertSummary {
  total: number;
  critical: number;
  warning: number;
  info: number;
}

export function summarizeAlerts(alerts: SLOAlert[]): AlertSummary {
  return {
    total: alerts.length,
    critical: alerts.filter((a) => a.severity === "critical").length,
    warning: alerts.filter((a) => a.severity === "warning").length,
    info: alerts.filter((a) => a.severity === "info").length,
  };
}

const STORAGE_KEY = "rte-gateway-slo-alert-state";

/** Lê o estado de disparos persistido, tolerando storage corrompido. */
export function loadAlertState(): AlertState[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is AlertState => {
        if (!item || typeof item !== "object") return false;
        const candidate = item as Partial<AlertState>;
        return (
          typeof candidate.gateway === "string" &&
          typeof candidate.severity === "string"
        );
      })
      .map((item) => ({
        gateway: item.gateway,
        severity: (["info", "warning", "critical"] as AlertSeverity[]).includes(
          item.severity,
        )
          ? item.severity
          : "warning",
        firedAt: sanitizeTimestamp(item.firedAt, 0),
      }));
  } catch {
    return [];
  }
}

export function saveAlertState(state: AlertState[]): AlertState[] {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage indisponível: estado permanece apenas em memória */
  }
  return state;
}
