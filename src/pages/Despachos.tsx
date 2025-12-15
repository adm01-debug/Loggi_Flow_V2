import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Package,
  Search,
  Plus,
  Truck,
  Box,
  FileText,
  DollarSign,
  CheckCircle,
  Send,
  Eye,
  MoreHorizontal,
  MapPin,
  Building,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const statusConfig: Record<EntregaStatus, { label: string; color: string }> = {
  aguardando_producao: { label: "Aguardando Produção", color: "bg-gray-500" },
  pronto_despacho: { label: "Pronto p/ Despacho", color: "bg-blue-500" },
  cotacao_frete: { label: "Cotação de Frete", color: "bg-yellow-500" },
  nf_emitida: { label: "NF Emitida", color: "bg-cyan-500" },
  despachado: { label: "Despachado", color: "bg-indigo-500" },
  em_transito: { label: "Em Trânsito", color: "bg-purple-500" },
  saiu_entrega: { label: "Saiu p/ Entrega", color: "bg-orange-500" },
  entregue: { label: "Entregue", color: "bg-emerald-500" },
  ocorrencia: { label: "Ocorrência", color: "bg-red-500" },
  finalizado: { label: "Finalizado", color: "bg-green-600" },
};

const BOX_OPTIONS = Array.from({ length: 16 }, (_, i) => `BOX-${String(i + 1).padStart(2, '0')}`);

