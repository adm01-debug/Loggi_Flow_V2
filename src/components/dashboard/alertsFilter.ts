import type { RecentAlert } from "@/hooks/analytics/useDashboardMetrics";

/**
 * O limiar so faz sentido para alertas que carregam um delta medido
 * (variacao de frete, probabilidade de atraso). Alerta sem delta -
 * coleta atrasada, ocorrencia, falha de integracao - nunca e escondido.
 */
export function filtrarPorLimiar(
  alerts: RecentAlert[],
  threshold: number,
): RecentAlert[] {
  return alerts.filter(
    (alert) => alert.delta === undefined || alert.delta >= threshold,
  );
}
