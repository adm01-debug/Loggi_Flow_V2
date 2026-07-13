import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Package,
  Truck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Calendar,
  Download,
  LucideIcon,
  Building2,
  Filter,
  TrendingUp,
  Zap,
  Target,
  History,
  BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

import { useExport } from "@/hooks/common/useExport";
import { cn } from "@/lib/utils";
import { useAudioFeedback } from "@/hooks/notifications/useAudioFeedback";

import { Pagination } from "@/components/common/Pagination";
import { FilterBar } from "@/components/common/FilterBar";
import { VirtualizedList } from "@/components/common/VirtualizedList";
import { RealtimeBadge } from "@/components/common/RealtimeBadge";
import { usePagination } from "@/hooks/common/usePagination";
import { useFilters, FilterConfig } from "@/hooks/common/useFilters";
import { useSorting } from "@/hooks/common/useSorting";
import { useRealtime } from "@/hooks/data/useRealtime";
import { PickupDialog } from "@/components/coletas/PickupDialog";
import { PickupDetailsDialog } from "@/components/coletas/PickupDetailsDialog";

import { Coleta, ColetaStatus } from "@/components/coletas/types";
import { QUERY_STALE_TIME } from "@/lib/queryConfig";
import { motion, AnimatePresence } from "framer-motion";

const statusConfig: Record<
  ColetaStatus,
  { label: string; color: string; icon: LucideIcon }
> = {
  aguardando_liberacao: {
    label: "Aguardando",
    color: "bg-muted text-muted-foreground",
    icon: Clock,
  },
  solicitada: {
    label: "Solicitada",
    color: "bg-primary/15 text-primary",
    icon: Package,
  },
  em_transito: {
    label: "Em Trânsito",
    color: "bg-warning/15 text-warning",
    icon: Truck,
  },
  chegou_expedicao: {
    label: "Na Expedição",
    color: "bg-accent text-accent-foreground",
    icon: Building2,
  },
  conferencia_ok: {
    label: "Conferida",
    color: "bg-success/15 text-success",
    icon: CheckCircle2,
  },
  divergencia: {
    label: "Divergência",
    color: "bg-destructive/15 text-destructive",
    icon: AlertTriangle,
  },
  finalizada: {
    label: "Finalizada",
    color: "bg-success/20 text-success",
    icon: CheckCircle2,
  },
};

