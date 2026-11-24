/* eslint-disable max-lines */
import { useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { SortIcon } from "@/components/common/SortIcon";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Truck,
  Plus,
  Clock,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Star,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { StatsCard } from "@/components/common/StatsCard";
import {
  PageTransition,
  StaggeredContent,
  StaggeredItem,
} from "@/components/common/PageTransition";

// Novos imports
import { Pagination } from "@/components/common/Pagination";
import { FilterBar } from "@/components/common/FilterBar";
import { BulkActions } from "@/components/common/BulkActions";
import { useSelection } from "@/hooks/common/useSelection";
import { Timeline } from "@/components/common/Timeline";
import { usePagination } from "@/hooks/common/usePagination";
import { useFilters, FilterConfig } from "@/hooks/common/useFilters";
import { useSorting } from "@/hooks/common/useSorting";
import { useEntityHistory } from "@/hooks/security/useEntityHistory";

type FreteStatus =
  "pendente" | "em_transito" | "entregue" | "atrasado" | "cancelado";

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

const statusConfig: Record<
  FreteStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  pendente: {
    label: "Pendente",
    color: "bg-warning/10 text-warning border-warning/20",
    icon: Clock,
  },
  em_transito: {
    label: "Em Trânsito",
    color: "bg-info/10 text-info border-info/20",
    icon: Truck,
  },
  entregue: {
    label: "Entregue",
    color: "bg-success/10 text-success border-success/20",
    icon: CheckCircle2,
  },
  atrasado: {
    label: "Atrasado",
    color: "bg-destructive/10 text-destructive border-destructive/20",
    icon: AlertTriangle,
  },
  cancelado: {
    label: "Cancelado",
    color: "bg-muted text-muted-foreground border-muted",
    icon: XCircle,
  },
};

const filterConfig: FilterConfig<FreteInterno> = {
  search: {
    fields: ["origem", "destino", "motorista", "observacoes"],
    placeholder: "Buscar fretes...",
  },
  status: {
    field: "status",
    options: Object.entries(statusConfig).map(([k, v]) => ({
      value: k,
      label: v.label,
    })),
  },
};

const emptyForm = {
  origem: "",
  destino: "",
  motorista: "",
  quantidade_itens: 1,
  previsao_entrega: "",
  xp_reward: 50,
  observacoes: "",
};

