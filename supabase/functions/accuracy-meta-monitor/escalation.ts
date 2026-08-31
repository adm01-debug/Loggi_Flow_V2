// Sprint P #13 — Escalonamento para WhatsApp após N emails ignorados.
// Módulo puro: recebe histórico de notificações e decide se o próximo
// disparo deve escalar para WhatsApp mesmo com toggle desligado.

export interface EscalationConfig {
  /** Nº mínimo de emails não lidos no histórico para acionar escalonamento. */
  ignoredThreshold: number;
  /** Janela (horas) para considerar emails "ignorados". */
  windowHours: number;
  /** Se true, exige que existam disparos de email bem-sucedidos (channels.email === "ok"). */
  requireEmailDispatched: boolean;
}

export const DEFAULT_ESCALATION: EscalationConfig = {
  ignoredThreshold: 3,
  windowHours: 72,
  requireEmailDispatched: true,
};

export interface HistoricalNotification {
  id: string;
  created_at: string;
  read: boolean;
  metadata: {
    source?: string;
    carrier?: string | null;
    channels?: Record<string, string>;
  };
}

export interface EscalationDecision {
  escalate: boolean;
  ignoredCount: number;
  reason: "threshold_met" | "below_threshold" | "no_email_dispatched" | "invalid_config";
}

/**
 * Decide se o próximo alerta para (user, carrier) deve escalar para WhatsApp
 * porque emails anteriores foram ignorados (não lidos) na janela.
 */
export function decideEscalation(
  history: HistoricalNotification[],
  carrierTag: string,
  now: Date,
  cfg: EscalationConfig = DEFAULT_ESCALATION,
): EscalationDecision {
  if (
    !Number.isFinite(cfg.ignoredThreshold) ||
    cfg.ignoredThreshold <= 0 ||
    !Number.isFinite(cfg.windowHours) ||
    cfg.windowHours <= 0
  ) {
    return { escalate: false, ignoredCount: 0, reason: "invalid_config" };
  }

  const windowStart = now.getTime() - cfg.windowHours * 60 * 60 * 1000;
  const variants = new Set<string | null>(
    carrierTag === "__all__" ? ["__all__", null] : [carrierTag],
  );

  const relevant = history.filter((n) => {
    if (n.metadata?.source !== "accuracy-meta-monitor") return false;
    if (!variants.has(n.metadata?.carrier ?? null)) return false;
    const ts = new Date(n.created_at).getTime();
    if (!Number.isFinite(ts) || ts < windowStart || ts > now.getTime()) return false;
    if (n.read) return false;
    if (cfg.requireEmailDispatched) {
      return n.metadata?.channels?.email === "ok";
    }
    return true;
  });

  const ignoredCount = relevant.length;
  if (ignoredCount >= cfg.ignoredThreshold) {
    return { escalate: true, ignoredCount, reason: "threshold_met" };
  }
  return {
    escalate: false,
    ignoredCount,
    reason: cfg.requireEmailDispatched && ignoredCount === 0 ? "no_email_dispatched" : "below_threshold",
  };
}
