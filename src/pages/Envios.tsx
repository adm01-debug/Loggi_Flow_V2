/* eslint-disable max-lines */
import { useState, useCallback } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { SortIcon } from "@/components/common/SortIcon";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Send,
  Plus,
  MapPin,
  Clock,
  Package,
  MoreVertical,
  Eye,
  Trash2,
  User,
  CheckCircle2,
  Truck,
  AlertTriangle,
  FileText,
  DollarSign,
  Calendar,
  Loader2,
  LucideIcon,
  FileDown,
  RefreshCw,
  QrCode,
  Copy,
  Printer,
} from "lucide-react";
import {
  MaterialLabelPrinter,
  LabelPreview,
  type LabelData,
} from "@/components/labels";
import { useRodonavesTracking } from "@/hooks/logistics/useRodonavesTracking";
import { ScannerButton } from "@/components/scanner/ScannerButton";
import { DocumentUploadField } from "@/components/common/DocumentUploadField";
import { ScanResult } from "@/hooks/ui/useQRScanner";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

import { useAudioFeedback } from "@/hooks/notifications/useAudioFeedback";
import { useRuleTriggers } from "@/hooks/logistics/useRuleTriggers";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

// Novos hooks e componentes
import { Pagination } from "@/components/common/Pagination";
import { FilterBar } from "@/components/common/FilterBar";
import { BulkActions } from "@/components/common/BulkActions";
import { useSelection } from "@/hooks/common/useSelection";
import { OnboardingTooltip } from "@/components/onboarding/OnboardingTooltip";
import { usePagination } from "@/hooks/common/usePagination";
import { useFilters, FilterConfig } from "@/hooks/common/useFilters";
import { useSorting } from "@/hooks/common/useSorting";
import { useRealtime } from "@/hooks/data/useRealtime";
import { SkeletonTable } from "@/components/ui/skeleton";

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
  nf_remessa_url: string | null;
  comprovante_entrega_url: string | null;
  observacoes: string | null;
  created_at: string;
  cliente: {
    id: string;
    razao_social: string;
    nome_fantasia: string | null;
  } | null;
  transportadora: { id: string; nome_fantasia: string } | null;
}

const statusConfig: Record<
  EntregaStatus,
  { label: string; color: string; icon: LucideIcon }
> = {
  aguardando_producao: {
    label: "Aguard. Produção",
    color: "bg-muted text-muted-foreground",
    icon: Clock,
  },
  pronto_despacho: {
    label: "Pronto Despacho",
    color: "bg-primary/15 text-primary",
    icon: Package,
  },
  cotacao_frete: {
    label: "Cotação Frete",
    color: "bg-accent text-accent-foreground",
    icon: DollarSign,
  },
  nf_emitida: {
    label: "NF Emitida",
    color: "bg-primary/20 text-primary",
    icon: FileText,
  },
  despachado: {
    label: "Despachado",
    color: "bg-primary/10 text-primary",
    icon: Send,
  },
  em_transito: {
    label: "Em Trânsito",
    color: "bg-warning/15 text-warning",
    icon: Truck,
  },
  saiu_entrega: {
    label: "Saiu p/ Entrega",
    color: "bg-warning/20 text-warning",
    icon: Truck,
  },
  entregue: {
    label: "Entregue",
    color: "bg-success/15 text-success",
    icon: CheckCircle2,
  },
  ocorrencia: {
    label: "Ocorrência",
    color: "bg-destructive/15 text-destructive",
    icon: AlertTriangle,
  },
  finalizado: {
    label: "Finalizado",
    color: "bg-success/20 text-success",
    icon: CheckCircle2,
  },
};

