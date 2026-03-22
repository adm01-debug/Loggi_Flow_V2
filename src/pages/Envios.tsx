import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Send, Plus, MapPin, Clock, Package, MoreVertical, Eye, Edit, Trash2, User, Phone, CheckCircle2, Truck, AlertCircle, AlertTriangle, FileText, DollarSign, Calendar, Loader2, ArrowUpDown, ChevronUp, ChevronDown, ScanLine, LucideIcon, FileDown, RefreshCw, QrCode } from "lucide-react";
import { MaterialLabelPrinter } from "@/components/labels";
import { useRodonavesTracking } from "@/hooks/useRodonavesTracking";
import { ScannerButton } from "@/components/scanner/ScannerButton";
import { DocumentUploadField } from "@/components/common/DocumentUploadField";
import { ScanResult } from "@/hooks/useQRScanner";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Novos hooks e componentes
import { Pagination } from "@/components/common/Pagination";
import { FilterBar } from "@/components/common/FilterBar";
import { BulkActions, useSelection } from "@/components/common/BulkActions";
import { OnboardingTooltip } from "@/components/onboarding/OnboardingTooltip";
import { usePagination } from "@/hooks/usePagination";
import { useFilters, FilterConfig } from "@/hooks/useFilters";
import { useSorting } from "@/hooks/useSorting";
import { useRealtime } from "@/hooks/useRealtime";

type EntregaStatus = "aguardando_producao" | "pronto_despacho" | "cotacao_frete" | "nf_emitida" | "despachado" | "em_transito" | "saiu_entrega" | "entregue" | "ocorrencia" | "finalizado";
type FreteType = "cif" | "fob" | "cortesia";

interface Entrega {
  id: string; numero_entrega: string; endereco_entrega: string; contato_cliente: string | null;
  status: EntregaStatus; codigo_rastreamento: string | null; previsao_entrega: string | null;
  data_entrega_efetiva: string | null; tipo_frete: FreteType | null; valor_frete: number | null;
  nf_remessa: string | null; nf_remessa_url: string | null; comprovante_entrega_url: string | null;
  observacoes: string | null; created_at: string;
  cliente: { id: string; razao_social: string; nome_fantasia: string | null } | null;
  transportadora: { id: string; nome_fantasia: string } | null;
}

const statusConfig: Record<EntregaStatus, { label: string; color: string; icon: LucideIcon }> = {
  aguardando_producao: { label: "Aguard. Produção", color: "bg-muted text-muted-foreground", icon: Clock },
  pronto_despacho: { label: "Pronto Despacho", color: "bg-primary/15 text-primary", icon: Package },
  cotacao_frete: { label: "Cotação Frete", color: "bg-accent text-accent-foreground", icon: DollarSign },
  nf_emitida: { label: "NF Emitida", color: "bg-primary/20 text-primary", icon: FileText },
  despachado: { label: "Despachado", color: "bg-primary/10 text-primary", icon: Send },
  em_transito: { label: "Em Trânsito", color: "bg-warning/15 text-warning", icon: Truck },
  saiu_entrega: { label: "Saiu p/ Entrega", color: "bg-warning/20 text-warning", icon: Truck },
  entregue: { label: "Entregue", color: "bg-success/15 text-success", icon: CheckCircle2 },
  ocorrencia: { label: "Ocorrência", color: "bg-destructive/15 text-destructive", icon: AlertTriangle },
  finalizado: { label: "Finalizado", color: "bg-success/20 text-success", icon: CheckCircle2 },
};

