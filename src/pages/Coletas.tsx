import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Package, Truck, Clock, CheckCircle2, AlertTriangle, MapPin, Calendar, MoreVertical, Building2, Download, ArrowUpDown, ChevronUp, ChevronDown, Loader2, ScanLine, LucideIcon } from "lucide-react";
import { ScannerButton } from "@/components/scanner/ScannerButton";
import { ScanResult } from "@/hooks/useQRScanner";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useExport } from "@/hooks/useExport";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RTEPickupActions } from "@/components/rodonaves/RTEPickupActions";

import { Pagination } from "@/components/common/Pagination";
import { FilterBar } from "@/components/common/FilterBar";
import { BulkActions, useSelection } from "@/components/common/BulkActions";
import { Timeline } from "@/components/common/Timeline";
import { OnboardingTooltip } from "@/components/onboarding/OnboardingTooltip";
import { usePagination } from "@/hooks/usePagination";
import { useFilters, FilterConfig } from "@/hooks/useFilters";
import { useSorting } from "@/hooks/useSorting";
import { useEntityHistory } from "@/hooks/useEntityHistory";

type ColetaStatus = 'aguardando_liberacao' | 'solicitada' | 'em_transito' | 'chegou_expedicao' | 'conferencia_ok' | 'divergencia' | 'finalizada';
type ColetaTipo = 'lalamove' | 'transportadora';

interface Coleta {
  id: string; numero_coleta: string; fornecedor_id: string | null; endereco_coleta: string; contato_coleta: string | null;
  tipo_coleta: ColetaTipo; transportadora_id: string | null; data_prevista_coleta: string | null; data_efetiva_coleta: string | null;
  qtd_volumes: number | null; peso_estimado_kg: number | null; codigo_rastreamento: string | null; status: ColetaStatus;
  observacoes: string | null; created_at: string;
  fornecedores?: { razao_social: string; nome_fantasia: string | null } | null;
  transportadoras?: { nome_fantasia: string } | null;
}

interface Fornecedor { id: string; razao_social: string; nome_fantasia: string | null; endereco_completo: string; contato_nome: string | null; contato_telefone: string | null; }
interface Transportadora { id: string; nome_fantasia: string; }

const statusConfig: Record<ColetaStatus, { label: string; color: string; icon: LucideIcon }> = {
  aguardando_liberacao: { label: "Aguardando", color: "bg-muted text-muted-foreground", icon: Clock },
  solicitada: { label: "Solicitada", color: "bg-primary/15 text-primary", icon: Package },
  em_transito: { label: "Em Trânsito", color: "bg-warning/15 text-warning", icon: Truck },
  chegou_expedicao: { label: "Na Expedição", color: "bg-accent text-accent-foreground", icon: Building2 },
  conferencia_ok: { label: "Conferida", color: "bg-success/15 text-success", icon: CheckCircle2 },
  divergencia: { label: "Divergência", color: "bg-destructive/15 text-destructive", icon: AlertTriangle },
  finalizada: { label: "Finalizada", color: "bg-success/20 text-success", icon: CheckCircle2 },
};

const filterConfig: FilterConfig<Coleta> = {
  search: {
    fields: ["numero_coleta", "endereco_coleta", "observacoes"],
    placeholder: "Buscar coletas..."
  },
  status: {
    field: "status",
    options: Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.label })),
    label: "Status"
  },
  select: {
    tipo: {
      field: "tipo_coleta",
      options: [{ value: "lalamove", label: "Lalamove" }, { value: "transportadora", label: "Transportadora" }],
      label: "Tipo"
    }
  }
};

