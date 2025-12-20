import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Plus, Search, MoreVertical, Eye, Edit, CheckCircle2, Clock, Loader2, AlertCircle, FileText, Package, Send, Calendar, MessageSquare } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

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

const emptyForm = { tipo_ocorrencia: "", descricao: "", acao_tomada: "", coleta_id: "", entrega_id: "" };

export default function Ocorrencias() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tipoFilter, setTipoFilter] = useState("all");
  const [dlgCreate, setDlgCreate] = useState(false);
  const [dlgEdit, setDlgEdit] = useState(false);
  const [dlgView, setDlgView] = useState(false);
  const [sel, setSel] = useState<Ocorrencia | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: list = [], isLoading, error } = useQuery({
    queryKey: ["ocorrencias"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ocorrencias").select("*, coleta:coletas(numero_coleta), entrega:entregas(numero_entrega)").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Ocorrencia[];
    },
  });

  const { data: coletas = [] } = useQuery({
    queryKey: ["coletas-select"],
    queryFn: async () => {
      const { data } = await supabase.from("coletas").select("id, numero_coleta").order("created_at", { ascending: false }).limit(50);
      return data || [];
    },
  });

  const { data: entregas = [] } = useQuery({
    queryKey: ["entregas-select"],
    queryFn: async () => {
      const { data } = await supabase.from("entregas").select("id, numero_entrega").order("created_at", { ascending: false }).limit(50);
      return data || [];
    },
  });

  const createMut = useMutation({
    mutationFn: async (d: typeof emptyForm) => {
      const { error } = await supabase.from("ocorrencias").insert({ tipo_ocorrencia: d.tipo_ocorrencia, descricao: d.descricao || null, acao_tomada: d.acao_tomada || null, coleta_id: d.coleta_id || null, entrega_id: d.entrega_id || null, resolvida: false });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ocorrencias"] }); setDlgCreate(false); setForm(emptyForm); toast.success("Ocorrência registrada!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, d, resolver }: { id: string; d: typeof emptyForm; resolver?: boolean }) => {
      const updateData: Record<string, unknown> = { tipo_ocorrencia: d.tipo_ocorrencia, descricao: d.descricao || null, acao_tomada: d.acao_tomada || null };
      if (resolver) { updateData.resolvida = true; updateData.data_resolucao = new Date().toISOString(); }
      const { error } = await supabase.from("ocorrencias").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ocorrencias"] }); setDlgEdit(false); toast.success("Atualizado!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const resolverMut = useMutation({
    mutationFn: async ({ id, acao }: { id: string; acao: string }) => {
      const { error } = await supabase.from("ocorrencias").update({ resolvida: true, data_resolucao: new Date().toISOString(), acao_tomada: acao }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["ocorrencias"] }); setDlgView(false); toast.success("Ocorrência resolvida!"); },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const filtered = list.filter((o) => {
    const s = search.toLowerCase();
    const match = o.tipo_ocorrencia.toLowerCase().includes(s) || o.descricao?.toLowerCase().includes(s) || o.coleta?.numero_coleta?.includes(s) || o.entrega?.numero_entrega?.includes(s);
    const statusOk = statusFilter === "all" || (statusFilter === "pendente" && !o.resolvida) || (statusFilter === "resolvida" && o.resolvida);
    const tipoOk = tipoFilter === "all" || o.tipo_ocorrencia === tipoFilter;
    return match && statusOk && tipoOk;
  });

  const stats = { total: list.length, pendentes: list.filter((o) => !o.resolvida).length, resolvidas: list.filter((o) => o.resolvida).length };

  const openEdit = (o: Ocorrencia) => { setSel(o); setForm({ tipo_ocorrencia: o.tipo_ocorrencia, descricao: o.descricao || "", acao_tomada: o.acao_tomada || "", coleta_id: o.coleta_id || "", entrega_id: o.entrega_id || "" }); setDlgEdit(true); };
  const fmtDate = (d: string | null) => d ? format(new Date(d), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-";
  const getTipoLabel = (t: string) => TIPOS.find((x) => x.value === t)?.label || t;
  const getTipoIcon = (t: string) => TIPOS.find((x) => x.value === t)?.icon || AlertTriangle;

  if (error) return <MainLayout><div className="flex flex-col items-center py-12"><AlertCircle className="w-12 h-12 text-destructive mb-4" /><p className="text-destructive">Erro: {error.message}</p></div></MainLayout>;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><h1 className="text-display text-foreground flex items-center gap-3"><div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-destructive/20 to-destructive/10"><AlertTriangle className="w-6 h-6 text-destructive" /></div>Ocorrências</h1><p className="text-muted-foreground mt-1">Gerencie ocorrências de coletas e entregas</p></div>
          <Button onClick={() => { setForm(emptyForm); setDlgCreate(true); }} className="gap-2"><Plus className="w-4 h-4" />Nova Ocorrência</Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card text-center"><AlertTriangle className="w-5 h-5 text-destructive mx-auto mb-2" /><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Total</p></div>
          <div className="stat-card text-center"><Clock className="w-5 h-5 text-warning mx-auto mb-2" /><p className="text-2xl font-bold">{stats.pendentes}</p><p className="text-xs text-muted-foreground">Pendentes</p></div>
          <div className="stat-card text-center"><CheckCircle2 className="w-5 h-5 text-success mx-auto mb-2" /><p className="text-2xl font-bold">{stats.resolvidas}</p><p className="text-xs text-muted-foreground">Resolvidas</p></div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" /></div>
          <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos</SelectItem><SelectItem value="pendente">Pendentes</SelectItem><SelectItem value="resolvida">Resolvidas</SelectItem></SelectContent></Select>
          <Select value={tipoFilter} onValueChange={setTipoFilter}><SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Tipo" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os tipos</SelectItem>{TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select>
        </div>

        {isLoading && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}

        {!isLoading && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((o, i) => {
            const TipoIcon = getTipoIcon(o.tipo_ocorrencia);
            return (
              <div key={o.id} className={cn("card-interactive animate-fade-in", o.resolvida && "opacity-60")} style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", o.resolvida ? "bg-success/10" : "bg-destructive/10")}>
                      {o.resolvida ? <CheckCircle2 className="w-5 h-5 text-success" /> : <TipoIcon className="w-5 h-5 text-destructive" />}
                    </div>
                    <div><p className="font-semibold">{getTipoLabel(o.tipo_ocorrencia)}</p><p className="text-xs text-muted-foreground">{fmtDate(o.created_at)}</p></div>
                  </div>
                  <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => { setSel(o); setDlgView(true); }}><Eye className="w-4 h-4 mr-2" />Ver</DropdownMenuItem><DropdownMenuItem onClick={() => openEdit(o)}><Edit className="w-4 h-4 mr-2" />Editar</DropdownMenuItem>{!o.resolvida && <><DropdownMenuSeparator /><DropdownMenuItem onClick={() => { setSel(o); setDlgView(true); }} className="text-success"><CheckCircle2 className="w-4 h-4 mr-2" />Resolver</DropdownMenuItem></>}</DropdownMenuContent></DropdownMenu>
                </div>
                <div className="space-y-2 text-sm">
                  {o.descricao && <p className="text-muted-foreground line-clamp-2">{o.descricao}</p>}
                  <div className="flex items-center gap-4">
                    {o.coleta && <div className="flex items-center gap-1 text-info"><Package className="w-4 h-4" /><span>{o.coleta.numero_coleta}</span></div>}
                    {o.entrega && <div className="flex items-center gap-1 text-success"><Send className="w-4 h-4" /><span>{o.entrega.numero_entrega}</span></div>}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <Badge variant="outline" className={o.resolvida ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}>{o.resolvida ? "Resolvida" : "Pendente"}</Badge>
                  {o.resolvida && o.data_resolucao && <span className="text-xs text-muted-foreground">Resolvida em {format(new Date(o.data_resolucao), "dd/MM", { locale: ptBR })}</span>}
                </div>
              </div>
            );
          })}
        </div>}

        {!isLoading && filtered.length === 0 && <div className="card-base flex flex-col items-center py-12"><AlertTriangle className="w-12 h-12 text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">Nenhuma ocorrência</p><Button variant="outline" className="mt-4" onClick={() => setDlgCreate(true)}>Registrar</Button></div>}

        <Dialog open={dlgCreate} onOpenChange={setDlgCreate}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Nova Ocorrência</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Tipo *</Label><Select value={form.tipo_ocorrencia} onValueChange={(v) => setForm({ ...form, tipo_ocorrencia: v })}><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger><SelectContent>{TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4"><div className="grid gap-2"><Label>Coleta (opcional)</Label><Select value={form.coleta_id} onValueChange={(v) => setForm({ ...form, coleta_id: v, entrega_id: "" })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{coletas.map((c) => <SelectItem key={c.id} value={c.id}>{c.numero_coleta}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label>Entrega (opcional)</Label><Select value={form.entrega_id} onValueChange={(v) => setForm({ ...form, entrega_id: v, coleta_id: "" })}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{entregas.map((e) => <SelectItem key={e.id} value={e.id}>{e.numero_entrega}</SelectItem>)}</SelectContent></Select></div></div>
            <div className="grid gap-2"><Label>Descrição</Label><Textarea placeholder="Descreva a ocorrência..." value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Ação Tomada</Label><Textarea placeholder="Descreva a ação tomada (se houver)..." value={form.acao_tomada} onChange={(e) => setForm({ ...form, acao_tomada: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDlgCreate(false)}>Cancelar</Button><Button onClick={() => createMut.mutate(form)} disabled={!form.tipo_ocorrencia || createMut.isPending}>{createMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Registrar</Button></DialogFooter>
        </DialogContent></Dialog>

        <Dialog open={dlgEdit} onOpenChange={setDlgEdit}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Editar Ocorrência</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2"><Label>Tipo *</Label><Select value={form.tipo_ocorrencia} onValueChange={(v) => setForm({ ...form, tipo_ocorrencia: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid gap-2"><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
            <div className="grid gap-2"><Label>Ação Tomada</Label><Textarea value={form.acao_tomada} onChange={(e) => setForm({ ...form, acao_tomada: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDlgEdit(false)}>Cancelar</Button>
            {sel && !sel.resolvida && <Button variant="secondary" onClick={() => sel && updateMut.mutate({ id: sel.id, d: form, resolver: true })} disabled={updateMut.isPending}>Salvar e Resolver</Button>}
            <Button onClick={() => sel && updateMut.mutate({ id: sel.id, d: form })} disabled={!form.tipo_ocorrencia || updateMut.isPending}>{updateMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar</Button>
          </DialogFooter>
        </DialogContent></Dialog>

        <Dialog open={dlgView} onOpenChange={setDlgView}><DialogContent><DialogHeader><DialogTitle className="flex items-center gap-2">{sel && <Badge variant="outline" className={sel.resolvida ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}>{sel.resolvida ? "Resolvida" : "Pendente"}</Badge>}{sel && getTipoLabel(sel.tipo_ocorrencia)}</DialogTitle></DialogHeader>
          {sel && <div className="space-y-4 py-4">
            <div><p className="text-sm text-muted-foreground">Data</p><p>{fmtDate(sel.created_at)}</p></div>
            {sel.descricao && <div><p className="text-sm text-muted-foreground">Descrição</p><p>{sel.descricao}</p></div>}
            <div className="flex gap-4">{sel.coleta && <div><p className="text-sm text-muted-foreground">Coleta</p><p className="flex items-center gap-1"><Package className="w-4 h-4 text-info" />{sel.coleta.numero_coleta}</p></div>}{sel.entrega && <div><p className="text-sm text-muted-foreground">Entrega</p><p className="flex items-center gap-1"><Send className="w-4 h-4 text-success" />{sel.entrega.numero_entrega}</p></div>}</div>
            {sel.acao_tomada && <div className="border-t pt-4"><p className="text-sm text-muted-foreground">Ação Tomada</p><p>{sel.acao_tomada}</p></div>}
            {sel.resolvida && sel.data_resolucao && <div><p className="text-sm text-muted-foreground">Resolvida em</p><p>{fmtDate(sel.data_resolucao)}</p></div>}
            {!sel.resolvida && <div className="border-t pt-4"><Label>Resolver Ocorrência</Label><Textarea className="mt-2" placeholder="Descreva a ação tomada para resolver..." value={form.acao_tomada} onChange={(e) => setForm({ ...form, acao_tomada: e.target.value })} /><Button className="mt-2 w-full" onClick={() => resolverMut.mutate({ id: sel.id, acao: form.acao_tomada })} disabled={resolverMut.isPending}>{resolverMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}<CheckCircle2 className="w-4 h-4 mr-2" />Marcar como Resolvida</Button></div>}
          </div>}
          <DialogFooter><Button variant="outline" onClick={() => setDlgView(false)}>Fechar</Button></DialogFooter>
        </DialogContent></Dialog>
      </div>
    </MainLayout>
  );
}
