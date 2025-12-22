import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Plus, Phone, MapPin, Package, MoreVertical, Eye, Edit, Trash2, TrendingUp, Clock, Loader2, AlertCircle, User, FileText, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
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
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Importar novos hooks e componentes
import { Pagination } from "@/components/common/Pagination";
import { FilterBar } from "@/components/common/FilterBar";
import { BulkActions, useSelection } from "@/components/common/BulkActions";
import { usePagination } from "@/hooks/usePagination";
import { useFilters, FilterConfig } from "@/hooks/useFilters";
import { useSorting } from "@/hooks/useSorting";

interface Fornecedor {
  id: string; razao_social: string; nome_fantasia: string | null; cnpj: string | null;
  endereco_completo: string; cidade: string | null; estado: string | null; cep: string | null;
  contato_nome: string | null; contato_email: string | null; contato_telefone: string | null;
  created_at: string; total_coletas?: number; coletas_pendentes?: number; ultima_coleta?: string | null;
}

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const emptyForm = { razao_social: "", nome_fantasia: "", cnpj: "", endereco_completo: "", cidade: "", estado: "", cep: "", contato_nome: "", contato_email: "", contato_telefone: "" };

const filterConfig: FilterConfig<Fornecedor> = {
  search: {
    fields: ["razao_social", "nome_fantasia", "cnpj", "cidade", "contato_nome"],
    placeholder: "Buscar por nome, CNPJ, cidade..."
  },
  select: {
    estado: {
      field: "estado",
      options: UFS.map(uf => ({ value: uf, label: uf })),
      label: "Estado"
    }
  }
};