export default function Coletas() {
  const { toast } = useToast();
  const { exportToCSV, exportToJSON } = useExport();
  const [coletas, setColetas] = useState<Coleta[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [transportadoras, setTransportadoras] = useState<Transportadora[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dlgView, setDlgView] = useState(false);
  const [sel, setSel] = useState<Coleta | null>(null);

  const [formData, setFormData] = useState({ fornecedor_id: "", tipo_coleta: "lalamove" as ColetaTipo, transportadora_id: "", endereco_coleta: "", contato_coleta: "", data_prevista_coleta: "", qtd_volumes: "", peso_estimado_kg: "", observacoes: "" });

  // Hooks de filtros, ordenação e paginação
  const { filteredData, filters, setSearch, setStatus, setFilter, clearFilters, hasActiveFilters, totalFiltered, totalOriginal } = useFilters(coletas, filterConfig);
  const { sortedData, toggleSort, getSortDirection } = useSorting(filteredData, { defaultKey: "created_at", defaultDirection: "desc" });
  const pagination = usePagination(sortedData, { initialPageSize: 10 });
  const { selectedIds, toggle, selectAll, clearSelection, isSelected } = useSelection(pagination.paginatedData);
  const { history } = useEntityHistory({ entityType: "coleta", entityId: sel?.id || "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const [coletasRes, fornecedoresRes, transportadorasRes] = await Promise.all([
      supabase.from("coletas").select("*, fornecedores(razao_social, nome_fantasia), transportadoras(nome_fantasia)").order("created_at", { ascending: false }),
      supabase.from("fornecedores").select("id, razao_social, nome_fantasia, endereco_completo, contato_nome, contato_telefone").order("razao_social"),
      supabase.from("transportadoras").select("id, nome_fantasia").order("nome_fantasia")
    ]);
    if (coletasRes.data) setColetas(coletasRes.data);
    if (fornecedoresRes.data) setFornecedores(fornecedoresRes.data);
    if (transportadorasRes.data) setTransportadoras(transportadorasRes.data);
    setLoading(false);
  };

  const handleFornecedorChange = (id: string) => {
    const fornecedor = fornecedores.find(f => f.id === id);
    if (fornecedor) setFormData({ ...formData, fornecedor_id: id, endereco_coleta: fornecedor.endereco_completo, contato_coleta: fornecedor.contato_telefone || "" });
  };

  const handleSubmit = async () => {
    if (!formData.endereco_coleta.trim()) {
      toast({ title: "Campo obrigatório", description: "Informe o endereço da coleta", variant: "destructive" });
      return;
    }
    if (formData.tipo_coleta === "transportadora" && !formData.transportadora_id) {
      toast({ title: "Campo obrigatório", description: "Selecione uma transportadora", variant: "destructive" });
      return;
    }
    if (formData.qtd_volumes && parseInt(formData.qtd_volumes) <= 0) {
      toast({ title: "Valor inválido", description: "Quantidade de volumes deve ser maior que zero", variant: "destructive" });
      return;
    }
    const numero = `COL-${Date.now().toString().slice(-8)}`;
    const { error } = await supabase.from("coletas").insert({
      numero_coleta: numero, fornecedor_id: formData.fornecedor_id || null, tipo_coleta: formData.tipo_coleta,
      transportadora_id: formData.tipo_coleta === "transportadora" ? formData.transportadora_id || null : null,
      endereco_coleta: formData.endereco_coleta, contato_coleta: formData.contato_coleta || null,
      data_prevista_coleta: formData.data_prevista_coleta || null, qtd_volumes: formData.qtd_volumes ? parseInt(formData.qtd_volumes) : null,
      peso_estimado_kg: formData.peso_estimado_kg ? parseFloat(formData.peso_estimado_kg) : null, observacoes: formData.observacoes || null, status: "aguardando_liberacao"
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Sucesso", description: "Coleta registrada!" }); setDialogOpen(false); fetchData();
    setFormData({ fornecedor_id: "", tipo_coleta: "lalamove", transportadora_id: "", endereco_coleta: "", contato_coleta: "", data_prevista_coleta: "", qtd_volumes: "", peso_estimado_kg: "", observacoes: "" });
  };

  // Status transition guards
  const validTransitions: Record<ColetaStatus, ColetaStatus[]> = {
    aguardando_liberacao: ["solicitada"],
    solicitada: ["em_transito", "aguardando_liberacao"],
    em_transito: ["chegou_expedicao"],
    chegou_expedicao: ["conferencia_ok", "divergencia"],
    conferencia_ok: ["finalizada"],
    divergencia: ["conferencia_ok", "finalizada"],
    finalizada: [],
  };

  const getNextStatuses = (current: ColetaStatus): ColetaStatus[] => validTransitions[current] || [];

  const updateStatus = async (id: string, status: ColetaStatus) => {
    const update: { status: ColetaStatus; data_efetiva_coleta?: string } = { status };
    if (status === "em_transito") update.data_efetiva_coleta = new Date().toISOString();
    const { error } = await supabase.from("coletas").update(update).eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Sucesso", description: "Status atualizado!" }); fetchData(); }
  };

  const bulkUpdateStatus = async (ids: string[], status: ColetaStatus) => {
    const { error } = await supabase.from("coletas").update({ status }).in("id", ids);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Sucesso", description: `${ids.length} coleta(s) atualizada(s)!` }); clearSelection(); fetchData(); }
  };

  // Preparar dados para exportação
  const exportData = coletas.map(c => ({
    numero_coleta: c.numero_coleta,
    status: statusConfig[c.status]?.label || c.status,
    tipo: c.tipo_coleta,
    endereco: c.endereco_coleta,
    data_prevista: c.data_prevista_coleta,
    volumes: c.qtd_volumes,
    peso_kg: c.peso_estimado_kg
  }));

  const stats = { total: coletas.length, aguardando: coletas.filter(c => c.status === "aguardando_liberacao").length, transito: coletas.filter(c => c.status === "em_transito").length, finalizadas: coletas.filter(c => c.status === "finalizada").length };
  const SortIcon = ({ field }: { field: keyof Coleta }) => { const dir = getSortDirection(field); if (!dir) return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />; return dir === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />; };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <span className="truncate">Coletas</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Gerencie coletas de fornecedores</p>
          </div>
          <div className="flex gap-2">
            <ScannerButton
              onScan={(result: ScanResult) => {
                const coleta = coletas.find(c => c.codigo_rastreamento === result.text || c.numero_coleta === result.text);
                if (coleta) {
                  setSel(coleta);
                  setDlgView(true);
                } else {
                  toast({ title: "Código não encontrado", description: `Código: ${result.text}`, variant: "destructive" });
                }
              }}
              variant="outline"
            />
            <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Exportar</Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onClick={() => exportToCSV(exportData, { filename: "coletas" })}>CSV</DropdownMenuItem><DropdownMenuItem onClick={() => exportToJSON(exportData, { filename: "coletas" })}>JSON</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
            <OnboardingTooltip
              id="coletas-nova-btn"
              title="Registre uma coleta"
              description="Crie uma nova coleta para buscar materiais de fornecedores. Acompanhe o status em tempo real."
              position="left"
            >
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Nova</Button></DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Nova Coleta</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2"><Label>Fornecedor</Label><Select value={formData.fornecedor_id} onValueChange={handleFornecedorChange}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{fornecedores.map(f => <SelectItem key={f.id} value={f.id}>{f.nome_fantasia || f.razao_social}</SelectItem>)}</SelectContent></Select></div>
                    <div className="grid gap-2"><Label>Tipo</Label><Select value={formData.tipo_coleta} onValueChange={(v: ColetaTipo) => setFormData({ ...formData, tipo_coleta: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="lalamove">Lalamove</SelectItem><SelectItem value="transportadora">Transportadora</SelectItem></SelectContent></Select></div>
                    {formData.tipo_coleta === "transportadora" && <div className="grid gap-2"><Label>Transportadora</Label><Select value={formData.transportadora_id} onValueChange={(v) => setFormData({ ...formData, transportadora_id: v })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{transportadoras.map(t => <SelectItem key={t.id} value={t.id}>{t.nome_fantasia}</SelectItem>)}</SelectContent></Select></div>}
                    <div className="grid gap-2"><Label>Endereço</Label><Textarea value={formData.endereco_coleta} onChange={(e) => setFormData({ ...formData, endereco_coleta: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>Contato</Label><Input value={formData.contato_coleta} onChange={(e) => setFormData({ ...formData, contato_coleta: e.target.value })} /></div><div className="grid gap-2"><Label>Data Prevista</Label><Input type="date" value={formData.data_prevista_coleta} onChange={(e) => setFormData({ ...formData, data_prevista_coleta: e.target.value })} /></div></div>
                    <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>Volumes</Label><Input type="number" value={formData.qtd_volumes} onChange={(e) => setFormData({ ...formData, qtd_volumes: e.target.value })} /></div><div className="grid gap-2"><Label>Peso (kg)</Label><Input type="number" step="0.1" value={formData.peso_estimado_kg} onChange={(e) => setFormData({ ...formData, peso_estimado_kg: e.target.value })} /></div></div>
                    <div className="grid gap-2"><Label>Observações</Label><Textarea value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} /></div>
                  </div>
                  <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button onClick={handleSubmit} disabled={!formData.endereco_coleta}>Registrar</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </OnboardingTooltip>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="stat-card text-center p-3 sm:p-4 hover:border-primary/40 transition-colors"><Package className="w-5 h-5 text-primary mx-auto mb-2" /><p className="text-xl sm:text-2xl font-bold">{stats.total}</p><p className="text-[10px] sm:text-xs text-muted-foreground">Total</p></div>
          <div className="stat-card text-center p-3 sm:p-4 hover:border-warning/40 transition-colors"><Clock className="w-5 h-5 text-muted-foreground mx-auto mb-2" /><p className="text-xl sm:text-2xl font-bold">{stats.aguardando}</p><p className="text-[10px] sm:text-xs text-muted-foreground">Aguardando</p></div>
          <div className="stat-card text-center p-3 sm:p-4 hover:border-warning/40 transition-colors"><Truck className="w-5 h-5 text-warning mx-auto mb-2" /><p className="text-xl sm:text-2xl font-bold">{stats.transito}</p><p className="text-[10px] sm:text-xs text-muted-foreground">Em Trânsito</p></div>
          <div className="stat-card text-center p-3 sm:p-4 hover:border-success/40 transition-colors"><CheckCircle2 className="w-5 h-5 text-success mx-auto mb-2" /><p className="text-xl sm:text-2xl font-bold">{stats.finalizadas}</p><p className="text-[10px] sm:text-xs text-muted-foreground">Finalizadas</p></div>
        </div>

        <FilterBar 
          search={filters.search} 
          onSearchChange={setSearch} 
          searchPlaceholder="Buscar coletas..." 
          status={filters.status}
          onStatusChange={setStatus}
          statusOptions={Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.label }))}
          statusLabel="Status"
          extraFilters={[
            { key: "tipo", label: "Tipo", value: filters.tipo as string || "all", options: [{ value: "lalamove", label: "Lalamove" }, { value: "transportadora", label: "Transportadora" }], onChange: (v) => setFilter("tipo", v === "all" ? undefined : v) }
          ]} 
          onClearFilters={clearFilters} 
          hasActiveFilters={hasActiveFilters} 
          totalFiltered={totalFiltered} 
          totalOriginal={totalOriginal} 
        />

        <div className="flex items-center gap-2 text-sm overflow-x-auto pb-1 scrollbar-none"><span className="text-muted-foreground shrink-0">Ordenar:</span><Button variant="ghost" size="sm" onClick={() => toggleSort("created_at")} className="gap-1 shrink-0">Data <SortIcon field="created_at" /></Button><Button variant="ghost" size="sm" onClick={() => toggleSort("status")} className="gap-1 shrink-0">Status <SortIcon field="status" /></Button></div>

        {selectedIds.length > 0 && <BulkActions selectedIds={selectedIds} totalCount={pagination.paginatedData.length} onClearSelection={clearSelection} onSelectAll={selectAll} actions={[{ id: "finalizar", label: "Finalizar", icon: CheckCircle2, onClick: (ids) => bulkUpdateStatus(ids, "finalizada") }]} />}

        {loading && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}

        {!loading && <div className="space-y-3">{pagination.paginatedData.map((coleta, i) => { const config = statusConfig[coleta.status]; const StatusIcon = config.icon; return (
          <Card key={coleta.id} className={`animate-fade-in ${isSelected(coleta.id) ? 'ring-2 ring-primary' : ''}`} style={{ animationDelay: `${i * 50}ms` }}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Checkbox checked={isSelected(coleta.id)} onCheckedChange={() => toggle(coleta.id)} className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2"><span className="font-semibold">{coleta.numero_coleta}</span><Badge className={config.color}><StatusIcon className="w-3 h-3 mr-1" />{config.label}</Badge><Badge variant="outline">{coleta.tipo_coleta === "lalamove" ? "Lalamove" : "Transportadora"}</Badge></div>
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { setSel(coleta); setDlgView(true); }}>Ver Detalhes</DropdownMenuItem>{coleta.status === "aguardando_liberacao" && <DropdownMenuItem onClick={() => updateStatus(coleta.id, "solicitada")}>Marcar Solicitada</DropdownMenuItem>}{coleta.status === "solicitada" && <DropdownMenuItem onClick={() => updateStatus(coleta.id, "em_transito")}>Iniciar Trânsito</DropdownMenuItem>}{coleta.status === "em_transito" && <DropdownMenuItem onClick={() => updateStatus(coleta.id, "chegou_expedicao")}>Chegou Expedição</DropdownMenuItem>}{coleta.status === "chegou_expedicao" && <><DropdownMenuItem onClick={() => updateStatus(coleta.id, "conferencia_ok")}>Conferência OK</DropdownMenuItem><DropdownMenuItem onClick={() => updateStatus(coleta.id, "divergencia")}>Divergência</DropdownMenuItem></>}{(coleta.status === "conferencia_ok" || coleta.status === "divergencia") && <DropdownMenuItem onClick={() => updateStatus(coleta.id, "finalizada")}>Finalizar</DropdownMenuItem>}</DropdownMenuContent></DropdownMenu>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                    {coleta.fornecedores && <div className="flex items-center gap-1"><Building2 className="w-4 h-4" />{coleta.fornecedores.nome_fantasia || coleta.fornecedores.razao_social}</div>}
                    <div className="flex items-center gap-1"><MapPin className="w-4 h-4" /><span className="truncate">{coleta.endereco_coleta}</span></div>
                    {coleta.data_prevista_coleta && <div className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(coleta.data_prevista_coleta).toLocaleDateString()}</div>}
                    {coleta.qtd_volumes && <div className="flex items-center gap-1"><Package className="w-4 h-4" />{coleta.qtd_volumes} vol.</div>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )})}</div>}

        {!loading && sortedData.length === 0 && <div className="card-base flex flex-col items-center py-12"><Package className="w-12 h-12 text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">Nenhuma coleta</p></div>}

        {!loading && sortedData.length > 0 && (
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
      </div>

      {/* Dialog de detalhes */}
      <Dialog open={dlgView} onOpenChange={setDlgView}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Detalhes da Coleta</DialogTitle></DialogHeader>
          {sel && <div className="space-y-4">
            <div className="flex items-center gap-2"><span className="font-semibold text-lg">{sel.numero_coleta}</span><Badge className={statusConfig[sel.status].color}>{statusConfig[sel.status].label}</Badge></div>
            <div className="grid gap-2 text-sm">
              <div><span className="text-muted-foreground">Tipo:</span> {sel.tipo_coleta === "lalamove" ? "Lalamove" : "Transportadora"}</div>
              <div><span className="text-muted-foreground">Endereço:</span> {sel.endereco_coleta}</div>
              {sel.fornecedores && <div><span className="text-muted-foreground">Fornecedor:</span> {sel.fornecedores.nome_fantasia || sel.fornecedores.razao_social}</div>}
              {sel.data_prevista_coleta && <div><span className="text-muted-foreground">Previsão:</span> {new Date(sel.data_prevista_coleta).toLocaleDateString('pt-BR')}</div>}
              {sel.data_efetiva_coleta && <div><span className="text-muted-foreground">Coleta Efetiva:</span> {new Date(sel.data_efetiva_coleta).toLocaleDateString('pt-BR')}</div>}
              {sel.qtd_volumes && <div><span className="text-muted-foreground">Volumes:</span> {sel.qtd_volumes}</div>}
              {sel.peso_estimado_kg && <div><span className="text-muted-foreground">Peso:</span> {sel.peso_estimado_kg} kg</div>}
              {sel.codigo_rastreamento && <div><span className="text-muted-foreground">Rastreamento:</span> {sel.codigo_rastreamento}</div>}
              {sel.observacoes && <div><span className="text-muted-foreground">Obs:</span> {sel.observacoes}</div>}
            </div>

            {/* Rodonaves RTE Pickup Actions */}
            {sel.tipo_coleta === "transportadora" && (
              <div className="border-t pt-4">
                <RTEPickupActions coletaId={sel.id} onActionComplete={fetchData} />
              </div>
            )}

            {history && history.length > 0 && <Timeline events={history} />}
          </div>}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
