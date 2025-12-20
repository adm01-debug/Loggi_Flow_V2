import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DelayPrediction {
  id: string;
  numero: string;
  tipo: 'entrega' | 'coleta';
  risco: 'baixo' | 'medio' | 'alto' | 'critico';
  probabilidade_atraso: number;
  motivos: string[];
  recomendacoes: string[];
  horas_estimadas_atraso: number;
}

export interface PredictionSummary {
  total_analisados: number;
  criticos: number;
  altos: number;
  medios: number;
  baixos: number;
  taxa_atraso_historica: number;
}

export interface PredictionResult {
  predictions: DelayPrediction[];
  summary: PredictionSummary;
  analyzed_at: string;
}

export function useDelayPrediction() {
  const [isLoading, setIsLoading] = useState(false);
  const [predictions, setPredictions] = useState<DelayPrediction[]>([]);
  const [summary, setSummary] = useState<PredictionSummary | null>(null);
  const [lastAnalyzed, setLastAnalyzed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeDelays = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('predict-delays');

      if (fnError) {
        throw fnError;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setPredictions(data.predictions || []);
      setSummary(data.summary || null);
      setLastAnalyzed(data.analyzed_at);

      const criticos = data.summary?.criticos || 0;
      const altos = data.summary?.altos || 0;

      if (criticos > 0) {
        toast.error(`🚨 ${criticos} entrega(s) com risco CRÍTICO de atraso!`, {
          duration: 8000,
        });
      } else if (altos > 0) {
        toast.warning(`⚠️ ${altos} entrega(s) com risco ALTO de atraso`, {
          duration: 5000,
        });
      } else {
        toast.success('Análise concluída! Nenhum risco crítico detectado.');
      }

      return data as PredictionResult;
    } catch (err) {
      const message = (err as Error).message;
      setError(message);
      
      if (message.includes('429') || message.includes('Limite')) {
        toast.error('Limite de requisições excedido. Aguarde alguns minutos.');
      } else if (message.includes('402') || message.includes('Créditos')) {
        toast.error('Créditos de IA esgotados. Adicione créditos no workspace.');
      } else {
        toast.error(`Erro na análise: ${message}`);
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getRiskColor = useCallback((risco: DelayPrediction['risco']) => {
    switch (risco) {
      case 'critico': return 'text-red-600 bg-red-100';
      case 'alto': return 'text-orange-600 bg-orange-100';
      case 'medio': return 'text-yellow-600 bg-yellow-100';
      case 'baixo': return 'text-green-600 bg-green-100';
      default: return 'text-muted-foreground bg-muted';
    }
  }, []);

  const getRiskLabel = useCallback((risco: DelayPrediction['risco']) => {
    switch (risco) {
      case 'critico': return 'Crítico';
      case 'alto': return 'Alto';
      case 'medio': return 'Médio';
      case 'baixo': return 'Baixo';
      default: return risco;
    }
  }, []);

  return {
    isLoading,
    predictions,
    summary,
    lastAnalyzed,
    error,
    analyzeDelays,
    getRiskColor,
    getRiskLabel,
  };
}
