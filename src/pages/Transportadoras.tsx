import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Truck, MoreVertical, Phone, Mail, MapPin, Star, CheckCircle2, XCircle, Edit, Trash2, Globe, Building2, Clock, TrendingUp, Download, ArrowUpDown, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useExport } from "@/hooks/useExport";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { PageHeader } from "@/components/common/PageHeader";
import { StatsCard } from "@/components/common/StatsCard";
import { PageTransition, StaggeredContent, StaggeredItem } from "@/components/common/PageTransition";



import { Pagination } from "@/components/common/Pagination";
import { FilterBar } from "@/components/common/FilterBar";
import { BulkActions } from "@/components/common/BulkActions";
import { useSelection } from "@/hooks/useSelection";
import { OnboardingTooltip } from "@/components/onboarding/OnboardingTooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { usePagination } from "@/hooks/usePagination";
import { useFilters, FilterConfig } from "@/hooks/useFilters";
import { useSorting } from "@/hooks/useSorting";
import { QUERY_STALE_TIME } from "@/lib/queryConfig";

interface Transportadora {
  id: string; razao_social: string; nome_fantasia: string; cnpj: string | null;
  contato_comercial: string | null; email_comercial: string | null; 
  whatsapp_operacional: string | null; url_rastreamento: string | null;
  regioes_atendidas: string[] | null; homologada: boolean | null; observacoes: string | null;
  created_at: string; total_entregas?: number; entregas_sucesso?: number;
  score_performance?: number | null;
}

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const filterConfig: FilterConfig<Transportadora> = {
  search: { fields: ["nome_fantasia", "razao_social", "cnpj"] },
};

const emptyForm = { razao_social: "", nome_fantasia: "", cnpj: "", contato_comercial: "", email_comercial: "", whatsapp_operacional: "", url_rastreamento: "", observacoes: "", homologada: true };

