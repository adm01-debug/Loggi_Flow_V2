import { useState, useMemo, useCallback } from 'react';
import { useFreightQuotation, QuotationResult } from '@/hooks/useFreightQuotation';
import { useSmartCarrierSelection } from '@/hooks/useSmartCarrierSelection';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';

export interface CargoData {
  estado_destino: string;
  peso_kg: number;
  volumes: number;
  valor_mercadoria: number;
  tipo_carga?: string;
}

export interface CargoTemplate {
  id: string;
  nome: string;
  data: CargoData;
  created_at: string;
}

export type FlowStep = 'dados' | 'resultados' | 'comparar' | 'despachar';

export function useQuotationFlow() {
  const freightQuotation = useFreightQuotation();
  const smartCarrier = useSmartCarrierSelection();

  const [step, setStep] = useState<FlowStep>('dados');
  const [cargoData, setCargoData] = useState<CargoData | null>(null);
  const [quotationResults, setQuotationResults] = useState<QuotationResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<QuotationResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Templates persistence
  const [templates, setTemplates] = useLocalStorage<CargoTemplate[]>('freight-cargo-templates', []);
  // Favorites persistence
  const [favorites, setFavorites] = useLocalStorage<QuotationResult[]>('freight-favorites', []);
  // History
  const [history, setHistory] = useLocalStorage<Array<{ data: CargoData; results: QuotationResult[]; date: string }>>('freight-history', []);

  const tabelasFrete = freightQuotation?.tabelasFrete || [];
  const transportadoras = freightQuotation?.transportadoras || [];
  const isLoadingTabelas = freightQuotation?.isLoadingTabelas || false;
  const calculateQuotations = freightQuotation?.calculateQuotations;
  const addTabelaFrete = freightQuotation?.addTabelaFrete;
  const deleteTabelaFrete = freightQuotation?.deleteTabelaFrete;

  interface TabelaFreteRaw {
    id: string;
    transportadora_id: string;
    transportadora?: { nome_fantasia?: string };
    estado_destino: string;
    peso_min_kg?: number;
    peso_max_kg?: number;
    preco_por_kg?: number;
    prazo_dias?: number;
  }

  const tabelasList = useMemo(() => (tabelasFrete || []).map((t: TabelaFreteRaw) => ({
    id: t.id,
    transportadora_id: t.transportadora_id,
    transportadora_nome: t.transportadora?.nome_fantasia || 'N/A',
    estado_destino: t.estado_destino,
    peso_min: t.peso_min_kg || 0,
    peso_max: t.peso_max_kg || 100,
    valor_kg: t.preco_por_kg || 0,
    prazo_dias: t.prazo_dias || 5,
  })), [tabelasFrete]);

  const stats = useMemo(() => ({
    tabelas: tabelasList.length,
    transportadoras: transportadoras?.length || 0,
    estados: [...new Set(tabelasList.map(t => t.estado_destino))].length,
  }), [tabelasList, transportadoras]);

  // Price anomaly detection (#24)
  const detectPriceAnomaly = useCallback((results: QuotationResult[]) => {
    if (results.length < 3) return results;
    const values = results.map(r => r.valor_total);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length);
    return results.map(r => ({
      ...r,
      preco_anormal: Math.abs(r.valor_total - mean) > stdDev * 1.5,
    }));
  }, []);

  const calculate = useCallback(async (data: CargoData & { event_type?: string }) => {
    setCargoData(data);
    if (calculateQuotations) {
      const results = await calculateQuotations({ 
        estado_destino: data.estado_destino, 
        peso_kg: data.peso_kg,
        event_type: data.event_type 
      });
      const withAnomalies = detectPriceAnomaly(results || []);
      setQuotationResults(withAnomalies);
      setHasSearched(true);
      setStep('resultados');

      // Save to history
      setHistory(prev => [
        { data, results: withAnomalies, date: new Date().toISOString() },
        ...prev.slice(0, 19), // keep last 20
      ]);
    }
    smartCarrier?.analyzeCarriers({
      estado_destino: data.estado_destino,
      peso_kg: data.peso_kg,
      urgencia: 'normal',
    });
  }, [calculateQuotations, smartCarrier, detectPriceAnomaly, setHistory]);

  // Scenario simulation (#13)
  const simulateScenario = useCallback(async (data: CargoData, splitVolumes: number) => {
    if (!calculateQuotations) return [];
    const pesoPerVolume = data.peso_kg / splitVolumes;
    const scenarios: Array<{ volumes: number; results: QuotationResult[] }> = [];
    for (let v = 1; v <= splitVolumes; v++) {
      const results = await calculateQuotations({ estado_destino: data.estado_destino, peso_kg: pesoPerVolume * v });
      scenarios.push({ volumes: v, results: results || [] });
    }
    return scenarios;
  }, [calculateQuotations]);

  // Template management (#14)
  const saveTemplate = useCallback((nome: string, data: CargoData) => {
    setTemplates(prev => [...prev, { id: crypto.randomUUID(), nome, data, created_at: new Date().toISOString() }]);
    toast.success('Template salvo!');
  }, [setTemplates]);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  }, [setTemplates]);

  const loadTemplate = useCallback((template: CargoTemplate) => {
    setCargoData(template.data);
    toast.success(`Template "${template.nome}" carregado`);
  }, []);

  // Favorites (#10)
  const toggleFavorite = useCallback((result: QuotationResult) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.transportadora_id === result.transportadora_id && f.regiao_destino === result.regiao_destino);
      if (exists) return prev.filter(f => !(f.transportadora_id === result.transportadora_id && f.regiao_destino === result.regiao_destino));
      return [...prev, result];
    });
  }, [setFavorites]);

  const isFavorite = useCallback((result: QuotationResult) => {
    return favorites.some(f => f.transportadora_id === result.transportadora_id && f.regiao_destino === result.regiao_destino);
  }, [favorites]);

  const selectAndAdvance = useCallback((result: QuotationResult) => {
    setSelectedResult(result);
    setStep('despachar');
  }, []);

  const resetFlow = useCallback(() => {
    setStep('dados');
    setCargoData(null);
    setQuotationResults([]);
    setSelectedResult(null);
    setHasSearched(false);
  }, []);

  return {
    // Flow state
    step, setStep, cargoData, quotationResults, selectedResult, hasSearched,
    // Actions
    calculate, selectAndAdvance, resetFlow, simulateScenario,
    // Templates
    templates, saveTemplate, deleteTemplate, loadTemplate,
    // Favorites
    favorites, toggleFavorite, isFavorite,
    // History
    history,
    // Data
    tabelasList, transportadoras, isLoadingTabelas, stats,
    addTabelaFrete, deleteTabelaFrete,
    // Smart carrier
    smartCarrier,
  };
}
