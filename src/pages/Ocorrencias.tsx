import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Plus, MoreVertical, Eye, Edit, CheckCircle2, Clock, Loader2, AlertCircle, FileText, Package, Send, Calendar, MessageSquare, ArrowUpDown, ChevronUp, ChevronDown, Camera } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/common/Pagination";
import { FilterBar } from "@/components/common/FilterBar";
import { BulkActions, useSelection } from "@/components/common/BulkActions";
import { CommentSection } from "@/components/common/CommentSection";
import { ImageUploader } from "@/components/common/ImageUploader";
import { Timeline } from "@/components/common/Timeline";
import { usePagination } from "@/hooks/usePagination";
import { useFilters, FilterConfig } from "@/hooks/useFilters";
import { useSorting } from "@/hooks/useSorting";
import { useComments } from "@/hooks/useComments";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useEntityHistory } from "@/hooks/useEntityHistory";

interface Ocorrencia {
  id: string; tipo_ocorrencia: string; descricao: string | null; acao_tomada: string | null;
  resolvida: boolean | null; data_resolucao: string | null; created_at: string;
  coleta_id: string | null; entrega_id: string | null; fotos_urls: string[] | null;
  coleta?: { numero_coleta: string } | null; entrega?: { numero_entrega: string } | null;
}

const TIPOS = [
  { value: "atraso", label: "Atraso na Entrega", icon: Clock },
  { value: "avaria", label: "Avaria/Dano", icon: AlertTriangle },
  { value: "extravio", label: "Extravio", icon: Package },
  { value: "endereco_incorreto", label: "Endereço Incorreto", icon: AlertCircle },
  { value: "ausente", label: "Destinatário Ausente", icon: AlertCircle },
  { value: "recusa", label: "Recusa de Recebimento", icon: AlertCircle },
  { value: "documentacao", label: "Problema Documentação", icon: FileText },
  { value: "outros", label: "Outros", icon: MessageSquare },
];

const filterConfig: FilterConfig<Ocorrencia> = {
  searchFields: ["tipo_ocorrencia", "descricao", "acao_tomada"],
};

const emptyForm = { tipo_ocorrencia: "", descricao: "", acao_tomada: "", coleta_id: "", entrega_id: "" };

