import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTelemetry } from '@/hooks/analytics/useTelemetry';

export interface CarrierRecommendation {
  id: string;
  nome: string;
  scorePerformance: number;
  prazoDias: number;
  valorTotal: number;
  precoPorKg: number;
  taxaFixa: number;
  onTimeRate: number | null;
  totalEntregas: number;
  regiao: string;
  rank: number;
  aiReason: string;
  confidence: number;
}

export interface SmartSelectionResult {
  success: boolean;
  recommendations: CarrierRecommendation[];
  generalAnalysis?: string;
  analysisType?: 'ai' | 'algorithmic';
  error?: string;
}

export interface SmartSelectionRequest {
  estado_destino: string;
  peso_kg: number;
  urgencia?: 'baixa' | 'normal' | 'alta' | 'urgente';
  tipo_carga?: string;
}

export const useSmartCarrierSelection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SmartSelectionResult | null>(null);
  const { logTelemetry } = useTelemetry();
  const cacheRef = useRef<{ [key: string]: { data: SmartSelectionResult, timestamp: number } }>({});
  const CACHE_TTL = 1000 * 60 * 10; // 10 minutos de cache para recomendações fixas

  const analyzeCarriers = useCallback(async (request: SmartSelectionRequest, forceRefresh = false) => {
    const cacheKey = JSON.stringify(request);
    
    if (!forceRefresh && cacheRef.current[cacheKey] && (Date.now() - cacheRef.current[cacheKey].timestamp < CACHE_TTL)) {
      const cached = cacheRef.current[cacheKey].data;
      setResult(cached);
      return cached;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('smart-carrier-selection', {
        body: request,
      });

      if (error) {
        toast.error('Erro ao analisar transportadoras');
        const errorResult: SmartSelectionResult = { success: false, recommendations: [], error: error.message };
        setResult(errorResult);
        return errorResult;
      }

      if (data.success) {
        toast.success(
          data.analysisType === 'ai' 
            ? 'Análise IA concluída!' 
            : 'Análise concluída!'
        );
      } else if (data.message) {
        toast.info(data.message);
      }

      const selectionResult = data as SmartSelectionResult;
      setResult(selectionResult);
      
      // Armazenar no cache
      cacheRef.current[cacheKey] = {
        data: selectionResult,
        timestamp: Date.now()
      };

      logTelemetry({
        severity: 'info',
        category: 'carrier_selection',
        message: 'Seleção inteligente de transportadora realizada',
        metadata: { request, result_count: selectionResult.recommendations?.length, type: selectionResult.analysisType }
      });

      return selectionResult;
    } catch (err) {
      toast.error('Erro ao processar seleção inteligente');
      const errorResult: SmartSelectionResult = { success: false, recommendations: [], error: (err as Error).message };
      setResult(errorResult);
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logTelemetry]);

  const clearResult = () => {
    setResult(null);
  };

  return {
    isLoading,
    result,
    analyzeCarriers,
    clearResult,
  };
};