// Rodonaves integration actions for entrega detail
function RodonavesActions({ entrega }: { entrega: Entrega }) {
  const {
    track,
    isTracking,
    trackingResult,
    getDeliveryProof,
    isLoadingProof,
    deliveryProof,
  } = useRodonavesTracking();

  const isRodonaves =
    entrega.transportadora?.nome_fantasia
      ?.toLowerCase()
      .includes("rodonaves") ||
    entrega.transportadora?.nome_fantasia?.toLowerCase().includes("rte");

  if (!isRodonaves || !entrega.nf_remessa) return null;

  const cnpjRemetente = ""; // Will use env var in edge function

  return (
    <div className="border-t pt-4 space-y-3">
      <p className="text-sm font-semibold flex items-center gap-2">
        <Truck className="w-4 h-4 text-primary" />
        Rodonaves RTE
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            track({ nfNumero: entrega.nf_remessa!, cnpjRemetente })
          }
          disabled={isTracking}
        >
          {isTracking ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-1" />
          )}
          Atualizar Rastreio
        </Button>
        {(entrega.status === "entregue" || entrega.status === "finalizado") && (
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              getDeliveryProof({ nfNumero: entrega.nf_remessa!, cnpjRemetente })
            }
            disabled={isLoadingProof}
          >
            {isLoadingProof ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4 mr-1" />
            )}
            Comprovante
          </Button>
        )}
      </div>
      {trackingResult?.data?.Tracking &&
        trackingResult.data.Tracking.length > 0 && (
          <div className="text-xs space-y-1 max-h-40 overflow-y-auto bg-muted/50 rounded-lg p-3">
            {trackingResult.data.Tracking.map(
              (
                evt: {
                  DataOcorrencia: string;
                  HoraOcorrencia: string;
                  DescricaoOcorrencia: string;
                  Cidade: string;
                  UF: string;
                },
                i: number,
              ) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-muted-foreground shrink-0">
                    {evt.DataOcorrencia} {evt.HoraOcorrencia}
                  </span>
                  <span>
                    {evt.DescricaoOcorrencia} — {evt.Cidade}/{evt.UF}
                  </span>
                </div>
              ),
            )}
          </div>
        )}
      {deliveryProof?.data && (
        <div className="text-xs bg-muted/50 rounded-lg p-3">
          <p className="font-medium mb-1">Comprovante disponível</p>
          {deliveryProof.data.ImagemComprovante && (
            <a
              href={`data:image/png;base64,${deliveryProof.data.ImagemComprovante}`}
              download="comprovante.png"
              className="text-primary underline"
            >
              Baixar comprovante
            </a>
          )}
        </div>
      )}
    </div>
  );
}

