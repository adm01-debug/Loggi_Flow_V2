import { useState, useMemo, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, TrendingUp, MapPin, Truck } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { useFreightQuotation, QuotationResult } from '@/hooks/useFreightQuotation';
import { useSmartCarrierSelection } from '@/hooks/useSmartCarrierSelection';
import {
  QuotationForm,
  QuotationResults,
  FreightTableManager,
  RodonavesQuotation,
  SmartCarrierSelector,
} from '@/components/freight';
import type { QuotationFormData } from '@/components/freight/QuotationForm';

export default function CotacaoFrete() {
  const freightQuotation = useFreightQuotation();
  const smartCarrier = useSmartCarrierSelection();

  const tabelasFrete = freightQuotation?.tabelasFrete || [];
  const transportadoras = freightQuotation?.transportadoras || [];
  const isLoadingTabelas = freightQuotation?.isLoadingTabelas || false;
  const calculateQuotations = freightQuotation?.calculateQuotations;
  const addTabelaFreteMutation = freightQuotation?.addTabelaFrete;
  const deleteTabelaFreteMutation = freightQuotation?.deleteTabelaFrete;

  const [quotationResults, setQuotationResults] = useState<QuotationResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [tab, setTab] = useState('cotacao');

  // Memoized tabelas list transformation
  const tabelasList = useMemo(() => (tabelasFrete || []).map((t: any) => ({
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

  const handleCalculate = useCallback((data: QuotationFormData) => {
    if (calculateQuotations) {
      const results = calculateQuotations({ estado_destino: data.estado_destino, peso_kg: data.peso_kg });
      setQuotationResults(results || []);
      setHasSearched(true);
    }
    smartCarrier?.analyzeCarriers({
      estado_destino: data.estado_destino,
      peso_kg: data.peso_kg,
      urgencia: 'normal',
    });
  }, [calculateQuotations, smartCarrier]);

  const handleAddTable = useCallback((data: any) => {
    addTabelaFreteMutation?.mutate(data);
  }, [addTabelaFreteMutation]);

  const handleDeleteTable = useCallback((id: string) => {
    deleteTabelaFreteMutation?.mutate(id);
  }, [deleteTabelaFreteMutation]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: 'Operações' }, { label: 'Cotação de Frete' }]} />

        <PageHeader
          title="Cotação de Frete"
          description="Calcule e compare custos de frete entre transportadoras"
          icon={Calculator}
        />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card text-center">
            <Calculator className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.tabelas}</p>
            <p className="text-xs text-muted-foreground">Tabelas</p>
          </div>
          <div className="stat-card text-center">
            <TrendingUp className="w-5 h-5 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.transportadoras}</p>
            <p className="text-xs text-muted-foreground">Transportadoras</p>
          </div>
          <div className="stat-card text-center">
            <MapPin className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.estados}</p>
            <p className="text-xs text-muted-foreground">Estados</p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex-wrap">
            <TabsTrigger value="cotacao"><Calculator className="w-4 h-4 mr-1" />Cotação</TabsTrigger>
            <TabsTrigger value="rodonaves"><Truck className="w-4 h-4 mr-1" />Rodonaves RTE</TabsTrigger>
            <TabsTrigger value="tabelas"><MapPin className="w-4 h-4 mr-1" />Tabelas de Frete</TabsTrigger>
            <TabsTrigger value="ia">🤖 IA Recomendação</TabsTrigger>
          </TabsList>

          <TabsContent value="cotacao" className="space-y-4">
            <QuotationForm onSubmit={handleCalculate} />
            <QuotationResults results={quotationResults} hasSearched={hasSearched} />
          </TabsContent>

          <TabsContent value="rodonaves" className="space-y-4">
            <RodonavesQuotation />
          </TabsContent>

          <TabsContent value="tabelas" className="space-y-4">
            <FreightTableManager
              tabelasList={tabelasList}
              transportadoras={transportadoras || []}
              isLoading={isLoadingTabelas}
              onAdd={handleAddTable}
              onDelete={handleDeleteTable}
            />
          </TabsContent>

          <TabsContent value="ia">
            <SmartCarrierSelector />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
