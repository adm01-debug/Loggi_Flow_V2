import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Send,
  Plus,
  Search,
  MapPin,
  Clock,
  Package,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  User,
  Phone,
  CheckCircle2,
  Truck,
  AlertCircle,
  AlertTriangle,
  FileText,
  DollarSign,
  Calendar,
  Loader2,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type EntregaStatus = 
  | "aguardando_producao"
  | "pronto_despacho"
  | "cotacao_frete"
  | "nf_emitida"
  | "despachado"
  | "em_transito"
  | "saiu_entrega"
  | "entregue"
  | "ocorrencia"
  | "finalizado";

type FreteType = "cif" | "fob" | "cortesia";

interface Entrega {
  id: string;
  numero_entrega: string;
  endereco_entrega: string;
  contato_cliente: string | null;
  status: EntregaStatus;
  codigo_rastreamento: string | null;
  previsao_entrega: string | null;
  data_entrega_efetiva: string | null;
  tipo_frete: FreteType | null;
  valor_frete: number | null;
  nf_remessa: string | null;
  observacoes: string | null;
  created_at: string;
  cliente: {
    id: string;
    razao_social: string;
    nome_fantasia: string | null;
    cidade: string | null;
    estado: string | null;
    contato_telefone: string | null;
  } | null;
  transportadora: {
    id: string;
    nome_fantasia: string;
  } | null;
}

const statusConfig: Record<EntregaStatus, { label: string; color: string; icon: React.ElementType }> = {
  aguardando_producao: {
    label: "Aguardando Produção",
    color: "bg-muted/50 text-muted-foreground border-muted",
    icon: Clock,
  },
  pronto_despacho: {
    label: "Pronto p/ Despacho",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: Package,
  },
  cotacao_frete: {
    label: "Cotação de Frete",
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    icon: DollarSign,
  },
  nf_emitida: {
    label: "NF Emitida",
    color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
    icon: FileText,
  },
  despachado: {
    label: "Despachado",
    color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    icon: Send,
  },
  em_transito: {
    label: "Em Trânsito",
    color: "bg-primary/10 text-primary border-primary/20",
    icon: Truck,
  },
  saiu_entrega: {
    label: "Saiu p/ Entrega",
    color: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    icon: Truck,
  },
  entregue: {
    label: "Entregue",
    color: "bg-success/10 text-success border-success/20",
    icon: CheckCircle2,
  },
  ocorrencia: {
    label: "Ocorrência",
    color: "bg-destructive/10 text-destructive border-destructive/20",
    icon: AlertTriangle,
  },
  finalizado: {
    label: "Finalizado",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    icon: CheckCircle2,
  },
};

const emptyFormData = {
  cliente_id: "",
  endereco_entrega: "",
  contato_cliente: "",
  previsao_entrega: "",
  tipo_frete: "" as FreteType | "",
  transportadora_id: "",
  observacoes: "",
};