const filterConfig: FilterConfig<Entrega> = {
  search: {
    fields: [
      "numero_entrega",
      "endereco_entrega",
      "nf_remessa",
      "codigo_rastreamento",
    ],
    placeholder: "Buscar entregas...",
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
  cliente_id: "",
  endereco_entrega: "",
  contato_cliente: "",
  tipo_frete: "cif" as FreteType,
  transportadora_id: "",
  previsao_entrega: "",
  observacoes: "",
};

export default function Envios() {
  const qc = useQueryClient();
  const { onStatusChange } = useRuleTriggers();
  const [dlgCreate, setDlgCreate] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [dlgView, setDlgView] = useState(false);
  const [dlgDel, setDlgDel] = useState(false);
  const [sel, setSel] = useState<Entrega | null>(null);
  const [previewLabel, setPreviewLabel] = useState<LabelData | null>(null);
  const [printMode, setPrintMode] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();
  const [form, setForm] = useState(emptyForm);
  const { playSuccess, playError, playWhoosh } = useAudioFeedback();

  const {
    data: list = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["entregas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entregas")
        .select(
          `id, numero_entrega, endereco_entrega, contato_cliente, status,
           codigo_rastreamento, previsao_entrega, data_entrega_efetiva,
           tipo_frete, valor_frete, nf_remessa, nf_remessa_url,
           comprovante_entrega_url, observacoes, created_at,
           cliente:clientes(id, razao_social, nome_fantasia),
           transportadora:transportadoras(id, nome_fantasia)`,
        )
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as Entrega[];
    },
  });

  const { data: clientes = [] } = useQuery({
    queryKey: ["clientes-select"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clientes")
        .select(
          "id, razao_social, nome_fantasia, endereco_completo, contato_telefone",
        )
        .is("deleted_at", null)
        .order("razao_social")
        .limit(500);
      return data || [];
    },
  });
  const { data: transportadoras = [] } = useQuery({
    queryKey: ["transportadoras-select"],
    queryFn: async () => {
      const { data } = await supabase
        .from("transportadoras")
        .select("id, nome_fantasia")
        .is("deleted_at", null)
        .order("nome_fantasia")
        .limit(200);
      return data || [];
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
  } = useFilters(list, filterConfig);

  const handleClearFilters = () => {
    playWhoosh();
    clearFilters();
  };
  const { sortedData, toggleSort, getSortDirection } = useSorting(
    filteredData,
    { defaultKey: "created_at", defaultDirection: "desc" },
  );
  const pagination = usePagination(sortedData, { initialPageSize: 10 });
  const { selectedIds, toggle, selectAll, clearSelection, isSelected } =
    useSelection(pagination.paginatedData);

  // Realtime — referencias estaveis: arrow inline reassina o canal a cada render
  // (contrato em src/hooks/data/useRealtime.tsx).
  const onEntregaRealtime = useCallback(() => {
    refetch();
  }, [refetch]);

  useRealtime({
    table: "entregas",
    onInsert: onEntregaRealtime,
    onUpdate: onEntregaRealtime,
    onDelete: onEntregaRealtime,
  });

  const createMut = useMutation({
    mutationFn: async (d: typeof emptyForm) => {
      const numero = `ENT-${Date.now().toString().slice(-8)}`;
      const { error } = await supabase.from("entregas").insert({
        numero_entrega: numero,
        cliente_id: d.cliente_id || null,
        endereco_entrega: d.endereco_entrega,
        contato_cliente: d.contato_cliente || null,
        tipo_frete: d.tipo_frete,
        transportadora_id: d.transportadora_id || null,
        previsao_entrega: d.previsao_entrega || null,
        observacoes: d.observacoes || null,
        status: "aguardando_producao",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entregas"] });
      setDlgCreate(false);
      setForm(emptyForm);
      playSuccess();
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      toast.success("Entrega criada!");
    },
    onError: (e) => {
      playError();
      toast.error("Erro: " + e.message);
    },
  });

  const updateStatusMut = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: EntregaStatus;
    }) => {
      const update: { status: EntregaStatus; data_entrega_efetiva?: string } = {
        status,
      };
      if (status === "entregue")
        update.data_entrega_efetiva = new Date().toISOString();
      const { error } = await supabase
        .from("entregas")
        .update(update)
        .eq("id", id);
      if (error) throw error;

      await onStatusChange("entrega", id, { status });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entregas"] });
      playSuccess();
      toast.success("Status atualizado!");
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("entregas")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entregas"] });
      setDlgDel(false);
      setSel(null);
      toast.success("Excluído!");
    },
  });

  const bulkUpdateStatus = async (ids: string[], status: EntregaStatus) => {
    const { error } = await supabase
      .from("entregas")
      .update({ status })
      .in("id", ids);
    if (error) toast.error("Erro: " + error.message);
    else {
      qc.invalidateQueries({ queryKey: ["entregas"] });
      clearSelection();
      toast.success(`${ids.length} entrega(s) atualizada(s)!`);
      for (const id of ids) {
        await onStatusChange("entrega", id, { status });
      }
    }
  };

  const handleClienteChange = (id: string) => {
    const cliente = clientes.find((c) => c.id === id);
    if (cliente)
      setForm({
        ...form,
        cliente_id: id,
        endereco_entrega: cliente.endereco_completo || "",
        contato_cliente: cliente.contato_telefone || "",
      });
  };

  const handlePrintLabel = (e: Entrega) => {
    const labelData: LabelData = {
      id: e.id,
      codigo: e.numero_entrega,
      descricao: e.nf_remessa ? `NF ${e.nf_remessa}` : e.numero_entrega,
      nfRemessa: e.nf_remessa || undefined,
      cliente: e.cliente?.nome_fantasia || e.cliente?.razao_social || undefined,
      destino: e.endereco_entrega,
      dataDespacho: e.created_at,
      transportadora: e.transportadora?.nome_fantasia || undefined,
      status: e.status,
    };
    setPreviewLabel(labelData);
  };

  const handleConfirmPrint = () => {
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 500);
  };

  const stats = {
    total: list.length,
    transito: list.filter((e) =>
      ["em_transito", "saiu_entrega"].includes(e.status),
    ).length,
    entregues: list.filter((e) => e.status === "entregue").length,
    ocorrencias: list.filter((e) => e.status === "ocorrencia").length,
  };

  if (error)
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <EmptyState
            variant="error"
            title="Erro ao carregar entregas"
            description={
              error?.message ||
              "Não foi possível carregar entregas. Tente novamente."
            }
            action={{ label: "Tentar novamente", onClick: () => refetch() }}
          />
        </div>
      </MainLayout>
    );

  return (
    <MainLayout>
      <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
        {showConfetti && (
          <Confetti
            width={width}
            height={height}
            recycle={false}
            numberOfPieces={200}
            gravity={0.3}
          />
        )}
        <div className="space-y-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between px-2">
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white flex items-center gap-4 tracking-tighter uppercase italic">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black border border-white/10 shadow-2xl transition-transform hover:scale-110">
                    <Send className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-pulse" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="drop-shadow-2xl">Envios de Elite</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                      <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                      <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                        Last_Mile_Command
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">
                      SMART EXPEDITION • NEXUS FLOW
                    </span>
                  </div>
                </div>
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant={showLabels ? "default" : "outline"}
                size="lg"
                onClick={() => setShowLabels(!showLabels)}
                className="h-14 px-8 rounded-2xl border-white/10 bg-black/40 backdrop-blur-xl font-black uppercase tracking-widest text-[11px] gap-3 hover:bg-white/5 transition-all"
              >
                <QrCode className="w-4 h-4 text-primary" />
                Etiquetas
              </Button>
              <ScannerButton
                onScan={(result: ScanResult) => {
                  const entrega = list.find(
                    (e) =>
                      e.codigo_rastreamento === result.text ||
                      e.numero_entrega === result.text,
                  );
                  if (entrega) {
                    setSel(entrega);
                    setDlgView(true);
                  } else {
                    toast.error(`Código não encontrado: ${result.text}`);
                  }
                }}
                variant="outline"
                className="h-14 w-14 rounded-2xl border-white/10 bg-black/40 backdrop-blur-xl transition-all hover:bg-white/5"
              />
              <Button
                size="lg"
                onClick={() => {
                  setForm(emptyForm);
                  setDlgCreate(true);
                }}
                className="h-14 px-8 rounded-2xl bg-primary text-black hover:bg-primary/90 font-black uppercase tracking-widest text-[11px] gap-3 transition-all shadow-lg shadow-primary/20"
              >
                <Plus className="w-5 h-5" /> Novo Envio
              </Button>
            </div>
          </div>
        </div>

        {showLabels && <MaterialLabelPrinter />}

        <OnboardingTooltip
          id="envios-stats"
          title="Estatísticas de Envios"
          description="Acompanhe o resumo das suas entregas: total, em trânsito, entregues e ocorrências. Clique nos cards para filtrar."
          position="bottom"
          delay={1500}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-1000 delay-200">
            <div className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-card to-card/90 shadow-xl border-none transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                  <Send className="w-6 h-6" />
                </div>
                <p className="text-3xl font-black tracking-tighter tabular-nums">
                  {stats.total}
                </p>
              </div>
              <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                Total Geral
              </p>
            </div>
            <div className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-card to-card/90 shadow-xl border-none transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 rounded-2xl bg-warning/10 text-warning group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                  <Truck className="w-6 h-6" />
                </div>
                <p className="text-3xl font-black tracking-tighter tabular-nums text-warning">
                  {stats.transito}
                </p>
              </div>
              <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                Em Trânsito
              </p>
            </div>
            <div className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-card to-card/90 shadow-xl border-none transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 rounded-2xl bg-success/10 text-success group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-3xl font-black tracking-tighter tabular-nums text-success">
                  {stats.entregues}
                </p>
              </div>
              <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                Entregues_OK
              </p>
            </div>
            <div className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-card to-card/90 shadow-xl border-none transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 rounded-2xl bg-destructive/10 text-destructive group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <p className="text-3xl font-black tracking-tighter tabular-nums text-destructive">
                  {stats.ocorrencias}
                </p>
              </div>
              <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                Ocorrências_Delta
              </p>
            </div>
          </div>
        </OnboardingTooltip>

        <FilterBar
          search={filters.search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar entregas..."
          status={filters.status}
          onStatusChange={setStatus}
          statusOptions={filterConfig.status?.options}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearFilters}
          totalFiltered={totalFiltered}
          totalOriginal={totalOriginal}
        />

        <div className="flex items-center gap-2 text-sm overflow-x-auto pb-1 scrollbar-none">
          <span className="text-muted-foreground shrink-0">Ordenar:</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSort("created_at")}
            className="gap-1 shrink-0"
          >
            Data <SortIcon dir={getSortDirection("created_at")} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSort("status")}
            className="gap-1 shrink-0"
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
            ]}
          />
        )}

        {isLoading && <SkeletonTable rows={5} cols={5} />}

        {!isLoading && (
          <div className="grid grid-cols-1 gap-4">
            {pagination.paginatedData.map((e, i) => {
              const config = statusConfig[e.status];
              const StatusIcon = config.icon;
              return (
                <div
                  key={e.id}
                  className={cn(
                    "group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-card to-card/95 border-none shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4",
                    isSelected(e.id) ? "ring-2 ring-primary bg-primary/5" : "",
                  )}
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-5 flex-1">
                      <Checkbox
                        checked={isSelected(e.id)}
                        onCheckedChange={() => toggle(e.id)}
                        className="mt-4 rounded-md h-5 w-5 border-2"
                      />
                      <div
                        className={cn(
                          "p-4 rounded-2xl transition-all shadow-inner group-hover:scale-110 duration-500",
                          config.color,
                        )}
                      >
                        <StatusIcon className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-1.5">
                          <span
                            className="font-black text-xl tracking-tighter uppercase italic cursor-pointer hover:text-primary transition-colors flex items-center gap-2 group/code"
                            onClick={() => {
                              navigator.clipboard.writeText(e.numero_entrega);
                              toast.success(`Copiado: ${e.numero_entrega}`);
                            }}
                          >
                            {e.numero_entrega}
                            <Copy className="w-4 h-4 opacity-0 group-hover/code:opacity-100 transition-opacity" />
                          </span>
                          <Badge
                            className={cn(
                              "px-4 py-1.5 font-black uppercase tracking-widest text-[10px] rounded-xl shadow-sm",
                              config.color,
                            )}
                          >
                            {config.label}
                          </Badge>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {e.cliente && (
                            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-tight text-foreground/80">
                              <User className="w-4 h-4 text-primary" />
                              {e.cliente.nome_fantasia ||
                                e.cliente.razao_social}
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-tight">
                            <MapPin className="w-4 h-4 text-primary/60" />
                            <span className="truncate max-w-[250px]">
                              {e.endereco_entrega}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-6 lg:gap-10 flex-[1.5] bg-sidebar-accent/30 p-4 rounded-2xl border border-border/50 backdrop-blur-sm">
                      <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground/80">
                        <div className="p-2 rounded-lg bg-background shadow-sm">
                          <Calendar className="w-4 h-4 text-primary" />
                        </div>
                        <span className="uppercase text-[11px] tracking-tight">
                          {e.previsao_entrega &&
                          isValid(new Date(e.previsao_entrega))
                            ? format(new Date(e.previsao_entrega), "dd MMM", {
                                locale: ptBR,
                              })
                            : "S/ PREVISÃO"}
                        </span>
                      </div>
                      {e.transportadora && (
                        <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground/80">
                          <div className="p-2 rounded-lg bg-background shadow-sm">
                            <Truck className="w-4 h-4 text-primary" />
                          </div>
                          <span className="uppercase text-[11px] tracking-tight truncate max-w-[120px]">
                            {e.transportadora.nome_fantasia}
                          </span>
                        </div>
                      )}
                      {e.nf_remessa && (
                        <div
                          className="flex items-center gap-3 text-sm font-bold text-primary cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            navigator.clipboard.writeText(e.nf_remessa!);
                            toast.success(`NF ${e.nf_remessa} copiada`);
                          }}
                        >
                          <div className="p-2 rounded-lg bg-primary/10 shadow-sm">
                            <FileText className="w-4 h-4" />
                          </div>
                          <span className="uppercase text-[11px] font-black tracking-widest">
                            NF {e.nf_remessa}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-12 w-12 rounded-xl hover:bg-white/5"
                          >
                            <MoreVertical className="w-5 h-5 text-white/40" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-56 p-2 rounded-2xl border-2 border-primary/5 shadow-2xl"
                        >
                          <DropdownMenuItem
                            className="rounded-xl h-11 font-bold gap-2"
                            onClick={() => {
                              setSel(e);
                              setDlgView(true);
                            }}
                          >
                            <Eye className="w-4 h-4 text-primary" /> Ver
                            Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="rounded-xl h-11 font-bold gap-2"
                            onClick={() => handlePrintLabel(e)}
                          >
                            <Printer className="w-4 h-4 text-primary" />{" "}
                            Imprimir Etiqueta
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-2" />
                          {e.status === "aguardando_producao" && (
                            <DropdownMenuItem
                              className="rounded-xl h-11 font-bold bg-primary/5 text-primary"
                              onClick={() =>
                                updateStatusMut.mutate({
                                  id: e.id,
                                  status: "pronto_despacho",
                                })
                              }
                            >
                              Pronto Despacho
                            </DropdownMenuItem>
                          )}
                          {e.status === "despachado" && (
                            <DropdownMenuItem
                              className="rounded-xl h-11 font-bold bg-warning/5 text-warning"
                              onClick={() =>
                                updateStatusMut.mutate({
                                  id: e.id,
                                  status: "em_transito",
                                })
                              }
                            >
                              Em Trânsito
                            </DropdownMenuItem>
                          )}
                          {e.status === "em_transito" && (
                            <DropdownMenuItem
                              className="rounded-xl h-11 font-bold bg-success/5 text-success"
                              onClick={() =>
                                updateStatusMut.mutate({
                                  id: e.id,
                                  status: "entregue",
                                })
                              }
                            >
                              Confirmar Entrega
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator className="my-2" />
                          <DropdownMenuItem
                            className="rounded-xl h-11 font-bold text-destructive hover:bg-destructive/5"
                            onClick={() => {
                              setSel(e);
                              setDlgDel(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Excluir Registro
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && sortedData.length === 0 && (
          <div className="card-base flex flex-col items-center py-12">
            <Send className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nenhuma entrega</p>
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
              <DialogTitle>Nova Entrega</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Cliente</Label>
                <Select
                  value={form.cliente_id}
                  onValueChange={handleClienteChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome_fantasia || c.razao_social}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Endereço *</Label>
                <Textarea
                  value={form.endereco_entrega}
                  onChange={(e) =>
                    setForm({ ...form, endereco_entrega: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Contato</Label>
                  <Input
                    value={form.contato_cliente}
                    onChange={(e) =>
                      setForm({ ...form, contato_cliente: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Tipo Frete</Label>
                  <Select
                    value={form.tipo_frete}
                    onValueChange={(v: FreteType) =>
                      setForm({ ...form, tipo_frete: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cif">CIF</SelectItem>
                      <SelectItem value="fob">FOB</SelectItem>
                      <SelectItem value="cortesia">Cortesia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Transportadora</Label>
                  <Select
                    value={form.transportadora_id}
                    onValueChange={(v) =>
                      setForm({ ...form, transportadora_id: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Opcional" />
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
                <div className="grid gap-2">
                  <Label>Previsão</Label>
                  <Input
                    type="date"
                    value={form.previsao_entrega}
                    onChange={(e) =>
                      setForm({ ...form, previsao_entrega: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Observações</Label>
                <Textarea
                  value={form.observacoes}
                  onChange={(e) =>
                    setForm({ ...form, observacoes: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDlgCreate(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => createMut.mutate(form)}
                disabled={!form.endereco_entrega || createMut.isPending}
              >
                {createMut.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={dlgView} onOpenChange={setDlgView}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{sel?.numero_entrega}</DialogTitle>
            </DialogHeader>
            {sel && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={statusConfig[sel.status].color}>
                    {statusConfig[sel.status].label}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p>
                      {sel.cliente?.nome_fantasia ||
                        sel.cliente?.razao_social ||
                        "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Transportadora
                    </p>
                    <p>{sel.transportadora?.nome_fantasia || "-"}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Endereço</p>
                  <p>{sel.endereco_entrega}</p>
                </div>
                {sel.observacoes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Observações</p>
                    <p>{sel.observacoes}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <DocumentUploadField
                    value={sel.comprovante_entrega_url}
                    onChange={async (url) => {
                      const { error } = await supabase
                        .from("entregas")
                        .update({ comprovante_entrega_url: url })
                        .eq("id", sel.id);
                      if (error) toast.error(error.message);
                      else refetch();
                    }}
                    folder={`entregas/${sel.id}/comprovantes`}
                    label="Comprovante de Entrega"
                  />
                  <DocumentUploadField
                    value={sel.nf_remessa_url}
                    onChange={async (url) => {
                      const { error } = await supabase
                        .from("entregas")
                        .update({ nf_remessa_url: url })
                        .eq("id", sel.id);
                      if (error) toast.error(error.message);
                      else refetch();
                    }}
                    folder={`entregas/${sel.id}/nf`}
                    label="NF Remessa"
                  />
                </div>
                <RodonavesActions entrega={sel} />
              </div>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={dlgDel} onOpenChange={setDlgDel}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir entrega?</AlertDialogTitle>
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

        {/* Modal de Impressão de Etiqueta Individual */}
        <Dialog
          open={!!previewLabel}
          onOpenChange={() => setPreviewLabel(null)}
        >
          <DialogContent className="max-w-fit">
            <DialogHeader>
              <DialogTitle>Imprimir Etiqueta — 10×15cm</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center py-4">
              {previewLabel && <LabelPreview data={previewLabel} />}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setPreviewLabel(null)}>
                Fechar
              </Button>
              <Button onClick={handleConfirmPrint}>
                <Printer className="w-4 h-4 mr-1" /> Imprimir
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Estilo e Conteúdo para Impressão */}
        {printMode && previewLabel && (
          <div className="fixed inset-0 z-[9999] bg-white">
            <LabelPreview data={previewLabel} showBorder={false} />
          </div>
        )}
      </div>
    </MainLayout>
  );
}