export default function FretesInternos() {
  const qc = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<FreteInterno | null>(null);
  const [form, setForm] = useState(emptyForm);

  const {
    data: fretes = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["fretes-internos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fretes_internos")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as FreteInterno[];
    },
  });

  // Hooks integrados
  const {
    filteredData,
    filters,
    setSearch,
    setStatus,
    clearFilters,
    hasActiveFilters,
    totalFiltered,
    totalOriginal,
  } = useFilters(fretes, filterConfig);
  const { sortedData, toggleSort, getSortDirection } = useSorting(
    filteredData,
    { defaultKey: "created_at", defaultDirection: "desc" },
  );
  const pagination = usePagination(sortedData, { initialPageSize: 10 });
  const { selectedIds, toggle, selectAll, clearSelection, isSelected } =
    useSelection(pagination.paginatedData);
  const { history } = useEntityHistory({
    entityType: "frete_interno",
    entityId: selected?.id || "",
  });

  const createMut = useMutation({
    mutationFn: async (data: typeof emptyForm) => {
      const { error } = await supabase.from("fretes_internos").insert({
        origem: data.origem,
        destino: data.destino,
        motorista: data.motorista || null,
        quantidade_itens: data.quantidade_itens,
        previsao_entrega: data.previsao_entrega || null,
        xp_reward: data.xp_reward,
        observacoes: data.observacoes || null,
        status: "pendente",
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
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: typeof emptyForm;
    }) => {
      const { error } = await supabase
        .from("fretes_internos")
        .update({
          origem: data.origem,
          destino: data.destino,
          motorista: data.motorista || null,
          quantidade_itens: data.quantidade_itens,
          previsao_entrega: data.previsao_entrega || null,
          xp_reward: data.xp_reward,
          observacoes: data.observacoes || null,
        })
        .is("deleted_at", null)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fretes-internos"] });
      setIsEditOpen(false);
      setSelected(null);
      toast.success("Frete atualizado!");
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("fretes_internos")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fretes-internos"] });
      setIsDeleteOpen(false);
      setSelected(null);
      toast.success("Frete excluído!");
    },
  });

  const updateStatusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: FreteStatus }) => {
      const update: { status: FreteStatus; data_entrega_efetiva?: string } = {
        status,
      };
      if (status === "entregue")
        update.data_entrega_efetiva = new Date().toISOString();
      const { error } = await supabase
        .from("fretes_internos")
        .update(update)
        .is("deleted_at", null)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fretes-internos"] });
      toast.success("Status atualizado!");
    },
  });

  const bulkUpdateStatus = async (ids: string[], status: FreteStatus) => {
    const { error } = await supabase
      .from("fretes_internos")
      .update({ status })
      .is("deleted_at", null)
      .in("id", ids);
    if (error) toast.error("Erro: " + error.message);
    else {
      qc.invalidateQueries({ queryKey: ["fretes-internos"] });
      clearSelection();
      toast.success(`${ids.length} frete(s) atualizado(s)!`);
    }
  };

  const openEdit = (f: FreteInterno) => {
    setSelected(f);
    setForm({
      origem: f.origem,
      destino: f.destino,
      motorista: f.motorista || "",
      quantidade_itens: f.quantidade_itens,
      previsao_entrega: f.previsao_entrega || "",
      xp_reward: f.xp_reward,
      observacoes: f.observacoes || "",
    });
    setIsEditOpen(true);
  };

  const stats = {
    total: fretes.length,
    pendentes: fretes.filter((f) => f.status === "pendente").length,
    transito: fretes.filter((f) => f.status === "em_transito").length,
    entregues: fretes.filter((f) => f.status === "entregue").length,
  };

  if (error)
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <EmptyState
            variant="error"
            title="Erro ao carregar fretes internos"
            description={
              error?.message ||
              "Não foi possível carregar fretes internos. Tente novamente."
            }
            action={{ label: "Tentar novamente", onClick: () => refetch() }}
          />
        </div>
      </MainLayout>
    );

  const FormFields = () => (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Origem *</Label>
          <Input
            value={form.origem}
            onChange={(e) => setForm({ ...form, origem: e.target.value })}
            placeholder="Ex: Armazém A"
          />
        </div>
        <div className="grid gap-2">
          <Label>Destino *</Label>
          <Input
            value={form.destino}
            onChange={(e) => setForm({ ...form, destino: e.target.value })}
            placeholder="Ex: Loja Centro"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Motorista</Label>
          <Input
            value={form.motorista}
            onChange={(e) => setForm({ ...form, motorista: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label>Previsão</Label>
          <Input
            type="datetime-local"
            value={form.previsao_entrega}
            onChange={(e) =>
              setForm({ ...form, previsao_entrega: e.target.value })
            }
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Qtd. Itens</Label>
          <Input
            type="number"
            min="1"
            value={form.quantidade_itens}
            onChange={(e) =>
              setForm({
                ...form,
                quantidade_itens: parseInt(e.target.value) || 1,
              })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label>XP Reward</Label>
          <Input
            type="number"
            min="0"
            value={form.xp_reward}
            onChange={(e) =>
              setForm({ ...form, xp_reward: parseInt(e.target.value) || 0 })
            }
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Observações</Label>
        <Textarea
          value={form.observacoes}
          onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
        />
      </div>
    </div>
  );

  return (
    <MainLayout>
      <PageTransition>
        <div className="space-y-6">
          <PageHeader
            title="Fretes Internos"
            description="Gerencie as movimentações e transportes internos entre suas unidades."
            icon={Truck}
            actions={
              <Button
                onClick={() => {
                  setForm(emptyForm);
                  setIsCreateOpen(true);
                }}
                size="sm"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Novo
              </Button>
            }
          />

          <StaggeredContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StaggeredItem>
              <StatsCard
                title="Total"
                value={stats.total}
                icon={Truck}
                color="primary"
              />
            </StaggeredItem>
            <StaggeredItem>
              <StatsCard
                title="Pendentes"
                value={stats.pendentes}
                icon={Clock}
                color="warning"
              />
            </StaggeredItem>
            <StaggeredItem>
              <StatsCard
                title="Em Trânsito"
                value={stats.transito}
                icon={Truck}
                color="info"
              />
            </StaggeredItem>
            <StaggeredItem>
              <StatsCard
                title="Entregues"
                value={stats.entregues}
                icon={CheckCircle2}
                color="success"
              />
            </StaggeredItem>
          </StaggeredContent>

          <FilterBar
            search={filters.search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar fretes..."
            status={filters.status}
            onStatusChange={setStatus}
            statusOptions={filterConfig.status?.options}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            totalFiltered={totalFiltered}
            totalOriginal={totalOriginal}
          />

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Ordenar:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSort("created_at")}
              className="gap-1"
            >
              Data <SortIcon dir={getSortDirection("created_at")} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSort("origem")}
              className="gap-1"
            >
              Origem <SortIcon dir={getSortDirection("origem")} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSort("status")}
              className="gap-1"
            >
              Status <SortIcon dir={getSortDirection("status")} />
            </Button>
          </div>

          {selectedIds.length > 0 && (
            <BulkActions
              selectedIds={selectedIds}
              totalCount={pagination.paginatedData.length}
              onClearSelection={clearSelection}
              onSelectAll={selectAll}
              actions={[
                {
                  id: "entregue",
                  label: "Marcar Entregue",
                  icon: CheckCircle2,
                  onClick: (ids) => bulkUpdateStatus(ids, "entregue"),
                },
                {
                  id: "cancelar",
                  label: "Cancelar",
                  icon: XCircle,
                  variant: "destructive",
                  onClick: (ids) => bulkUpdateStatus(ids, "cancelado"),
                  confirmTitle: "Cancelar fretes selecionados?",
                  confirmDescription: (count) =>
                    `Você está prestes a cancelar ${count} frete(s). Os fretes cancelados não podem ser retomados.`,
                },
              ]}
            />
          )}

          {isLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {!isLoading && (
            <StaggeredContent className="space-y-3">
              {pagination.paginatedData.map((f, i) => {
                const config = statusConfig[f.status];
                const StatusIcon = config.icon;
                return (
                  <StaggeredItem key={f.id}>
                    <div
                      className={`card-interactive animate-fade-in ${isSelected(f.id) ? "ring-2 ring-primary" : ""}`}
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected(f.id)}
                          onCheckedChange={() => toggle(f.id)}
                          className="mt-1"
                        />
                        <div className={cn("p-2 rounded-lg", config.color)}>
                          <StatusIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">
                              {f.origem} → {f.destino}
                            </span>
                            <Badge className={config.color}>
                              {config.label}
                            </Badge>
                            {f.xp_reward > 0 && (
                              <Badge variant="outline" className="gap-1">
                                <Star className="w-3 h-3 text-yellow-500" />
                                {f.xp_reward} XP
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {f.motorista && <span>🚗 {f.motorista}</span>}
                            <span>📦 {f.quantidade_itens} itens</span>
                            {f.previsao_entrega && (
                              <span>
                                📅{" "}
                                {format(
                                  new Date(f.previsao_entrega),
                                  "dd/MM HH:mm",
                                  { locale: ptBR },
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelected(f);
                                setIsViewOpen(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(f)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {f.status === "pendente" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  updateStatusMut.mutate({
                                    id: f.id,
                                    status: "em_transito",
                                  })
                                }
                              >
                                Iniciar Trânsito
                              </DropdownMenuItem>
                            )}
                            {f.status === "em_transito" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  updateStatusMut.mutate({
                                    id: f.id,
                                    status: "entregue",
                                  })
                                }
                              >
                                Marcar Entregue
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelected(f);
                                setIsDeleteOpen(true);
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </StaggeredItem>
                );
              })}
            </StaggeredContent>
          )}

          {!isLoading && sortedData.length === 0 && (
            <div className="card-base flex flex-col items-center py-12">
              <Truck className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">Nenhum frete</p>
            </div>
          )}
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

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Novo Frete</DialogTitle>
              </DialogHeader>
              <FormFields />
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => createMut.mutate(form)}
                  disabled={
                    !form.origem || !form.destino || createMut.isPending
                  }
                >
                  {createMut.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Criar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Editar Frete</DialogTitle>
              </DialogHeader>
              <FormFields />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() =>
                    selected &&
                    updateMut.mutate({ id: selected.id, data: form })
                  }
                  disabled={
                    !form.origem || !form.destino || updateMut.isPending
                  }
                >
                  {updateMut.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Detalhes do Frete</DialogTitle>
              </DialogHeader>
              {selected && (
                <Tabs defaultValue="detalhes">
                  <TabsList className="w-full">
                    <TabsTrigger value="detalhes" className="flex-1">
                      Detalhes
                    </TabsTrigger>
                    <TabsTrigger value="historico" className="flex-1">
                      Histórico
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="detalhes" className="space-y-4 pt-4">
                    <div className="flex items-center gap-3">
                      <Badge className={statusConfig[selected.status].color}>
                        {statusConfig[selected.status].label}
                      </Badge>
                      {selected.xp_reward > 0 && (
                        <Badge variant="outline" className="gap-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          {selected.xp_reward} XP
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Origem</p>
                        <p className="font-medium">{selected.origem}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Destino</p>
                        <p className="font-medium">{selected.destino}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Motorista
                        </p>
                        <p>{selected.motorista || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Itens</p>
                        <p>{selected.quantidade_itens}</p>
                      </div>
                    </div>
                    {selected.observacoes && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Observações
                        </p>
                        <p>{selected.observacoes}</p>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="historico" className="pt-4">
                    <Timeline events={history} />
                  </TabsContent>
                </Tabs>
              )}
            </DialogContent>
          </Dialog>
          <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir frete?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => selected && deleteMut.mutate(selected.id)}
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </PageTransition>
    </MainLayout>
  );
}
