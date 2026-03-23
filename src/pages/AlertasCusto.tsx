import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Bell, Plus, Trash2, DollarSign, MapPin, TrendingUp, CheckCircle2, XCircle, RefreshCw, ArrowUpDown, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { useCostAlerts } from '@/hooks/useCostAlerts';
import { useSmartAlerts } from '@/hooks/useSmartAlerts';
import { cn } from '@/lib/utils';

import { Pagination } from '@/components/common/Pagination';
import { FilterBar } from '@/components/common/FilterBar';
import { BulkActions, useSelection } from '@/components/common/BulkActions';
import { usePagination } from '@/hooks/usePagination';
import { useFilters } from '@/hooks/useFilters';
import { useSorting } from '@/hooks/useSorting';

const ESTADOS_BRASIL = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

interface Alerta { 
  id: string; 
  nome: string; 
  tipo: string; 
  valor_limite: number; 
  estado_origem?: string; 
  estado_destino?: string; 
  ativo: boolean; 
  created_at: string; 
}

export default function AlertasCusto() {
  const { 
    alertas = [], 
    notificacoes, 
    costCheckResults, 
    isLoadingAlertas, 
    checkCosts, 
    createAlerta, 
    deleteAlerta, 
    updateAlerta, 
    markAllAsRead 
  } = useCostAlerts();
  
  const { alerts: smartAlertsList } = useSmartAlerts();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [tipoFilter, setTipoFilter] = useState("all");
  const [ativoFilter, setAtivoFilter] = useState("all");
  const [newAlertForm, setNewAlertForm] = useState({ 
    nome: '', 
    tipo: 'valor_maximo', 
    valor_limite: 0, 
    estado_origem: '', 
    estado_destino: '', 
    ativo: true 
  });

  interface AlertaRaw {
    id: string;
    nome?: string;
    name?: string;
    tipo?: string;
    type?: string;
    valor_limite?: number;
    limite_mensal?: number;
    threshold?: number;
    estado_origem?: string;
    estado_destino?: string;
    ativo?: boolean;
    created_at: string;
  }

  const alertasList = useMemo(() => (alertas || []).map((a: AlertaRaw) => ({ 
    id: a.id, 
    nome: a.nome || a.name || 'Alerta', 
    tipo: a.tipo || a.type || 'valor_maximo', 
    valor_limite: a.valor_limite || a.limite_mensal || a.threshold || 0, 
    estado_origem: a.estado_origem, 
    estado_destino: a.estado_destino, 
    ativo: a.ativo ?? true, 
    created_at: a.created_at 
  })), [alertas]);

  const { filteredData, filters, setSearch, clearFilters, hasActiveFilters } = useFilters(alertasList, {
    search: { fields: ["nome", "tipo"] as (keyof Alerta)[] }
  });

  // Apply additional filters
  const fullyFilteredData = filteredData.filter(alerta => {
    if (tipoFilter !== "all" && alerta.tipo !== tipoFilter) return false;
    if (ativoFilter === "sim" && !alerta.ativo) return false;
    if (ativoFilter === "nao" && alerta.ativo) return false;
    return true;
  });

  const { sortedData, toggleSort, getSortDirection } = useSorting(fullyFilteredData, { defaultKey: "created_at", defaultDirection: "desc" });
  const pagination = usePagination(sortedData, { initialPageSize: 10 });
  const { selectedIds, toggle, selectAll, clearSelection, isSelected } = useSelection(pagination.paginatedData);

  const handleCreateAlert = async () => {
    // Map form tipo to API tipo
    const tipoMap: Record<string, 'transportadora' | 'rota' | 'global'> = {
      'valor_maximo': 'global',
      'valor_minimo': 'global', 
      'variacao': 'global'
    };
    await createAlerta.mutateAsync({
      tipo: tipoMap[newAlertForm.tipo] || 'global',
      limite_mensal: newAlertForm.valor_limite,
      estado_destino: newAlertForm.estado_destino || null,
      ativo: newAlertForm.ativo,
      notificar_percentual: 80,
      transportadora_id: null,
      limite_por_entrega: null,
      created_by: null,
    });
    setIsAddDialogOpen(false);
    setNewAlertForm({ nome: '', tipo: 'valor_maximo', valor_limite: 0, estado_origem: '', estado_destino: '', ativo: true });
  };

  const bulkDelete = async (ids: string[]) => {
    for (const id of ids) { 
      await deleteAlerta.mutateAsync(id); 
    }
    clearSelection();
  };

  const bulkToggle = async (ids: string[], ativo: boolean) => {
    for (const id of ids) { 
      await updateAlerta.mutateAsync({ id, ativo }); 
    }
    clearSelection();
  };

  const stats = { 
    total: alertasList.length, 
    ativos: alertasList.filter(a => a.ativo).length, 
    notificacoes: notificacoes?.length || 0 
  };

  const SortIcon = ({ field }: { field: string }) => { 
    const dir = getSortDirection(field as keyof Alerta); 
    if (!dir) return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />; 
    return dir === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />; 
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-display flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-destructive/10">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              Alertas de Custo
            </h1>
            <p className="text-muted-foreground mt-1">Configure alertas para monitorar custos de frete</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => checkCosts()}>
              <RefreshCw className="w-4 h-4 mr-2" />Verificar
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />Novo Alerta</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Novo Alerta</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Nome</Label>
                    <Input value={newAlertForm.nome} onChange={(e) => setNewAlertForm({ ...newAlertForm, nome: e.target.value })} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Tipo</Label>
                    <Select value={newAlertForm.tipo} onValueChange={(v) => setNewAlertForm({ ...newAlertForm, tipo: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="valor_maximo">Valor Máximo</SelectItem>
                        <SelectItem value="valor_minimo">Valor Mínimo</SelectItem>
                        <SelectItem value="variacao">Variação %</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Valor Limite</Label>
                    <Input type="number" value={newAlertForm.valor_limite} onChange={(e) => setNewAlertForm({ ...newAlertForm, valor_limite: Number(e.target.value) })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Origem</Label>
                      <Select value={newAlertForm.estado_origem} onValueChange={(v) => setNewAlertForm({ ...newAlertForm, estado_origem: v })}>
                        <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                        <SelectContent>
                          {ESTADOS_BRASIL.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Destino</Label>
                      <Select value={newAlertForm.estado_destino} onValueChange={(v) => setNewAlertForm({ ...newAlertForm, estado_destino: v })}>
                        <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                        <SelectContent>
                          {ESTADOS_BRASIL.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreateAlert}>Criar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card text-center">
            <AlertTriangle className="w-5 h-5 text-destructive mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Alertas</p>
          </div>
          <div className="stat-card text-center">
            <CheckCircle2 className="w-5 h-5 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.ativos}</p>
            <p className="text-xs text-muted-foreground">Ativos</p>
          </div>
          <div className="stat-card text-center">
            <Bell className="w-5 h-5 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.notificacoes}</p>
            <p className="text-xs text-muted-foreground">Notificações</p>
          </div>
        </div>

        <FilterBar 
          search={filters.search} 
          onSearchChange={setSearch} 
          searchPlaceholder="Buscar alertas..."
          status={tipoFilter}
          onStatusChange={setTipoFilter}
          statusOptions={[
            { value: "valor_maximo", label: "Valor Máximo" }, 
            { value: "valor_minimo", label: "Valor Mínimo" }, 
            { value: "variacao", label: "Variação %" }
          ]}
          statusLabel="Tipo"
          extraFilters={[{
            key: "ativo",
            value: ativoFilter,
            onChange: setAtivoFilter,
            options: [
              { value: "sim", label: "Ativos" }, 
              { value: "nao", label: "Inativos" }
            ],
            label: "Status"
          }]}
          hasActiveFilters={hasActiveFilters || tipoFilter !== "all" || ativoFilter !== "all"}
          onClearFilters={() => { clearFilters(); setTipoFilter("all"); setAtivoFilter("all"); }}
          totalFiltered={sortedData.length}
          totalOriginal={alertasList.length}
        />

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => toggleSort("valor_limite")} className="gap-1">
            Valor <SortIcon field="valor_limite" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => toggleSort("created_at")} className="gap-1">
            Data <SortIcon field="created_at" />
          </Button>
        </div>

        {selectedIds.length > 0 && (
          <BulkActions 
            selectedIds={selectedIds} 
            totalCount={pagination.paginatedData.length} 
            onClearSelection={clearSelection} 
            onSelectAll={selectAll} 
            actions={[
              { id: "ativar", label: "Ativar", icon: CheckCircle2, onClick: (ids) => bulkToggle(ids, true) }, 
              { id: "desativar", label: "Desativar", icon: XCircle, onClick: (ids) => bulkToggle(ids, false) }, 
              { id: "delete", label: "Excluir", icon: Trash2, variant: "destructive", onClick: bulkDelete }
            ]} 
          />
        )}

        {isLoadingAlertas && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}

        {!isLoadingAlertas && (
          <div className="space-y-3">
            {pagination.paginatedData.map((a, i) => (
              <div key={a.id} className={cn("card-interactive", isSelected(a.id) && "ring-2 ring-primary")} style={{ animationDelay: `${i * 30}ms` }}>
                <div className="flex items-center gap-3">
                  <Checkbox checked={isSelected(a.id)} onCheckedChange={() => toggle(a.id)} />
                  <div className={cn("p-2 rounded-lg", a.ativo ? "bg-green-100" : "bg-gray-100")}>
                    <DollarSign className={cn("w-5 h-5", a.ativo ? "text-green-600" : "text-gray-400")} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{a.nome}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline">{a.tipo}</Badge>
                      {a.estado_origem && (
                        <span><MapPin className="w-3 h-3 inline" /> {a.estado_origem} → {a.estado_destino || "Todos"}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">R$ {a.valor_limite.toFixed(2)}</p>
                    <Badge variant={a.ativo ? "default" : "secondary"}>{a.ativo ? "Ativo" : "Inativo"}</Badge>
                  </div>
                  <Switch 
                    checked={a.ativo} 
                    onCheckedChange={(v) => updateAlerta.mutate({ id: a.id, ativo: v })} 
                  />
                  <Button variant="ghost" size="icon" onClick={() => deleteAlerta.mutate(a.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoadingAlertas && sortedData.length === 0 && (
          <div className="flex flex-col items-center py-12">
            <AlertTriangle className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nenhum alerta configurado</p>
          </div>
        )}
        
        {!isLoadingAlertas && sortedData.length > 0 && (
          <Pagination 
            currentPage={pagination.currentPage} 
            totalPages={pagination.totalPages} 
            pageSize={pagination.pageSize} 
            totalItems={sortedData.length}
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
      </div>
    </MainLayout>
  );
}