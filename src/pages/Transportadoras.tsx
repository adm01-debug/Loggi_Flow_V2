import { useState, useEffect } from "react";
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

// Novos imports
import { Pagination } from "@/components/common/Pagination";
import { FilterBar } from "@/components/common/FilterBar";
import { BulkActions, useSelection } from "@/components/common/BulkActions";
import { usePagination } from "@/hooks/usePagination";
import { useFilters, FilterConfig } from "@/hooks/useFilters";
import { useSorting } from "@/hooks/useSorting";

interface Transportadora {
  id: string; razao_social: string; nome_fantasia: string; cnpj: string | null;
  telefone: string | null; email: string | null; website: string | null;
  endereco: string | null; cidade: string | null; estado: string | null;
  rating: number | null; ativa: boolean | null; observacoes: string | null;
  created_at: string; total_entregas?: number; entregas_sucesso?: number;
}

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const filterConfig: FilterConfig<Transportadora>[] = [
  { key: "search", type: "search", fields: ["nome_fantasia", "razao_social", "cnpj", "cidade"] },
  { key: "estado", type: "select", field: "estado", options: UFS.map(uf => ({ value: uf, label: uf })) },
  { key: "ativa", type: "custom", filterFn: (item, value) => value === "sim" ? item.ativa === true : value === "nao" ? item.ativa === false : true }
];

const emptyForm = { razao_social: "", nome_fantasia: "", cnpj: "", telefone: "", email: "", website: "", endereco: "", cidade: "", estado: "", observacoes: "", ativa: true };