// Rodonaves integration actions for entrega detail
function RodonavesActions({ entrega }: { entrega: Entrega }) {
  const { track, isTracking, trackingResult, getDeliveryProof, isLoadingProof, deliveryProof } = useRodonavesTracking();
  
  const isRodonaves = entrega.transportadora?.nome_fantasia?.toLowerCase().includes('rodonaves') || 
                       entrega.transportadora?.nome_fantasia?.toLowerCase().includes('rte');

  if (!isRodonaves || !entrega.nf_remessa) return null;

  const cnpjRemetente = ""; // Will use env var in edge function

  return (
    <div className="border-t pt-4 space-y-3">
      <p className="text-sm font-semibold flex items-center gap-2"><Truck className="w-4 h-4 text-primary" />Rodonaves RTE</p>
      <div className="flex flex-wrap gap-2">
        <Button 
          size="sm" variant="outline" 
          onClick={() => track({ nfNumero: entrega.nf_remessa!, cnpjRemetente })} 
          disabled={isTracking}
        >
          {isTracking ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
          Atualizar Rastreio
        </Button>
        {(entrega.status === "entregue" || entrega.status === "finalizado") && (
          <Button 
            size="sm" variant="outline"
            onClick={() => getDeliveryProof({ nfNumero: entrega.nf_remessa!, cnpjRemetente })}
            disabled={isLoadingProof}
          >
            {isLoadingProof ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileDown className="w-4 h-4 mr-1" />}
            Comprovante
          </Button>
        )}
      </div>
      {trackingResult?.data?.Tracking && trackingResult.data.Tracking.length > 0 && (
        <div className="text-xs space-y-1 max-h-40 overflow-y-auto bg-muted/50 rounded-lg p-3">
          {trackingResult.data.Tracking.map((evt: { DataOcorrencia: string; HoraOcorrencia: string; DescricaoOcorrencia: string; Cidade: string; UF: string }, i: number) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-muted-foreground shrink-0">{evt.DataOcorrencia} {evt.HoraOcorrencia}</span>
              <span>{evt.DescricaoOcorrencia} — {evt.Cidade}/{evt.UF}</span>
            </div>
          ))}
        </div>
      )}
      {deliveryProof?.data && (
        <div className="text-xs bg-muted/50 rounded-lg p-3">
          <p className="font-medium mb-1">Comprovante disponível</p>
          {deliveryProof.data.ImagemComprovante && (
            <a href={`data:image/png;base64,${deliveryProof.data.ImagemComprovante}`} download="comprovante.png" className="text-primary underline">
              Baixar comprovante
            </a>
          )}
        </div>
      )}
    </div>
  );
}

const filterConfig: FilterConfig<Entrega> = {
  search: {
    fields: ["numero_entrega", "endereco_entrega", "nf_remessa", "codigo_rastreamento"],
    placeholder: "Buscar entregas..."
  },
  status: {
    field: "status",
    options: Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.label }))
  }
};

const emptyForm = { cliente_id: "", endereco_entrega: "", contato_cliente: "", tipo_frete: "cif" as FreteType, transportadora_id: "", previsao_entrega: "", observacoes: "" };

