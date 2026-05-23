import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Truck, MoreVertical, Phone, Mail, MapPin, Star, CheckCircle2, XCircle, Edit, Trash2, Globe, Building2, Clock, TrendingUp, Download, ArrowUpDown, ChevronUp, ChevronDown, Loader2, Key, Settings, Map, Wand2, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/ui/use-toast";
import { useExport } from "@/hooks/common/useExport";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MaskedInput } from "@/components/ui/MaskedInput";
import { PageHeader } from "@/components/common/PageHeader";
import { StatsCard } from "@/components/common/StatsCard";
import { PageTransition, StaggeredContent, StaggeredItem } from "@/components/common/PageTransition";
import { NormalizationMapping } from "@/components/transportadoras/NormalizationMapping";

import { Pagination } from "@/components/common/Pagination";
import { FilterBar } from "@/components/common/FilterBar";
import { BulkActions } from "@/components/common/BulkActions";
import { useSelection } from "@/hooks/common/useSelection";
import { OnboardingTooltip } from "@/components/onboarding/OnboardingTooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { usePagination } from "@/hooks/common/usePagination";
import { useFilters, FilterConfig } from "@/hooks/common/useFilters";
import { useSorting } from "@/hooks/common/useSorting";
import { QUERY_STALE_TIME } from "@/lib/queryConfig";
import { cn } from "@/lib/utils";

interface Transportadora {
  id: string; 
  razao_social: string; 
  nome_fantasia: string; 
  cnpj: string | null;
  contato_comercial: string | null; 
  email_comercial: string | null; 
  whatsapp_operacional: string | null; 
  url_rastreamento: string | null;
  regioes_atendidas: string[] | null; 
  homologada: boolean | null; 
  observacoes: string | null;
  created_at: string; 
  total_entregas?: number; 
  entregas_sucesso?: number;
  score_performance?: number | null;
  credentials?: any;
  non_api_config?: any;
  coverage_details?: any;
}

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const filterConfig: FilterConfig<Transportadora> = {
  search: { fields: ["nome_fantasia", "razao_social", "cnpj"] },
};