export default function Envios() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEntrega, setSelectedEntrega] = useState<Entrega | null>(null);
  const [formData, setFormData] = useState(emptyFormData);

  // Fetch entregas from Supabase
  const { data: entregas = [], isLoading, error } = useQuery({
    queryKey: ["entregas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entregas")
        .select(`
          *,
          cliente:clientes(id, razao_social, nome_fantasia, cidade, estado, contato_telefone),
          transportadora:transportadoras(id, nome_fantasia)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Entrega[];
    },
  });

  // Fetch clientes for dropdown
  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes-dropdown"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, razao_social, nome_fantasia, cidade, estado, endereco_completo, contato_telefone")
        .order("razao_social");
      if (error) throw error;
      return data;
    },
  });

  // Fetch transportadoras for dropdown
  const { data: transportadoras = [] } = useQuery({
    queryKey: ["transportadoras-dropdown"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transportadoras")
        .select("id, nome_fantasia")
        .eq("homologada", true)
        .order("nome_fantasia");
      if (error) throw error;
      return data;
    },
  });

  // Generate next numero_entrega
  const generateNumeroEntrega = async () => {
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from("entregas")
      .select("*", { count: "exact", head: true })
      .like("numero_entrega", `ENV-${year}-%`);
    
    const nextNum = (count || 0) + 1;
    return `ENV-${year}-${String(nextNum).padStart(4, "0")}`;
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const numero_entrega = await generateNumeroEntrega();
      const { error } = await supabase.from("entregas").insert({
        numero_entrega,
        cliente_id: data.cliente_id || null,
        endereco_entrega: data.endereco_entrega,
        contato_cliente: data.contato_cliente || null,
        previsao_entrega: data.previsao_entrega || null,
        tipo_frete: data.tipo_frete || null,
        transportadora_id: data.transportadora_id || null,
        observacoes: data.observacoes || null,
        status: "aguardando_producao",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entregas"] });
      setIsCreateOpen(false);
      setFormData(emptyFormData);
      toast.success("Envio criado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao criar envio: " + error.message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData & { status: EntregaStatus }> }) => {
      // Build clean update object
      const updateData: Record<string, unknown> = {};
      if (data.cliente_id) updateData.cliente_id = data.cliente_id;
      if (data.endereco_entrega) updateData.endereco_entrega = data.endereco_entrega;
      if (data.contato_cliente) updateData.contato_cliente = data.contato_cliente;
      if (data.previsao_entrega) updateData.previsao_entrega = data.previsao_entrega;
      if (data.tipo_frete) updateData.tipo_frete = data.tipo_frete;
      if (data.transportadora_id) updateData.transportadora_id = data.transportadora_id;
      if (data.observacoes !== undefined) updateData.observacoes = data.observacoes;
      if (data.status) updateData.status = data.status;
      
      const { error } = await supabase.from("entregas").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entregas"] });
      setIsEditOpen(false);
      setSelectedEntrega(null);
      toast.success("Envio atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar envio: " + error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("entregas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entregas"] });
      setIsDeleteOpen(false);
      setSelectedEntrega(null);
      toast.success("Envio excluído com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir envio: " + error.message);
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: EntregaStatus }) => {
      const updateData: Record<string, unknown> = { status };
      if (status === "entregue") {
        updateData.data_entrega_efetiva = new Date().toISOString();
      }
      const { error } = await supabase.from("entregas").update(updateData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entregas"] });
      toast.success("Status atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });

  // Filter entregas
  const filteredEntregas = entregas.filter((entrega) => {
    const matchesSearch =
      entrega.numero_entrega.toLowerCase().includes(search.toLowerCase()) ||
      entrega.cliente?.razao_social?.toLowerCase().includes(search.toLowerCase()) ||
      entrega.cliente?.nome_fantasia?.toLowerCase().includes(search.toLowerCase()) ||
      entrega.endereco_entrega.toLowerCase().includes(search.toLowerCase()) ||
      entrega.codigo_rastreamento?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || entrega.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: entregas.length,
    aguardando: entregas.filter((e) => e.status === "aguardando_producao").length,
    emTransito: entregas.filter((e) => ["em_transito", "saiu_entrega"].includes(e.status)).length,
    entregues: entregas.filter((e) => ["entregue", "finalizado"].includes(e.status)).length,
    ocorrencias: entregas.filter((e) => e.status === "ocorrencia").length,
  };

  const handleEdit = (entrega: Entrega) => {
    setSelectedEntrega(entrega);
    setFormData({
      cliente_id: entrega.cliente?.id || "",
      endereco_entrega: entrega.endereco_entrega,
      contato_cliente: entrega.contato_cliente || "",
      previsao_entrega: entrega.previsao_entrega?.split("T")[0] || "",
      tipo_frete: entrega.tipo_frete || "",
      transportadora_id: entrega.transportadora?.id || "",
      observacoes: entrega.observacoes || "",
    });
    setIsEditOpen(true);
  };

  const handleView = (entrega: Entrega) => {
    setSelectedEntrega(entrega);
    setIsViewOpen(true);
  };

  const handleDelete = (entrega: Entrega) => {
    setSelectedEntrega(entrega);
    setIsDeleteOpen(true);
  };

  const handleClienteChange = (clienteId: string) => {
    setFormData({ ...formData, cliente_id: clienteId });
    const cliente = clientes.find((c) => c.id === clienteId);
    if (cliente && !formData.endereco_entrega) {
      setFormData((prev) => ({
        ...prev,
        cliente_id: clienteId,
        endereco_entrega: cliente.endereco_completo || "",
        contato_cliente: cliente.contato_telefone || "",
      }));
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  if (error) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <p className="text-destructive">Erro ao carregar envios: {error.message}</p>
          <Button variant="outline" className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ["entregas"] })}>
            Tentar novamente
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-display text-foreground flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                <Send className="w-6 h-6 text-primary" />
              </div>
              Envios
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as entregas para clientes
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Envio
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="stat-card text-center">
            <Package className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="stat-card text-center">
            <Clock className="w-5 h-5 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.aguardando}</p>
            <p className="text-xs text-muted-foreground">Aguardando</p>
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
            <AlertTriangle className="w-5 h-5 text-destructive mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.ocorrencias}</p>
            <p className="text-xs text-muted-foreground">Ocorrências</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, cliente, endereço ou rastreamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {Object.entries(statusConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Envios Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEntregas.map((entrega, index) => {
              const StatusIcon = statusConfig[entrega.status].icon;

              return (
                <div
                  key={entrega.id}
                  className="card-interactive animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-semibold text-lg">{entrega.numero_entrega}</p>
                      {entrega.codigo_rastreamento && (
                        <p className="text-xs text-muted-foreground font-mono">
                          {entrega.codigo_rastreamento}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn("border flex items-center gap-1", statusConfig[entrega.status].color)}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig[entrega.status].label}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(entrega)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(entrega)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => updateStatusMutation.mutate({ id: entrega.id, status: "em_transito" })}
                            disabled={entrega.status === "em_transito"}
                          >
                            <Truck className="w-4 h-4 mr-2" />
                            Marcar Em Trânsito
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateStatusMutation.mutate({ id: entrega.id, status: "entregue" })}
                            disabled={entrega.status === "entregue"}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Marcar Entregue
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(entrega)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium truncate">
                        {entrega.cliente?.nome_fantasia || entrega.cliente?.razao_social || "Cliente não informado"}
                      </span>
                    </div>
                    {entrega.contato_cliente && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{entrega.contato_cliente}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mt-0.5" />
                      <div>
                        <p className="line-clamp-2">{entrega.endereco_entrega}</p>
                        {entrega.cliente?.cidade && (
                          <p className="font-medium text-foreground">
                            {entrega.cliente.cidade} - {entrega.cliente.estado}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Criado: {formatDate(entrega.created_at)}</span>
                    </div>
                    {entrega.previsao_entrega && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>Prev: {formatDate(entrega.previsao_entrega)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && filteredEntregas.length === 0 && (
          <div className="card-base flex flex-col items-center justify-center py-12 text-center">
            <Send className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nenhum envio encontrado</p>
            <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
              Criar primeiro envio
            </Button>
          </div>
        )}

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo Envio</DialogTitle>
              <DialogDescription>
                Cadastre uma nova entrega para cliente
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="cliente">Cliente</Label>
                <Select value={formData.cliente_id} onValueChange={handleClienteChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome_fantasia || cliente.razao_social}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endereco">Endereço de Entrega *</Label>
                <Textarea
                  id="endereco"
                  placeholder="Endereço completo para entrega"
                  value={formData.endereco_entrega}
                  onChange={(e) => setFormData({ ...formData, endereco_entrega: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="contato">Contato</Label>
                  <Input
                    id="contato"
                    placeholder="(00) 00000-0000"
                    value={formData.contato_cliente}
                    onChange={(e) => setFormData({ ...formData, contato_cliente: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="previsao">Previsão de Entrega</Label>
                  <Input
                    id="previsao"
                    type="date"
                    value={formData.previsao_entrega}
                    onChange={(e) => setFormData({ ...formData, previsao_entrega: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="tipo_frete">Tipo de Frete</Label>
                  <Select value={formData.tipo_frete} onValueChange={(v) => setFormData({ ...formData, tipo_frete: v as FreteType })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cif">CIF (Pago pelo remetente)</SelectItem>
                      <SelectItem value="fob">FOB (Pago pelo destinatário)</SelectItem>
                      <SelectItem value="cortesia">Cortesia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="transportadora">Transportadora</Label>
                  <Select value={formData.transportadora_id} onValueChange={(v) => setFormData({ ...formData, transportadora_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {transportadoras.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.nome_fantasia}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Observações adicionais"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => createMutation.mutate(formData)}
                disabled={!formData.endereco_entrega || createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar Envio
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Envio</DialogTitle>
              <DialogDescription>
                {selectedEntrega?.numero_entrega}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={selectedEntrega?.status}
                  onValueChange={(v) => setSelectedEntrega(selectedEntrega ? { ...selectedEntrega, status: v as EntregaStatus } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-endereco">Endereço de Entrega *</Label>
                <Textarea
                  id="edit-endereco"
                  value={formData.endereco_entrega}
                  onChange={(e) => setFormData({ ...formData, endereco_entrega: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-contato">Contato</Label>
                  <Input
                    id="edit-contato"
                    value={formData.contato_cliente}
                    onChange={(e) => setFormData({ ...formData, contato_cliente: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-previsao">Previsão de Entrega</Label>
                  <Input
                    id="edit-previsao"
                    type="date"
                    value={formData.previsao_entrega}
                    onChange={(e) => setFormData({ ...formData, previsao_entrega: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-tipo_frete">Tipo de Frete</Label>
                  <Select value={formData.tipo_frete} onValueChange={(v) => setFormData({ ...formData, tipo_frete: v as FreteType })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cif">CIF</SelectItem>
                      <SelectItem value="fob">FOB</SelectItem>
                      <SelectItem value="cortesia">Cortesia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-transportadora">Transportadora</Label>
                  <Select value={formData.transportadora_id} onValueChange={(v) => setFormData({ ...formData, transportadora_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {transportadoras.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.nome_fantasia}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-observacoes">Observações</Label>
                <Textarea
                  id="edit-observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (selectedEntrega) {
                    updateMutation.mutate({
                      id: selectedEntrega.id,
                      data: {
                        ...formData,
                        status: selectedEntrega.status,
                        cliente_id: formData.cliente_id || null,
                        transportadora_id: formData.transportadora_id || null,
                        tipo_frete: formData.tipo_frete || null,
                      } as any,
                    });
                  }
                }}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedEntrega?.numero_entrega}</DialogTitle>
              <Badge
                variant="outline"
                className={cn("w-fit mt-2", selectedEntrega && statusConfig[selectedEntrega.status].color)}
              >
                {selectedEntrega && statusConfig[selectedEntrega.status].label}
              </Badge>
            </DialogHeader>
            {selectedEntrega && (
              <div className="space-y-4 py-4">
                {/* Status Timeline */}
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium mb-3">Progresso da Entrega</p>
                  <div className="flex items-center overflow-x-auto pb-2">
                    {Object.entries(statusConfig).slice(0, 8).map(([key, config], index, arr) => {
                      const statusOrder = Object.keys(statusConfig);
                      const currentIndex = statusOrder.indexOf(selectedEntrega.status);
                      const stepIndex = statusOrder.indexOf(key);
                      const isCompleted = stepIndex < currentIndex;
                      const isCurrent = key === selectedEntrega.status;
                      const IconStep = config.icon;
                      
                      return (
                        <div key={key} className="flex items-center flex-shrink-0">
                          <div className="flex flex-col items-center">
                            <div
                              className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-full text-xs",
                                isCompleted && "bg-success text-white",
                                isCurrent && "bg-primary text-white",
                                !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                              )}
                            >
                              <IconStep className="h-4 w-4" />
                            </div>
                            <span className="text-[10px] mt-1 text-center max-w-[60px] truncate">
                              {config.label.split(" ")[0]}
                            </span>
                          </div>
                          {index < arr.length - 1 && (
                            <div
                              className={cn(
                                "w-6 h-0.5 mx-1",
                                isCompleted ? "bg-success" : "bg-border"
                              )}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">
                      {selectedEntrega.cliente?.nome_fantasia || selectedEntrega.cliente?.razao_social || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contato</p>
                    <p className="font-medium">{selectedEntrega.contato_cliente || "-"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Endereço</p>
                  <p className="font-medium">{selectedEntrega.endereco_entrega}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Transportadora</p>
                    <p className="font-medium">{selectedEntrega.transportadora?.nome_fantasia || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo de Frete</p>
                    <p className="font-medium uppercase">{selectedEntrega.tipo_frete || "-"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Rastreamento</p>
                    <p className="font-medium font-mono">{selectedEntrega.codigo_rastreamento || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">NF Remessa</p>
                    <p className="font-medium">{selectedEntrega.nf_remessa || "-"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Previsão de Entrega</p>
                    <p className="font-medium">{formatDate(selectedEntrega.previsao_entrega)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Entregue em</p>
                    <p className="font-medium">{formatDate(selectedEntrega.data_entrega_efetiva)}</p>
                  </div>
                </div>
                {selectedEntrega.observacoes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Observações</p>
                    <p className="font-medium">{selectedEntrega.observacoes}</p>
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewOpen(false)}>
                Fechar
              </Button>
              <Button onClick={() => { setIsViewOpen(false); handleEdit(selectedEntrega!); }}>
                Editar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Envio</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o envio {selectedEntrega?.numero_entrega}? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => selectedEntrega && deleteMutation.mutate(selectedEntrega.id)}
              >
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
