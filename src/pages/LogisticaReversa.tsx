/* eslint-disable max-lines */
import { useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { MainLayout } from "@/components/layout/MainLayout";
import { useLogisticaReversaReal } from "@/hooks/logistics/useLogisticaReversaReal";
import { type LogisticaReversa } from "@/hooks";
import {
  RotateCcw,
  Plus,
  Search,
  Filter,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  AlertCircle,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useExport } from "@/hooks/common/useExport";
import { toast } from "sonner";

export default function LogisticaReversa() {
  const { list, create, updateStatus } = useLogisticaReversaReal();
  const listError = list.isError;
  const listErrorMessage = list.error?.message;
  const { exportToCSV } = useExport();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    motivo: "",
    descricao_detalhada: "",
    prioridade: "media" as "alta" | "media" | "baixa",
    codigo_rastreio_reverso: "",
  });
  const [selectedItem, setSelectedItem] = useState<LogisticaReversa | null>(
    null,
  );
  const [cancelItem, setCancelItem] = useState<LogisticaReversa | null>(null);

  const getStatusBadge = (status: LogisticaReversa["status"]) => {
    const variants: Record<
      LogisticaReversa["status"],
      { label: string; color: string; icon: React.ElementType }
    > = {
      pendente: {
        label: "Pendente",
        color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
        icon: Clock,
      },
      aprovado: {
        label: "Aprovado",
        color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
        icon: CheckCircle2,
      },
      em_transito: {
        label: "Em Trânsito",
        color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
        icon: Truck,
      },
      recebido: {
        label: "Recebido",
        color: "bg-green-500/10 text-green-500 border-green-500/20",
        icon: Package,
      },
      cancelado: {
        label: "Cancelado",
        color: "bg-red-500/10 text-red-500 border-red-500/20",
        icon: XCircle,
      },
    };

    const config = variants[status] || variants.pendente;
    const Icon = config.icon;

    return (
      <Badge
        variant="outline"
        className={`${config.color} flex items-center gap-1 px-2 py-0.5`}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredData = list.data?.filter(
    (item) =>
      (statusFilter === "todos" || item.status === statusFilter) &&
      (item.motivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.clientes?.razao_social
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        item.codigo_rastreio_reverso
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())),
  );

  const handleCreate = () => {
    if (!createForm.motivo.trim()) {
      toast.error("Informe o motivo da solicitação.");
      return;
    }
    create.mutate({
      motivo: createForm.motivo.trim(),
      descricao_detalhada: createForm.descricao_detalhada.trim() || null,
      prioridade: createForm.prioridade,
      codigo_rastreio_reverso:
        createForm.codigo_rastreio_reverso.trim() || null,
    });
    setIsCreateOpen(false);
    setCreateForm({
      motivo: "",
      descricao_detalhada: "",
      prioridade: "media",
      codigo_rastreio_reverso: "",
    });
  };

  const handleExport = () => {
    if (!filteredData?.length) {
      toast.info("Nada para exportar.");
      return;
    }
    exportToCSV(
      filteredData.map((i) => ({
        id: i.id,
        cliente: i.clientes?.razao_social || "",
        motivo: i.motivo,
        status: i.status,
        prioridade: i.prioridade,
        criado_em: i.created_at,
        rastreio_reverso: i.codigo_rastreio_reverso || "",
      })),
      { filename: "logistica-reversa" },
    );
  };

  if (listError) {
    return (
      <MainLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <EmptyState
            variant="error"
            title="Erro ao carregar logística reversa"
            description={
              listErrorMessage ||
              "Não foi possível carregar as solicitações. Tente novamente."
            }
            action={{
              label: "Tentar novamente",
              onClick: () => window.location.reload(),
            }}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8 max-w-[1600px] mx-auto pb-12 p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between px-2">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white flex items-center gap-4 tracking-tighter uppercase italic">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black border border-white/10 shadow-2xl transition-transform hover:scale-110">
                  <RotateCcw className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="drop-shadow-2xl">Logística Reversa</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                    <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                      Reverse_Flow_Nexus
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">
                    SMART RETURNS • ASSET RECOVERY
                  </span>
                </div>
              </div>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="lg"
              className="h-14 px-8 rounded-2xl bg-primary text-black hover:bg-primary/90 font-black uppercase tracking-widest text-[11px] gap-3 transition-all shadow-lg shadow-primary/20"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="w-5 h-5" /> Nova Solicitação
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
                Pendentes
              </CardTitle>
              <CardTitle className="text-2xl">
                {list.data?.filter((i) => i.status === "pendente").length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
                Em Trânsito
              </CardTitle>
              <CardTitle className="text-2xl">
                {list.data?.filter((i) => i.status === "em_transito").length ||
                  0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
                Resolvidos
              </CardTitle>
              <CardTitle className="text-2xl text-green-500">
                {list.data?.filter((i) => i.status === "recebido").length || 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase">
                Taxa de Devolução
              </CardTitle>
              <CardTitle className="text-2xl text-primary">4.2%</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por motivo, cliente ou rastreio..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter className="w-4 h-4" />
                      {statusFilter === "todos"
                        ? "Filtros"
                        : `Status: ${statusFilter}`}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filtrar por status</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => setStatusFilter("todos")}>
                      Todos
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setStatusFilter("pendente")}
                    >
                      Pendente
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setStatusFilter("aprovado")}
                    >
                      Aprovado
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setStatusFilter("em_transito")}
                    >
                      Em Trânsito
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setStatusFilter("recebido")}
                    >
                      Recebido
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setStatusFilter("cancelado")}
                    >
                      Cancelado
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  Exportar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>Cliente / Motivo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Data Solicitação</TableHead>
                    <TableHead>Rastreio Reverso</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    if (list.isLoading)
                      return Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 7 }).map((_, j) => (
                            <TableCell key={j}>
                              <Skeleton className="h-4 w-full" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ));
                    if (filteredData?.length === 0)
                      return (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center py-12 text-muted-foreground"
                          >
                            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            Nenhuma solicitação de logística reversa encontrada.
                          </TableCell>
                        </TableRow>
                      );
                    return filteredData?.map((item) => (
                      <TableRow
                        key={item.id}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          #{item.id.substring(0, 8)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {item.clientes?.razao_social ||
                                "Cliente não identificado"}
                            </span>
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {item.motivo}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              item.prioridade === "alta"
                                ? "border-red-500 text-red-500"
                                : ""
                            }
                          >
                            {item.prioridade}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(
                            new Date(item.created_at),
                            "dd/MM/yyyy HH:mm",
                            { locale: ptBR },
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {item.codigo_rastreio_reverso || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem
                                className="gap-2"
                                onClick={() => setSelectedItem(item)}
                              >
                                <Search className="w-4 h-4" /> Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="gap-2 text-blue-500"
                                onClick={() =>
                                  updateStatus.mutate({
                                    id: item.id,
                                    status: "aprovado",
                                  })
                                }
                              >
                                <CheckCircle2 className="w-4 h-4" /> Aprovar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 text-purple-500"
                                onClick={() =>
                                  updateStatus.mutate({
                                    id: item.id,
                                    status: "em_transito",
                                  })
                                }
                              >
                                <Truck className="w-4 h-4" /> Em Trânsito
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 text-green-500"
                                onClick={() =>
                                  updateStatus.mutate({
                                    id: item.id,
                                    status: "recebido",
                                  })
                                }
                              >
                                <Package className="w-4 h-4" /> Recebido
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="gap-2 text-red-500"
                                onClick={() => setCancelItem(item)}
                              >
                                <XCircle className="w-4 h-4" /> Cancelar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Solicitação de Logística Reversa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lr-motivo">Motivo *</Label>
                <Input
                  id="lr-motivo"
                  placeholder="Ex.: Produto avariado no transporte"
                  value={createForm.motivo}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, motivo: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lr-descricao">Descrição detalhada</Label>
                <Textarea
                  id="lr-descricao"
                  placeholder="Detalhes da ocorrência..."
                  value={createForm.descricao_detalhada}
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      descricao_detalhada: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lr-rastreio">Código de rastreio reverso</Label>
                <Input
                  id="lr-rastreio"
                  placeholder="Opcional"
                  value={createForm.codigo_rastreio_reverso}
                  onChange={(e) =>
                    setCreateForm((p) => ({
                      ...p,
                      codigo_rastreio_reverso: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <div className="flex gap-2">
                  {(["alta", "media", "baixa"] as const).map((p) => {
                    const label = {
                      alta: "Alta",
                      media: "Média",
                      baixa: "Baixa",
                    }[p];
                    return (
                      <Button
                        key={p}
                        type="button"
                        size="sm"
                        variant={
                          createForm.prioridade === p ? "default" : "outline"
                        }
                        onClick={() =>
                          setCreateForm((prev) => ({ ...prev, prioridade: p }))
                        }
                      >
                        {label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={create.isPending}>
                Criar Solicitação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={selectedItem !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedItem(null);
          }}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalhes da Solicitação</DialogTitle>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Cliente
                  </p>
                  <p className="font-medium">
                    {selectedItem.clientes?.razao_social ||
                      "Cliente não identificado"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Motivo
                  </p>
                  <p className="font-medium">{selectedItem.motivo}</p>
                </div>
                {selectedItem.descricao_detalhada && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Descrição detalhada
                    </p>
                    <p className="whitespace-pre-wrap">
                      {selectedItem.descricao_detalhada}
                    </p>
                  </div>
                )}
                {selectedItem.entregas?.codigo_rastreamento && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Código de rastreamento da entrega
                    </p>
                    <p className="font-mono">
                      {selectedItem.entregas.codigo_rastreamento}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Status
                    </p>
                    <p>{getStatusBadge(selectedItem.status)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Prioridade
                    </p>
                    <p className="capitalize">{selectedItem.prioridade}</p>
                  </div>
                </div>
                {selectedItem.valor_estorno !== null && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Valor de estorno
                    </p>
                    <p>
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(selectedItem.valor_estorno)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Solicitado em
                  </p>
                  <p>
                    {format(
                      new Date(selectedItem.created_at),
                      "dd/MM/yyyy HH:mm",
                      { locale: ptBR },
                    )}
                  </p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedItem(null)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={!!cancelItem}
          onOpenChange={(open) => {
            if (!open) setCancelItem(null);
          }}
          type="danger"
          title="Cancelar esta devolução?"
          description={`A devolução ${cancelItem?.codigo_rastreio_reverso ?? cancelItem?.motivo ?? ""} será marcada como cancelada e não poderá voltar ao fluxo. Confirme apenas se o cliente desistiu da devolução.`}
          confirmText="Cancelar devolução"
          cancelText="Voltar"
          isLoading={updateStatus.isPending}
          onConfirm={() => {
            if (!cancelItem) return;
            updateStatus.mutate(
              { id: cancelItem.id, status: "cancelado" },
              { onSettled: () => setCancelItem(null) },
            );
          }}
        />
      </div>
    </MainLayout>
  );
}
