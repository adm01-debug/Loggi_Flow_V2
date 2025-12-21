import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Bell, Plus, Trash2, DollarSign, Truck, MapPin, Globe, TrendingUp, CheckCircle2, XCircle, RefreshCw, ArrowUpDown, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { useCostAlerts, CostCheckResult } from '@/hooks/useCostAlerts';
import { useSmartAlerts } from '@/hooks/useSmartAlerts';
import { cn } from '@/lib/utils';

import { Pagination } from '@/components/common/Pagination';
import { FilterBar } from '@/components/common/FilterBar';
import { BulkActions, useSelection } from '@/components/common/BulkActions';
import { usePagination } from '@/hooks/usePagination';
import { useFilters, FilterConfig } from '@/hooks/useFilters';
import { useSorting } from '@/hooks/useSorting';
import { useRealtime } from '@/hooks/useRealtime';

const ESTADOS_BRASIL = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

interface Alerta { id: string; nome: string; tipo: string; valor_limite: number; estado_origem?: string; estado_destino?: string; ativo: boolean; created_at: string; }

const filterConfig: FilterConfig<Alerta>[] = [
  { key: "search", type: "search", fields: ["nome", "tipo"] },
  { key: "tipo", type: "select", field: "tipo", options: [{ value: "valor_maximo", label: "Valor Máximo" }, { value: "valor_minimo", label: "Valor Mínimo" }, { value: "variacao", label: "Variação %" }] },
  { key: "ativo", type: "custom", filterFn: (item, value) => value === "sim" ? item.ativo : value === "nao" ? !item.ativo : true }
];

