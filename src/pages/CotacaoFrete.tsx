import { useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, TrendingUp, MapPin, Truck, Clock, Bookmark, SplitSquareVertical, FileCheck, TrendingDown } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { DataExporter } from '@/components/common/DataExporter';
import { useQuotationFlow, type TabelaFrete } from '@/hooks';
import {
  QuotationForm,
  QuotationResults,
  FreightTableManager,
  RodonavesQuotation,
  SmartCarrierSelector,
  QuotationHistory,
  CargoTemplates,
  ScenarioSimulator,
} from '@/components/freight';
import { TransportadoraRanking } from '@/components/dashboard/TransportadoraRanking';
import { CotacoesFreteManager } from '@/components/freight/CotacoesFreteManager';
import type { QuotationFormData } from '@/components/freight/QuotationForm';

export default function CotacaoFrete() {
  const flow = useQuotationFlow();

  const handleCalculate = useCallback((data: QuotationFormData) => {
    flow.calculate(data);
  }, [flow]);

  const handleAddTable = useCallback((data: Omit<TabelaFrete, 'id' | 'created_at' | 'updated_at' | 'transportadora'>) => {
    flow.addTabelaFrete?.mutate(data);
  }, [flow.addTabelaFrete]);

  const handleDeleteTable = useCallback((id: string) => {
    flow.deleteTabelaFrete?.mutate(id);
  }, [flow.deleteTabelaFrete]);

  // Export data for results
  const exportData = flow.quotationResults.map(r => ({
    transportadora: r.transportadora_nome,
    valor_total: `R$ ${r.valor_total?.toFixed(2)}`,
    preco_kg: `R$ ${r.preco_por_kg?.toFixed(2)}`,
    taxa_fixa: `R$ ${r.taxa_fixa?.toFixed(2)}`,
    prazo_dias: r.prazo_dias,
    melhor_preco: r.melhor_preco ? 'Sim' : '',
    melhor_prazo: r.melhor_prazo ? 'Sim' : '',
  }));

  return (
    <MainLayout>
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: 'Operações' }, { label: 'Cotação de Frete' }]} />

        <PageHeader
          title="Cotação de Frete"
          description="Calcule e compare custos de frete entre transportadoras"
          icon={Calculator}
        >
          {flow.quotationResults.length > 0 && (
            <DataExporter data={exportData} filename="cotacao-frete" />
          )}
        </PageHeader>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card text-center">
            <Calculator className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{flow.stats.tabelas}</p>
            <p className="text-xs text-muted-foreground">Tabelas</p>
          </div>
          <div className="stat-card text-center">
            <TrendingUp className="w-5 h-5 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold">{flow.stats.transportadoras}</p>
            <p className="text-xs text-muted-foreground">Transportadoras</p>
          </div>
          <div className="stat-card text-center">
            <MapPin className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{flow.stats.estados}</p>
            <p className="text-xs text-muted-foreground">Estados</p>
          </div>
        </div>

        <Tabs defaultValue="cotacao">
          <TabsList className="flex-wrap">
            <TabsTrigger value="cotacao"><Calculator className="w-4 h-4 mr-1" />Cotação</TabsTrigger>
            <TabsTrigger value="rodonaves"><Truck className="w-4 h-4 mr-1" />Rodonaves RTE</TabsTrigger>
            <TabsTrigger value="tabelas"><MapPin className="w-4 h-4 mr-1" />Tabelas de Frete</TabsTrigger>
            <TabsTrigger value="historico"><Clock className="w-4 h-4 mr-1" />Histórico</TabsTrigger>
            <TabsTrigger value="templates"><Bookmark className="w-4 h-4 mr-1" />Templates</TabsTrigger>
            <TabsTrigger value="cenarios"><SplitSquareVertical className="w-4 h-4 mr-1" />Cenários</TabsTrigger>
            <TabsTrigger value="cotacoes-salvas"><FileCheck className="w-4 h-4 mr-1" />Cotações Salvas</TabsTrigger>
            <TabsTrigger value="ia">🤖 IA Recomendação</TabsTrigger>
          </TabsList>

          <TabsContent value="cotacao" className="space-y-4">
            <QuotationForm onSubmit={handleCalculate} />
            <QuotationResults
              results={flow.quotationResults}
              hasSearched={flow.hasSearched}
              onSelect={(r) => flow.selectAndAdvance(r)}
            />
          </TabsContent>

          <TabsContent value="rodonaves" className="space-y-4">
            <RodonavesQuotation />
          </TabsContent>

          <TabsContent value="tabelas" className="space-y-4">
            <FreightTableManager
              tabelasList={flow.tabelasList}
              transportadoras={flow.transportadoras || []}
              isLoading={flow.isLoadingTabelas}
              onAdd={handleAddTable}
              onDelete={handleDeleteTable}
            />
          </TabsContent>

          <TabsContent value="historico" className="space-y-4">
            <QuotationHistory history={flow.history} onReuse={async (data) => await flow.calculate(data)} />
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <CargoTemplates
              templates={flow.templates}
              currentData={flow.cargoData}
              onSave={flow.saveTemplate}
              onDelete={flow.deleteTemplate}
              onLoad={flow.loadTemplate}
            />
          </TabsContent>

          <TabsContent value="cenarios" className="space-y-4">
            <ScenarioSimulator cargoData={flow.cargoData} simulateScenario={flow.simulateScenario} />
          </TabsContent>

          <TabsContent value="cotacoes-salvas" className="space-y-4">
            <CotacoesFreteManager />
          </TabsContent>

          <TabsContent value="ia" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SmartCarrierSelector onSelect={(r) => flow.selectAndAdvance({
                  transportadora_id: r.id,
                  transportadora_nome: r.nome,
                  valor_total: r.valorTotal,
                  prazo_dias: r.prazoDias,
                  score_performance: r.scorePerformance,
                  preco_por_kg: r.precoPorKg,
                  taxa_fixa: r.taxaFixa,
                  regiao_destino: r.regiao,
                  melhor_preco: false,
                  melhor_prazo: false,
                  melhor_custo_beneficio: true
                })} />
              </div>
              <div className="space-y-6">
                <div className="card-base p-6 border-primary/20 bg-primary/5">
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                    <TrendingDown className="w-5 h-5 text-primary" />
                    Economia Garantida
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Nossa IA compara automaticamente tabelas e histórico do Bitrix24 para encontrar discrepâncias de até 50%.
                  </p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-white/10 rounded-lg">
                      <span className="text-xs uppercase font-bold">Média Mensal</span>
                      <span className="font-bold">R$ 12.450,00</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-success/20 rounded-lg border border-success/30">
                      <span className="text-xs uppercase font-bold text-success">Economia IA</span>
                      <span className="font-bold text-success">- R$ 3.120,00</span>
                    </div>
                  </div>
                </div>
                <TransportadoraRanking transportadoras={flow.transportadoras || []} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
