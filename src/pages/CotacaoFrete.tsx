import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Calculator, TrendingUp, Clock, Plus, Trash2, Search, Package, MapPin, Star, Loader2, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { useFreightQuotation, QuotationResult } from '@/hooks/useFreightQuotation';
import { useSmartCarrierSelection } from '@/hooks/useSmartCarrierSelection';
import { SmartCarrierSelector } from '@/components/freight/SmartCarrierSelector';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { Pagination } from '@/components/common/Pagination';
import { FilterBar } from '@/components/common/FilterBar';
import { BulkActions, useSelection } from '@/components/common/BulkActions';
import { usePagination } from '@/hooks/usePagination';
import { useFilters, FilterConfig } from '@/hooks/useFilters';
import { useSorting } from '@/hooks/useSorting';

const ESTADOS_BRASIL = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

interface TabelaFreteLocal { id: string; transportadora_id: string; transportadora_nome?: string; estado_destino: string; peso_min: number; peso_max: number; valor_kg: number; prazo_dias: number; }

const filterConfig: FilterConfig<TabelaFreteLocal> = {
  search: {
    fields: ["transportadora_nome", "estado_destino"],
    placeholder: "Buscar tabelas..."
  }
};

export default function CotacaoFrete() {
  const freightQuotation = useFreightQuotation();
  const smartCarrier = useSmartCarrierSelection();
  
  const tabelasFrete = freightQuotation?.tabelasFrete || [];
  const transportadoras = freightQuotation?.transportadoras || [];
  const isLoadingTabelas = freightQuotation?.isLoadingTabelas || false;
  const calculateQuotations = freightQuotation?.calculateQuotations;
  const addTabelaFreteMutation = freightQuotation?.addTabelaFrete;
  const deleteTabelaFreteMutation = freightQuotation?.deleteTabelaFrete;
  
  const analyzeCarriers = smartCarrier?.analyzeCarriers;
  const loadingAI = smartCarrier?.isLoading || false;
  
  const [estadoDestino, setEstadoDestino] = useState('');
  const [pesoKg, setPesoKg] = useState('');
  const [quotationResults, setQuotationResults] = useState<QuotationResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTableForm, setNewTableForm] = useState({ transportadora_id: '', estado_destino: '', peso_min: 0, peso_max: 100, valor_kg: 0, prazo_dias: 5 });
  const [tab, setTab] = useState("cotacao");
  const [estadoFilter, setEstadoFilter] = useState("all");

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
    prazo_dias: t.prazo_dias || 5 
  })), [tabelasFrete]);

  // Apply estado filter
  const estadoFiltered = useMemo(() => {
    if (estadoFilter === "all") return tabelasList;
    return tabelasList.filter(t => t.estado_destino === estadoFilter);
  }, [tabelasList, estadoFilter]);

  const { filteredData, filters, setSearch, clearFilters, hasActiveFilters, totalFiltered, totalOriginal } = useFilters(estadoFiltered, filterConfig);
  const { sortedData, toggleSort, getSortDirection } = useSorting(filteredData, { defaultKey: "valor_kg", defaultDirection: "asc" });
  const pagination = usePagination(sortedData, { initialPageSize: 10 });
  const { selectedIds, toggle, selectAll, clearSelection, isSelected } = useSelection(pagination.paginatedData);

  const handleCalculate = async () => {
    if (!estadoDestino || !pesoKg) { toast.error("Preencha estado e peso"); return; }
    if (calculateQuotations) {
      const results = calculateQuotations({ estado_destino: estadoDestino, peso_kg: parseFloat(pesoKg) });
      setQuotationResults(results || []);
      setHasSearched(true);
    }
    // Chamar IA para recomendação
    if (analyzeCarriers) {
      analyzeCarriers({ estado_destino: estadoDestino, peso_kg: parseFloat(pesoKg), urgencia: 'normal' });
    }
  };

  const handleAddTable = async () => {
    if (addTabelaFreteMutation) {
      addTabelaFreteMutation.mutate({
        transportadora_id: newTableForm.transportadora_id,
        estado_destino: newTableForm.estado_destino,
        regiao_destino: newTableForm.estado_destino,
        peso_min_kg: newTableForm.peso_min,
        peso_max_kg: newTableForm.peso_max,
        preco_por_kg: newTableForm.valor_kg,
        prazo_dias: newTableForm.prazo_dias,
        taxa_fixa: 0,
        ativo: true
      });
    }
    setIsAddDialogOpen(false);
    setNewTableForm({ transportadora_id: '', estado_destino: '', peso_min: 0, peso_max: 100, valor_kg: 0, prazo_dias: 5 });
  };

  const handleDeleteTable = (id: string) => {
    if (deleteTabelaFreteMutation) {
      deleteTabelaFreteMutation.mutate(id);
    }
  };

  const bulkDelete = async (ids: string[]) => { 
    for (const id of ids) { 
      handleDeleteTable(id); 
    } 
    clearSelection(); 
  };

  const handleClearFilters = () => {
    clearFilters();
    setEstadoFilter("all");
  };

  const stats = { tabelas: tabelasList.length, transportadoras: transportadoras?.length || 0, estados: [...new Set(tabelasList.map(t => t.estado_destino))].length };
  const SortIcon = ({ field }: { field: string }) => { 
    const dir = getSortDirection(field as keyof TabelaFreteLocal); 
    if (!dir) return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />; 
    return dir === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />; 
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><h1 className="text-display flex items-center gap-3"><div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400/20 to-blue-600/10"><Calculator className="w-6 h-6 text-blue-500" /></div>Cotação de Frete</h1><p className="text-muted-foreground mt-1">Calcule e compare custos de frete</p></div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card text-center"><Calculator className="w-5 h-5 text-blue-500 mx-auto mb-2" /><p className="text-2xl font-bold">{stats.tabelas}</p><p className="text-xs text-muted-foreground">Tabelas</p></div>
          <div className="stat-card text-center"><TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-2" /><p className="text-2xl font-bold">{stats.transportadoras}</p><p className="text-xs text-muted-foreground">Transportadoras</p></div>
          <div className="stat-card text-center"><MapPin className="w-5 h-5 text-purple-500 mx-auto mb-2" /><p className="text-2xl font-bold">{stats.estados}</p><p className="text-xs text-muted-foreground">Estados</p></div>
        </div>

        <Tabs value={tab} onValueChange={setTab}><TabsList><TabsTrigger value="cotacao">Cotação</TabsTrigger><TabsTrigger value="tabelas">Tabelas de Frete</TabsTrigger><TabsTrigger value="ia">IA Recomendação</TabsTrigger></TabsList>

          <TabsContent value="cotacao" className="space-y-4">
            <div className="card-base p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div><Label>Estado Destino</Label><Select value={estadoDestino} onValueChange={setEstadoDestino}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{ESTADOS_BRASIL.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent></Select></div>
                <div><Label>Peso (kg)</Label><Input type="number" value={pesoKg} onChange={(e) => setPesoKg(e.target.value)} placeholder="Ex: 10" /></div>
                <div className="flex items-end"><Button onClick={handleCalculate} className="w-full"><Search className="w-4 h-4 mr-2" />Calcular</Button></div>
              </div>
            </div>
            {hasSearched && <div className="space-y-3">{quotationResults.length > 0 ? quotationResults.map((r, i) => (
              <div key={i} className="card-interactive flex items-center gap-4">
                <div className={cn("p-3 rounded-lg", i === 0 ? "bg-amber-100" : "bg-muted")}>{i === 0 ? <Star className="w-5 h-5 text-amber-500" /> : <Package className="w-5 h-5" />}</div>
                <div className="flex-1"><p className="font-semibold">{r.transportadora_nome}</p><p className="text-sm text-muted-foreground"><Clock className="w-3 h-3 inline mr-1" />{r.prazo_dias} dias</p></div>
                <div className="text-right"><p className="text-2xl font-bold text-primary">R$ {r.valor_total?.toFixed(2)}</p><p className="text-xs text-muted-foreground">R$ {r.preco_por_kg?.toFixed(2)}/kg</p></div>
                <Button>Selecionar</Button>
              </div>
            )) : <div className="text-center py-8 text-muted-foreground">Nenhuma cotação encontrada</div>}</div>}
          </TabsContent>

          <TabsContent value="tabelas" className="space-y-4">
            <div className="flex justify-end"><Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}><DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Nova Tabela</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Nova Tabela de Frete</DialogTitle></DialogHeader><div className="grid gap-4 py-4"><div><Label>Transportadora</Label><Select value={newTableForm.transportadora_id} onValueChange={(v) => setNewTableForm({ ...newTableForm, transportadora_id: v })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{(transportadoras || []).map((t: any) => <SelectItem key={t.id} value={t.id}>{t.nome_fantasia}</SelectItem>)}</SelectContent></Select></div><div><Label>Estado Destino</Label><Select value={newTableForm.estado_destino} onValueChange={(v) => setNewTableForm({ ...newTableForm, estado_destino: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ESTADOS_BRASIL.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent></Select></div><div className="grid grid-cols-2 gap-2"><div><Label>Peso Mín</Label><Input type="number" value={newTableForm.peso_min} onChange={(e) => setNewTableForm({ ...newTableForm, peso_min: Number(e.target.value) })} /></div><div><Label>Peso Máx</Label><Input type="number" value={newTableForm.peso_max} onChange={(e) => setNewTableForm({ ...newTableForm, peso_max: Number(e.target.value) })} /></div></div><div className="grid grid-cols-2 gap-2"><div><Label>Valor/kg</Label><Input type="number" step="0.01" value={newTableForm.valor_kg} onChange={(e) => setNewTableForm({ ...newTableForm, valor_kg: Number(e.target.value) })} /></div><div><Label>Prazo (dias)</Label><Input type="number" value={newTableForm.prazo_dias} onChange={(e) => setNewTableForm({ ...newTableForm, prazo_dias: Number(e.target.value) })} /></div></div></div><DialogFooter><Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button><Button onClick={handleAddTable}>Criar</Button></DialogFooter></DialogContent></Dialog></div>
            
            <FilterBar 
              search={filters.search} 
              onSearchChange={setSearch} 
              searchPlaceholder="Buscar tabelas..." 
              extraFilters={[
                { key: "estado_destino", label: "Estado", value: estadoFilter, options: ESTADOS_BRASIL.map(uf => ({ value: uf, label: uf })), onChange: setEstadoFilter }
              ]} 
              onClearFilters={handleClearFilters} 
              hasActiveFilters={hasActiveFilters || estadoFilter !== "all"} 
              totalFiltered={totalFiltered} 
              totalOriginal={totalOriginal} 
            />
            
            <div className="flex items-center gap-2"><Button variant="ghost" size="sm" onClick={() => toggleSort("valor_kg")} className="gap-1">Valor <SortIcon field="valor_kg" /></Button><Button variant="ghost" size="sm" onClick={() => toggleSort("prazo_dias")} className="gap-1">Prazo <SortIcon field="prazo_dias" /></Button></div>
            
            {selectedIds.length > 0 && <BulkActions selectedIds={selectedIds} totalCount={pagination.paginatedData.length} onClearSelection={clearSelection} onSelectAll={selectAll} actions={[{ id: "delete", label: "Excluir", icon: Trash2, variant: "destructive", onClick: bulkDelete }]} />}
            
            {isLoadingTabelas ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div> : <div className="space-y-2">{pagination.paginatedData.map((t, i) => (
              <div key={t.id} className={cn("card-interactive flex items-center gap-3", isSelected(t.id) && "ring-2 ring-primary")}>
                <Checkbox checked={isSelected(t.id)} onCheckedChange={() => toggle(t.id)} />
                <div className="flex-1"><p className="font-semibold">{t.transportadora_nome}</p><p className="text-sm text-muted-foreground"><MapPin className="w-3 h-3 inline" /> {t.estado_destino} | {t.peso_min}-{t.peso_max}kg</p></div>
                <div className="text-right"><p className="font-bold">R$ {t.valor_kg?.toFixed(2)}/kg</p><p className="text-sm text-muted-foreground">{t.prazo_dias} dias</p></div>
                <Button variant="ghost" size="icon" onClick={() => handleDeleteTable(t.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </div>
            ))}</div>}
            
            {sortedData.length === 0 && !isLoadingTabelas && <div className="text-center py-12 text-muted-foreground">Nenhuma tabela cadastrada</div>}
            
            {sortedData.length > 0 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                pageSize={pagination.pageSize}
                totalItems={pagination.totalItems}
                startIndex={pagination.startIndex}
                endIndex={pagination.endIndex}
                hasNextPage={pagination.hasNextPage}
                hasPrevPage={pagination.hasPrevPage}
                pageSizeOptions={pagination.pageSizeOptions}
                onPageChange={pagination.setPage}
                onPageSizeChange={pagination.setPageSize}
                onNextPage={pagination.nextPage}
                onPrevPage={pagination.prevPage}
                onFirstPage={pagination.firstPage}
                onLastPage={pagination.lastPage}
              />
            )}
          </TabsContent>

          <TabsContent value="ia"><SmartCarrierSelector /></TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}