/**
 * Mitigation Recommender — sugere ações concretas por bucket de causa raiz,
 * priorizando pela severidade (contagem + horas acumuladas) e transportadora
 * dominante. Puro/determinístico para permitir simulação de centenas de cenários.
 */
import type { CategoryBucket, RootCauseCategory, RootCauseReport } from "./rootCauseAnalyzer";

export type MitigationPriority = "alta" | "media" | "baixa";

export interface MitigationSuggestion {
  category: RootCauseCategory;
  priority: MitigationPriority;
  headline: string;
  actions: string[];
  focusCarrier: string | null;
  impactScore: number; // 0-100
}

const PLAYBOOK: Record<RootCauseCategory, { headline: string; actions: string[] }> = {
  clima: {
    headline: "Ativar contingência climática",
    actions: [
      "Configurar alertas meteorológicos automáticos por região crítica",
      "Adicionar buffer de 12h em rotas com histórico climático adverso",
      "Habilitar transportadora reserva para trechos de risco",
    ],
  },
  transportadora: {
    headline: "Renegociar SLA com a transportadora crítica",
    actions: [
      "Revisar contrato e cláusulas de multa por atraso",
      "Escalar a operação junto ao gerente de conta da transportadora",
      "Redistribuir volume para transportadoras com melhor OTIF",
    ],
  },
  distancia: {
    headline: "Otimizar malha de rotas longas",
    actions: [
      "Consolidar cargas em hubs intermediários",
      "Avaliar modal alternativo (aéreo/rodoviário fracionado)",
      "Recalcular prazo padrão para rotas > 800km",
    ],
  },
  feriado: {
    headline: "Antecipar calendário sazonal",
    actions: [
      "Bloquear coletas em vésperas de feriados regionais",
      "Sincronizar calendário com transportadoras 15 dias antes",
      "Comunicar clientes sobre prazos ampliados em pontos facultativos",
    ],
  },
  demanda: {
    headline: "Escalar capacidade em picos",
    actions: [
      "Provisionar frota extra em janelas de alta demanda",
      "Ativar cotação multi-canal (Nexus Blast) por padrão",
      "Comunicar SLA estendido durante Black Friday/Natal",
    ],
  },
  endereco: {
    headline: "Validar endereços na origem",
    actions: [
      "Aplicar validação de CEP em tempo real no checkout",
      "Solicitar ponto de referência para endereços de risco",
      "Configurar reentrega automática após 1ª falha por endereço",
    ],
  },
  documentacao: {
    headline: "Blindar processo fiscal",
    actions: [
      "Adicionar validação de NF/CT-e antes da coleta",
      "Automatizar reemissão em caso de rejeição SEFAZ",
      "Configurar alerta para divergência de valor/peso",
    ],
  },
  outros: {
    headline: "Investigar padrões residuais",
    actions: [
      "Auditar motivos livres registrados e criar taxonomia",
      "Ativar coleta obrigatória de motivo estruturado no app",
      "Revisar semanalmente ocorrências não categorizadas",
    ],
  },
};

/** Compõe recomendações a partir de um relatório de causa raiz. */
export function buildMitigations(report: RootCauseReport): MitigationSuggestion[] {
  if (!report.buckets.length) return [];

  const maxCount = Math.max(...report.buckets.map((b) => b.count));
  const maxHours = Math.max(1, ...report.buckets.map((b) => b.totalDelayHours));

  return report.buckets.map((bucket) => {
    const playbook = PLAYBOOK[bucket.category];
    const impactScore = scoreImpact(bucket, maxCount, maxHours);
    return {
      category: bucket.category,
      priority: priorityFromScore(impactScore),
      headline: playbook.headline,
      actions: playbook.actions,
      focusCarrier: topCarrier(bucket),
      impactScore,
    };
  });
}

/** Score 0-100 combinando frequência (70%) e severidade horária (30%). */
export function scoreImpact(bucket: CategoryBucket, maxCount: number, maxHours: number): number {
  const safeMaxCount = Math.max(1, maxCount);
  const safeMaxHours = Math.max(1, maxHours);
  const freq = bucket.count / safeMaxCount;
  const sev = bucket.totalDelayHours / safeMaxHours;
  const score = freq * 0.7 + sev * 0.3;
  return Math.round(Math.min(1, Math.max(0, score)) * 100);
}

export function priorityFromScore(score: number): MitigationPriority {
  if (score >= 70) return "alta";
  if (score >= 35) return "media";
  return "baixa";
}

function topCarrier(bucket: CategoryBucket): string | null {
  const entries = Object.entries(bucket.carriers).sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ?? null;
}

export const PRIORITY_LABELS: Record<MitigationPriority, string> = {
  alta: "Prioridade Alta",
  media: "Prioridade Média",
  baixa: "Prioridade Baixa",
};
