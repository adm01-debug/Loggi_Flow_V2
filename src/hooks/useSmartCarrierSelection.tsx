import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

  const analyzeCarriers = async (request: SmartSelectionRequest) => {
    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('smart-carrier-selection', {
        body: request,
      });

      if (error) {
        toast.error('Erro ao analisar transportadoras');
        setResult({ success: false, recommendations: [], error: error.message });
        return null;
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

      setResult(data);
      return data;
    } catch {
      toast.error('Erro ao processar seleção inteligente');
      const errorResult = { success: false, recommendations: [], error: 'Erro inesperado' };
      setResult(errorResult);
      return errorResult;
    } finally {
      setIsLoading(false);
    }
  };

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