export default function AlertasCusto() {
  const { alertas = [], notificacoes, transportadoras, costCheckResults, isLoadingAlertas, checkCosts, createAlerta, deleteAlerta, updateAlerta, markAllAsRead, refetch } = useCostAlerts();
  const { smartAlerts } = useSmartAlerts();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAlertForm, setNewAlertForm] = useState({ nome: '', tipo: 'valor_maximo', valor_limite: 0, estado_origem: '', estado_destino: '', ativo: true });

  useRealtime({ table: "cost_alerts", onInsert: () => refetch?.(), onUpdate: () => refetch?.(), onDelete: () => refetch?.() });

  const alertasList = useMemo(() => (alertas || []).map((a: any) => ({ id: a.id, nome: a.nome || a.name || 'Alerta', tipo: a.tipo || a.type || 'valor_maximo', valor_limite: a.valor_limite || a.threshold || 0, estado_origem: a.estado_origem, estado_destino: a.estado_destino, ativo: a.ativo ?? true, created_at: a.created_at })), [alertas]);

  const { filteredData, filters, setFilter, clearFilters, hasActiveFilters } = useFilters(alertasList, filterConfig);
  const { sortedData, toggleSort, getSortDirection } = useSorting(filteredData, { defaultKey: "created_at", defaultDirection: "desc" });
  const { paginatedData, currentPage, totalPages, pageSize, setPageSize, goToPage, hasNextPage, hasPrevPage } = usePagination(sortedData, { initialPageSize: 10 });
  const { selectedIds, toggle, selectAll, clearSelection, isSelected } = useSelection(paginatedData);

  const handleCreateAlert = async () => {
    await createAlerta?.(newAlertForm);
    setIsAddDialogOpen(false);
    setNewAlertForm({ nome: '', tipo: 'valor_maximo', valor_limite: 0, estado_origem: '', estado_destino: '', ativo: true });
  };

  const bulkDelete = async (ids: string[]) => {
    for (const id of ids) { await deleteAlerta?.(id); }
    clearSelection();
  };

  const bulkToggle = async (ids: string[], ativo: boolean) => {
    for (const id of ids) { await updateAlerta?.(id, { ativo }); }
    clearSelection();
  };

  const stats = { total: alertasList.length, ativos: alertasList.filter(a => a.ativo).length, notificacoes: notificacoes?.length || 0 };
  const SortIcon = ({ field }: { field: string }) => { const dir = getSortDirection(field as any); if (!dir) return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />; return dir === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />; };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><h1 className="text-display flex items-center gap-3"><div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-red-400/20 to-red-600/10"><AlertTriangle className="w-6 h-6 text-red-500" /></div>Alertas de Custo</h1><p className="text-muted-foreground mt-1">Configure alertas para monitorar custos de frete</p></div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => checkCosts?.()}><RefreshCw className="w-4 h-4 mr-2" />Verificar</Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}><DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Novo Alerta</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Novo Alerta</DialogTitle></DialogHeader><div className="grid gap-4 py-4"><div className="grid gap-2"><Label>Nome</Label><Input value={newAlertForm.nome} onChange={(e) => setNewAlertForm({ ...newAlertForm, nome: e.target.value })} /></div><div className="grid gap-2"><Label>Tipo</Label><Select value={newAlertForm.tipo} onValueChange={(v) => setNewAlertForm({ ...newAlertForm, tipo: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="valor_maximo">Valor Máximo</SelectItem><SelectItem value="valor_minimo">Valor Mínimo</SelectItem><SelectItem value="variacao">Variação %</SelectItem></SelectContent></Select></div><div className="grid gap-2"><Label>Valor Limite</Label><Input type="number" value={newAlertForm.valor_limite} onChange={(e) => setNewAlertForm({ ...newAlertForm, valor_limite: Number(e.target.value) })} /></div><div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>Origem</Label><Select value={newAlertForm.estado_origem} onValueChange={(v) => setNewAlertForm({ ...newAlertForm, estado_origem: v })}><SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent>{ESTADOS_BRASIL.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label>Destino</Label><Select value={newAlertForm.estado_destino} onValueChange={(v) => setNewAlertForm({ ...newAlertForm, estado_destino: v })}><SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent>{ESTADOS_BRASIL.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent></Select></div></div></div><DialogFooter><Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button><Button onClick={handleCreateAlert}>Criar</Button></DialogFooter></DialogContent></Dialog>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card text-center"><AlertTriangle className="w-5 h-5 text-red-500 mx-auto mb-2" /><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total Alertas</p></div>
          <div className="stat-card text-center"><CheckCircle2 className="w-5 h-5 text-green-500 mx-auto mb-2" /><p className="text-2xl font-bold">{stats.ativos}</p><p className="text-xs text-muted-foreground">Ativos</p></div>
          <div className="stat-card text-center"><Bell className="w-5 h-5 text-amber-500 mx-auto mb-2" /><p className="text-2xl font-bold">{stats.notificacoes}</p><p className="text-xs text-muted-foreground">Notificações</p></div>
        </div>

        <FilterBar searchValue={filters.search as string || ""} onSearchChange={(v) => setFilter("search", v)} searchPlaceholder="Buscar alertas..." filters={[{ key: "tipo", label: "Tipo", type: "select", value: filters.tipo as string || "", options: [{ value: "", label: "Todos" }, { value: "valor_maximo", label: "Valor Máximo" }, { value: "valor_minimo", label: "Valor Mínimo" }, { value: "variacao", label: "Variação %" }], onChange: (v) => setFilter("tipo", v || undefined) }, { key: "ativo", label: "Status", type: "select", value: filters.ativo as string || "", options: [{ value: "", label: "Todos" }, { value: "sim", label: "Ativos" }, { value: "nao", label: "Inativos" }], onChange: (v) => setFilter("ativo", v || undefined) }]} onClearFilters={clearFilters} hasActiveFilters={hasActiveFilters} totalCount={sortedData.length} filteredCount={sortedData.length} />

        <div className="flex items-center gap-2"><Button variant="ghost" size="sm" onClick={() => toggleSort("valor_limite")} className="gap-1">Valor <SortIcon field="valor_limite" /></Button><Button variant="ghost" size="sm" onClick={() => toggleSort("created_at")} className="gap-1">Data <SortIcon field="created_at" /></Button></div>

        {selectedIds.length > 0 && <BulkActions selectedIds={selectedIds} totalCount={paginatedData.length} onClearSelection={clearSelection} onSelectAll={selectAll} actions={[{ id: "ativar", label: "Ativar", icon: CheckCircle2, onClick: (ids) => bulkToggle(ids, true) }, { id: "desativar", label: "Desativar", icon: XCircle, onClick: (ids) => bulkToggle(ids, false) }, { id: "delete", label: "Excluir", icon: Trash2, variant: "destructive", onClick: bulkDelete }]} />}

        {isLoadingAlertas && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}

        {!isLoadingAlertas && <div className="space-y-3">{paginatedData.map((a, i) => (
          <div key={a.id} className={cn("card-interactive", isSelected(a.id) && "ring-2 ring-primary")} style={{ animationDelay: `${i * 30}ms` }}>
            <div className="flex items-center gap-3">
              <Checkbox checked={isSelected(a.id)} onCheckedChange={() => toggle(a.id)} />
              <div className={cn("p-2 rounded-lg", a.ativo ? "bg-green-100" : "bg-gray-100")}><DollarSign className={cn("w-5 h-5", a.ativo ? "text-green-600" : "text-gray-400")} /></div>
              <div className="flex-1"><p className="font-semibold">{a.nome}</p><div className="flex items-center gap-2 text-sm text-muted-foreground"><Badge variant="outline">{a.tipo}</Badge>{a.estado_origem && <span><MapPin className="w-3 h-3 inline" /> {a.estado_origem} → {a.estado_destino || "Todos"}</span>}</div></div>
              <div className="text-right"><p className="font-bold text-lg">R$ {a.valor_limite.toFixed(2)}</p><Badge variant={a.ativo ? "default" : "secondary"}>{a.ativo ? "Ativo" : "Inativo"}</Badge></div>
              <Switch checked={a.ativo} onCheckedChange={(v) => updateAlerta?.(a.id, { ativo: v })} />
              <Button variant="ghost" size="icon" onClick={() => deleteAlerta?.(a.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          </div>
        ))}</div>}

        {!isLoadingAlertas && sortedData.length === 0 && <div className="flex flex-col items-center py-12"><AlertTriangle className="w-12 h-12 text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">Nenhum alerta configurado</p></div>}
        {!isLoadingAlertas && sortedData.length > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} totalItems={sortedData.length} onPageChange={goToPage} onPageSizeChange={setPageSize} hasNextPage={hasNextPage} hasPrevPage={hasPrevPage} />}
      </div>
    </MainLayout>
  );
}