export default function Envios() {
  const qc = useQueryClient();
  const [dlgCreate, setDlgCreate] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [dlgEdit, setDlgEdit] = useState(false);
  const [dlgView, setDlgView] = useState(false);
  const [dlgDel, setDlgDel] = useState(false);
  const [sel, setSel] = useState<Entrega | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: list = [], isLoading, error, refetch } = useQuery({
    queryKey: ["entregas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("entregas").select("*, cliente:clientes(id, razao_social, nome_fantasia), transportadora:transportadoras(id, nome_fantasia)").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Entrega[];
    },
  });

  const { data: clientes = [] } = useQuery({ queryKey: ["clientes-select"], queryFn: async () => { const { data } = await supabase.from("clientes").select("id, razao_social, nome_fantasia, endereco_completo, contato_telefone").order("razao_social"); return data || []; } });
  const { data: transportadoras = [] } = useQuery({ queryKey: ["transportadoras-select"], queryFn: async () => { const { data } = await supabase.from("transportadoras").select("id, nome_fantasia").order("nome_fantasia"); return data || []; } });

  // Hooks integrados
  const { filteredData, filters, setSearch, setStatus, clearFilters, hasActiveFilters, totalFiltered, totalOriginal } = useFilters(list, filterConfig);
  const { sortedData, toggleSort, getSortDirection } = useSorting(filteredData, { defaultKey: "created_at", defaultDirection: "desc" });
  const pagination = usePagination(sortedData, { initialPageSize: 10 });
  const { selectedIds, toggle, selectAll, clearSelection, isSelected } = useSelection(pagination.paginatedData);

  // Realtime
  useRealtime({ table: "entregas", onInsert: () => refetch(), onUpdate: () => refetch(), onDelete: () => refetch() });

  const createMut = useMutation({
    mutationFn: async (d: typeof emptyForm) => {
      const numero = `ENT-${Date.now().toString().slice(-8)}`;
      const { error } = await supabase.from("entregas").insert({ numero_entrega: numero, cliente_id: d.cliente_id || null, endereco_entrega: d.endereco_entrega, contato_cliente: d.contato_cliente || null, tipo_frete: d.tipo_frete, transportadora_id: d.transportadora_id || null, previsao_entrega: d.previsao_entrega || null, observacoes: d.observacoes || null, status: "aguardando_producao" });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["entregas"] }); setDlgCreate(false); setForm(emptyForm); toast.success("Entrega criada!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const updateStatusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: EntregaStatus }) => {
      const update: { status: EntregaStatus; data_entrega_efetiva?: string } = { status };
      if (status === "entregue") update.data_entrega_efetiva = new Date().toISOString();
      const { error } = await supabase.from("entregas").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["entregas"] }); toast.success("Status atualizado!"); },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("entregas").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["entregas"] }); setDlgDel(false); setSel(null); toast.success("Excluído!"); },
  });

  const bulkUpdateStatus = async (ids: string[], status: EntregaStatus) => {
    const { error } = await supabase.from("entregas").update({ status }).in("id", ids);
    if (error) toast.error("Erro: " + error.message);
    else { qc.invalidateQueries({ queryKey: ["entregas"] }); clearSelection(); toast.success(`${ids.length} entrega(s) atualizada(s)!`); }
  };

  const handleClienteChange = (id: string) => {
    const cliente = clientes.find(c => c.id === id);
    if (cliente) setForm({ ...form, cliente_id: id, endereco_entrega: cliente.endereco_completo || "", contato_cliente: cliente.contato_telefone || "" });
  };

  const stats = { total: list.length, transito: list.filter(e => ["em_transito", "saiu_entrega"].includes(e.status)).length, entregues: list.filter(e => e.status === "entregue").length, ocorrencias: list.filter(e => e.status === "ocorrencia").length };
  const SortIcon = ({ field }: { field: keyof Entrega }) => { const dir = getSortDirection(field); if (!dir) return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />; return dir === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />; };

  if (error) return <MainLayout><div className="flex flex-col items-center py-12"><AlertCircle className="w-12 h-12 text-destructive mb-4" /><p className="text-destructive">Erro: {error.message}</p></div></MainLayout>;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                <Send className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <span className="truncate">Envios</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Gerencie entregas aos clientes</p>
          </div>
          <div className="flex gap-2">
            <Button variant={showLabels ? "default" : "outline"} onClick={() => setShowLabels(!showLabels)} className="gap-2">
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Etiquetas</span>
            </Button>
            <ScannerButton
              onScan={(result: ScanResult) => {
                const entrega = list.find(e => e.codigo_rastreamento === result.text || e.numero_entrega === result.text);
                if (entrega) {
                  setSel(entrega);
                  setDlgView(true);
                } else {
                  toast.error(`Código não encontrado: ${result.text}`);
                }
              }}
              variant="outline"
            />
            <OnboardingTooltip
              id="envios-novo-btn"
              title="Crie sua primeira entrega"
              description="Registre uma nova entrega e acompanhe todo o ciclo de envio. Ganhe XP a cada entrega finalizada!"
              position="left"
            >
              <Button onClick={() => { setForm(emptyForm); setDlgCreate(true); }} className="gap-2"><Plus className="w-4 h-4" />Novo</Button>
            </OnboardingTooltip>
          </div>
        </div>

        <OnboardingTooltip
          id="envios-stats"
          title="Estatísticas de Envios"
          description="Acompanhe o resumo das suas entregas: total, em trânsito, entregues e ocorrências. Clique nos cards para filtrar."
          position="bottom"
          delay={1500}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="stat-card text-center p-3 sm:p-4"><Send className="w-5 h-5 text-primary mx-auto mb-2" /><p className="text-xl sm:text-2xl font-bold">{stats.total}</p><p className="text-[10px] sm:text-xs text-muted-foreground">Total</p></div>
            <div className="stat-card text-center p-3 sm:p-4"><Truck className="w-5 h-5 text-warning mx-auto mb-2" /><p className="text-xl sm:text-2xl font-bold">{stats.transito}</p><p className="text-[10px] sm:text-xs text-muted-foreground">Em Trânsito</p></div>
            <div className="stat-card text-center p-3 sm:p-4"><CheckCircle2 className="w-5 h-5 text-success mx-auto mb-2" /><p className="text-xl sm:text-2xl font-bold">{stats.entregues}</p><p className="text-[10px] sm:text-xs text-muted-foreground">Entregues</p></div>
            <div className="stat-card text-center p-3 sm:p-4"><AlertTriangle className="w-5 h-5 text-destructive mx-auto mb-2" /><p className="text-xl sm:text-2xl font-bold">{stats.ocorrencias}</p><p className="text-[10px] sm:text-xs text-muted-foreground">Ocorrências</p></div>
          </div>
        </OnboardingTooltip>

        <FilterBar 
          search={filters.search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar entregas..."
          status={filters.status}
          onStatusChange={setStatus}
          statusOptions={filterConfig.status?.options}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          totalFiltered={totalFiltered}
          totalOriginal={totalOriginal}
        />

        <div className="flex items-center gap-2 text-sm overflow-x-auto pb-1 scrollbar-none"><span className="text-muted-foreground shrink-0">Ordenar:</span><Button variant="ghost" size="sm" onClick={() => toggleSort("created_at")} className="gap-1 shrink-0">Data <SortIcon field="created_at" /></Button><Button variant="ghost" size="sm" onClick={() => toggleSort("status")} className="gap-1 shrink-0">Status <SortIcon field="status" /></Button></div>

        {selectedIds.length > 0 && <BulkActions selectedIds={selectedIds} totalCount={pagination.paginatedData.length} onClearSelection={clearSelection} onSelectAll={selectAll} actions={[{ id: "entregue", label: "Marcar Entregue", icon: CheckCircle2, onClick: (ids) => bulkUpdateStatus(ids, "entregue") }]} />}

        {isLoading && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}

        {!isLoading && <div className="space-y-3">{pagination.paginatedData.map((e, i) => { const config = statusConfig[e.status]; const StatusIcon = config.icon; return (
          <div key={e.id} className={`card-interactive animate-fade-in ${isSelected(e.id) ? 'ring-2 ring-primary' : ''}`} style={{ animationDelay: `${i * 30}ms` }}>
            <div className="flex items-start gap-3">
              <Checkbox checked={isSelected(e.id)} onCheckedChange={() => toggle(e.id)} className="mt-1" />
              <div className={cn("p-2 rounded-lg", config.color)}><StatusIcon className="w-5 h-5" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1"><span className="font-semibold">{e.numero_entrega}</span><Badge className={config.color}>{config.label}</Badge>{e.nf_remessa && <Badge variant="outline">NF {e.nf_remessa}</Badge>}</div>
                <div className="text-sm text-muted-foreground space-y-1">
                  {e.cliente && <div className="flex items-center gap-1"><User className="w-3 h-3" />{e.cliente.nome_fantasia || e.cliente.razao_social}</div>}
                  <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /><span className="truncate">{e.endereco_entrega}</span></div>
                  <div className="flex items-center gap-4">{e.previsao_entrega && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{format(new Date(e.previsao_entrega), "dd/MM", { locale: ptBR })}</span>}{e.transportadora && <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{e.transportadora.nome_fantasia}</span>}</div>
                </div>
              </div>
              <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { setSel(e); setDlgView(true); }}><Eye className="w-4 h-4 mr-2" />Ver</DropdownMenuItem><DropdownMenuSeparator />{e.status === "aguardando_producao" && <DropdownMenuItem onClick={() => updateStatusMut.mutate({ id: e.id, status: "pronto_despacho" })}>Pronto Despacho</DropdownMenuItem>}{e.status === "despachado" && <DropdownMenuItem onClick={() => updateStatusMut.mutate({ id: e.id, status: "em_transito" })}>Em Trânsito</DropdownMenuItem>}{e.status === "em_transito" && <DropdownMenuItem onClick={() => updateStatusMut.mutate({ id: e.id, status: "entregue" })}>Marcar Entregue</DropdownMenuItem>}<DropdownMenuSeparator /><DropdownMenuItem className="text-destructive" onClick={() => { setSel(e); setDlgDel(true); }}><Trash2 className="w-4 h-4 mr-2" />Excluir</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
            </div>
          </div>
        ); })}</div>}

        {!isLoading && sortedData.length === 0 && <div className="card-base flex flex-col items-center py-12"><Send className="w-12 h-12 text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">Nenhuma entrega</p></div>}
        {!isLoading && sortedData.length > 0 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
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

        <Dialog open={dlgCreate} onOpenChange={setDlgCreate}><DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Nova Entrega</DialogTitle></DialogHeader><div className="grid gap-4 py-4"><div className="grid gap-2"><Label>Cliente</Label><Select value={form.cliente_id} onValueChange={handleClienteChange}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome_fantasia || c.razao_social}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label>Endereço *</Label><Textarea value={form.endereco_entrega} onChange={(e) => setForm({ ...form, endereco_entrega: e.target.value })} /></div><div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>Contato</Label><Input value={form.contato_cliente} onChange={(e) => setForm({ ...form, contato_cliente: e.target.value })} /></div><div className="grid gap-2"><Label>Tipo Frete</Label><Select value={form.tipo_frete} onValueChange={(v: FreteType) => setForm({ ...form, tipo_frete: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cif">CIF</SelectItem><SelectItem value="fob">FOB</SelectItem><SelectItem value="cortesia">Cortesia</SelectItem></SelectContent></Select></div></div><div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>Transportadora</Label><Select value={form.transportadora_id} onValueChange={(v) => setForm({ ...form, transportadora_id: v })}><SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger><SelectContent>{transportadoras.map(t => <SelectItem key={t.id} value={t.id}>{t.nome_fantasia}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label>Previsão</Label><Input type="date" value={form.previsao_entrega} onChange={(e) => setForm({ ...form, previsao_entrega: e.target.value })} /></div></div><div className="grid gap-2"><Label>Observações</Label><Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div></div><DialogFooter><Button variant="outline" onClick={() => setDlgCreate(false)}>Cancelar</Button><Button onClick={() => createMut.mutate(form)} disabled={!form.endereco_entrega || createMut.isPending}>{createMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Criar</Button></DialogFooter></DialogContent></Dialog>

        <Dialog open={dlgView} onOpenChange={setDlgView}><DialogContent><DialogHeader><DialogTitle>{sel?.numero_entrega}</DialogTitle></DialogHeader>{sel && <div className="space-y-4"><div className="flex items-center gap-2"><Badge className={statusConfig[sel.status].color}>{statusConfig[sel.status].label}</Badge></div><div className="grid grid-cols-2 gap-4"><div><p className="text-sm text-muted-foreground">Cliente</p><p>{sel.cliente?.nome_fantasia || sel.cliente?.razao_social || "-"}</p></div><div><p className="text-sm text-muted-foreground">Transportadora</p><p>{sel.transportadora?.nome_fantasia || "-"}</p></div></div><div><p className="text-sm text-muted-foreground">Endereço</p><p>{sel.endereco_entrega}</p></div>{sel.observacoes && <div><p className="text-sm text-muted-foreground">Observações</p><p>{sel.observacoes}</p></div>}<div className="grid grid-cols-2 gap-4"><DocumentUploadField value={sel.comprovante_entrega_url} onChange={async (url) => { await supabase.from("entregas").update({ comprovante_entrega_url: url }).eq("id", sel.id); refetch(); }} folder={`entregas/${sel.id}/comprovantes`} label="Comprovante de Entrega" /><DocumentUploadField value={sel.nf_remessa_url} onChange={async (url) => { await supabase.from("entregas").update({ nf_remessa_url: url }).eq("id", sel.id); refetch(); }} folder={`entregas/${sel.id}/nf`} label="NF Remessa" /></div><RodonavesActions entrega={sel} /></div>}</DialogContent></Dialog>

        <AlertDialog open={dlgDel} onOpenChange={setDlgDel}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir entrega?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => sel && deleteMut.mutate(sel.id)}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      </div>
    </MainLayout>
  );
}