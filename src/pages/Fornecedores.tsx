/* eslint-disable max-lines */
import { useState } from "react";
import { SortIcon } from "@/components/common/SortIcon";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2,
  Plus,
  Phone,
  MapPin,
  Package,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  Clock,
  Loader2,
  AlertCircle,
  User,
  FileText,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StatsCard } from "@/components/common/StatsCard";
import {
  StaggeredContent,
  StaggeredItem,
} from "@/components/common/PageTransition";

// Importar novos hooks e componentes
import { Pagination } from "@/components/common/Pagination";
import { FilterBar } from "@/components/common/FilterBar";
import { BulkActions } from "@/components/common/BulkActions";
import { useSelection } from "@/hooks/common/useSelection";
import { usePagination } from "@/hooks/common/usePagination";
import { useFilters, FilterConfig } from "@/hooks/common/useFilters";
import { useSorting } from "@/hooks/common/useSorting";

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
  ultima_coleta?: string | null;
}

const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];
const emptyForm = {
  razao_social: "",
  nome_fantasia: "",
  cnpj: "",
  endereco_completo: "",
  cidade: "",
  estado: "",
  cep: "",
  contato_nome: "",
  contato_email: "",
  contato_telefone: "",
};

const filterConfig: FilterConfig<Fornecedor> = {
  search: {
    fields: ["razao_social", "nome_fantasia", "cnpj", "cidade", "contato_nome"],
    placeholder: "Buscar por nome, CNPJ, cidade...",
  },
  select: {
    estado: {
      field: "estado",
      options: UFS.map((uf) => ({ value: uf, label: uf })),
      label: "Estado",
    },
  },
};

