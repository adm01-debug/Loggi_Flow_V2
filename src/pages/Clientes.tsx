/* eslint-disable max-lines */
import { useState } from "react";
import { SortIcon } from "@/components/common/SortIcon";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  Plus,
  Phone,
  MapPin,
  Package,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Clock,
  Loader2,
  AlertCircle,
  User,
  FileText,
  Calendar,
  Upload,
  Copy,
} from "lucide-react";
import { z } from "zod";
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
import { StatsCard } from "@/components/common/StatsCard";
import {
  StaggeredContent,
  StaggeredItem,
} from "@/components/common/PageTransition";

import { Pagination } from "@/components/common/Pagination";
import { FilterBar } from "@/components/common/FilterBar";
import { BulkActions } from "@/components/common/BulkActions";
import { useSelection } from "@/hooks/common/useSelection";
import { OnboardingTooltip } from "@/components/onboarding/OnboardingTooltip";
import { usePagination } from "@/hooks/common/usePagination";
import { useFilters, FilterConfig } from "@/hooks/common/useFilters";
import { useSorting } from "@/hooks/common/useSorting";
import { CSVImporter } from "@/components/common/CSVImporter";
import {
  Dialog as ImportDialog,
  DialogContent as ImportDialogContent,
  DialogHeader as ImportDialogHeader,
  DialogTitle as ImportDialogTitle,
} from "@/components/ui/dialog";
import { RTECustomerSync } from "@/components/rodonaves/RTECustomerSync";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import { SkeletonTable } from "@/components/ui/skeleton";

const clienteCSVSchema = z.object({
  razao_social: z.string().min(1),
  nome_fantasia: z.string().optional().default(""),
  cnpj: z.string().optional().default(""),
  endereco_completo: z.string().min(1),
  cidade: z.string().optional().default(""),
  estado: z.string().optional().default(""),
  cep: z.string().optional().default(""),
  contato_nome: z.string().optional().default(""),
  contato_email: z.string().optional().default(""),
  contato_telefone: z.string().optional().default(""),
});

const clienteCSVColumns = [
  { key: "razao_social", label: "Razão Social", example: "Empresa LTDA" },
  { key: "nome_fantasia", label: "Nome Fantasia", example: "Empresa" },
  { key: "cnpj", label: "CNPJ", example: "12345678000199" },
  { key: "endereco_completo", label: "Endereço", example: "Rua ABC, 123" },
  { key: "cidade", label: "Cidade", example: "São Paulo" },
  { key: "estado", label: "UF", example: "SP" },
  { key: "cep", label: "CEP", example: "01234567" },
  { key: "contato_nome", label: "Contato", example: "João" },
  { key: "contato_email", label: "Email", example: "joao@empresa.com" },
  { key: "contato_telefone", label: "Telefone", example: "11999999999" },
];

interface Cliente {
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
  horario_entrega: string | null;
  restricoes_entrega: string | null;
  created_at: string;
  total_entregas?: number;
  entregas_pendentes?: number;
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
  horario_entrega: "",
  restricoes_entrega: "",
};

