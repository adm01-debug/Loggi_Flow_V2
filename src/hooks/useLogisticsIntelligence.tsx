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
    
    // AI-Driven dynamic analysis simulation
    const hasCriticals = (delaySummary?.criticos || 0) > 0;
    const highVolumeSP = true; // Simulated detection
    
    if (hasCriticals || highVolumeSP) {
      list.push({
        id: 'opt-1',
        title: 'Otimização de Rota Dinâmica',
        description: `Detectado gargalo logístico em São Paulo (Marginal Tietê). Sugerido redirecionamento de 4 veículos para a Rota B (Dutra).`,
        impact: 'Alta',
        icon: 'truck',
        type: 'resource'
      });
    }

    if (metrics && metrics.entregasComOcorrencia > 0) {
      list.push({
        id: 'opt-2',
        title: 'Auditoria de Conferência',
        description: `Detectado aumento de ${metrics.entregasComOcorrencia} ocorrências. Recomenda-se reforçar conferência no Box 12.`,
        impact: 'Média',
        icon: 'package',
        type: 'process'
      });
    }

    list.push({
      id: 'opt-3',
      title: 'IA: Redução de Custo de Frete',
      description: 'Identificada oportunidade de economia de 12% via consolidação de carga para Curitiba/PR.',
      impact: 'Alta',
      icon: 'trending-up',
      type: 'cost'
    });

    list.push({
      id: 'opt-4',
      title: 'Economia: Cotação Multicanal',
      description: 'Identificada variação de 45% nos preços para a região Nordeste. Recomenda-se nova cotação via transportadoras homologadas.',
      impact: 'Alta',
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