const emptyForm = { 
  razao_social: "", 
  nome_fantasia: "", 
  cnpj: "", 
  contato_comercial: "", 
  email_comercial: "", 
  whatsapp_operacional: "", 
  url_rastreamento: "", 
  observacoes: "", 
  homologada: true,
  credentials: { api_key: "", api_user: "", api_password: "", endpoint: "" },
  non_api_config: { 
    type: "whatsapp" as "whatsapp" | "email" | "portal", 
    template: "", 
    recipient: "", 
    portal_url: "", 
    portal_user: "",
    normalization: { price_pattern: "", term_pattern: "", fallback_strategy: "ai_extraction", ai_prompt: "" }
  },
  coverage_details: { states: [] as string[], cities: [] as string[] }
};

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
      homologada: form.homologada,
      credentials: form.credentials,
      non_api_config: form.non_api_config,
      coverage_details: form.coverage_details
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
      homologada: form.homologada,
      credentials: form.credentials,
      non_api_config: form.non_api_config,
      coverage_details: form.coverage_details
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
      homologada: t.homologada ?? true,
      credentials: t.credentials || emptyForm.credentials,
      non_api_config: t.non_api_config || emptyForm.non_api_config,
      coverage_details: t.coverage_details || emptyForm.coverage_details
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
    <Tabs defaultValue="geral" className="w-full">
      <TabsList className="grid w-full grid-cols-5 mb-4">
        <TabsTrigger value="geral">Geral</TabsTrigger>
        <TabsTrigger value="api">API</TabsTrigger>
        <TabsTrigger value="automacao">Automação</TabsTrigger>
        <TabsTrigger value="mapeamento">Integração</TabsTrigger>
        <TabsTrigger value="cobertura">Cobertura</TabsTrigger>
      </TabsList>
      
      <TabsContent value="geral" className="space-y-4">
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
      </TabsContent>

      <TabsContent value="api" className="space-y-4">
        <div className="grid gap-2"><Label>Endpoint API</Label><Input placeholder="https://api.transportadora.com/v1" value={form.credentials.endpoint} onChange={(e) => setForm({ ...form, credentials: { ...form.credentials, endpoint: e.target.value } })} /></div>
        <div className="grid gap-2"><Label>API Key / Token</Label><Input type="password" value={form.credentials.api_key} onChange={(e) => setForm({ ...form, credentials: { ...form.credentials, api_key: e.target.value } })} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2"><Label>Usuário API</Label><Input value={form.credentials.api_user} onChange={(e) => setForm({ ...form, credentials: { ...form.credentials, api_user: e.target.value } })} /></div>
          <div className="grid gap-2"><Label>Senha API</Label><Input type="password" value={form.credentials.api_password} onChange={(e) => setForm({ ...form, credentials: { ...form.credentials, api_password: e.target.value } })} /></div>
        </div>
      </TabsContent>

      <TabsContent value="automacao" className="space-y-4">
        <div className="grid gap-2">
          <Label>Canal de Cotação</Label>
          <Select value={form.non_api_config.type} onValueChange={(v: any) => setForm({ ...form, non_api_config: { ...form.non_api_config, type: v } })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="whatsapp">WhatsApp Business</SelectItem>
              <SelectItem value="email">E-mail Corporativo</SelectItem>
              <SelectItem value="portal">Portal Web (Login)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {form.non_api_config.type === 'portal' ? (
          <>
            <div className="grid gap-2"><Label>URL do Portal</Label><Input value={form.non_api_config.portal_url} onChange={(e) => setForm({ ...form, non_api_config: { ...form.non_api_config, portal_url: e.target.value } })} /></div>
            <div className="grid gap-2"><Label>Usuário de Acesso</Label><Input value={form.non_api_config.portal_user} onChange={(e) => setForm({ ...form, non_api_config: { ...form.non_api_config, portal_user: e.target.value } })} /></div>
          </>
        ) : (
          <>
            <div className="grid gap-2"><Label>{form.non_api_config.type === 'whatsapp' ? 'Número WhatsApp' : 'E-mail de Destino'}</Label><Input value={form.non_api_config.recipient} onChange={(e) => setForm({ ...form, non_api_config: { ...form.non_api_config, recipient: e.target.value } })} /></div>
            <div className="grid gap-2"><Label>Template de Mensagem</Label><Textarea placeholder="Olá, gostaria de cotar um frete..." value={form.non_api_config.template} onChange={(e) => setForm({ ...form, non_api_config: { ...form.non_api_config, template: e.target.value } })} /></div>
          </>
        )}
      </TabsContent>
      <TabsContent value="mapeamento" className="space-y-4">
        <NormalizationMapping 
          carrierId={selected?.id || "new"} 
          initialConfig={form.non_api_config?.normalization}
          onSave={(normConfig) => setForm({ 
            ...form, 
            non_api_config: { ...form.non_api_config, normalization: normConfig } 
          })}
        />
      </TabsContent>

      <TabsContent value="cobertura" className="space-y-4">
        <div className="grid gap-2">
          <Label>Estados Atendidos (UF)</Label>
          <div className="flex flex-wrap gap-2 p-2 border rounded-md max-h-32 overflow-y-auto">
            {UFS.map(uf => (
              <div key={uf} className="flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded">
                <Checkbox 
                  checked={form.coverage_details.states.includes(uf)} 
                  onCheckedChange={(checked) => {
                    const states = checked 
                      ? [...form.coverage_details.states, uf]
                      : form.coverage_details.states.filter((s: string) => s !== uf);
                    setForm({ ...form, coverage_details: { ...form.coverage_details, states } });
                  }}
                />
                <span className="text-xs">{uf}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-2">
          <Label>Cidades Específicas (Opcional)</Label>
          <Textarea 
            placeholder="Ex: São Paulo, Rio de Janeiro, Curitiba..." 
            value={form.coverage_details.cities.join(", ")} 
            onChange={(e) => setForm({ ...form, coverage_details: { ...form.coverage_details, cities: e.target.value.split(",").map(c => c.trim()).filter(c => c) } })} 
          />
        </div>
      </TabsContent>
    </Tabs>
  );

  return (
    <>
    <MainLayout>
      <div className="space-y-8 max-w-[1600px] mx-auto pb-12 p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between px-2">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white flex items-center gap-4 tracking-tighter uppercase italic">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black border border-white/10 shadow-2xl transition-transform hover:scale-110">
                  <Truck className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="drop-shadow-2xl">Gestão Malha</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                    <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Fleet_Matrix_Active</span>
                  </div>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">SMART CARRIERS • MULTI-API SYNC</span>
                </div>
              </div>
            </h1>
          </div>
        </div>
            <div className="flex gap-3 animate-in slide-in-from-right-6 duration-700 ease-out-expo">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="lg" className="h-12 px-6 rounded-xl border-2 font-bold uppercase tracking-widest text-[11px] gap-2 hover:bg-primary/5 transition-all">
                    <Download className="w-4 h-4" /> <span className="hidden sm:inline">Exportar</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-black/95 border-white/10 backdrop-blur-xl">
                  <DropdownMenuItem onClick={() => exportToCSV(list as unknown as Record<string, unknown>[], { filename: "transportadoras" })} className="font-black uppercase tracking-widest text-[10px]">CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportToJSON(list as unknown as Record<string, unknown>[], { filename: "transportadoras" })} className="font-black uppercase tracking-widest text-[10px]">JSON</DropdownMenuItem>
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
                    <Button size="lg" className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[11px] gap-2 bg-gradient-to-r from-primary via-primary/90 to-primary/80 shadow-xl shadow-primary/20 hover:scale-[1.03] transition-all">
                      <Plus className="w-5 h-5" /> Nova
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black/95 border-white/10 backdrop-blur-xl rounded-[2.5rem]">
                    <DialogHeader>
                      <DialogTitle className="font-black text-2xl tracking-tighter uppercase italic text-white">Nova Transportadora</DialogTitle>
                    </DialogHeader>
                    <FormFields />
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl border-2 font-black uppercase tracking-widest text-[10px]">Cancelar</Button>
                      <Button onClick={handleSubmit} disabled={!form.razao_social || !form.nome_fantasia} className="rounded-xl font-black uppercase tracking-widest text-[10px] bg-primary text-white">Cadastrar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </OnboardingTooltip>
            </div>



          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-1000 delay-200">
            <div className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-card to-card/90 shadow-xl border-none transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                  <Truck className="w-6 h-6" />
                </div>
                <p className="text-3xl font-black tracking-tighter tabular-nums">{stats.total}</p>
              </div>
              <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Total Parceiros</p>
            </div>
            <div className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-card to-card/90 shadow-xl border-none transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 rounded-2xl bg-success/10 text-success group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-3xl font-black tracking-tighter tabular-nums text-success">{stats.ativas}</p>
              </div>
              <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Ativas_Grid</p>
            </div>
            <div className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-card to-card/90 shadow-xl border-none transition-all hover:-translate-y-1 col-span-2">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 rounded-2xl bg-info/10 text-info group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <p className="text-3xl font-black tracking-tighter tabular-nums text-info">{stats.entregas}</p>
              </div>
              <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Movimentação Total_Node</p>
            </div>
          </div>



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

        {!loading && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{pagination.paginatedData.map((t, i) => (
          <div key={t.id} className="pb-4">
            <div 
              className={cn(
                "group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-card to-card/95 border-none shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer p-8",
                isSelected(t.id) ? "ring-2 ring-primary" : ""
              )}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-5">
                  <div className="relative group/check">
                    <Checkbox checked={isSelected(t.id)} onCheckedChange={() => toggle(t.id)} className="w-6 h-6 rounded-lg border-2 border-white/20" />
                  </div>
                  <div className={cn("p-4 rounded-2xl transition-all shadow-inner group-hover:scale-110 duration-500", t.homologada ? "bg-success/15 text-success" : "bg-muted/20 text-muted-foreground")}>
                    <Truck className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-xl tracking-tighter uppercase italic truncate text-white">{t.nome_fantasia}</p>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-0.5 truncate">{t.razao_social}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white/5"><MoreVertical className="w-5 h-5 text-white/40" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-black/95 border-white/10 backdrop-blur-xl">
                    <DropdownMenuItem onClick={() => openEdit(t)} className="font-black uppercase tracking-widest text-[10px] gap-2"><Edit className="w-4 h-4" />Editar</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive font-black uppercase tracking-widest text-[10px] gap-2" onClick={() => setDeleteTarget(t.id)}><Trash2 className="w-4 h-4" />Excluir</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="grid grid-cols-1 gap-3 mb-8">
                {t.contato_comercial && <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground/80"><div className="p-2 rounded-lg bg-background shadow-sm"><Phone className="w-3.5 h-3.5 text-primary" /></div><span className="uppercase text-[11px] tracking-tight">{t.contato_comercial}</span></div>}
                {t.email_comercial && <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground/80"><div className="p-2 rounded-lg bg-background shadow-sm"><Mail className="w-3.5 h-3.5 text-primary" /></div><span className="uppercase text-[11px] tracking-tight lowercase">{t.email_comercial}</span></div>}
                {(t.regioes_atendidas || t.coverage_details?.states) && (
                  <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground/80">
                    <div className="p-2 rounded-lg bg-background shadow-sm"><MapPin className="w-3.5 h-3.5 text-primary" /></div>
                    <span className="uppercase text-[11px] tracking-tight">{(t.coverage_details?.states || t.regioes_atendidas).slice(0, 3).join(", ")}{(t.coverage_details?.states?.length || t.regioes_atendidas?.length || 0) > 3 && ` +${(t.coverage_details?.states?.length || t.regioes_atendidas?.length || 0) - 3}`}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                  {[1,2,3,4,5].map(s => <Star key={s} className={cn("w-4 h-4 transition-all duration-700", s <= (t.score_performance || 0) / 20 ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]' : 'text-white/10')} />)}
                </div>
                <Badge variant="outline" className={cn("px-4 py-1.5 font-black uppercase tracking-widest text-[9px] rounded-xl shadow-sm", t.homologada ? "bg-success/15 text-success border-success/30" : "bg-muted/20 text-muted-foreground border-white/10")}>
                  {t.homologada ? "ACTIVE_NODE" : "OFFLINE"}
                </Badge>
              </div>
            </div>
          </div>
        ))}</div>}


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
      </MainLayout>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir Transportadora</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita. Isso excluirá permanentemente o registro.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteTarget && handleDelete(deleteTarget)} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Transportadora</DialogTitle></DialogHeader>
          <FormFields />
          <DialogFooter><Button variant="outline" onClick={() => setEditDialog(false)}>Cancelar</Button><Button onClick={handleUpdate}>Salvar Alterações</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