export default function Fornecedores() {
  const qc = useQueryClient();
  const [dlgCreate, setDlgCreate] = useState(false);
  const [dlgEdit, setDlgEdit] = useState(false);
  const [dlgView, setDlgView] = useState(false);
  const [dlgDel, setDlgDel] = useState(false);
  const [sel, setSel] = useState<Fornecedor | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: list = [], isLoading, error } = useQuery({
    queryKey: ["fornecedores"],
    queryFn: async () => {
      const { data, error } = await supabase.from("fornecedores").select("*").order("razao_social");
      if (error) throw error;
      const { data: coletas } = await supabase.from("coletas").select("fornecedor_id, status, created_at");
      return (data || []).map((f) => {
        const fc = coletas?.filter((c) => c.fornecedor_id === f.id) || [];
        const pend = fc.filter((c) => ["aguardando_liberacao","solicitada","em_transito"].includes(c.status)).length;
        const ult = fc.length ? fc.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at : null;
        return { ...f, total_coletas: fc.length, coletas_pendentes: pend, ultima_coleta: ult };
      }) as Fornecedor[];
    },
  });

  // Hooks de filtros, ordenação e paginação
  const { filteredData, filters, setSearch, setFilter, clearFilters, hasActiveFilters, totalFiltered, totalOriginal } = useFilters(list, filterConfig);
  const { sortedData, toggleSort, getSortDirection } = useSorting(filteredData, { defaultKey: "razao_social", defaultDirection: "asc" });
  const pagination = usePagination(sortedData, { initialPageSize: 12 });
  const { selectedIds, toggle, selectAll, clearSelection, isSelected } = useSelection(pagination.paginatedData);

  const createMut = useMutation({
    mutationFn: async (d: typeof emptyForm) => {
      const { error } = await supabase.from("fornecedores").insert({ razao_social: d.razao_social, nome_fantasia: d.nome_fantasia || null, cnpj: d.cnpj || null, endereco_completo: d.endereco_completo, cidade: d.cidade || null, estado: d.estado || null, cep: d.cep || null, contato_nome: d.contato_nome || null, contato_email: d.contato_email || null, contato_telefone: d.contato_telefone || null });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fornecedores"] }); setDlgCreate(false); setForm(emptyForm); toast.success("Fornecedor cadastrado!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, d }: { id: string; d: typeof emptyForm }) => {
      const { error } = await supabase.from("fornecedores").update({ razao_social: d.razao_social, nome_fantasia: d.nome_fantasia || null, cnpj: d.cnpj || null, endereco_completo: d.endereco_completo, cidade: d.cidade || null, estado: d.estado || null, cep: d.cep || null, contato_nome: d.contato_nome || null, contato_email: d.contato_email || null, contato_telefone: d.contato_telefone || null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fornecedores"] }); setDlgEdit(false); setSel(null); toast.success("Fornecedor atualizado!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("fornecedores").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fornecedores"] }); setDlgDel(false); setSel(null); toast.success("Fornecedor excluído!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const bulkDeleteMut = useMutation({
    mutationFn: async (ids: string[]) => { const { error } = await supabase.from("fornecedores").delete().in("id", ids); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fornecedores"] }); clearSelection(); toast.success(`${selectedIds.length} fornecedor(es) excluído(s)!`); },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const openEdit = (f: Fornecedor) => { setSel(f); setForm({ razao_social: f.razao_social, nome_fantasia: f.nome_fantasia || "", cnpj: f.cnpj || "", endereco_completo: f.endereco_completo, cidade: f.cidade || "", estado: f.estado || "", cep: f.cep || "", contato_nome: f.contato_nome || "", contato_email: f.contato_email || "", contato_telefone: f.contato_telefone || "" }); setDlgEdit(true); };

  const stats = { total: list.length, com: list.filter((f) => (f.total_coletas || 0) > 0).length, pend: list.filter((f) => (f.coletas_pendentes || 0) > 0).length, tot: list.reduce((a, f) => a + (f.total_coletas || 0), 0) };
  const fmtCNPJ = (c: string) => { const n = c.replace(/\D/g, ""); return n.length === 14 ? n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5") : c; };

  const SortIcon = ({ field }: { field: keyof Fornecedor }) => {
    const dir = getSortDirection(field);
    if (!dir) return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />;
    return dir === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  if (error) return <MainLayout><div className="flex flex-col items-center py-12"><AlertCircle className="w-12 h-12 text-destructive mb-4" /><p className="text-destructive">Erro: {error.message}</p></div></MainLayout>;

  const FormFields = () => (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2"><Label>Razão Social *</Label><Input value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>Nome Fantasia</Label><Input value={form.nome_fantasia} onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })} /></div><div className="grid gap-2"><Label>CNPJ</Label><Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} /></div></div>
      <div className="grid gap-2"><Label>Endereço *</Label><Textarea value={form.endereco_completo} onChange={(e) => setForm({ ...form, endereco_completo: e.target.value })} /></div>
      <div className="grid grid-cols-3 gap-4"><div className="grid gap-2"><Label>Cidade</Label><Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} /></div><div className="grid gap-2"><Label>UF</Label><Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{UFS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label>CEP</Label><Input value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} /></div></div>
      <div className="border-t pt-4"><p className="text-sm font-medium mb-3">Contato</p><div className="grid gap-4"><div className="grid gap-2"><Label>Nome</Label><Input value={form.contato_nome} onChange={(e) => setForm({ ...form, contato_nome: e.target.value })} /></div><div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>Email</Label><Input type="email" value={form.contato_email} onChange={(e) => setForm({ ...form, contato_email: e.target.value })} /></div><div className="grid gap-2"><Label>Telefone</Label><Input value={form.contato_telefone} onChange={(e) => setForm({ ...form, contato_telefone: e.target.value })} /></div></div></div></div>
    </div>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><h1 className="text-display text-foreground flex items-center gap-3"><div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10"><Building2 className="w-6 h-6 text-primary" /></div>Fornecedores</h1><p className="text-muted-foreground mt-1">Gerencie seus fornecedores</p></div>
          <Button onClick={() => { setForm(emptyForm); setDlgCreate(true); }} className="gap-2"><Plus className="w-4 h-4" />Novo</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card text-center"><Building2 className="w-5 h-5 text-primary mx-auto mb-2" /><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></div>
          <div className="stat-card text-center"><Package className="w-5 h-5 text-success mx-auto mb-2" /><p className="text-2xl font-bold">{stats.com}</p><p className="text-xs text-muted-foreground">Com Coletas</p></div>
          <div className="stat-card text-center"><Clock className="w-5 h-5 text-warning mx-auto mb-2" /><p className="text-2xl font-bold">{stats.pend}</p><p className="text-xs text-muted-foreground">Pendentes</p></div>
          <div className="stat-card text-center"><TrendingUp className="w-5 h-5 text-info mx-auto mb-2" /><p className="text-2xl font-bold">{stats.tot}</p><p className="text-xs text-muted-foreground">Total Coletas</p></div>
        </div>

        <FilterBar
          search={filters.search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por nome, CNPJ, cidade..."
          extraFilters={[
            {
              key: "estado",
              value: (filters.estado as string) || "",
              onChange: (value) => setFilter("estado", value || undefined),
              options: UFS.map(uf => ({ value: uf, label: uf })),
              label: "Estado"
            }
          ]}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          totalFiltered={totalFiltered}
          totalOriginal={totalOriginal}
        />

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Ordenar por:</span>
          <Button variant="ghost" size="sm" onClick={() => toggleSort("razao_social")} className="gap-1">Nome <SortIcon field="razao_social" /></Button>
          <Button variant="ghost" size="sm" onClick={() => toggleSort("cidade")} className="gap-1">Cidade <SortIcon field="cidade" /></Button>
          <Button variant="ghost" size="sm" onClick={() => toggleSort("total_coletas")} className="gap-1">Coletas <SortIcon field="total_coletas" /></Button>
        </div>

        {selectedIds.length > 0 && (
          <BulkActions selectedIds={selectedIds} totalCount={pagination.paginatedData.length} onClearSelection={clearSelection} onSelectAll={selectAll}
            actions={[{ id: "delete", label: "Excluir Selecionados", icon: Trash2, variant: "destructive", onClick: (ids) => bulkDeleteMut.mutate(ids) }]} />
        )}

        {isLoading && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}

        {!isLoading && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pagination.paginatedData.map((f, i) => (
            <div key={f.id} className={`card-interactive animate-fade-in ${isSelected(f.id) ? 'ring-2 ring-primary' : ''}`} style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start gap-3 mb-4">
                <Checkbox checked={isSelected(f.id)} onCheckedChange={() => toggle(f.id)} className="mt-1" />
                <div className="flex-1 min-w-0"><p className="font-semibold text-lg truncate">{f.nome_fantasia || f.razao_social}</p>{f.nome_fantasia && <p className="text-xs text-muted-foreground truncate">{f.razao_social}</p>}</div>
                <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { setSel(f); setDlgView(true); }}><Eye className="w-4 h-4 mr-2" />Ver</DropdownMenuItem><DropdownMenuItem onClick={() => openEdit(f)}><Edit className="w-4 h-4 mr-2" />Editar</DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem className="text-destructive" onClick={() => { setSel(f); setDlgDel(true); }}><Trash2 className="w-4 h-4 mr-2" />Excluir</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
              </div>
              <div className="space-y-2 text-sm">{f.cnpj && <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-muted-foreground" /><span className="font-mono">{fmtCNPJ(f.cnpj)}</span></div>}{f.contato_nome && <div className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" />{f.contato_nome}</div>}{f.contato_telefone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4" />{f.contato_telefone}</div>}<div className="flex items-start gap-2 text-muted-foreground"><MapPin className="w-4 h-4 mt-0.5" /><div><p className="line-clamp-2">{f.endereco_completo}</p>{f.cidade && <p className="font-medium text-foreground">{f.cidade} - {f.estado}</p>}</div></div></div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t"><div className="flex items-center gap-2"><Package className="w-4 h-4 text-muted-foreground" /><span className="font-medium">{f.total_coletas || 0}</span>{(f.coletas_pendentes || 0) > 0 && <Badge variant="outline" className="bg-warning/10 text-warning">{f.coletas_pendentes} pend.</Badge>}</div>{f.ultima_coleta && <span className="text-xs text-muted-foreground">{format(new Date(f.ultima_coleta), "dd/MM/yy", { locale: ptBR })}</span>}</div>
            </div>
          ))}
        </div>}

        {!isLoading && sortedData.length === 0 && <div className="card-base flex flex-col items-center py-12"><Building2 className="w-12 h-12 text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">Nenhum fornecedor</p><Button variant="outline" className="mt-4" onClick={() => setDlgCreate(true)}>Cadastrar</Button></div>}

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

        <Dialog open={dlgCreate} onOpenChange={setDlgCreate}><DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Novo Fornecedor</DialogTitle></DialogHeader><FormFields /><DialogFooter><Button variant="outline" onClick={() => setDlgCreate(false)}>Cancelar</Button><Button onClick={() => createMut.mutate(form)} disabled={!form.razao_social || !form.endereco_completo || createMut.isPending}>{createMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Cadastrar</Button></DialogFooter></DialogContent></Dialog>
        <Dialog open={dlgEdit} onOpenChange={setDlgEdit}><DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Editar Fornecedor</DialogTitle></DialogHeader><FormFields /><DialogFooter><Button variant="outline" onClick={() => setDlgEdit(false)}>Cancelar</Button><Button onClick={() => sel && updateMut.mutate({ id: sel.id, d: form })} disabled={!form.razao_social || !form.endereco_completo || updateMut.isPending}>{updateMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar</Button></DialogFooter></DialogContent></Dialog>
        <Dialog open={dlgView} onOpenChange={setDlgView}><DialogContent><DialogHeader><DialogTitle>Detalhes do Fornecedor</DialogTitle></DialogHeader>{sel && <div className="space-y-4"><p className="text-lg font-semibold">{sel.nome_fantasia || sel.razao_social}</p>{sel.cnpj && <p className="font-mono">{fmtCNPJ(sel.cnpj)}</p>}<div className="grid grid-cols-2 gap-4 text-sm"><div><p className="text-muted-foreground">Endereço</p><p>{sel.endereco_completo}</p></div><div><p className="text-muted-foreground">Cidade/UF</p><p>{sel.cidade} - {sel.estado}</p></div></div>{sel.contato_nome && <div className="text-sm"><p className="text-muted-foreground">Contato</p><p>{sel.contato_nome} - {sel.contato_telefone}</p></div>}</div>}</DialogContent></Dialog>
        <AlertDialog open={dlgDel} onOpenChange={setDlgDel}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir fornecedor?</AlertDialogTitle><AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => sel && deleteMut.mutate(sel.id)}>Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      </div>
    </MainLayout>
  );
}