export default function Despachos() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isNewEntregaOpen, setIsNewEntregaOpen] = useState(false);
  const [isCotacaoOpen, setIsCotacaoOpen] = useState(false);
  const [isDespachoOpen, setIsDespachoOpen] = useState(false);
  const [selectedEntrega, setSelectedEntrega] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form states for new entrega
  const [formData, setFormData] = useState({
    cliente_id: "",
    endereco_entrega: "",
    contato_cliente: "",
    observacoes: "",
  });

  // Form states for cotação
  const [cotacaoData, setCotacaoData] = useState({
    transportadora_id: "",
    valor: "",
    prazo_dias: "",
    observacoes: "",
  });

  // Form states for despacho
  const [despachoData, setDespachoData] = useState({
    box_alocado: "",
    nf_remessa: "",
    transportadora_id: "",
    valor_frete: "",
    tipo_frete: "cif" as "cif" | "fob",
  });

  // Fetch entregas
  const { data: entregas = [], isLoading: loadingEntregas } = useQuery({
    queryKey: ["entregas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entregas")
        .select("*, cliente:clientes(*), transportadora:transportadoras(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch clientes
  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("razao_social");
      if (error) throw error;
      return data;
    },
  });

  // Fetch transportadoras
  const { data: transportadoras = [] } = useQuery({
    queryKey: ["transportadoras"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transportadoras")
        .select("*")
        .eq("homologada", true)
        .order("nome_fantasia");
      if (error) throw error;
      return data;
    },
  });

  // Fetch cotações for selected entrega
  const { data: cotacoes = [] } = useQuery({
    queryKey: ["cotacoes", selectedEntrega?.id],
    queryFn: async () => {
      if (!selectedEntrega?.id) return [];
      const { data, error } = await supabase
        .from("cotacoes_frete")
        .select("*, transportadora:transportadoras(*)")
        .eq("entrega_id", selectedEntrega.id)
        .order("valor");
      if (error) throw error;
      return data;
    },
    enabled: !!selectedEntrega?.id,
  });

  // Create entrega mutation
  const createEntrega = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("entregas").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entregas"] });
      setIsNewEntregaOpen(false);
      setFormData({ cliente_id: "", endereco_entrega: "", contato_cliente: "", observacoes: "" });
      toast({ title: "Entrega criada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar entrega", variant: "destructive" });
    },
  });

  // Create cotação mutation
  const createCotacao = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("cotacoes_frete").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cotacoes", selectedEntrega?.id] });
      setCotacaoData({ transportadora_id: "", valor: "", prazo_dias: "", observacoes: "" });
      toast({ title: "Cotação adicionada!" });
    },
    onError: () => {
      toast({ title: "Erro ao adicionar cotação", variant: "destructive" });
    },
  });

  // Select cotação mutation
  const selectCotacao = useMutation({
    mutationFn: async ({ cotacaoId, entregaId }: { cotacaoId: string; entregaId: string }) => {
      // Deselect all cotações for this entrega
      await supabase
        .from("cotacoes_frete")
        .update({ selecionada: false })
        .eq("entrega_id", entregaId);
      
      // Select the chosen one
      const { error } = await supabase
        .from("cotacoes_frete")
        .update({ selecionada: true })
        .eq("id", cotacaoId);
      if (error) throw error;

      // Update entrega status to cotacao_frete (approved quote)
      await supabase
        .from("entregas")
        .update({ status: "cotacao_frete" })
        .eq("id", entregaId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cotacoes", selectedEntrega?.id] });
      queryClient.invalidateQueries({ queryKey: ["entregas"] });
      toast({ title: "Cotação selecionada!" });
    },
  });

  // Despacho mutation
  const realizarDespacho = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("entregas")
        .update({
          ...data,
          status: "em_transito",
          data_despacho: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entregas"] });
      setIsDespachoOpen(false);
      setSelectedEntrega(null);
      setDespachoData({ box_alocado: "", nf_remessa: "", transportadora_id: "", valor_frete: "", tipo_frete: "cif" });
      toast({ title: "Despacho realizado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao realizar despacho", variant: "destructive" });
    },
  });

  // Handle cliente selection
  const handleClienteChange = (clienteId: string) => {
    const cliente = clientes.find((c) => c.id === clienteId);
    if (cliente) {
      setFormData({
        ...formData,
        cliente_id: clienteId,
        endereco_entrega: cliente.endereco_completo,
        contato_cliente: cliente.contato_telefone || "",
      });
    }
  };

  // Filter entregas
  const filteredEntregas = entregas.filter((entrega: any) => {
    const matchesSearch =
      entrega.numero_entrega?.toLowerCase().includes(search.toLowerCase()) ||
      entrega.cliente?.razao_social?.toLowerCase().includes(search.toLowerCase()) ||
      entrega.endereco_entrega?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || entrega.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: entregas.length,
    prontoDespacho: entregas.filter((e: any) => e.status === "pronto_despacho").length,
    aguardandoCotacao: entregas.filter((e: any) => e.status === "aguardando_cotacao").length,
    emTransito: entregas.filter((e: any) => e.status === "em_transito").length,
  };

  // Get boxes in use
  const boxesInUse = entregas
    .filter((e: any) => e.box_alocado && e.status !== "entregue")
    .map((e: any) => e.box_alocado);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Cotação e Despacho</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie cotações, alocação em BOX e despacho de entregas
            </p>
          </div>
          <Dialog open={isNewEntregaOpen} onOpenChange={setIsNewEntregaOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Entrega
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nova Entrega</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select value={formData.cliente_id} onValueChange={handleClienteChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente: any) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.nome_fantasia || cliente.razao_social}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Endereço de Entrega</Label>
                  <Input
                    value={formData.endereco_entrega}
                    onChange={(e) => setFormData({ ...formData, endereco_entrega: e.target.value })}
                    placeholder="Endereço completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contato do Cliente</Label>
                  <Input
                    value={formData.contato_cliente}
                    onChange={(e) => setFormData({ ...formData, contato_cliente: e.target.value })}
                    placeholder="Telefone para contato"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    placeholder="Observações da entrega"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsNewEntregaOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => createEntrega.mutate(formData)}
                    disabled={!formData.cliente_id || !formData.endereco_entrega}
                  >
                    Criar Entrega
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Entregas</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Box className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pronto Despacho</p>
                  <p className="text-2xl font-bold">{stats.prontoDespacho}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <DollarSign className="h-6 w-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Aguardando Cotação</p>
                  <p className="text-2xl font-bold">{stats.aguardandoCotacao}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-lg">
                  <Truck className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Em Trânsito</p>
                  <p className="text-2xl font-bold">{stats.emTransito}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* BOX Allocation Visual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Box className="h-5 w-5" />
              Alocação de BOX (1-16)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {BOX_OPTIONS.map((box) => {
                const entrega = entregas.find(
                  (e: any) => e.box_alocado === box && e.status !== "entregue"
                );
                const isOccupied = !!entrega;
                return (
                  <div
                    key={box}
                    className={`p-3 rounded-lg border-2 text-center transition-colors ${
                      isOccupied
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-dashed border-muted-foreground/30 text-muted-foreground"
                    }`}
                    title={isOccupied ? `${entrega.numero_entrega}` : "Disponível"}
                  >
                    <div className="font-bold text-sm">{box.replace("BOX-", "")}</div>
                    {isOccupied && (
                      <div className="text-xs mt-1 truncate">{entrega.numero_entrega}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, cliente ou endereço..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {Object.entries(statusConfig).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Entregas Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Entrega</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>BOX</TableHead>
                  <TableHead>NF Remessa</TableHead>
                  <TableHead>Transportadora</TableHead>
                  <TableHead>Valor Frete</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingEntregas ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredEntregas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Nenhuma entrega encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntregas.map((entrega: any) => (
                    <TableRow key={entrega.id}>
                      <TableCell className="font-medium">{entrega.numero_entrega}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          {entrega.cliente?.nome_fantasia || entrega.cliente?.razao_social || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 max-w-[200px]">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{entrega.endereco_entrega}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {entrega.box_alocado ? (
                          <Badge variant="outline" className="font-mono">
                            {entrega.box_alocado}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {entrega.nf_remessa ? (
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4 text-green-500" />
                            {entrega.nf_remessa}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {entrega.transportadora?.nome_fantasia || "-"}
                      </TableCell>
                      <TableCell>
                        {entrega.valor_frete
                          ? `R$ ${Number(entrega.valor_frete).toFixed(2)}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig[entrega.status as EntregaStatus]?.color}>
                          {statusConfig[entrega.status as EntregaStatus]?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedEntrega(entrega);
                                setIsCotacaoOpen(true);
                              }}
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              Cotações
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedEntrega(entrega);
                                setDespachoData({
                                  box_alocado: entrega.box_alocado || "",
                                  nf_remessa: entrega.nf_remessa || "",
                                  transportadora_id: entrega.transportadora_id || "",
                                  valor_frete: entrega.valor_frete?.toString() || "",
                                  tipo_frete: entrega.tipo_frete || "cif",
                                });
                                setIsDespachoOpen(true);
                              }}
                              disabled={entrega.status === "em_transito" || entrega.status === "entregue"}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Despachar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Cotações Dialog */}
        <Dialog open={isCotacaoOpen} onOpenChange={setIsCotacaoOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Cotações - {selectedEntrega?.numero_entrega}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {/* Add new cotação */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Adicionar Cotação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Transportadora</Label>
                      <Select
                        value={cotacaoData.transportadora_id}
                        onValueChange={(v) => setCotacaoData({ ...cotacaoData, transportadora_id: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {transportadoras.map((t: any) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.nome_fantasia}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Valor (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={cotacaoData.valor}
                        onChange={(e) => setCotacaoData({ ...cotacaoData, valor: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Prazo (dias)</Label>
                      <Input
                        type="number"
                        value={cotacaoData.prazo_dias}
                        onChange={(e) => setCotacaoData({ ...cotacaoData, prazo_dias: e.target.value })}
                        placeholder="Ex: 5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Observações</Label>
                      <Input
                        value={cotacaoData.observacoes}
                        onChange={(e) => setCotacaoData({ ...cotacaoData, observacoes: e.target.value })}
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                  <Button
                    className="mt-4"
                    onClick={() =>
                      createCotacao.mutate({
                        entrega_id: selectedEntrega?.id,
                        transportadora_id: cotacaoData.transportadora_id,
                        valor: parseFloat(cotacaoData.valor),
                        prazo_dias: parseInt(cotacaoData.prazo_dias),
                        observacoes: cotacaoData.observacoes,
                      })
                    }
                    disabled={!cotacaoData.transportadora_id || !cotacaoData.valor}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Cotação
                  </Button>
                </CardContent>
              </Card>

              {/* List cotações */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Cotações Recebidas</CardTitle>
                </CardHeader>
                <CardContent>
                  {cotacoes.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhuma cotação cadastrada
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {cotacoes.map((cotacao: any) => (
                        <div
                          key={cotacao.id}
                          className={`p-4 rounded-lg border flex items-center justify-between ${
                            cotacao.selecionada ? "border-green-500 bg-green-500/10" : ""
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <Truck className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                {cotacao.transportadora?.nome_fantasia}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Prazo: {cotacao.prazo_dias} dias
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-bold text-lg">
                                R$ {Number(cotacao.valor).toFixed(2)}
                              </p>
                              {cotacao.selecionada && (
                                <Badge className="bg-green-500">Selecionada</Badge>
                              )}
                            </div>
                            {!cotacao.selecionada && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  selectCotacao.mutate({
                                    cotacaoId: cotacao.id,
                                    entregaId: selectedEntrega?.id,
                                  })
                                }
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Selecionar
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>

        {/* Despacho Dialog */}
        <Dialog open={isDespachoOpen} onOpenChange={setIsDespachoOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                Despachar - {selectedEntrega?.numero_entrega}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Alocar em BOX</Label>
                <Select
                  value={despachoData.box_alocado}
                  onValueChange={(v) => setDespachoData({ ...despachoData, box_alocado: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o BOX" />
                  </SelectTrigger>
                  <SelectContent>
                    {BOX_OPTIONS.map((box) => {
                      const isOccupied = boxesInUse.includes(box) && box !== selectedEntrega?.box_alocado;
                      return (
                        <SelectItem key={box} value={box} disabled={isOccupied}>
                          {box} {isOccupied && "(Ocupado)"}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>NF Remessa</Label>
                <Input
                  value={despachoData.nf_remessa}
                  onChange={(e) => setDespachoData({ ...despachoData, nf_remessa: e.target.value })}
                  placeholder="Número da NF de remessa"
                />
              </div>

              <div className="space-y-2">
                <Label>Transportadora</Label>
                <Select
                  value={despachoData.transportadora_id}
                  onValueChange={(v) => setDespachoData({ ...despachoData, transportadora_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a transportadora" />
                  </SelectTrigger>
                  <SelectContent>
                    {transportadoras.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nome_fantasia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor do Frete (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={despachoData.valor_frete}
                    onChange={(e) => setDespachoData({ ...despachoData, valor_frete: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo do Frete</Label>
                  <Select
                    value={despachoData.tipo_frete}
                    onValueChange={(v: "cif" | "fob") => setDespachoData({ ...despachoData, tipo_frete: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cif">CIF (Pago pelo remetente)</SelectItem>
                      <SelectItem value="fob">FOB (Pago pelo destinatário)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDespachoOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() =>
                    realizarDespacho.mutate({
                      id: selectedEntrega?.id,
                      data: {
                        box_alocado: despachoData.box_alocado,
                        nf_remessa: despachoData.nf_remessa,
                        transportadora_id: despachoData.transportadora_id,
                        valor_frete: despachoData.valor_frete ? parseFloat(despachoData.valor_frete) : null,
                        tipo_frete: despachoData.tipo_frete,
                      },
                    })
                  }
                  disabled={!despachoData.box_alocado || !despachoData.nf_remessa}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Confirmar Despacho
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