export default function Fornecedores() {
  const qc = useQueryClient();
  const [dlgCreate, setDlgCreate] = useState(false);
  const [dlgEdit, setDlgEdit] = useState(false);
  const [dlgView, setDlgView] = useState(false);
  const [dlgDel, setDlgDel] = useState(false);
  const [sel, setSel] = useState<Fornecedor | null>(null);
  const [form, setForm] = useState(emptyForm);

  const {
    data: list = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["fornecedores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fornecedores")
        .select("*")
        .is("deleted_at", null)
        .order("razao_social")
        .limit(1000);

      if (error) throw error;

      const { data: coletas } = await supabase
        .from("coletas")
        .select("fornecedor_id, status, created_at")
        .is("deleted_at", null)
        .limit(2000);

      return (data || []).map((f) => {
        const fc = coletas?.filter((c) => c.fornecedor_id === f.id) || [];
        const pend = fc.filter((c) =>
          ["aguardando_liberacao", "solicitada", "em_transito"].includes(
            c.status,
          ),
        ).length;
        const ult = fc.length
          ? fc.sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
            )[0].created_at
          : null;
        return {
          ...f,
          total_coletas: fc.length,
          coletas_pendentes: pend,
          ultima_coleta: ult,
        };
      }) as Fornecedor[];
    },
  });

  // Hooks de filtros, ordenação e paginação
  const {
    filteredData,
    filters,
    setSearch,
    setFilter,
    clearFilters,
    hasActiveFilters,
    totalFiltered,
    totalOriginal,
  } = useFilters(list, filterConfig);
  const { sortedData, toggleSort, getSortDirection } = useSorting(
    filteredData,
    { defaultKey: "razao_social", defaultDirection: "asc" },
  );
  const pagination = usePagination(sortedData, { initialPageSize: 12 });
  const { selectedIds, toggle, selectAll, clearSelection, isSelected } =
    useSelection(pagination.paginatedData);

  const createMut = useMutation({
    mutationFn: async (d: typeof emptyForm) => {
      const { error } = await supabase.from("fornecedores").insert({
        razao_social: d.razao_social,
        nome_fantasia: d.nome_fantasia || null,
        cnpj: d.cnpj || null,
        endereco_completo: d.endereco_completo,
        cidade: d.cidade || null,
        estado: d.estado || null,
        cep: d.cep || null,
        contato_nome: d.contato_nome || null,
        contato_email: d.contato_email || null,
        contato_telefone: d.contato_telefone || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fornecedores"] });
      setDlgCreate(false);
      setForm(emptyForm);
      toast.success("Fornecedor cadastrado!");
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, d }: { id: string; d: typeof emptyForm }) => {
      const { error } = await supabase
        .from("fornecedores")
        .update({
          razao_social: d.razao_social,
          nome_fantasia: d.nome_fantasia || null,
          cnpj: d.cnpj || null,
          endereco_completo: d.endereco_completo,
          cidade: d.cidade || null,
          estado: d.estado || null,
          cep: d.cep || null,
          contato_nome: d.contato_nome || null,
          contato_email: d.contato_email || null,
          contato_telefone: d.contato_telefone || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fornecedores"] });
      setDlgEdit(false);
      setSel(null);
      toast.success("Fornecedor atualizado!");
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("fornecedores")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fornecedores"] });
      setDlgDel(false);
      setSel(null);
      toast.success("Fornecedor movido para lixeira!");
    },
    onError: (e) => toast.error("Erro ao remover: " + e.message),
  });

  const bulkDeleteMut = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("fornecedores")
        .update({ deleted_at: new Date().toISOString() })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fornecedores"] });
      clearSelection();
      toast.success(
        `${selectedIds.length} fornecedor(es) movidos para lixeira!`,
      );
    },
    onError: (e) => toast.error("Erro ao remover: " + e.message),
  });

  const openEdit = (f: Fornecedor) => {
    setSel(f);
    setForm({
      razao_social: f.razao_social,
      nome_fantasia: f.nome_fantasia || "",
      cnpj: f.cnpj || "",
      endereco_completo: f.endereco_completo,
      cidade: f.cidade || "",
      estado: f.estado || "",
      cep: f.cep || "",
      contato_nome: f.contato_nome || "",
      contato_email: f.contato_email || "",
      contato_telefone: f.contato_telefone || "",
    });
    setDlgEdit(true);
  };

  const stats = {
    total: list.length,
    com: list.filter((f) => (f.total_coletas || 0) > 0).length,
    pend: list.filter((f) => (f.coletas_pendentes || 0) > 0).length,
    tot: list.reduce((a, f) => a + (f.total_coletas || 0), 0),
  };
  const fmtCNPJ = (c: string) => {
    const n = c.replace(/\D/g, "");
    return n.length === 14
      ? n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
      : c;
  };


  if (error)
    return (
      <MainLayout>
        <div className="flex flex-col items-center py-12">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <p className="text-destructive">Erro: {error.message}</p>
        </div>
      </MainLayout>
    );

  const FormFields = () => (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label>Razão Social *</Label>
        <Input
          value={form.razao_social}
          onChange={(e) => setForm({ ...form, razao_social: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label>Nome Fantasia</Label>
          <Input
            value={form.nome_fantasia}
            onChange={(e) =>
              setForm({ ...form, nome_fantasia: e.target.value })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label>CNPJ</Label>
          <Input
            value={form.cnpj}
            onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Endereço *</Label>
        <Textarea
          value={form.endereco_completo}
          onChange={(e) =>
            setForm({ ...form, endereco_completo: e.target.value })
          }
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label>Cidade</Label>
          <Input
            value={form.cidade}
            onChange={(e) => setForm({ ...form, cidade: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label>UF</Label>
          <Select
            value={form.estado}
            onValueChange={(v) => setForm({ ...form, estado: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UFS.map((e) => (
                <SelectItem key={e} value={e}>
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>CEP</Label>
          <Input
            value={form.cep}
            onChange={(e) => setForm({ ...form, cep: e.target.value })}
          />
        </div>
      </div>
      <div className="border-t pt-4">
        <p className="text-sm font-medium mb-3">Contato</p>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Nome</Label>
            <Input
              value={form.contato_nome}
              onChange={(e) =>
                setForm({ ...form, contato_nome: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.contato_email}
                onChange={(e) =>
                  setForm({ ...form, contato_email: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Telefone</Label>
              <Input
                value={form.contato_telefone}
                onChange={(e) =>
                  setForm({ ...form, contato_telefone: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="space-y-8 max-w-[1600px] mx-auto pb-12 p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between px-2">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white flex items-center gap-4 tracking-tighter uppercase italic">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black border border-white/10 shadow-2xl transition-transform hover:scale-110">
                  <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="drop-shadow-2xl">Supply Matrix</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                    <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                      Supplier_Nexus_Core
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">
                    LOGÍSTICA DE ENTRADA • PICKUP HUB
                  </span>
                </div>
              </div>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="lg"
              onClick={() => {
                setForm(emptyForm);
                setDlgCreate(true);
              }}
              className="h-14 px-8 rounded-2xl bg-primary text-black hover:bg-primary/90 font-black uppercase tracking-widest text-[11px] gap-3 transition-all shadow-lg shadow-primary/20"
            >
              <Plus className="w-5 h-5" /> Novo Fornecedor
            </Button>
          </div>
        </div>

        <StaggeredContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StaggeredItem>
            <StatsCard
              title="Total"
              value={stats.total}
              icon={Building2}
              color="primary"
            />
          </StaggeredItem>
          <StaggeredItem>
            <StatsCard
              title="Com Coletas"
              value={stats.com}
              icon={Package}
              color="success"
            />
          </StaggeredItem>
          <StaggeredItem>
            <StatsCard
              title="Pendentes"
              value={stats.pend}
              icon={Clock}
              color="warning"
            />
          </StaggeredItem>
          <StaggeredItem>
            <StatsCard
              title="Total Coletas"
              value={stats.tot}
              icon={TrendingUp}
              color="info"
            />
          </StaggeredItem>
        </StaggeredContent>

        <FilterBar
          search={filters.search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar por nome, CNPJ, cidade..."
          extraFilters={[
            {
              key: "estado",
              value: (filters.estado as string) || "",
              onChange: (value) => setFilter("estado", value || undefined),
              options: UFS.map((uf) => ({ value: uf, label: uf })),
              label: "Estado",
            },
          ]}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          totalFiltered={totalFiltered}
          totalOriginal={totalOriginal}
        />

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Ordenar por:</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSort("razao_social")}
            className="gap-1"
          >
            Nome <SortIcon dir={getSortDirection("razao_social")} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSort("cidade")}
            className="gap-1"
          >
            Cidade <SortIcon dir={getSortDirection("cidade")} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSort("total_coletas")}
            className="gap-1"
          >
            Coletas <SortIcon dir={getSortDirection("total_coletas")} />
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
                id: "delete",
                label: "Excluir Selecionados",
                icon: Trash2,
                variant: "destructive",
                onClick: (ids) => bulkDeleteMut.mutate(ids),
                confirmTitle: "Excluir fornecedores selecionados?",
                confirmDescription: (count) =>
                  `Você está prestes a excluir ${count} fornecedor(es). Esta ação não pode ser desfeita.`,
                confirmTyping: "EXCLUIR",
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
          <StaggeredContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pagination.paginatedData.map((f, i) => (
              <StaggeredItem key={f.id}>
                <div
                  className={`card-interactive animate-fade-in ${isSelected(f.id) ? "ring-2 ring-primary" : ""}`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <Checkbox
                      checked={isSelected(f.id)}
                      onCheckedChange={() => toggle(f.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-lg truncate">
                        {f.nome_fantasia || f.razao_social}
                      </p>
                      {f.nome_fantasia && (
                        <p className="text-xs text-muted-foreground truncate">
                          {f.razao_social}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSel(f);
                            setDlgView(true);
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
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSel(f);
                            setDlgDel(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="space-y-2 text-sm">
                    {f.cnpj && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono">{fmtCNPJ(f.cnpj)}</span>
                      </div>
                    )}
                    {f.contato_nome && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        {f.contato_nome}
                      </div>
                    )}
                    {f.contato_telefone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        {f.contato_telefone}
                      </div>
                    )}
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 mt-0.5" />
                      <div>
                        <p className="line-clamp-2">{f.endereco_completo}</p>
                        {f.cidade && (
                          <p className="font-medium text-foreground">
                            {f.cidade} - {f.estado}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {f.total_coletas || 0}
                      </span>
                      {(f.coletas_pendentes || 0) > 0 && (
                        <Badge
                          variant="outline"
                          className="bg-warning/10 text-warning"
                        >
                          {f.coletas_pendentes} pend.
                        </Badge>
                      )}
                    </div>
                    {f.ultima_coleta && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(f.ultima_coleta), "dd/MM/yy", {
                          locale: ptBR,
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </StaggeredItem>
            ))}
          </StaggeredContent>
        )}

        {!isLoading && sortedData.length === 0 && (
          <div className="card-base flex flex-col items-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nenhum fornecedor</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setDlgCreate(true)}
            >
              Cadastrar
            </Button>
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

        <Dialog open={dlgCreate} onOpenChange={setDlgCreate}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Fornecedor</DialogTitle>
            </DialogHeader>
            <FormFields />
            <DialogFooter>
              <Button variant="outline" onClick={() => setDlgCreate(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => createMut.mutate(form)}
                disabled={
                  !form.razao_social ||
                  !form.endereco_completo ||
                  createMut.isPending
                }
              >
                {createMut.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Cadastrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={dlgEdit} onOpenChange={setDlgEdit}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Fornecedor</DialogTitle>
            </DialogHeader>
            <FormFields />
            <DialogFooter>
              <Button variant="outline" onClick={() => setDlgEdit(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => sel && updateMut.mutate({ id: sel.id, d: form })}
                disabled={
                  !form.razao_social ||
                  !form.endereco_completo ||
                  updateMut.isPending
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
        <Dialog open={dlgView} onOpenChange={setDlgView}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do Fornecedor</DialogTitle>
            </DialogHeader>
            {sel && (
              <div className="space-y-4">
                <p className="text-lg font-semibold">
                  {sel.nome_fantasia || sel.razao_social}
                </p>
                {sel.cnpj && <p className="font-mono">{fmtCNPJ(sel.cnpj)}</p>}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Endereço</p>
                    <p>{sel.endereco_completo}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cidade/UF</p>
                    <p>
                      {sel.cidade} - {sel.estado}
                    </p>
                  </div>
                </div>
                {sel.contato_nome && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Contato</p>
                    <p>
                      {sel.contato_nome} - {sel.contato_telefone}
                    </p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
        <AlertDialog open={dlgDel} onOpenChange={setDlgDel}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir fornecedor?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => sel && deleteMut.mutate(sel.id)}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