export default function Transportadoras() {
  const { toast } = useToast();
  const { exportToCSV, exportToJSON } = useExport();
  const [list, setList] = useState<Transportadora[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [selected, setSelected] = useState<Transportadora | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { filteredData, filters, setFilter, clearFilters, hasActiveFilters } = useFilters(list, filterConfig);
  const { sortedData, toggleSort, getSortDirection } = useSorting(filteredData, { defaultKey: "nome_fantasia", defaultDirection: "asc" });
  const { paginatedData, currentPage, totalPages, pageSize, setPageSize, goToPage, hasNextPage, hasPrevPage } = usePagination(sortedData, { initialPageSize: 12 });
  const { selectedIds, toggle, selectAll, clearSelection, isSelected } = useSelection(paginatedData);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("transportadoras").select("*").order("nome_fantasia");
    if (data) {
      const { data: entregas } = await supabase.from("entregas").select("transportadora_id, status");
      const enriched = data.map(t => {
        const tEntregas = entregas?.filter(e => e.transportadora_id === t.id) || [];
        return { ...t, total_entregas: tEntregas.length, entregas_sucesso: tEntregas.filter(e => e.status === "entregue").length };
      });
      setList(enriched);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    const { error } = await supabase.from("transportadoras").insert({ ...form, ativa: form.ativa });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Sucesso", description: "Transportadora cadastrada!" }); setDialogOpen(false); fetchData();
    setForm(emptyForm);
  };

  const handleUpdate = async () => {
    if (!selected) return;
    const { error } = await supabase.from("transportadoras").update({ ...form }).eq("id", selected.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Sucesso", description: "Atualizado!" }); setEditDialog(false); fetchData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("transportadoras").delete().eq("id", id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Sucesso", description: "Excluído!" }); fetchData(); }
  };

  const bulkToggleAtiva = async (ids: string[], ativa: boolean) => {
    const { error } = await supabase.from("transportadoras").update({ ativa }).in("id", ids);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Sucesso", description: `${ids.length} transportadora(s) ${ativa ? 'ativada(s)' : 'desativada(s)'}!` }); clearSelection(); fetchData(); }
  };

  const openEdit = (t: Transportadora) => { setSelected(t); setForm({ razao_social: t.razao_social, nome_fantasia: t.nome_fantasia, cnpj: t.cnpj || "", telefone: t.telefone || "", email: t.email || "", website: t.website || "", endereco: t.endereco || "", cidade: t.cidade || "", estado: t.estado || "", observacoes: t.observacoes || "", ativa: t.ativa ?? true }); setEditDialog(true); };

  const stats = { total: list.length, ativas: list.filter(t => t.ativa).length, entregas: list.reduce((a, t) => a + (t.total_entregas || 0), 0) };
  const SortIcon = ({ field }: { field: keyof Transportadora }) => { const dir = getSortDirection(field); if (!dir) return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />; return dir === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />; };

  const FormFields = () => (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>Razão Social *</Label><Input value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} /></div><div className="grid gap-2"><Label>Nome Fantasia *</Label><Input value={form.nome_fantasia} onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })} /></div></div>
      <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>CNPJ</Label><Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} /></div><div className="grid gap-2"><Label>Telefone</Label><Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} /></div></div>
      <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div><div className="grid gap-2"><Label>Website</Label><Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div></div>
      <div className="grid gap-2"><Label>Endereço</Label><Input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} /></div>
      <div className="grid grid-cols-3 gap-4"><div className="grid gap-2"><Label>Cidade</Label><Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} /></div><div className="grid gap-2"><Label>UF</Label><Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v })}><SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger><SelectContent>{UFS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent></Select></div><div className="flex items-center gap-2 pt-6"><Switch checked={form.ativa} onCheckedChange={(v) => setForm({ ...form, ativa: v })} /><Label>Ativa</Label></div></div>
      <div className="grid gap-2"><Label>Observações</Label><Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} /></div>
    </div>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><h1 className="text-display text-foreground flex items-center gap-3"><div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10"><Truck className="w-6 h-6 text-primary" /></div>Transportadoras</h1><p className="text-muted-foreground mt-1">Gerencie suas transportadoras</p></div>
          <div className="flex gap-2">
            <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />Exportar</Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onClick={() => exportToCSV(list, "transportadoras")}>CSV</DropdownMenuItem><DropdownMenuItem onClick={() => exportToJSON(list, "transportadoras")}>JSON</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Nova</Button></DialogTrigger><DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Nova Transportadora</DialogTitle></DialogHeader><FormFields /><DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button><Button onClick={handleSubmit} disabled={!form.razao_social || !form.nome_fantasia}>Cadastrar</Button></DialogFooter></DialogContent></Dialog>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card text-center"><Truck className="w-5 h-5 text-primary mx-auto mb-2" /><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></div>
          <div className="stat-card text-center"><CheckCircle2 className="w-5 h-5 text-success mx-auto mb-2" /><p className="text-2xl font-bold">{stats.ativas}</p><p className="text-xs text-muted-foreground">Ativas</p></div>
          <div className="stat-card text-center"><TrendingUp className="w-5 h-5 text-info mx-auto mb-2" /><p className="text-2xl font-bold">{stats.entregas}</p><p className="text-xs text-muted-foreground">Entregas</p></div>
        </div>

        <FilterBar searchValue={filters.search as string || ""} onSearchChange={(v) => setFilter("search", v)} searchPlaceholder="Buscar..." filters={[{ key: "estado", label: "Estado", type: "select", value: filters.estado as string || "", options: [{ value: "", label: "Todos" }, ...UFS.map(uf => ({ value: uf, label: uf }))], onChange: (v) => setFilter("estado", v || undefined) }, { key: "ativa", label: "Status", type: "select", value: filters.ativa as string || "", options: [{ value: "", label: "Todos" }, { value: "sim", label: "Ativas" }, { value: "nao", label: "Inativas" }], onChange: (v) => setFilter("ativa", v || undefined) }]} onClearFilters={clearFilters} hasActiveFilters={hasActiveFilters} totalCount={sortedData.length} filteredCount={sortedData.length} />

        <div className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">Ordenar:</span><Button variant="ghost" size="sm" onClick={() => toggleSort("nome_fantasia")} className="gap-1">Nome <SortIcon field="nome_fantasia" /></Button><Button variant="ghost" size="sm" onClick={() => toggleSort("cidade")} className="gap-1">Cidade <SortIcon field="cidade" /></Button><Button variant="ghost" size="sm" onClick={() => toggleSort("rating")} className="gap-1">Rating <SortIcon field="rating" /></Button></div>

        {selectedIds.length > 0 && <BulkActions selectedIds={selectedIds} totalCount={paginatedData.length} onClearSelection={clearSelection} onSelectAll={selectAll} actions={[{ id: "ativar", label: "Ativar", icon: CheckCircle2, onClick: (ids) => bulkToggleAtiva(ids, true) }, { id: "desativar", label: "Desativar", icon: XCircle, variant: "destructive", onClick: (ids) => bulkToggleAtiva(ids, false) }]} />}

        {loading && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}

        {!loading && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{paginatedData.map((t, i) => (
          <div key={t.id} className={`card-interactive animate-fade-in ${isSelected(t.id) ? 'ring-2 ring-primary' : ''}`} style={{ animationDelay: `${i * 30}ms` }}>
            <div className="flex items-start gap-3 mb-3">
              <Checkbox checked={isSelected(t.id)} onCheckedChange={() => toggle(t.id)} />
              <div className="flex-1"><p className="font-semibold">{t.nome_fantasia}</p><p className="text-xs text-muted-foreground">{t.razao_social}</p></div>
              <Badge variant={t.ativa ? "default" : "secondary"} className={t.ativa ? "bg-success/20 text-success" : ""}>{t.ativa ? "Ativa" : "Inativa"}</Badge>
              <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => openEdit(t)}><Edit className="w-4 h-4 mr-2" />Editar</DropdownMenuItem><DropdownMenuItem className="text-destructive" onClick={() => handleDelete(t.id)}><Trash2 className="w-4 h-4 mr-2" />Excluir</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">{t.telefone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{t.telefone}</div>}{t.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{t.email}</div>}{t.cidade && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{t.cidade} - {t.estado}</div>}</div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t"><div className="flex items-center gap-1">{[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= (t.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />)}</div><span className="text-sm font-medium">{t.total_entregas || 0} entregas</span></div>
          </div>
        ))}</div>}

        {!loading && sortedData.length === 0 && <div className="card-base flex flex-col items-center py-12"><Truck className="w-12 h-12 text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">Nenhuma transportadora</p></div>}
        {!loading && sortedData.length > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} totalItems={sortedData.length} onPageChange={goToPage} onPageSizeChange={setPageSize} hasNextPage={hasNextPage} hasPrevPage={hasPrevPage} />}

        <Dialog open={editDialog} onOpenChange={setEditDialog}><DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Editar Transportadora</DialogTitle></DialogHeader><FormFields /><DialogFooter><Button variant="outline" onClick={() => setEditDialog(false)}>Cancelar</Button><Button onClick={handleUpdate} disabled={!form.razao_social || !form.nome_fantasia}>Salvar</Button></DialogFooter></DialogContent></Dialog>
      </div>
    </MainLayout>
  );
}