export default function Ocorrencias() {
  const qc = useQueryClient();
  const [dlgCreate, setDlgCreate] = useState(false);
  const [dlgEdit, setDlgEdit] = useState(false);
  const [dlgView, setDlgView] = useState(false);
  const [sel, setSel] = useState<Ocorrencia | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [tipoFilter, setTipoFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [newComment, setNewComment] = useState("");

  const { data: list = [], isLoading, error } = useQuery({
    queryKey: ["ocorrencias"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ocorrencias").select("*, coleta:coletas(numero_coleta), entrega:entregas(numero_entrega)").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Ocorrencia[];
    },
  });

  const { data: coletas = [] } = useQuery({ queryKey: ["coletas-select"], queryFn: async () => { const { data } = await supabase.from("coletas").select("id, numero_coleta").order("created_at", { ascending: false }).limit(50); return data || []; } });
  const { data: entregas = [] } = useQuery({ queryKey: ["entregas-select"], queryFn: async () => { const { data } = await supabase.from("entregas").select("id, numero_entrega").order("created_at", { ascending: false }).limit(50); return data || []; } });

  // Apply filters manually
  const filteredByCustom = list.filter(o => {
    if (tipoFilter && o.tipo_ocorrencia !== tipoFilter) return false;
    if (statusFilter === "pendente" && o.resolvida) return false;
    if (statusFilter === "resolvida" && !o.resolvida) return false;
    return true;
  });

  const { filteredData, search, setSearch, clearFilters, hasActiveFilters } = useFilters(filteredByCustom, filterConfig);
  const { sortedData, toggleSort, getSortDirection } = useSorting(filteredData, { defaultKey: "created_at", defaultDirection: "desc" });
  const pagination = usePagination(sortedData, { initialPageSize: 10 });
  const { selectedIds, toggle, selectAll, clearSelection, isSelected } = useSelection(pagination.paginatedData);
  const { comments, addComment, deleteComment, isLoading: commentsLoading } = useComments({ entityType: "ocorrencia", entityId: sel?.id || "" });
  const { uploadImage, uploading } = useImageUpload("ocorrencias-fotos");
  const { history } = useEntityHistory({ entityType: "ocorrencia", entityId: sel?.id || "" });

  const createMut = useMutation({
    mutationFn: async (d: typeof emptyForm & { fotos_urls?: string[] }) => {
      const { error } = await supabase.from("ocorrencias").insert({ tipo_ocorrencia: d.tipo_ocorrencia, descricao: d.descricao || null, acao_tomada: d.acao_tomada || null, coleta_id: d.coleta_id || null, entrega_id: d.entrega_id || null, fotos_urls: d.fotos_urls || null, resolvida: false });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ocorrencias"] }); setDlgCreate(false); setForm(emptyForm); setUploadedPhotos([]); toast.success("Ocorrência registrada!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, d }: { id: string; d: typeof emptyForm & { resolvida?: boolean; fotos_urls?: string[] } }) => {
      const { error } = await supabase.from("ocorrencias").update({ tipo_ocorrencia: d.tipo_ocorrencia, descricao: d.descricao || null, acao_tomada: d.acao_tomada || null, coleta_id: d.coleta_id || null, entrega_id: d.entrega_id || null, fotos_urls: d.fotos_urls || null, resolvida: d.resolvida, data_resolucao: d.resolvida ? new Date().toISOString() : null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ocorrencias"] }); setDlgEdit(false); setSel(null); toast.success("Ocorrência atualizada!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const resolveMut = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from("ocorrencias").update({ resolvida: true, data_resolucao: new Date().toISOString() }).eq("id", id); if (error) throw error; }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["ocorrencias"] }); toast.success("Resolvida!"); } });
  const bulkResolveMut = useMutation({ mutationFn: async (ids: string[]) => { const { error } = await supabase.from("ocorrencias").update({ resolvida: true, data_resolucao: new Date().toISOString() }).in("id", ids); if (error) throw error; }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["ocorrencias"] }); clearSelection(); toast.success(`${selectedIds.length} resolvida(s)!`); } });

  const openEdit = (o: Ocorrencia) => { setSel(o); setForm({ tipo_ocorrencia: o.tipo_ocorrencia, descricao: o.descricao || "", acao_tomada: o.acao_tomada || "", coleta_id: o.coleta_id || "", entrega_id: o.entrega_id || "" }); setUploadedPhotos(o.fotos_urls || []); setDlgEdit(true); };
  
  const handlePhotoUpload = async (files: File[]) => { 
    for (const f of files) { 
      const result = await uploadImage(f); 
      if (result) setUploadedPhotos(p => [...p, result.url]); 
    } 
  };

  const handleClearFilters = () => {
    clearFilters();
    setTipoFilter("");
    setStatusFilter("");
  };

  const handleAddComment = async () => {
    if (newComment.trim()) {
      await addComment.mutateAsync(newComment);
      setNewComment("");
    }
  };

  const stats = { total: list.length, pendentes: list.filter(o => !o.resolvida).length, resolvidas: list.filter(o => o.resolvida).length, hoje: list.filter(o => format(new Date(o.created_at), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")).length };
  const getTipoInfo = (tipo: string) => TIPOS.find(t => t.value === tipo) || { label: tipo, icon: AlertTriangle };
  const SortIcon = ({ field }: { field: keyof Ocorrencia }) => { const dir = getSortDirection(field); if (!dir) return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />; return dir === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />; };

  if (error) return <MainLayout><div className="flex flex-col items-center py-12"><AlertCircle className="w-12 h-12 text-destructive mb-4" /><p className="text-destructive">Erro: {error.message}</p></div></MainLayout>;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><h1 className="text-display text-foreground flex items-center gap-3"><div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-destructive/20 to-destructive/10"><AlertTriangle className="w-6 h-6 text-destructive" /></div>Ocorrências</h1><p className="text-muted-foreground mt-1">Registre e acompanhe ocorrências</p></div>
          <Button onClick={() => { setForm(emptyForm); setUploadedPhotos([]); setDlgCreate(true); }} className="gap-2"><Plus className="w-4 h-4" />Nova</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card text-center"><AlertTriangle className="w-5 h-5 text-primary mx-auto mb-2" /><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></div>
          <div className="stat-card text-center"><Clock className="w-5 h-5 text-warning mx-auto mb-2" /><p className="text-2xl font-bold">{stats.pendentes}</p><p className="text-xs text-muted-foreground">Pendentes</p></div>
          <div className="stat-card text-center"><CheckCircle2 className="w-5 h-5 text-success mx-auto mb-2" /><p className="text-2xl font-bold">{stats.resolvidas}</p><p className="text-xs text-muted-foreground">Resolvidas</p></div>
          <div className="stat-card text-center"><Calendar className="w-5 h-5 text-info mx-auto mb-2" /><p className="text-2xl font-bold">{stats.hoje}</p><p className="text-xs text-muted-foreground">Hoje</p></div>
        </div>

        <FilterBar 
          search={search} 
          onSearchChange={setSearch} 
          searchPlaceholder="Buscar..." 
          filters={[
            { key: "tipo", label: "Tipo", type: "select", value: tipoFilter, options: [{ value: "", label: "Todos" }, ...TIPOS.map(t => ({ value: t.value, label: t.label }))], onChange: (v) => setTipoFilter(v) }, 
            { key: "status", label: "Status", type: "select", value: statusFilter, options: [{ value: "", label: "Todos" }, { value: "pendente", label: "Pendentes" }, { value: "resolvida", label: "Resolvidas" }], onChange: (v) => setStatusFilter(v) }
          ]} 
          onClearFilters={handleClearFilters} 
          hasActiveFilters={hasActiveFilters || !!tipoFilter || !!statusFilter} 
          totalCount={list.length} 
          filteredCount={sortedData.length} 
        />

        <div className="flex items-center gap-2 text-sm"><span className="text-muted-foreground">Ordenar:</span><Button variant="ghost" size="sm" onClick={() => toggleSort("created_at")} className="gap-1">Data <SortIcon field="created_at" /></Button><Button variant="ghost" size="sm" onClick={() => toggleSort("tipo_ocorrencia")} className="gap-1">Tipo <SortIcon field="tipo_ocorrencia" /></Button></div>

        {selectedIds.length > 0 && <BulkActions selectedIds={selectedIds} totalCount={pagination.paginatedData.length} onClearSelection={clearSelection} onSelectAll={selectAll} actions={[{ id: "resolve", label: "Resolver", icon: CheckCircle2, onClick: (ids) => bulkResolveMut.mutate(ids) }]} />}

        {isLoading && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}

        {!isLoading && <div className="space-y-3">{pagination.paginatedData.map((o, i) => { const tipoInfo = getTipoInfo(o.tipo_ocorrencia); const TipoIcon = tipoInfo.icon; return (
          <div key={o.id} className={`card-interactive animate-fade-in ${isSelected(o.id) ? 'ring-2 ring-primary' : ''}`} style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-start gap-3"><Checkbox checked={isSelected(o.id)} onCheckedChange={() => toggle(o.id)} className="mt-1" /><div className={cn("p-2 rounded-lg", o.resolvida ? "bg-success/10" : "bg-warning/10")}><TipoIcon className={cn("w-5 h-5", o.resolvida ? "text-success" : "text-warning")} /></div>
              <div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1"><p className="font-semibold">{tipoInfo.label}</p><Badge variant={o.resolvida ? "default" : "secondary"} className={o.resolvida ? "bg-success/20 text-success" : ""}>{o.resolvida ? "Resolvida" : "Pendente"}</Badge>{o.fotos_urls && o.fotos_urls.length > 0 && <Badge variant="outline" className="gap-1"><Camera className="w-3 h-3" />{o.fotos_urls.length}</Badge>}</div>{o.descricao && <p className="text-sm text-muted-foreground line-clamp-2">{o.descricao}</p>}<div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground"><span>{format(new Date(o.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}</span>{o.coleta && <span className="flex items-center gap-1"><Package className="w-3 h-3" />{o.coleta.numero_coleta}</span>}{o.entrega && <span className="flex items-center gap-1"><Send className="w-3 h-3" />{o.entrega.numero_entrega}</span>}</div></div>
              <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { setSel(o); setDlgView(true); }}><Eye className="w-4 h-4 mr-2" />Ver</DropdownMenuItem><DropdownMenuItem onClick={() => openEdit(o)}><Edit className="w-4 h-4 mr-2" />Editar</DropdownMenuItem>{!o.resolvida && <><DropdownMenuSeparator /><DropdownMenuItem onClick={() => resolveMut.mutate(o.id)}><CheckCircle2 className="w-4 h-4 mr-2" />Resolver</DropdownMenuItem></>}</DropdownMenuContent></DropdownMenu>
            </div>
          </div>
        ); })}</div>}

        {!isLoading && sortedData.length === 0 && <div className="card-base flex flex-col items-center py-12"><AlertTriangle className="w-12 h-12 text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">Nenhuma ocorrência</p></div>}
        
        {!isLoading && sortedData.length > 0 && (
          <Pagination 
            currentPage={pagination.currentPage} 
            totalPages={pagination.totalPages} 
            pageSize={pagination.pageSize} 
            totalItems={sortedData.length}
            startIndex={(pagination.currentPage - 1) * pagination.pageSize + 1}
            endIndex={Math.min(pagination.currentPage * pagination.pageSize, sortedData.length)}
            pageSizeOptions={[10, 25, 50]}
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

        <Dialog open={dlgCreate} onOpenChange={setDlgCreate}><DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Nova Ocorrência</DialogTitle></DialogHeader><div className="grid gap-4 py-4"><div className="grid gap-2"><Label>Tipo *</Label><Select value={form.tipo_ocorrencia} onValueChange={(v) => setForm({ ...form, tipo_ocorrencia: v })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} /></div><div className="grid gap-2"><Label>Ação Tomada</Label><Textarea value={form.acao_tomada} onChange={(e) => setForm({ ...form, acao_tomada: e.target.value })} rows={2} /></div><div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>Coleta</Label><Select value={form.coleta_id} onValueChange={(v) => setForm({ ...form, coleta_id: v })}><SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger><SelectContent>{coletas.map(c => <SelectItem key={c.id} value={c.id}>{c.numero_coleta}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label>Entrega</Label><Select value={form.entrega_id} onValueChange={(v) => setForm({ ...form, entrega_id: v })}><SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger><SelectContent>{entregas.map(e => <SelectItem key={e.id} value={e.id}>{e.numero_entrega}</SelectItem>)}</SelectContent></Select></div></div><div className="grid gap-2"><Label>Fotos</Label><ImageUploader images={uploadedPhotos} onImagesChange={setUploadedPhotos} maxImages={5} disabled={uploading} bucket="ocorrencias-fotos" /></div></div><DialogFooter><Button variant="outline" onClick={() => setDlgCreate(false)}>Cancelar</Button><Button onClick={() => createMut.mutate({ ...form, fotos_urls: uploadedPhotos })} disabled={!form.tipo_ocorrencia || createMut.isPending}>{createMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Registrar</Button></DialogFooter></DialogContent></Dialog>

        <Dialog open={dlgEdit} onOpenChange={setDlgEdit}><DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Editar Ocorrência</DialogTitle></DialogHeader><div className="grid gap-4 py-4"><div className="grid gap-2"><Label>Tipo *</Label><Select value={form.tipo_ocorrencia} onValueChange={(v) => setForm({ ...form, tipo_ocorrencia: v })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} /></div><div className="grid gap-2"><Label>Ação Tomada</Label><Textarea value={form.acao_tomada} onChange={(e) => setForm({ ...form, acao_tomada: e.target.value })} rows={2} /></div><div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>Coleta</Label><Select value={form.coleta_id} onValueChange={(v) => setForm({ ...form, coleta_id: v })}><SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger><SelectContent>{coletas.map(c => <SelectItem key={c.id} value={c.id}>{c.numero_coleta}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label>Entrega</Label><Select value={form.entrega_id} onValueChange={(v) => setForm({ ...form, entrega_id: v })}><SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger><SelectContent>{entregas.map(e => <SelectItem key={e.id} value={e.id}>{e.numero_entrega}</SelectItem>)}</SelectContent></Select></div></div><div className="grid gap-2"><Label>Fotos</Label><ImageUploader images={uploadedPhotos} onImagesChange={setUploadedPhotos} maxImages={5} disabled={uploading} bucket="ocorrencias-fotos" /></div></div><DialogFooter><Button variant="outline" onClick={() => setDlgEdit(false)}>Cancelar</Button><Button onClick={() => sel && updateMut.mutate({ id: sel.id, d: { ...form, fotos_urls: uploadedPhotos, resolvida: sel.resolvida ?? false } })} disabled={!form.tipo_ocorrencia || updateMut.isPending}>{updateMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar</Button></DialogFooter></DialogContent></Dialog>

        <Dialog open={dlgView} onOpenChange={setDlgView}><DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">{sel && (<><DialogHeader><DialogTitle className="flex items-center gap-2">{getTipoInfo(sel.tipo_ocorrencia).label}<Badge variant={sel.resolvida ? "default" : "secondary"} className={sel.resolvida ? "bg-success/20 text-success" : ""}>{sel.resolvida ? "Resolvida" : "Pendente"}</Badge></DialogTitle></DialogHeader><Tabs defaultValue="detalhes"><TabsList><TabsTrigger value="detalhes">Detalhes</TabsTrigger><TabsTrigger value="comments">Comentários</TabsTrigger><TabsTrigger value="historico">Histórico</TabsTrigger></TabsList><TabsContent value="detalhes" className="space-y-4"><div className="grid gap-4"><div className="grid grid-cols-2 gap-4"><div><p className="text-sm text-muted-foreground">Criada em</p><p>{format(new Date(sel.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p></div>{sel.data_resolucao && <div><p className="text-sm text-muted-foreground">Resolvida em</p><p>{format(new Date(sel.data_resolucao), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p></div>}</div>{sel.descricao && <div><p className="text-sm text-muted-foreground">Descrição</p><p className="whitespace-pre-wrap">{sel.descricao}</p></div>}{sel.acao_tomada && <div><p className="text-sm text-muted-foreground">Ação Tomada</p><p className="whitespace-pre-wrap">{sel.acao_tomada}</p></div>}<div className="flex gap-4">{sel.coleta && <Badge variant="outline" className="gap-1"><Package className="w-3 h-3" />{sel.coleta.numero_coleta}</Badge>}{sel.entrega && <Badge variant="outline" className="gap-1"><Send className="w-3 h-3" />{sel.entrega.numero_entrega}</Badge>}</div>{sel.fotos_urls && sel.fotos_urls.length > 0 && <div><p className="text-sm text-muted-foreground mb-2">Fotos</p><div className="flex flex-wrap gap-2">{sel.fotos_urls.map((url, i) => <img key={i} src={url} alt={`Foto ${i + 1}`} className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80" onClick={() => window.open(url, "_blank")} />)}</div></div>}</div></TabsContent>
          <TabsContent value="comments">
            <CommentSection 
              comments={comments} 
              isLoading={commentsLoading}
              newComment={newComment}
              onNewCommentChange={setNewComment}
              onSubmit={handleAddComment}
              onDelete={(id) => deleteComment.mutate(id)}
              isAdding={addComment.isPending}
              isDeleting={deleteComment.isPending}
            />
          </TabsContent>
          <TabsContent value="historico">{history.length > 0 ? <Timeline events={history} /> : <p className="text-muted-foreground text-center py-4">Nenhum histórico</p>}</TabsContent></Tabs></>)}</DialogContent></Dialog>
      </div>
    </MainLayout>
  );
}