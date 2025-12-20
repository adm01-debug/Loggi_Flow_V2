import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Plus, Search, Phone, Mail, MapPin, Package, MoreVertical, Eye, Edit, Trash2, Clock, Loader2, AlertCircle, User, FileText } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Fornecedor {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string | null;
  endereco_completo: string;
  cidade: string | null;
  estado: string | null;
  cep: string | null;
  contato_nome: string | null;
  contato_email: string | null;
  contato_telefone: string | null;
  created_at: string;
  total_coletas?: number;
  coletas_pendentes?: number;
}

const ESTADOS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

const emptyForm = { razao_social: "", nome_fantasia: "", cnpj: "", endereco_completo: "", cidade: "", estado: "", cep: "", contato_nome: "", contato_email: "", contato_telefone: "" };

export default function Fornecedores() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Fornecedor | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: fornecedores = [], isLoading, error } = useQuery({
    queryKey: ["fornecedores"],
    queryFn: async () => {
      const { data, error } = await supabase.from("fornecedores").select("*").order("razao_social");
      if (error) throw error;
      const { data: coletas } = await supabase.from("coletas").select("fornecedor_id, status");
      return (data || []).map((f) => {
        const fc = coletas?.filter((c) => c.fornecedor_id === f.id) || [];
        return { ...f, total_coletas: fc.length, coletas_pendentes: fc.filter((c) => ["aguardando_liberacao","solicitada","em_transito"].includes(c.status)).length };
      }) as Fornecedor[];
    },
  });

  const createMut = useMutation({
    mutationFn: async (d: typeof form) => {
      const { error } = await supabase.from("fornecedores").insert({ razao_social: d.razao_social, nome_fantasia: d.nome_fantasia || null, cnpj: d.cnpj || null, endereco_completo: d.endereco_completo, cidade: d.cidade || null, estado: d.estado || null, cep: d.cep || null, contato_nome: d.contato_nome || null, contato_email: d.contato_email || null, contato_telefone: d.contato_telefone || null });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fornecedores"] }); setIsCreateOpen(false); setForm(emptyForm); toast.success("Fornecedor cadastrado!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, d }: { id: string; d: typeof form }) => {
      const { error } = await supabase.from("fornecedores").update({ razao_social: d.razao_social, nome_fantasia: d.nome_fantasia || null, cnpj: d.cnpj || null, endereco_completo: d.endereco_completo, cidade: d.cidade || null, estado: d.estado || null, cep: d.cep || null, contato_nome: d.contato_nome || null, contato_email: d.contato_email || null, contato_telefone: d.contato_telefone || null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fornecedores"] }); setIsEditOpen(false); toast.success("Fornecedor atualizado!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("fornecedores").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["fornecedores"] }); setIsDeleteOpen(false); toast.success("Fornecedor excluído!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const filtered = fornecedores.filter((f) => {
    const s = search.toLowerCase();
    const match = f.razao_social.toLowerCase().includes(s) || f.nome_fantasia?.toLowerCase().includes(s) || f.cnpj?.includes(s) || f.cidade?.toLowerCase().includes(s);
    return match && (estadoFilter === "all" || f.estado === estadoFilter);
  });

  const stats = { total: fornecedores.length, comColetas: fornecedores.filter((f) => (f.total_coletas || 0) > 0).length, pendentes: fornecedores.reduce((a, f) => a + (f.coletas_pendentes || 0), 0) };

  const handleEdit = (f: Fornecedor) => { setSelected(f); setForm({ razao_social: f.razao_social, nome_fantasia: f.nome_fantasia || "", cnpj: f.cnpj || "", endereco_completo: f.endereco_completo, cidade: f.cidade || "", estado: f.estado || "", cep: f.cep || "", contato_nome: f.contato_nome || "", contato_email: f.contato_email || "", contato_telefone: f.contato_telefone || "" }); setIsEditOpen(true); };
  const formatDate = (d: string) => { try { return format(new Date(d), "dd/MM/yyyy", { locale: ptBR }); } catch { return d; } };
  const formatCNPJ = (c: string) => { const n = c.replace(/\D/g, ""); return n.length === 14 ? n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5") : c; };

  if (error) return <MainLayout><div className="flex flex-col items-center py-12"><AlertCircle className="w-12 h-12 text-destructive mb-4" /><p className="text-destructive">Erro: {error.message}</p></div></MainLayout>;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-display text-foreground flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-info/20 to-info/10"><Building2 className="w-6 h-6 text-info" /></div>
              Fornecedores
            </h1>
            <p className="text-muted-foreground mt-1">Gerencie seus fornecedores</p>
          </div>
          <Button onClick={() => { setForm(emptyForm); setIsCreateOpen(true); }} className="gap-2"><Plus className="w-4 h-4" />Novo Fornecedor</Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card text-center"><Building2 className="w-5 h-5 text-info mx-auto mb-2" /><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></div>
          <div className="stat-card text-center"><Package className="w-5 h-5 text-success mx-auto mb-2" /><p className="text-2xl font-bold">{stats.comColetas}</p><p className="text-xs text-muted-foreground">Com Coletas</p></div>
          <div className="stat-card text-center"><Clock className="w-5 h-5 text-warning mx-auto mb-2" /><p className="text-2xl font-bold">{stats.pendentes}</p><p className="text-xs text-muted-foreground">Pendentes</p></div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></div>
          <Select value={estadoFilter} onValueChange={setEstadoFilter}><SelectTrigger className="w-[150px]"><SelectValue placeholder="Estado" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem>{ESTADOS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent></Select>
        </div>

        {isLoading && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}

        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((f) => (
              <div key={f.id} className="card-interactive">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0"><p className="font-semibold truncate">{f.nome_fantasia || f.razao_social}</p>{f.nome_fantasia && <p className="text-xs text-muted-foreground truncate">{f.razao_social}</p>}</div>
                  <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setSelected(f); setIsViewOpen(true); }}><Eye className="w-4 h-4 mr-2" />Ver</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(f)}><Edit className="w-4 h-4 mr-2" />Editar</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => { setSelected(f); setIsDeleteOpen(true); }}><Trash2 className="w-4 h-4 mr-2" />Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-2 text-sm">
                  {f.cnpj && <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-muted-foreground" /><span className="font-mono">{formatCNPJ(f.cnpj)}</span></div>}
                  {f.contato_nome && <div className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" />{f.contato_nome}</div>}
                  {f.contato_telefone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4" />{f.contato_telefone}</div>}
                  {f.contato_email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4" /><span className="truncate">{f.contato_email}</span></div>}
                  <div className="flex items-start gap-2 text-muted-foreground"><MapPin className="w-4 h-4 mt-0.5" /><div><p className="line-clamp-2">{f.endereco_completo}</p>{f.cidade && <p className="text-foreground font-medium">{f.cidade} - {f.estado}</p>}</div></div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <div className="flex items-center gap-1"><Package className="w-4 h-4 text-muted-foreground" /><span className="text-sm font-medium">{f.total_coletas || 0}</span></div>
                  {(f.coletas_pendentes || 0) > 0 && <Badge variant="outline" className="bg-warning/10 text-warning">{f.coletas_pendentes} pendente(s)</Badge>}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && <div className="card-base flex flex-col items-center py-12"><Building2 className="w-12 h-12 text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">Nenhum fornecedor</p><Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>Cadastrar</Button></div>}

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Novo Fornecedor</DialogTitle><DialogDescription>Cadastre um fornecedor</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Razão Social *</Label><Input value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>Nome Fantasia</Label><Input value={form.nome_fantasia} onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })} /></div><div className="grid gap-2"><Label>CNPJ</Label><Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} /></div></div>
              <div className="grid gap-2"><Label>Endereço *</Label><Textarea value={form.endereco_completo} onChange={(e) => setForm({ ...form, endereco_completo: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-4"><div className="grid gap-2"><Label>Cidade</Label><Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} /></div><div className="grid gap-2"><Label>UF</Label><Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ESTADOS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label>CEP</Label><Input value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} /></div></div>
              <div className="border-t pt-4"><p className="text-sm font-medium mb-3">Contato</p><div className="grid gap-4"><div className="grid gap-2"><Label>Nome</Label><Input value={form.contato_nome} onChange={(e) => setForm({ ...form, contato_nome: e.target.value })} /></div><div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>Email</Label><Input type="email" value={form.contato_email} onChange={(e) => setForm({ ...form, contato_email: e.target.value })} /></div><div className="grid gap-2"><Label>Telefone</Label><Input value={form.contato_telefone} onChange={(e) => setForm({ ...form, contato_telefone: e.target.value })} /></div></div></div></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button><Button onClick={() => createMut.mutate(form)} disabled={!form.razao_social || !form.endereco_completo || createMut.isPending}>{createMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Cadastrar</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Editar Fornecedor</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Razão Social *</Label><Input value={form.razao_social} onChange={(e) => setForm({ ...form, razao_social: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>Nome Fantasia</Label><Input value={form.nome_fantasia} onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })} /></div><div className="grid gap-2"><Label>CNPJ</Label><Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} /></div></div>
              <div className="grid gap-2"><Label>Endereço *</Label><Textarea value={form.endereco_completo} onChange={(e) => setForm({ ...form, endereco_completo: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-4"><div className="grid gap-2"><Label>Cidade</Label><Input value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} /></div><div className="grid gap-2"><Label>UF</Label><Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ESTADOS.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label>CEP</Label><Input value={form.cep} onChange={(e) => setForm({ ...form, cep: e.target.value })} /></div></div>
              <div className="border-t pt-4"><p className="text-sm font-medium mb-3">Contato</p><div className="grid gap-4"><div className="grid gap-2"><Label>Nome</Label><Input value={form.contato_nome} onChange={(e) => setForm({ ...form, contato_nome: e.target.value })} /></div><div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>Email</Label><Input type="email" value={form.contato_email} onChange={(e) => setForm({ ...form, contato_email: e.target.value })} /></div><div className="grid gap-2"><Label>Telefone</Label><Input value={form.contato_telefone} onChange={(e) => setForm({ ...form, contato_telefone: e.target.value })} /></div></div></div></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button><Button onClick={() => selected && updateMut.mutate({ id: selected.id, d: form })} disabled={!form.razao_social || !form.endereco_completo || updateMut.isPending}>{updateMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{selected?.nome_fantasia || selected?.razao_social}</DialogTitle></DialogHeader>
            {selected && <div className="space-y-4 py-4">
              {selected.cnpj && <div><p className="text-sm text-muted-foreground">CNPJ</p><p className="font-mono">{formatCNPJ(selected.cnpj)}</p></div>}
              <div><p className="text-sm text-muted-foreground">Endereço</p><p>{selected.endereco_completo}</p>{selected.cidade && <p>{selected.cidade} - {selected.estado}</p>}</div>
              <div className="grid grid-cols-2 gap-4"><div><p className="text-sm text-muted-foreground">Contato</p><p>{selected.contato_nome || "-"}</p></div><div><p className="text-sm text-muted-foreground">Telefone</p><p>{selected.contato_telefone || "-"}</p></div></div>
              <div><p className="text-sm text-muted-foreground">Email</p><p>{selected.contato_email || "-"}</p></div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t"><div className="text-center p-3 bg-muted/50 rounded"><p className="text-2xl font-bold">{selected.total_coletas || 0}</p><p className="text-xs text-muted-foreground">Coletas</p></div><div className="text-center p-3 bg-warning/10 rounded"><p className="text-2xl font-bold text-warning">{selected.coletas_pendentes || 0}</p><p className="text-xs text-muted-foreground">Pendentes</p></div></div>
              <p className="text-xs text-muted-foreground">Cadastrado em {formatDate(selected.created_at)}</p>
            </div>}
            <DialogFooter><Button variant="outline" onClick={() => setIsViewOpen(false)}>Fechar</Button><Button onClick={() => { setIsViewOpen(false); selected && handleEdit(selected); }}>Editar</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Excluir Fornecedor</AlertDialogTitle><AlertDialogDescription>Excluir "{selected?.nome_fantasia || selected?.razao_social}"?{(selected?.total_coletas || 0) > 0 && <span className="block mt-2 text-warning">⚠️ Possui {selected?.total_coletas} coleta(s)</span>}</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => selected && deleteMut.mutate(selected.id)}>{deleteMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Excluir</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