// Configuração de filtros - formato correto como objeto
const filterConfig: FilterConfig<Cliente> = {
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

export default function Clientes() {
  const qc = useQueryClient();
  const [dlgCreate, setDlgCreate] = useState(false);
  const [dlgEdit, setDlgEdit] = useState(false);
  const [dlgView, setDlgView] = useState(false);
  const [dlgDel, setDlgDel] = useState(false);
  const [sel, setSel] = useState<Cliente | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [dlgImport, setDlgImport] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();

  const {
    data: list = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .is("deleted_at", null)
        .order("razao_social")
        .limit(1000);

      if (error) throw error;

      const { data: entregas } = await supabase
        .from("entregas")
        .select("cliente_id, status")
        .is("deleted_at", null)
        .limit(2000);

      return (data || []).map((c) => {
        const ec = entregas?.filter((e) => e.cliente_id === c.id) || [];
        const pend = ec.filter(
          (e) => !["entregue", "finalizado"].includes(e.status),
        ).length;
        return { ...c, total_entregas: ec.length, entregas_pendentes: pend };
      }) as Cliente[];
    },
  });

  // Hook de Filtros
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

  // Hook de Ordenação
  const { sortedData, toggleSort, getSortDirection } = useSorting(
    filteredData,
    {
      defaultKey: "razao_social",
      defaultDirection: "asc",
    },
  );

  // Hook de Paginação
  const pagination = usePagination(sortedData, { initialPageSize: 12 });

  // Hook de Seleção para Bulk Actions
  const {
    selectedIds,
    toggle,
    selectAll,
    clearSelection,
    isSelected,
  } = useSelection(pagination.paginatedData);

  const createMut = useMutation({
    mutationFn: async (d: typeof emptyForm) => {
      const { error } = await supabase.from("clientes").insert({
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
        horario_entrega: d.horario_entrega || null,
        restricoes_entrega: d.restricoes_entrega || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] });
      setDlgCreate(false);
      setForm(emptyForm);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      toast.success("Cliente cadastrado!");
    },
    onError: (e) => toast.error("Erro ao cadastrar: " + e.message),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, d }: { id: string; d: typeof emptyForm }) => {
      const { error } = await supabase
        .from("clientes")
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
          horario_entrega: d.horario_entrega || null,
          restricoes_entrega: d.restricoes_entrega || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] });
      setDlgEdit(false);
      setSel(null);
      toast.success("Cliente atualizado!");
    },
    onError: (e) => toast.error("Erro ao atualizar: " + e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("clientes")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] });
      setDlgDel(false);
      setSel(null);
      toast.success("Cliente movido para lixeira!");
    },
    onError: (e) => toast.error("Erro ao remover: " + e.message),
  });

  const bulkDeleteMut = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("clientes")
        .update({ deleted_at: new Date().toISOString() })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clientes"] });
      clearSelection();
      toast.success(`${selectedIds.length} cliente(s) movidos para lixeira!`);
    },
    onError: (e) => toast.error("Erro ao remover: " + e.message),
  });

  const openEdit = (c: Cliente) => {
    setSel(c);
    setForm({
      razao_social: c.razao_social,
      nome_fantasia: c.nome_fantasia || "",
      cnpj: c.cnpj || "",
      endereco_completo: c.endereco_completo,
      cidade: c.cidade || "",
      estado: c.estado || "",
      cep: c.cep || "",
      contato_nome: c.contato_nome || "",
      contato_email: c.contato_email || "",
      contato_telefone: c.contato_telefone || "",
      horario_entrega: c.horario_entrega || "",
      restricoes_entrega: c.restricoes_entrega || "",
    });
    setDlgEdit(true);
  };

  const stats = {
    total: list.length,
    com: list.filter((c) => (c.total_entregas || 0) > 0).length,
    pend: list.filter((c) => (c.entregas_pendentes || 0) > 0).length,
    tot: list.reduce((a, c) => a + (c.total_entregas || 0), 0),
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
      <div className="border-t pt-4">
        <p className="text-sm font-medium mb-3">Preferências de Entrega</p>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Horário Preferencial</Label>
            <Input
              placeholder="Ex: 08:00 às 17:00"
              value={form.horario_entrega}
              onChange={(e) =>
                setForm({ ...form, horario_entrega: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>Restrições</Label>
            <Textarea
              placeholder="Restrições ou observações para entrega"
              value={form.restricoes_entrega}
              onChange={(e) =>
                setForm({ ...form, restricoes_entrega: e.target.value })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <div className="space-y-8 max-w-[1600px] mx-auto pb-12 p-6">
        {showConfetti && (
          <Confetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={200}
            gravity={0.3}
          />
        )}

        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between px-2">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white flex items-center gap-4 tracking-tighter uppercase italic">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black border border-white/10 shadow-2xl transition-transform hover:scale-110">
                  <Users className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="drop-shadow-2xl">Base Clientes</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                    <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                      Customer_Nexus_Central
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">
                    CRM LOGÍSTICO • SYNC BITRIX24
                  </span>
                </div>
              </div>
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <RTECustomerSync
              onCustomerFound={(data) => {
                setForm({
                  ...emptyForm,
                  razao_social: (data.Name as string) || "",
                  nome_fantasia: (data.TradeName as string) || "",
                  cnpj: (data.TaxIdRegistration as string) || "",
                  endereco_completo: (data.Address as string) || "",
                });
                setDlgCreate(true);
              }}
            />
            <Button
              variant="outline"
              size="lg"
              onClick={() => setDlgImport(true)}
              className="h-14 px-8 rounded-2xl border-white/10 bg-black/40 backdrop-blur-xl font-black uppercase tracking-widest text-[11px] gap-3 hover:bg-white/5 transition-all"
            >
              <Upload className="w-4 h-4 text-primary" /> Importar
            </Button>
            <Button
              size="lg"
              onClick={() => {
                setForm(emptyForm);
                setDlgCreate(true);
              }}
              className="h-14 px-8 rounded-2xl bg-primary text-black hover:bg-primary/90 font-black uppercase tracking-widest text-[11px] gap-3 transition-all shadow-lg shadow-primary/20"
            >
              <Plus className="w-5 h-5" /> Novo Cliente
            </Button>
          </div>
        </div>

        <StaggeredContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StaggeredItem>
            <StatsCard
              title="Total"
              value={stats.total}
              icon={Users}
              color="primary"
            />
          </StaggeredItem>
          <StaggeredItem>
            <StatsCard
              title="Com Entregas"
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
              title="Total Entregas"
              value={stats.tot}
              icon={Package}
              color="info"
            />
          </StaggeredItem>
        </StaggeredContent>

        {/* Barra de Filtros */}
        <OnboardingTooltip
          id="clientes-filtros"
          title="Filtros Avançados"
          description="Use a barra de busca e filtros para encontrar clientes rapidamente. Você pode filtrar por nome, CNPJ, cidade e estado."
          position="bottom"
          delay={2000}
        >
          <FilterBar
            search={filters.search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por nome, CNPJ, cidade..."
            extraFilters={[
              {
                key: "estado",
                label: "Estado",
                value: (filters.estado as string) || "all",
                options: UFS.map((uf) => ({ value: uf, label: uf })),
                onChange: (value) =>
                  setFilter("estado", value === "all" ? undefined : value),
              },
            ]}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
            totalFiltered={totalFiltered}
            totalOriginal={totalOriginal}
          />
        </OnboardingTooltip>

        {/* Ordenação */}
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
            onClick={() => toggleSort("total_entregas")}
            className="gap-1"
          >
            Entregas <SortIcon dir={getSortDirection("total_entregas")} />
          </Button>
        </div>

        {/* Bulk Actions */}
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
                confirmTitle: "Excluir clientes selecionados?",
                confirmDescription: (count) =>
                  `Você está prestes a excluir ${count} cliente(s). Esta ação não pode ser desfeita.`,
                confirmTyping: "EXCLUIR",
              },
            ]}
          />
        )}

        {isLoading && <SkeletonTable rows={6} cols={4} />}

        {!isLoading && (
          <StaggeredContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pagination.paginatedData.map((c, i) => (
              <StaggeredItem key={c.id}>
                <div
                  className={`card-interactive animate-fade-in ${isSelected(c.id) ? "ring-2 ring-primary" : ""}`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <Checkbox
                      checked={isSelected(c.id)}
                      onCheckedChange={() => toggle(c.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-semibold text-lg truncate cursor-pointer hover:text-primary transition-colors flex items-center gap-1"
                        onClick={() => {
                          const text = c.nome_fantasia || c.razao_social;
                          navigator.clipboard.writeText(text);
                          toast.success(`Copiado: ${text}`);
                        }}
                        title="Clique para copiar"
                      >
                        {c.nome_fantasia || c.razao_social}
                        <Copy className="w-3 h-3 opacity-50" />
                      </p>
                      {c.nome_fantasia && (
                        <p className="text-xs text-muted-foreground truncate">
                          {c.razao_social}
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
                            setSel(c);
                            setDlgView(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEdit(c)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSel(c);
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
                    {c.cnpj && (
                      <div
                        className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors group"
                        onClick={() => {
                          navigator.clipboard.writeText(c.cnpj!);
                          toast.success(`CNPJ ${fmtCNPJ(c.cnpj!)} copiado`);
                        }}
                        title="Copiar CNPJ"
                      >
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono">{fmtCNPJ(c.cnpj)}</span>
                        <Copy className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                      </div>
                    )}
                    {c.contato_nome && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        {c.contato_nome}
                      </div>
                    )}
                    {c.contato_telefone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        {c.contato_telefone}
                      </div>
                    )}
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4 mt-0.5" />
                      <div
                        className="cursor-pointer hover:text-primary transition-colors group"
                        onClick={() => {
                          navigator.clipboard.writeText(c.endereco_completo);
                          toast.success("Endereço copiado");
                        }}
                        title="Copiar endereço"
                      >
                        <p className="line-clamp-2">{c.endereco_completo}</p>
                        {c.cidade && (
                          <p className="font-medium text-foreground flex items-center gap-1">
                            {c.cidade} - {c.estado}{" "}
                            <Copy className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                          </p>
                        )}
                      </div>
                    </div>
                    {c.horario_entrega && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{c.horario_entrega}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">
                        {c.total_entregas || 0}
                      </span>
                      {(c.entregas_pendentes || 0) > 0 && (
                        <Badge
                          variant="outline"
                          className="bg-warning/10 text-warning"
                        >
                          {c.entregas_pendentes} pend.
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </StaggeredItem>
            ))}
          </StaggeredContent>
        )}

        {!isLoading && sortedData.length === 0 && (
          <div className="card-base flex flex-col items-center py-12">
            <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nenhum cliente</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setDlgCreate(true)}
            >
              Cadastrar
            </Button>
          </div>
        )}

        {/* Paginação */}
        {!isLoading && sortedData.length > 0 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
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
      </div>

      {/* Dialogs */}
      <Dialog open={dlgCreate} onOpenChange={setDlgCreate}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{sel?.nome_fantasia || sel?.razao_social}</DialogTitle>
          </DialogHeader>
          {sel && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Razão Social</p>
                  <p className="font-medium">{sel.razao_social}</p>
                </div>
                {sel.cnpj && (
                  <div>
                    <p className="text-sm text-muted-foreground">CNPJ</p>
                    <p className="font-mono">{fmtCNPJ(sel.cnpj)}</p>
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Endereço</p>
                <p>{sel.endereco_completo}</p>
                {sel.cidade && (
                  <p className="font-medium">
                    {sel.cidade} - {sel.estado} {sel.cep}
                  </p>
                )}
              </div>
              {sel.contato_nome && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Contato</p>
                  <p>{sel.contato_nome}</p>
                  {sel.contato_email && (
                    <p className="text-muted-foreground">{sel.contato_email}</p>
                  )}
                  {sel.contato_telefone && (
                    <p className="text-muted-foreground">
                      {sel.contato_telefone}
                    </p>
                  )}
                </div>
              )}
              {(sel.horario_entrega || sel.restricoes_entrega) && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">
                    Preferências de Entrega
                  </p>
                  {sel.horario_entrega && <p>Horário: {sel.horario_entrega}</p>}
                  {sel.restricoes_entrega && (
                    <p className="text-muted-foreground">
                      {sel.restricoes_entrega}
                    </p>
                  )}
                </div>
              )}
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>Entregas: {sel.total_entregas || 0}</span>
                {(sel.entregas_pendentes || 0) > 0 && (
                  <Badge
                    variant="outline"
                    className="bg-warning/10 text-warning"
                  >
                    {sel.entregas_pendentes} pendentes
                  </Badge>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={dlgDel} onOpenChange={setDlgDel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O cliente "
              {sel?.nome_fantasia || sel?.razao_social}" será excluído
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sel && deleteMut.mutate(sel.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMut.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImportDialog open={dlgImport} onOpenChange={setDlgImport}>
        <ImportDialogContent className="max-w-lg">
          <ImportDialogHeader>
            <ImportDialogTitle>Importar Clientes via CSV</ImportDialogTitle>
          </ImportDialogHeader>
          <CSVImporter
            schema={clienteCSVSchema}
            columns={clienteCSVColumns}
            templateName="clientes_template"
            onImport={async (data) => {
              const rows = (data as Array<Record<string, string | null | undefined>>).map((d) => ({
                razao_social: d.razao_social ?? "",

                nome_fantasia: d.nome_fantasia || null,
                cnpj: d.cnpj || null,
                endereco_completo: d.endereco_completo ?? "",

                cidade: d.cidade || null,
                estado: d.estado || null,
                cep: d.cep || null,
                contato_nome: d.contato_nome || null,
                contato_email: d.contato_email || null,
                contato_telefone: d.contato_telefone || null,
              }));
              const { error } = await supabase.from("clientes").insert(rows);
              if (error) throw error;
              qc.invalidateQueries({ queryKey: ["clientes"] });
              toast.success(`${rows.length} clientes importados!`);
              setDlgImport(false);
            }}
          />
        </ImportDialogContent>
      </ImportDialog>
    </MainLayout>
  );
}