export default function Transportadoras() {
  const { toast } = useToast();
  const { exportToCSV, exportToJSON } = useExport();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [selected, setSelected] = useState<Transportadora | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [estadoFilter, setEstadoFilter] = useState("");
  const [ativaFilter, setAtivaFilter] = useState("");

  const { data: list = [], isLoading: loading, refetch: fetchData } = useQuery({
    queryKey: ["transportadoras-list"],
    queryFn: async () => {
      // Parallel fetch for transportadoras and their performance stats
      const [tRes, statsRes] = await Promise.all([
        supabase.from("transportadoras").select("*").order("nome_fantasia"),
        supabase.rpc('get_carrier_performance_stats')
      ]);
      
      if (tRes.error) throw tRes.error;
      
      const transportadoras = tRes.data || [];
      const stats = statsRes.data || [];
      
      // Enriched data with stats from RPC
      return transportadoras.map(t => {
        const tStats = (stats as any[]).find(s => s.transportadora_id === t.id);
        return { 
          ...t, 
          total_entregas: Number(tStats?.total_entregas || 0), 
          entregas_sucesso: Number(tStats?.entregas_no_prazo || 0) 
        };
      }) as Transportadora[];
    },
    staleTime: QUERY_STALE_TIME.STATIC,
  });

  // Apply custom filters
  const filteredByCustom = useMemo(() => list.filter(t => {
    if (estadoFilter && !t.regioes_atendidas?.includes(estadoFilter)) return false;
    if (ativaFilter === "sim" && !t.homologada) return false;
    if (ativaFilter === "nao" && t.homologada) return false;
    return true;
  }), [list, estadoFilter, ativaFilter]);

  const { filteredData, filters, setSearch, clearFilters, hasActiveFilters } = useFilters(filteredByCustom, filterConfig);
  const { sortedData, toggleSort, getSortDirection } = useSorting(filteredData, { defaultKey: "nome_fantasia", defaultDirection: "asc" });
  const pagination = usePagination(sortedData, { initialPageSize: 12 });
  const { selectedIds, toggle, selectAll, clearSelection, isSelected } = useSelection(pagination.paginatedData);

  const handleSubmit = async () => {
    const { error } = await supabase.from("transportadoras").insert({ 
      razao_social: form.razao_social,
      nome_fantasia: form.nome_fantasia,
      cnpj: form.cnpj || "",
      contato_comercial: form.contato_comercial || "",
      email_comercial: form.email_comercial || "",
      whatsapp_operacional: form.whatsapp_operacional,
      url_rastreamento: form.url_rastreamento,
      observacoes: form.observacoes,
      homologada: form.homologada 
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Sucesso", description: "Transportadora cadastrada!" }); setDialogOpen(false); fetchData();
    setForm(emptyForm);
  };

  const handleUpdate = async () => {
    if (!selected) return;
    const { error } = await supabase.from("transportadoras").update({ 
      razao_social: form.razao_social,
      nome_fantasia: form.nome_fantasia,
      cnpj: form.cnpj || "",
      contato_comercial: form.contato_comercial || "",
      email_comercial: form.email_comercial || "",
      whatsapp_operacional: form.whatsapp_operacional,
      url_rastreamento: form.url_rastreamento,
      observacoes: form.observacoes,
      homologada: form.homologada 
    }).eq("id", selected.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Sucesso", description: "Atualizado!" }); setEditDialog(false); fetchData();
  };

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("transportadoras").delete().eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Sucesso", description: "Excluído!" }); fetchData(); }
    setDeleteTarget(null);
  };

  const bulkToggleAtiva = async (ids: string[], homologada: boolean) => {
    const { error } = await supabase.from("transportadoras").update({ homologada }).in("id", ids);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Sucesso", description: `${ids.length} transportadora(s) ${homologada ? 'ativada(s)' : 'desativada(s)'}!` }); clearSelection(); fetchData(); }
  };

  const openEdit = (t: Transportadora) => { 
    setSelected(t); 
    setForm({ 
      razao_social: t.razao_social, 
      nome_fantasia: t.nome_fantasia, 
      cnpj: t.cnpj || "", 
      contato_comercial: t.contato_comercial || "", 
      email_comercial: t.email_comercial || "", 
      whatsapp_operacional: t.whatsapp_operacional || "", 
      url_rastreamento: t.url_rastreamento || "", 
      observacoes: t.observacoes || "", 
      homologada: t.homologada ?? true 
    }); 
    setEditDialog(true); 
  };

  const handleClearFilters = () => {
    clearFilters();
    setEstadoFilter("");
    setAtivaFilter("");
  };

  const stats = { total: list.length, ativas: list.filter(t => t.homologada).length, entregas: list.reduce((a, t) => a + (t.total_entregas || 0), 0) };
  const SortIcon = ({ field }: { field: keyof Transportadora }) => { const dir = getSortDirection(field); if (!dir) return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />; return dir === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />; };

  const FormFields = () => (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2"><Label>Razão Social *</Label><Input value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} /></div>
        <div className="grid gap-2"><Label>Nome Fantasia *</Label><Input value={form.nome_fantasia} onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2"><Label>CNPJ</Label><MaskedInput maskType="cnpj" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} /></div>
        <div className="grid gap-2"><Label>Contato Comercial</Label><Input value={form.contato_comercial} onChange={(e) => setForm({ ...form, contato_comercial: e.target.value })} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2"><Label>Email Comercial</Label><Input type="email" value={form.email_comercial} onChange={(e) => setForm({ ...form, email_comercial: e.target.value })} /></div>
        <div className="grid gap-2"><Label>WhatsApp</Label><MaskedInput maskType="phone" value={form.whatsapp_operacional} onChange={(e) => setForm({ ...form, whatsapp_operacional: e.target.value })} /></div>
      </div>
      <div className="grid gap-2"><Label>URL Rastreamento</Label><Input value={form.url_rastreamento} onChange={(e) => setForm({ ...form, url_rastreamento: e.target.value })} /></div>
      <div className="flex items-center gap-2"><Switch checked={form.homologada} onCheckedChange={(v) => setForm({ ...form, homologada: v })} /><Label>Homologada</Label></div>
      <div className="grid gap-2"><Label>Observações</Label><Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>
    </div>
  );

  return (
    <MainLayout>
      <PageTransition>
        <div className="space-y-6">
          <PageHeader
            title="Transportadoras"
            description="Gerencie suas transportadoras parceiras e acompanhe a performance de cada uma em tempo real."
            icon={Truck}
            actions={
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />Exportar
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => exportToCSV(list as unknown as Record<string, unknown>[], { filename: "transportadoras" })}>CSV</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportToJSON(list as unknown as Record<string, unknown>[], { filename: "transportadoras" })}>JSON</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <OnboardingTooltip
                  id="transportadoras-nova-btn"
                  title="Cadastre uma transportadora"
                  description="Adicione transportadoras parceiras para gerenciar seus fretes. Compare performance e custos entre elas."
                  position="left"
                >
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />Nova
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Nova Transportadora</DialogTitle>
                      </DialogHeader>
                      <FormFields />
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} disabled={!form.razao_social || !form.nome_fantasia}>Cadastrar</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </OnboardingTooltip>
              </div>
            }
          />

          <StaggeredContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StaggeredItem>
              <StatsCard title="Total" value={stats.total} icon={Truck} color="primary" />
            </StaggeredItem>
            <StaggeredItem>
              <StatsCard title="Ativas" value={stats.ativas} icon={CheckCircle2} color="success" />
            </StaggeredItem>
            <StaggeredItem>
              <StatsCard title="Entregas" value={stats.entregas} icon={TrendingUp} color="info" />
            </StaggeredItem>
          </StaggeredContent>



        <FilterBar 
          search={filters.search} 
          onSearchChange={setSearch} 
          searchPlaceholder="Buscar..." 
          extraFilters={[
            { key: "estado", label: "Estado", value: estadoFilter, options: UFS.map(uf => ({ value: uf, label: uf })), onChange: (v) => setEstadoFilter(v) }, 
            { key: "ativa", label: "Status", value: ativaFilter, options: [{ value: "sim", label: "Ativas" }, { value: "nao", label: "Inativas" }], onChange: (v) => setAtivaFilter(v) }
          ]} 
          onClearFilters={handleClearFilters} 
          hasActiveFilters={hasActiveFilters || !!estadoFilter || !!ativaFilter} 
          totalFiltered={sortedData.length}
          totalOriginal={list.length} 
        />

        <div className="flex items-center gap-2 text-sm overflow-x-auto pb-1 scrollbar-none"><span className="text-muted-foreground shrink-0">Ordenar:</span><Button variant="ghost" size="sm" onClick={() => toggleSort("nome_fantasia")} className="gap-1 shrink-0">Nome <SortIcon field="nome_fantasia" /></Button><Button variant="ghost" size="sm" onClick={() => toggleSort("score_performance")} className="gap-1 shrink-0">Score <SortIcon field="score_performance" /></Button></div>

        {selectedIds.length > 0 && <BulkActions selectedIds={selectedIds} totalCount={pagination.paginatedData.length} onClearSelection={clearSelection} onSelectAll={selectAll} actions={[{ id: "ativar", label: "Ativar", icon: CheckCircle2, onClick: (ids) => bulkToggleAtiva(ids, true) }, { id: "desativar", label: "Desativar", icon: XCircle, variant: "destructive", onClick: (ids) => bulkToggleAtiva(ids, false) }]} />}

        {loading && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}

        {!loading && <StaggeredContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{pagination.paginatedData.map((t, i) => (
          <StaggeredItem key={t.id}>
            <div className={`card-interactive animate-fade-in ${isSelected(t.id) ? 'ring-2 ring-primary' : ''}`} style={{ animationDelay: `${i * 30}ms` }}>

            <div className="flex items-start gap-3 mb-3">
              <Checkbox checked={isSelected(t.id)} onCheckedChange={() => toggle(t.id)} />
              <div className="flex-1"><p className="font-semibold">{t.nome_fantasia}</p><p className="text-xs text-muted-foreground">{t.razao_social}</p></div>
              <Badge variant={t.homologada ? "default" : "secondary"} className={t.homologada ? "bg-success/20 text-success" : ""}>{t.homologada ? "Ativa" : "Inativa"}</Badge>
              <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => openEdit(t)}><Edit className="w-4 h-4 mr-2" />Editar</DropdownMenuItem><DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(t.id)}><Trash2 className="w-4 h-4 mr-2" />Excluir</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">{t.contato_comercial && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{t.contato_comercial}</div>}{t.email_comercial && <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{t.email_comercial}</div>}{t.regioes_atendidas && t.regioes_atendidas.length > 0 && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{t.regioes_atendidas.slice(0, 3).join(", ")}{t.regioes_atendidas.length > 3 && ` +${t.regioes_atendidas.length - 3}`}</div>}</div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t"><div className="flex items-center gap-1">{[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= (t.score_performance || 0) / 20 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />)}</div><span className="text-sm font-medium">{t.total_entregas || 0} entregas</span></div>
            </div>
          </StaggeredItem>
        ))}</StaggeredContent>}


        {!loading && sortedData.length === 0 && <div className="card-base flex flex-col items-center py-12"><Truck className="w-12 h-12 text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">Nenhuma transportadora</p></div>}
        
        {!loading && sortedData.length > 0 && (
          <Pagination 
            currentPage={pagination.currentPage} 
            totalPages={pagination.totalPages} 
            pageSize={pagination.pageSize} 
            totalItems={sortedData.length}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
            pageSizeOptions={[12, 24, 48]}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
            onNextPage={pagination.nextPage}
            onPrevPage={pagination.prevPage}
            onFirstPage={pagination.firstPage}
            onLastPage={pagination.lastPage}
            hasNextPage={pagination.hasNextPage}
            hasPrevPage={pagination.hasPrevPage}
          />
        )}
        </div>
      </PageTransition>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir Transportadora</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita. Isso excluirá permanentemente o registro.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteTarget && handleDelete(deleteTarget)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Transportadora</DialogTitle></DialogHeader>
          <FormFields />
          <DialogFooter><Button variant="outline" onClick={() => setEditDialog(false)}>Cancelar</Button><Button onClick={handleUpdate}>Salvar Alterações</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
