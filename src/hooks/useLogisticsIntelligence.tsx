import { useMemo } from 'react';
import { useDashboardMetrics } from './useDashboardMetrics';
import { useDelayPrediction } from './useDelayPrediction';

export function useLogisticsIntelligence() {
  const { data: metrics } = useDashboardMetrics();
  const { summary: delaySummary } = useDelayPrediction();

  const healthScore = useMemo(() => {
    if (!metrics) return 0;
    
    // Factors for Health Score:
    // 1. OTIF (On-Time In-Full) - heavily weighted
    // 2. Critical Delays (negative impact)
    // 3. Efficiency of resource usage
    // 4. Incident rate
    
    const otif = 92; // Simulated base OTIF
    const delayImpact = (delaySummary?.criticos || 0) * 5;
    const highRiskImpact = (delaySummary?.altos || 0) * 2;
    
    const score = Math.max(0, Math.min(100, otif - delayImpact - highRiskImpact));
    return Math.round(score);
  }, [metrics, delaySummary]);

  const optimizations = useMemo(() => {
    const list = [];
    
    if (delaySummary && delaySummary.criticos > 0) {
      list.push({
        id: 'opt-1',
        title: 'Redirecionamento de Frota',
        description: `${delaySummary.criticos} entregas críticas detectadas em São Paulo. Recomenda-se alocar 2 motoristas adicionais da frota de reserva.`,
        impact: 'Alta',
        icon: 'truck',
        type: 'resource'
      });
    }

    if (metrics && metrics.ocorrencias_ativas > 5) {
      list.push({
        id: 'opt-2',
        title: 'Ajuste de Fluxo de Expedição',
        description: 'Alto volume de ocorrências em conferência. Recomenda-se dobrar a verificação nos BOX 04 e 07.',
        impact: 'Média',
        icon: 'package',
        type: 'process'
      });
    }

    list.push({
      id: 'opt-3',
      title: 'Consolidação de Carga',
      description: 'Identificada oportunidade de consolidar 12 envios para a região Sul, reduzindo custo de frete em 15%.',
      impact: 'Média',
      icon: 'trending-up',
      type: 'cost'
    });

    return list;
  }, [delaySummary, metrics]);

  return {
    healthScore,
    optimizations,
    summary: delaySummary
  };
}
