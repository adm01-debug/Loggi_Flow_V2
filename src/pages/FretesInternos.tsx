import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Truck, Plus, Search, Clock, Package, MoreVertical, Eye, Edit, Trash2, CheckCircle2, AlertTriangle, XCircle, Loader2, AlertCircle, Star } from "lucide-react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type FreteStatus = "pendente" | "em_transito" | "entregue" | "atrasado" | "cancelado";

interface FreteInterno {
  id: string;
  origem: string;
  destino: string;
  motorista: string | null;
  quantidade_itens: number;
  status: FreteStatus;
  previsao_entrega: string | null;
  data_entrega_efetiva: string | null;
  xp_reward: number;
  observacoes: string | null;
  created_at: string;
}

const statusConfig: Record<FreteStatus, { label: string; color: string; icon: React.ElementType }> = {
  pendente: { label: "Pendente", color: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  em_transito: { label: "Em Trânsito", color: "bg-info/10 text-info border-info/20", icon: Truck },
  entregue: { label: "Entregue", color: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  atrasado: { label: "Atrasado", color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertTriangle },
  cancelado: { label: "Cancelado", color: "bg-muted text-muted-foreground border-muted", icon: XCircle },
};

const emptyForm = { origem: "", destino: "", motorista: "", quantidade_itens: 1, previsao_entrega: "", xp_reward: 50, observacoes: "" };

export default function FretesInternos() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<FreteInterno | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: fretes = [], isLoading, error } = useQuery({
    queryKey: ["fretes-internos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fretes_internos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as FreteInterno[];
    },
  });

  const createMut = useMutation({
    mutationFn: async (d: typeof form) => {
      const { error } = await supabase.from("fretes_internos").insert({
        origem: d.origem,
        destino: d.destino,
        motorista: d.motorista || null,
        quantidade_itens: d.quantidade_itens,
        previsao_entrega: d.previsao_entrega || null,
        xp_reward: d.xp_reward,
        observacoes: d.observacoes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fretes-internos"] });
      setIsCreateOpen(false);
      setForm(emptyForm);
      toast.success("Frete criado!");
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, d, status }: { id: string; d: typeof form; status?: FreteStatus }) => {
      const updateData: Record<string, unknown> = {
        origem: d.origem,
        destino: d.destino,
        motorista: d.motorista || null,
        quantidade_itens: d.quantidade_itens,
        previsao_entrega: d.previsao_entrega || null,
        xp_reward: d.xp_reward,
        observacoes: d.observacoes || null,
      };
      if (status) {
        updateData.status = status;
        if (status === "entregue") updateData.data_entrega_efetiva = new Date().toISOString();
      }
      const { error } = await supabase.from("fretes_internos").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fretes-internos"] });
      setIsEditOpen(false);
      toast.success("Frete atualizado!");
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const updateStatusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: FreteStatus }) => {
      const updateData: Record<string, unknown> = { status };
      if (status === "entregue") updateData.data_entrega_efetiva = new Date().toISOString();
      const { error } = await supabase.from("fretes_internos").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fretes-internos"] });
      toast.success("Status atualizado!");
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fretes_internos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fretes-internos"] });
      setIsDeleteOpen(false);
      toast.success("Frete excluído!");
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const filtered = fretes.filter((f) => {
    const s = search.toLowerCase();
    const match = f.origem.toLowerCase().includes(s) || f.destino.toLowerCase().includes(s) || f.motorista?.toLowerCase().includes(s);
    return match && (statusFilter === "all" || f.status === statusFilter);
  });

  const stats = {
    total: fretes.length,
    pendentes: fretes.filter((f) => f.status === "pendente").length,
    emTransito: fretes.filter((f) => f.status === "em_transito").length,
    entregues: fretes.filter((f) => f.status === "entregue").length,
    xpTotal: fretes.filter((f) => f.status === "entregue").reduce((a, f) => a + f.xp_reward, 0),
  };

  const handleEdit = (f: FreteInterno) => {
    setSelected(f);
    setForm({
      origem: f.origem,
      destino: f.destino,
      motorista: f.motorista || "",
      quantidade_itens: f.quantidade_itens,
      previsao_entrega: f.previsao_entrega?.split("T")[0] || "",
      xp_reward: f.xp_reward,
      observacoes: f.observacoes || "",
    });
    setIsEditOpen(true);
  };

  const formatDate = (d: string | null) => {
    if (!d) return "-";
    try {
      return format(new Date(d), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return d;
    }
  };

  if (error) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center py-12">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <p className="text-destructive">Erro: {(error as Error).message}</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-display text-foreground flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              Fretes Internos
            </h1>
            <p className="text-muted-foreground mt-1">Gerencie transferências internas</p>
          </div>
          <Button onClick={() => { setForm(emptyForm); setIsCreateOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Frete
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="stat-card text-center">
            <Package className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="stat-card text-center">
            <Clock className="w-5 h-5 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.pendentes}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </div>
          <div className="stat-card text-center">
            <Truck className="w-5 h-5 text-info mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.emTransito}</p>
            <p className="text-xs text-muted-foreground">Em Trânsito</p>
          </div>
          <div className="stat-card text-center">
            <CheckCircle2 className="w-5 h-5 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.entregues}</p>
            <p className="text-xs text-muted-foreground">Entregues</p>
          </div>
          <div className="stat-card text-center">
            <Star className="w-5 h-5 text-amber-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.xpTotal}</p>
            <p className="text-xs text-muted-foreground">XP Ganho</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar origem, destino ou motorista..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.entries(statusConfig).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="card-base overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Origem</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Previsão</TableHead>
                  <TableHead>XP</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((f) => {
                  const StatusIcon = statusConfig[f.status].icon;
                  return (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.origem}</TableCell>
                      <TableCell>{f.destino}</TableCell>
                      <TableCell>{f.motorista || "-"}</TableCell>
                      <TableCell>{f.quantidade_itens}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("flex items-center gap-1 w-fit", statusConfig[f.status].color)}>
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig[f.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {f.previsao_entrega ? format(new Date(f.previsao_entrega), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600">+{f.xp_reward} XP</Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setSelected(f); setIsViewOpen(true); }}>
                              <Eye className="w-4 h-4 mr-2" />Ver
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(f)}>
                              <Edit className="w-4 h-4 mr-2" />Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => updateStatusMut.mutate({ id: f.id, status: "em_transito" })}
                              disabled={f.status === "em_transito"}
                            >
                              <Truck className="w-4 h-4 mr-2" />Em Trânsito
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => updateStatusMut.mutate({ id: f.id, status: "entregue" })}
                              disabled={f.status === "entregue"}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />Entregue
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => { setSelected(f); setIsDeleteOpen(true); }}>
                              <Trash2 className="w-4 h-4 mr-2" />Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="card-base flex flex-col items-center py-12">
            <Truck className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nenhum frete interno</p>
            <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
              Criar primeiro
            </Button>
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Frete Interno</DialogTitle>
              <DialogDescription>Registre uma transferência interna</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Origem *</Label>
                  <Input value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })} placeholder="Local de origem" />
                </div>
                <div className="grid gap-2">
                  <Label>Destino *</Label>
                  <Input value={form.destino} onChange={(e) => setForm({ ...form, destino: e.target.value })} placeholder="Local de destino" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Motorista</Label>
                  <Input value={form.motorista} onChange={(e) => setForm({ ...form, motorista: e.target.value })} placeholder="Nome do motorista" />
                </div>
                <div className="grid gap-2">
                  <Label>Qtd Itens</Label>
                  <Input type="number" min="1" value={form.quantidade_itens} onChange={(e) => setForm({ ...form, quantidade_itens: parseInt(e.target.value) || 1 })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Previsão Entrega</Label>
                  <Input type="date" value={form.previsao_entrega} onChange={(e) => setForm({ ...form, previsao_entrega: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>XP Recompensa</Label>
                  <Input type="number" min="0" value={form.xp_reward} onChange={(e) => setForm({ ...form, xp_reward: parseInt(e.target.value) || 50 })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Observações</Label>
                <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Observações adicionais" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button onClick={() => createMut.mutate(form)} disabled={!form.origem || !form.destino || createMut.isPending}>
                {createMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Frete</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Origem *</Label>
                  <Input value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Destino *</Label>
                  <Input value={form.destino} onChange={(e) => setForm({ ...form, destino: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Motorista</Label>
                  <Input value={form.motorista} onChange={(e) => setForm({ ...form, motorista: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>Qtd Itens</Label>
                  <Input type="number" min="1" value={form.quantidade_itens} onChange={(e) => setForm({ ...form, quantidade_itens: parseInt(e.target.value) || 1 })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Previsão</Label>
                  <Input type="date" value={form.previsao_entrega} onChange={(e) => setForm({ ...form, previsao_entrega: e.target.value })} />
                </div>
                <div className="grid gap-2">
                  <Label>XP</Label>
                  <Input type="number" min="0" value={form.xp_reward} onChange={(e) => setForm({ ...form, xp_reward: parseInt(e.target.value) || 50 })} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Observações</Label>
                <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
              <Button onClick={() => selected && updateMut.mutate({ id: selected.id, d: form })} disabled={!form.origem || !form.destino || updateMut.isPending}>
                {updateMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do Frete</DialogTitle>
            </DialogHeader>
            {selected && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Origem</p>
                    <p className="font-medium">{selected.origem}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Destino</p>
                    <p className="font-medium">{selected.destino}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Motorista</p>
                    <p className="font-medium">{selected.motorista || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quantidade</p>
                    <p className="font-medium">{selected.quantidade_itens} itens</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant="outline" className={cn("mt-1", statusConfig[selected.status].color)}>
                      {statusConfig[selected.status].label}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">XP Recompensa</p>
                    <Badge variant="outline" className="mt-1 bg-amber-500/10 text-amber-600">+{selected.xp_reward} XP</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Previsão</p>
                    <p className="font-medium">{formatDate(selected.previsao_entrega)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Entrega Efetiva</p>
                    <p className="font-medium">{formatDate(selected.data_entrega_efetiva)}</p>
                  </div>
                </div>
                {selected.observacoes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Observações</p>
                    <p className="font-medium">{selected.observacoes}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Criado em</p>
                  <p className="font-medium">{formatDate(selected.created_at)}</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewOpen(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Frete</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este frete interno? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selected && deleteMut.mutate(selected.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMut.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
