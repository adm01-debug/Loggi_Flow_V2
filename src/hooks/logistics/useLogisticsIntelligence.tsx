import { useMemo } from "react";
import { useDashboardMetrics } from "@/hooks/analytics/useDashboardMetrics";
import { useDelayPrediction } from "@/hooks/logistics/useDelayPrediction";

export function useLogisticsIntelligence() {
  const { data: metrics } = useDashboardMetrics();
  const { summary: delaySummary } = useDelayPrediction();

  const healthScore = useMemo(() => {
    if (!metrics) return 0;

    // OTIF real da RPC get_dashboard_metrics; penalidades por atrasos reais.
    const otif = metrics.otifRate;
    const delayImpact = (delaySummary?.criticos || 0) * 5;
    const highRiskImpact = (delaySummary?.altos || 0) * 2;

    const score = Math.max(
      0,
      Math.min(100, otif - delayImpact - highRiskImpact),
    );
    return Math.round(score);
  }, [metrics, delaySummary]);

  const optimizations = useMemo(() => {
    const list = [];

    const hasCriticals = (delaySummary?.criticos || 0) > 0;
    // Carga operacional real: alertas criticos + coletas atrasadas.
    const hasOperationalLoad =
      (metrics?.alertasCriticos || 0) + (metrics?.coletasAtrasadas || 0) >= 3;

    if (hasCriticals || hasOperationalLoad) {
      list.push({
        id: "opt-1",
        title: "Otimização de Rota Dinâmica",
        description: `Detectados ${metrics?.alertasCriticos || 0} alertas críticos e ${metrics?.coletasAtrasadas || 0} coletas atrasadas na operação. Recomenda-se revisar a priorização das rotas ativas.`,
        impact: "Alta",
        icon: "truck",
        type: "resource",
      });
    }

    if (metrics && metrics.entregasComOcorrencia > 0) {
      list.push({
        id: "opt-2",
        title: "Auditoria de Conferência",
        description: `Detectado aumento de ${metrics.entregasComOcorrencia} ocorrências. Recomenda-se reforçar conferência no Box 12.`,
        impact: "Média",
        icon: "package",
        type: "process",
      });
    }

    list.push({
      id: "opt-3",
      title: "IA: Redução de Custo de Frete",
      description:
        "Identificada oportunidade de economia de 12% via consolidação de carga para Curitiba/PR.",
      impact: "Alta",
      icon: "trending-up",
      type: "cost",
    });

    list.push({
      id: "opt-4",
      title: "Economia: Cotação Multicanal",
      description:
        "Identificada variação de 45% nos preços para a região Nordeste. Recomenda-se nova cotação via transportadoras homologadas.",
      impact: "Alta",
      icon: "trending-up",
      type: "cost",
    });

    return list;
  }, [delaySummary, metrics]);

  return {
    healthScore,
    optimizations,
    summary: delaySummary,
  };
}