export default function Coletas() {
  const { exportToCSV } = useExport();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState<Coleta | null>(null);
  const { playAction } = useAudioFeedback();
  const [activeView, setActiveView] = useState("grid");

  const {
    data: coletas = [],
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ["coletas-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coletas")
        .select(
          "*, fornecedores!fk_coletas_fornecedor(razao_social, nome_fantasia), transportadoras!fk_coletas_transportadora(nome_fantasia)",
        )
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      return data as unknown as Coleta[];
    },
    staleTime: QUERY_STALE_TIME.DYNAMIC,
  });

  useRealtime({ table: "coletas", queryKey: ["coletas-list"] });

  const filterConfig: FilterConfig<Coleta> = {
    search: {
      fields: ["numero_coleta", "endereco_coleta", "observacoes"],
      placeholder: "Buscar coletas...",
    },
    status: {
      field: "status",
      options: Object.entries(statusConfig).map(([k, v]) => ({
        value: k,
        label: v.label,
      })),
      label: "Status",
    },
  };

  const {
    filteredData,
    filters,
    setSearch,
    setStatus,
    totalFiltered,
    totalOriginal,
  } = useFilters(coletas, filterConfig);
  const { sortedData } = useSorting(filteredData, {
    defaultKey: "created_at",
    defaultDirection: "desc",
  });
  const pagination = usePagination(sortedData, { initialPageSize: 10 });

  const stats = useMemo(() => {
    const finalizadas = coletas.filter((c) => c.status === "finalizada");
    const conferidas = coletas.filter(
      (c) => c.status === "conferencia_ok" || c.status === "finalizada",
    );
    const divergencias = coletas.filter(
      (c) => c.status === "divergencia",
    ).length;

    // Simulação de cálculo de OTIF (On-Time In-Full)
    // Em produção, isso viria de cálculos reais entre data_prevista e data_recebimento
    const otif =
      coletas.length > 0
        ? Math.round((conferidas.length / coletas.length) * 100)
        : 0;
    const taxaDivergencia =
      coletas.length > 0
        ? Math.round((divergencias / coletas.length) * 100)
        : 0;

    return {
      total: coletas.length,
      aguardando: coletas.filter((c) => c.status === "aguardando_liberacao")
        .length,
      transito: coletas.filter((c) => c.status === "em_transito").length,
      finalizadas: finalizadas.length,
      otif,
      taxaDivergencia,
      leadTime: "18.4h", // Simulado
    };
  }, [coletas]);

  return (
    <MainLayout>
      <div className="space-y-8 pb-20">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 min-w-0"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/40 shadow-xl shadow-primary/20 group cursor-pointer transition-transform hover:rotate-6">
                <Package className="w-6 h-6 sm:w-9 sm:h-9 text-white animate-pulse" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-foreground tracking-tighter drop-shadow-sm">
                  Coletas
                </h1>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-primary uppercase tracking-[0.2em]">
                    Fluxo de Entrada Nexus
                  </span>
                  <RealtimeBadge isSyncing={loading} className="scale-90" />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-wrap gap-3"
          >
            <div className="bg-sidebar-accent/50 p-1 rounded-xl border border-white/5 flex gap-1 mr-2">
              <Button
                variant={activeView === "grid" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveView("grid")}
                className="h-9 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest gap-2"
              >
                <Filter className="w-3.5 h-3.5" /> Grid
              </Button>
              <Button
                variant={activeView === "insights" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setActiveView("insights")}
                className="h-9 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest gap-2"
              >
                <TrendingUp className="w-3.5 h-3.5" /> Insights
              </Button>
            </div>

            <Button
              variant="outline"
              size="lg"
              onClick={() =>
                exportToCSV(coletas as any, { filename: "coletas" })
              }
              className="h-12 px-6 rounded-xl border-2 font-bold uppercase tracking-widest text-[11px] gap-2 hover:bg-primary/5 transition-all"
            >
              <Download className="w-4 h-4" />{" "}
              <span className="hidden sm:inline">Exportar</span>
            </Button>
            <Button
              size="lg"
              onClick={() => {
                setSelectedPickup(null);
                setIsDialogOpen(true);
              }}
              className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[11px] gap-2 bg-gradient-to-r from-primary via-primary/90 to-primary/80 shadow-xl shadow-primary/20 hover:scale-[1.03] transition-all"
            >
              <Plus className="w-5 h-5" /> Nova Coleta
            </Button>
          </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {activeView === "insights" ? (
            <div className="space-y-6">
              <motion.div
                key="insights"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                <Card className="group relative overflow-hidden p-6 rounded-3xl bg-black/40 border-primary/20 backdrop-blur-xl shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                      <Target className="w-6 h-6" />
                    </div>
                    <Badge className="bg-success/10 text-success border-success/20">
                      +12%
                    </Badge>
                  </div>
                  <p className="text-3xl font-black tracking-tighter text-white">
                    {stats.otif}%
                  </p>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">
                    OTIF Global_Node
                  </p>
                  <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.otif}%` }}
                      className="h-full bg-primary"
                    />
                  </div>
                </Card>

                <Card className="group relative overflow-hidden p-6 rounded-3xl bg-black/40 border-warning/20 backdrop-blur-xl shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-warning/10 text-warning">
                      <History className="w-6 h-6" />
                    </div>
                    <Badge className="bg-warning/10 text-warning border-warning/20">
                      ESTÁVEL
                    </Badge>
                  </div>
                  <p className="text-3xl font-black tracking-tighter text-white">
                    {stats.leadTime}
                  </p>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">
                    Lead Time Médio
                  </p>
                  <p className="text-[9px] text-white/20 mt-2 italic">
                    Coleta ➔ Recebimento_GRID
                  </p>
                </Card>

                <Card className="group relative overflow-hidden p-6 rounded-3xl bg-black/40 border-destructive/20 backdrop-blur-xl shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-destructive/10 text-destructive">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                      -5% REDUÇÃO
                    </Badge>
                  </div>
                  <p className="text-3xl font-black tracking-tighter text-white">
                    {stats.taxaDivergencia}%
                  </p>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">
                    Taxa Divergência
                  </p>
                  <div className="mt-4 flex gap-1">
                    {[40, 60, 45, 80, 50, 30, 20].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        className="flex-1 bg-destructive/40 rounded-t-sm"
                      />
                    ))}
                  </div>
                </Card>

                <Card className="group relative overflow-hidden p-6 rounded-3xl bg-black/40 border-success/20 backdrop-blur-xl shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-success/10 text-success">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <Badge className="bg-success/10 text-success border-success/20">
                      ALTO DESEMPENHO
                    </Badge>
                  </div>
                  <p className="text-3xl font-black tracking-tighter text-white">
                    {stats.finalizadas}
                  </p>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1">
                    Protocolos Finalizados
                  </p>
                  <p className="text-[9px] text-white/20 mt-2 italic">
                    Ciclo completo de logística_REVERSE
                  </p>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                <Card className="lg:col-span-2 p-8 rounded-[2.5rem] bg-black/40 border-white/5 backdrop-blur-2xl shadow-2xl overflow-hidden relative group">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-[0.4em] text-primary mb-1 italic">
                        Performance_Nexus OTIF
                      </h3>
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                        Sincronização de Fluxo Global em Tempo Real
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                      <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                        Live_Feed
                      </span>
                    </div>
                  </div>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={[
                          { name: "Seg", otif: 85, vol: 120 },
                          { name: "Ter", otif: 88, vol: 150 },
                          { name: "Qua", otif: 82, vol: 110 },
                          { name: "Qui", otif: 94, vol: 180 },
                          { name: "Sex", otif: 91, vol: 140 },
                          { name: "Sab", otif: 96, vol: 90 },
                          { name: "Dom", otif: 98, vol: 60 },
                        ]}
                      >
                        <defs>
                          <linearGradient
                            id="colorOtif"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="var(--primary)"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="var(--primary)"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.05)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          stroke="rgba(255,255,255,0.2)"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="rgba(255,255,255,0.2)"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(0,0,0,0.9)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "16px",
                            fontSize: "10px",
                            color: "#fff",
                          }}
                          itemStyle={{
                            color: "var(--primary)",
                            fontWeight: "bold",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="otif"
                          stroke="var(--primary)"
                          strokeWidth={4}
                          fillOpacity={1}
                          fill="url(#colorOtif)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="p-8 rounded-[2.5rem] bg-black/40 border-white/5 backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
                  <h3 className="text-sm font-black uppercase tracking-[0.4em] text-warning mb-8 italic">
                    Distribuição_Volume
                  </h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          {
                            type: "Inbound",
                            val:
                              stats.total -
                              coletas.filter((c) => (c as any).is_reverse)
                                .length,
                          },
                          {
                            type: "Reversa",
                            val: coletas.filter((c) => (c as any).is_reverse)
                              .length,
                          },
                          {
                            type: "Urgente",
                            val: coletas.filter((c) => (c as any).is_urgent)
                              .length,
                          },
                        ]}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.05)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="type"
                          stroke="rgba(255,255,255,0.2)"
                          fontSize={9}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(255,255,255,0.02)" }}
                          contentStyle={{
                            backgroundColor: "rgba(0,0,0,0.9)",
                            border: "none",
                            borderRadius: "12px",
                            fontSize: "10px",
                          }}
                        />
                        <Bar dataKey="val" radius={[8, 8, 0, 0]}>
                          {[0, 1, 2].map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                index === 0
                                  ? "var(--primary)"
                                  : index === 1
                                    ? "#a855f7"
                                    : "#f97316"
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </motion.div>
            </div>
          ) : (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <div className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-card to-card/90 shadow-xl border-none transition-all hover:-translate-y-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                    <Package className="w-6 h-6" />
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
                  <div className="p-3 rounded-2xl bg-muted/20 text-muted-foreground group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                    <Clock className="w-6 h-6" />
                  </div>
                  <p className="text-3xl font-black tracking-tighter tabular-nums text-muted-foreground">
                    {stats.aguardando}
                  </p>
                </div>
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                  Aguardando
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
                    {stats.finalizadas}
                  </p>
                </div>
                <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                  Finalizadas
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <FilterBar
          search={filters.search}
          onSearchChange={setSearch}
          status={filters.status}
          onStatusChange={setStatus}
          statusOptions={Object.entries(statusConfig).map(([k, v]) => ({
            value: k,
            label: v.label,
          }))}
          totalFiltered={totalFiltered}
          totalOriginal={totalOriginal}
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <Zap className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 text-primary animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 min-h-[400px]">
            {pagination.paginatedData.length > 0 ? (
              <VirtualizedList
                items={pagination.paginatedData}
                estimateSize={120}
                className="max-h-[70vh] rounded-xl pr-2"
                renderItem={(c) => {
                  const Icon = statusConfig[c.status]?.icon || Package;
                  const isAtrasado =
                    c.status !== "finalizada" &&
                    c.data_prevista_coleta &&
                    new Date(c.data_prevista_coleta) < new Date();

                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="pb-4"
                    >
                      <Card
                        key={c.id}
                        className={cn(
                          "group relative overflow-hidden rounded-3xl bg-gradient-to-br from-card to-card/95 border-none shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer border-l-4 border-l-transparent hover:border-l-primary",
                          isAtrasado &&
                            "border-l-destructive shadow-destructive/20 bg-destructive/5",
                          c.is_urgent &&
                            "border-l-orange-500 shadow-orange-500/10",
                          c.is_reverse &&
                            "border-l-purple-500 shadow-purple-500/10",
                        )}
                        onClick={() => {
                          playAction();
                          setSelectedPickup(c);
                          setIsDetailsOpen(true);
                        }}
                      >
                        <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-center gap-5 flex-1">
                            <div
                              className={cn(
                                "p-4 rounded-2xl transition-all shadow-inner group-hover:scale-110 duration-500",
                                statusConfig[c.status]?.color,
                              )}
                            >
                              <Icon className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <p className="font-black text-xl tracking-tighter uppercase italic">
                                  {c.numero_coleta}
                                </p>
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] h-5 font-black uppercase tracking-widest px-2 bg-primary/5 text-primary border-primary/10"
                                >
                                  {c.tipo_coleta}
                                </Badge>
                                {c.is_reverse && (
                                  <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 h-5 text-[9px] font-black uppercase tracking-widest px-2">
                                    REVERSA
                                  </Badge>
                                )}
                                {c.is_urgent && (
                                  <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 h-5 text-[9px] font-black uppercase tracking-widest px-2 animate-pulse">
                                    URGENTE
                                  </Badge>
                                )}
                                {isAtrasado && (
                                  <Badge
                                    variant="destructive"
                                    className="animate-pulse h-5 text-[9px] font-black uppercase tracking-widest px-2"
                                  >
                                    ATRASO_SLA
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground font-bold uppercase tracking-tight mt-0.5">
                                {(c.fornecedores as any)?.nome_fantasia ||
                                  (c.fornecedores as any)?.razao_social}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 flex-[2] bg-sidebar-accent/30 p-4 rounded-2xl border border-border/50 backdrop-blur-sm">
                            <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground/80">
                              <div className="p-2 rounded-lg bg-background shadow-sm">
                                <MapPin className="w-4 h-4 text-primary" />
                              </div>
                              <span className="truncate max-w-[150px] uppercase text-[11px] tracking-tight">
                                {c.endereco_coleta}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground/80">
                              <div className="p-2 rounded-lg bg-background shadow-sm">
                                <Calendar className="w-4 h-4 text-primary" />
                              </div>
                              <span
                                className={cn(
                                  "uppercase text-[11px] tracking-tight",
                                  isAtrasado && "text-destructive font-black",
                                )}
                              >
                                {c.data_prevista_coleta
                                  ? new Date(
                                      c.data_prevista_coleta,
                                    ).toLocaleDateString("pt-BR", {
                                      day: "2-digit",
                                      month: "short",
                                    })
                                  : "-"}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground/80">
                              <div className="p-2 rounded-lg bg-background shadow-sm">
                                <Package className="w-4 h-4 text-primary" />
                              </div>
                              <span className="uppercase text-[11px] tracking-tight">
                                {c.qtd_volumes} VOLUMES
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <Badge
                              className={cn(
                                "px-4 py-1.5 font-black uppercase tracking-widest text-[10px] rounded-xl shadow-sm",
                                statusConfig[c.status]?.color,
                              )}
                            >
                              {statusConfig[c.status]?.label}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                }}
              />
            ) : (
              <div className="text-center py-20 bg-muted/20 rounded-xl border-2 border-dashed">
                <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">
                  Nenhuma coleta encontrada
                </p>
                <Button
                  variant="link"
                  onClick={() => {
                    setSearch("");
                    setStatus("all");
                  }}
                >
                  Limpar filtros
                </Button>
              </div>
            )}
          </div>
        )}

        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.setPage}
          pageSize={pagination.pageSize}
          totalItems={totalFiltered}
          startIndex={pagination.startIndex}
          endIndex={pagination.endIndex}
          hasNextPage={pagination.hasNextPage}
          hasPrevPage={pagination.hasPrevPage}
          pageSizeOptions={[10, 20, 50]}
          onPageSizeChange={pagination.setPageSize}
          onNextPage={pagination.nextPage}
          onPrevPage={pagination.prevPage}
          onFirstPage={pagination.firstPage}
          onLastPage={pagination.lastPage}
        />
      </div>

      <PickupDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={refetch}
        pickup={selectedPickup}
      />

      <PickupDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        pickup={selectedPickup}
        statusConfig={statusConfig}
        onStatusUpdate={refetch}
      />
    </MainLayout>
  );
}
