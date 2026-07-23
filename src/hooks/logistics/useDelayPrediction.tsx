/* eslint-disable sonarjs/cognitive-complexity */
import { useState, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTelemetry } from '@/hooks/analytics/useTelemetry';

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
  const { logTelemetry } = useTelemetry();
  const cacheRef = useRef<{ [key: string]: { data: PredictionResult, timestamp: number } }>({});
  const CACHE_TTL = 1000 * 60 * 5; // 5 minutos de cache local
  const [predictionsData, setPredictions] = useState<DelayPrediction[]>([]);
  const [summaryData, setSummary] = useState<PredictionSummary | null>(null);

  // Memoize results to prevent cascading re-renders
  const predictions = useMemo(() => predictionsData, [predictionsData]);
  const summary = useMemo(() => summaryData, [summaryData]);
  const [lastAnalyzed, setLastAnalyzed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  const analyzeDelays = useCallback(async (forceRefresh = false) => {
    // Verificação de cache para evitar chamadas de IA desnecessárias
    const cacheKey = 'global_prediction';
    if (!forceRefresh && cacheRef.current[cacheKey] && (Date.now() - cacheRef.current[cacheKey].timestamp < CACHE_TTL)) {
      const cached = cacheRef.current[cacheKey].data;
      setPredictions(cached.predictions);
      setSummary(cached.summary);
      setLastAnalyzed(cached.analyzed_at);
      setIsCached(true);
      return cached;
    }

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

      if (data.circuitOpen) {
        throw new Error('Circuit Breaker: O serviço de análise preditiva está temporariamente suspenso devido a falhas recorrentes.');
      }

      setPredictions(data.predictions || []);
      setSummary(data.summary || null);
      setLastAnalyzed(data.analyzed_at);
      setIsCached(!!data.cached);

      // Persistir no cache local
      cacheRef.current[cacheKey] = {
        data: data as PredictionResult,
        timestamp: Date.now()
      };

      logTelemetry({
        severity: 'info',
        category: 'ai_prediction',
        message: 'Análise preditiva de atrasos concluída com sucesso',
        metadata: { summary: data.summary, analyzed_at: data.analyzed_at }
      });

      const criticos = data.summary?.criticos || 0;
      const altos = data.summary?.altos || 0;

      if (criticos > 0 || altos > 0) {
        if (criticos > 0 && altos > 0) {
          toast.error(`🚨 Alerta Crítico: ${criticos} entregas críticas e ${altos} com alto risco de atraso!`, {
            duration: 10000,
          });
        } else if (criticos > 0) {
          toast.error(`🚨 ${criticos} entrega(s) com risco CRÍTICO de atraso!`, {
            duration: 8000,
          });
        } else {
          toast.warning(`⚠️ ${altos} entrega(s) com risco ALTO de atraso`, {
            duration: 6000,
          });
        }
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
      } else if (message.includes('Circuit Breaker')) {
        toast.error('Serviço de IA temporariamente indisponível (Resiliência Ativa)');
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
      case 'critico': return 'text-destructive bg-destructive/10';
      case 'alto': return 'text-destructive/80 bg-destructive/10';
      case 'medio': return 'text-warning bg-warning/10';
      case 'baixo': return 'text-success bg-success/10';
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
    isCached,
    analyzeDelays,
    getRiskColor,
    getRiskLabel,
  };
}
