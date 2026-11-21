/* eslint-disable max-lines */
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { MainLayout } from "@/components/layout/MainLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QUERY_STALE_TIME } from "@/lib/queryConfig";
import {
  BarChart3,
  Target,
  Truck,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BrainCircuit,
  Sparkles,
  X,
  LayoutGrid,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { formatCurrency } from "@/lib/formatters";
import { useExecutiveMetrics } from "@/hooks/analytics/useExecutiveMetrics";
import { AIAssistant } from "@/components/ai/AIAssistant";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PerformanceChart,
  DistributionChart,
} from "@/components/analytics/AnalyticsCharts";
import { OperationalPulse } from "@/components/analytics/OperationalPulse";
import { useAnalytics } from "@/hooks/analytics/useAnalytics";
import {
  useRecentAlerts,
  type RecentAlert,
} from "@/hooks/analytics/useDashboardMetrics";

interface AlertasPreditosCardProps {
  alertas?: RecentAlert[];
  loading?: boolean;
}

function AlertasPreditosCard({ alertas, loading }: AlertasPreditosCardProps) {
  if (loading) {
    return (
      <div className="p-3 bg-background rounded-lg border text-xs flex items-center gap-2">
        <Loader2 className="w-3 h-3 animate-spin" />
        Carregando alertas preditivos...
      </div>
    );
  }

  if (!alertas || alertas.length === 0) {
    return (
      <div className="p-3 bg-background rounded-lg border text-xs">
        <p className="font-semibold text-success flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Sem alertas preditivos no momento
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alertas.slice(0, 3).map((a) => (
        <div
          key={a.id}
          className={cn(
            "p-3 bg-background rounded-lg border text-xs",
            a.severity === "error"
              ? "border-destructive/30"
              : "border-warning/30",
          )}
        >
          <p
            className={cn(
              "font-semibold",
              a.severity === "error" ? "text-destructive" : "text-warning",
            )}
          >
            {a.severity === "error" ? "⚠️" : "⚡"} {a.message}
          </p>
          <p className="text-muted-foreground mt-1 text-[10px]">
            {format(new Date(a.createdAt), "dd/MM HH:mm")}
          </p>
        </div>
      ))}
    </div>
  );
}

interface MetasEmFocoCardProps {
  otifRate: number;
  targetOtif: number;
}

function MetasEmFocoCard({ otifRate, targetOtif }: MetasEmFocoCardProps) {
  const faltantes = Math.max(targetOtif - otifRate, 0);
  return (
    <div className="card-base p-4 border-primary/30 bg-primary/5">
      <h3 className="text-sm font-bold flex items-center gap-2 text-primary">
        <Target className="w-4 h-4" />
        Metas em Foco
      </h3>
      <div className="mt-3 space-y-2">
        <div className="flex justify-between text-xs mb-1">
          <span>Meta OTIF ({targetOtif}%)</span>
          <span className="font-bold">{otifRate.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary"
            style={{ width: `${Math.min(otifRate, 100)}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          {faltantes > 0
            ? `Faltam ${faltantes.toFixed(1)} p.p. para atingir a meta de OTIF.`
            : "Operação dentro da meta de OTIF no mês corrente."}
        </p>
      </div>
    </div>
  );
}

function anyError(...flags: Array<boolean | undefined>): boolean {
  return flags.some(Boolean);
}

function AIAssistantToggle({
  showAI,
  onToggle,
}: {
  showAI: boolean;
  onToggle: () => void;
}) {
  return (
    <Button
      variant={showAI ? "secondary" : "default"}
      className={cn(
        "gap-2 transition-all duration-300",
        !showAI && "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20",
      )}
      onClick={onToggle}
    >
      {showAI ? (
        <X className="w-4 h-4" />
      ) : (
        <BrainCircuit className="w-4 h-4 animate-pulse" />
      )}
      {showAI ? "Fechar Assistente" : "Assistente Logístico IA"}
      {!showAI && (
        <Badge
          variant="secondary"
          className="ml-1 h-5 bg-white/20 text-white border-none text-[10px]"
        >
          Gemini 2.0
        </Badge>
      )}
    </Button>
  );
}

export default function DashboardExecutivo() {
  const [showAI, setShowAI] = useState(false);
  const { trends, carrierOtif, avgCollectionTime } = useExecutiveMetrics();
  const { monthlyData } = useAnalytics();

  // Core monthly metrics (current vs previous)
  const {
    data: entregasData,
    isLoading: isLoadingEntregas,
    isError: isErrorEntregas,
  } = useQuery({
    queryKey: ["exec-entregas"],
    queryFn: async () => {
      const now = new Date();
      const thisMonth = startOfMonth(now);
      const lastMonth = startOfMonth(subMonths(now, 1));
      const endLastMonth = endOfMonth(subMonths(now, 1));
      const [current, previous] = await Promise.all([
        supabase
          .from("entregas")
          .select(
            "status, valor_frete, previsao_entrega, data_entrega_efetiva, created_at, transportadora_id",
          )
          .is("deleted_at", null)
          .gte("created_at", thisMonth.toISOString())
          .limit(2000),
        supabase
          .from("entregas")
          .select(
            "status, valor_frete, previsao_entrega, data_entrega_efetiva, created_at",
          )
          .is("deleted_at", null)
          .gte("created_at", lastMonth.toISOString())
          .lte("created_at", endLastMonth.toISOString())
          .limit(2000),
      ]);
      return { current: current.data || [], previous: previous.data || [] };
    },
    staleTime: QUERY_STALE_TIME.DASHBOARD,
  });

  const {
    data: coletasData,
    isLoading: isLoadingColetas,
    isError: isErrorColetas,
  } = useQuery({
    queryKey: ["exec-coletas"],
    queryFn: async () => {
      const thisMonth = startOfMonth(new Date());
      const { data } = await supabase
        .from("coletas")
        .select(
          "status, qtd_volumes, qtd_recebida, divergencia_percentual, created_at",
        )
        .is("deleted_at", null)
        .gte("created_at", thisMonth.toISOString())
        .limit(1000);
      return data || [];
    },
    staleTime: QUERY_STALE_TIME.DASHBOARD,
  });

  const {
    data: ocorrenciasData,
    isLoading: isLoadingOcorrencias,
    isError: isErrorOcorrencias,
    error: errorOcorrencias,
  } = useQuery({
    queryKey: ["exec-ocorrencias"],
    queryFn: async () => {
      const thisMonth = startOfMonth(new Date());
      const { data } = await supabase
        .from("ocorrencias")
        .select("tipo_ocorrencia, resolvida, created_at")
        .gte("created_at", thisMonth.toISOString())
        .limit(500);
      return data || [];
    },
    staleTime: QUERY_STALE_TIME.DASHBOARD,
  });

  // KPI calculation
  const kpis = useMemo(() => {
    const curr = entregasData?.current || [];
    const prev = entregasData?.previous || [];
    const coletas = coletasData || [];
    const ocorrencias = ocorrenciasData || [];

    const totalEntregas = curr.length;
    const prevTotal = prev.length;
    const entregues = curr.filter(
      (e) => e.status === "entregue" || e.status === "finalizado",
    );

    const onTime = entregues.filter((e) => {
      if (!e.previsao_entrega || !e.data_entrega_efetiva) return false;
      return new Date(e.data_entrega_efetiva) <= new Date(e.previsao_entrega);
    });
    const otifRate =
      entregues.length > 0 ? (onTime.length / entregues.length) * 100 : 0;

    const totalFrete = curr.reduce((acc, e) => acc + (e.valor_frete || 0), 0);
    const prevFrete = prev.reduce((acc, e) => acc + (e.valor_frete || 0), 0);

    const incidentRate =
      totalEntregas > 0 ? (ocorrencias.length / totalEntregas) * 100 : 0;

    const coletasComDiv = coletas.filter(
      (c) => c.divergencia_percentual != null && c.divergencia_percentual > 0,
    );
    const avgDivergencia =
      coletasComDiv.length > 0
        ? coletasComDiv.reduce(
            (acc, c) => acc + (c.divergencia_percentual || 0),
            0,
          ) / coletasComDiv.length
        : 0;

    const entregasGrowth =
      prevTotal > 0 ? ((totalEntregas - prevTotal) / prevTotal) * 100 : 0;
    const freteGrowth =
      prevFrete > 0 ? ((totalFrete - prevFrete) / prevFrete) * 100 : 0;

    return {
      totalEntregas,
      prevTotal,
      entregasGrowth,
      otifRate,
      targetOtif: 95,
      totalFrete,
      prevFrete,
      freteGrowth,
      incidentRate,
      targetIncident: 1,
      avgDivergencia,
      targetDivergencia: 5,
      totalColetas: coletas.length,
      entregues: entregues.length,
      ocorrencias: ocorrencias.length,
      ocorrenciasResolvidas: ocorrencias.filter((o) => o.resolvida).length,
    };
  }, [entregasData, coletasData, ocorrenciasData]);

  // Pie chart: status distribution
  const statusDistribution = useMemo(() => {
    const curr = entregasData?.current || [];
    const groups: Record<string, number> = {};
    curr.forEach((e) => {
      groups[e.status] = (groups[e.status] || 0) + 1;
    });
    return Object.entries(groups).map(([name, value]) => ({
      name: name.replace(/_/g, " "),
      value,
    }));
  }, [entregasData]);

  const pieColors = [
    "hsl(var(--primary))",
    "hsl(var(--warning))",
    "hsl(var(--success))",
    "hsl(var(--destructive))",
    "hsl(var(--accent))",
    "hsl(var(--muted))",
  ];

  const GrowthIndicator = ({
    value,
    suffix = "%",
  }: {
    value: number;
    suffix?: string;
  }) => {
    if (value === 0)
      return (
        <span className="text-muted-foreground flex items-center gap-1 text-xs">
          <Minus className="w-3 h-3" />0{suffix}
        </span>
      );
    if (value > 0)
      return (
        <span className="text-success flex items-center gap-1 text-xs">
          <ArrowUpRight className="w-3 h-3" />+{value.toFixed(1)}
          {suffix}
        </span>
      );
    return (
      <span className="text-destructive flex items-center gap-1 text-xs">
        <ArrowDownRight className="w-3 h-3" />
        {value.toFixed(1)}
        {suffix}
      </span>
    );
  };

  const KPIStatus = ({
    value,
    target,
    inverted = false,
  }: {
    value: number;
    target: number;
    inverted?: boolean;
  }) => {
    const isGood = inverted ? value <= target : value >= target;
    return (
      <Badge
        variant="secondary"
        className={cn(
          "text-xs",
          isGood
            ? "bg-success/20 text-success"
            : "bg-destructive/20 text-destructive",
        )}
      >
        {isGood ? "✓ Na meta" : "✗ Abaixo"}
      </Badge>
    );
  };

  const trendData = trends.data || [];
  const carrierData = carrierOtif.data || [];
  const avgColTime = avgCollectionTime.data || 0;
  const { data: alertas, isLoading: alertasLoading } = useRecentAlerts();

  const loading = anyError(
    isLoadingEntregas,
    isLoadingColetas,
    isLoadingOcorrencias,
    alertasLoading,
  );
  const hasError = anyError(
    isErrorEntregas,
    isErrorColetas,
    isErrorOcorrencias,
  );

  if (loading) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (hasError) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <EmptyState
            variant="error"
            title="Erro ao carregar o Dashboard Executivo"
            description={
              errorOcorrencias?.message ||
              "Não foi possível carregar os indicadores. Tente novamente."
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              Dashboard Executivo
            </h1>
            <p className="text-muted-foreground mt-1">
              Visão C-level —{" "}
              {format(new Date(), "MMMM yyyy", { locale: ptBR })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <AIAssistantToggle
              showAI={showAI}
              onToggle={() => setShowAI(!showAI)}
            />
          </div>
        </div>

        {/* AI Overlay / Section */}
        {showAI && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-top duration-500">
            <div className="lg:col-span-2">
              <div className="card-base p-6 bg-gradient-to-br from-primary/5 via-transparent to-transparent border-primary/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Insights Estratégicos</h2>
                    <p className="text-sm text-muted-foreground">
                      Análise preditiva em tempo real sobre sua operação.
                    </p>
                  </div>
                </div>
                <div className="h-[400px]">
                  <AIAssistant />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="card-base p-4 border-warning/30 bg-warning/5">
                <h3 className="text-sm font-bold flex items-center gap-2 text-warning">
                  <AlertTriangle className="w-4 h-4" />
                  Alertas Preditos (IA)
                </h3>
                <AlertasPreditosCard
                  alertas={alertas}
                  loading={alertasLoading}
                />
              </div>
              <MetasEmFocoCard
                otifRate={kpis.otifRate}
                targetOtif={kpis.targetOtif}
              />
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="card-base p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Target className="w-5 h-5 text-primary" />
              <KPIStatus value={kpis.otifRate} target={kpis.targetOtif} />
            </div>
            <p className="text-2xl font-bold">{kpis.otifRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">
              OTIF (On Time In Full)
            </p>
            <p className="text-xs text-muted-foreground">
              Meta: ≥{kpis.targetOtif}%
            </p>
          </div>

          <div className="card-base p-4 space-y-2">
            <div className="flex items-center justify-between">
              <DollarSign className="w-5 h-5 text-success" />
              <GrowthIndicator value={kpis.freteGrowth} />
            </div>
            <p className="text-2xl font-bold">
              {formatCurrency(kpis.totalFrete)}
            </p>
            <p className="text-xs text-muted-foreground">Custo Frete Mensal</p>
            <p className="text-xs text-muted-foreground">
              Anterior: {formatCurrency(kpis.prevFrete)}
            </p>
          </div>

          <div className="card-base p-4 space-y-2">
            <div className="flex items-center justify-between">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <KPIStatus
                value={kpis.incidentRate}
                target={kpis.targetIncident}
                inverted
              />
            </div>
            <p className="text-2xl font-bold">
              {kpis.incidentRate.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Taxa de Incidentes</p>
            <p className="text-xs text-muted-foreground">
              Meta: ≤{kpis.targetIncident}%
            </p>
          </div>

          <div className="card-base p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Package className="w-5 h-5 text-accent-foreground" />
              <KPIStatus
                value={kpis.avgDivergencia}
                target={kpis.targetDivergencia}
                inverted
              />
            </div>
            <p className="text-2xl font-bold">
              {kpis.avgDivergencia.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">
              Diverg. Média Coletas
            </p>
            <p className="text-xs text-muted-foreground">
              Meta: ≤{kpis.targetDivergencia}%
            </p>
          </div>

          <div className="card-base p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Clock className="w-5 h-5 text-primary" />
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs",
                  avgColTime <= 48
                    ? "bg-success/20 text-success"
                    : "bg-destructive/20 text-destructive",
                )}
              >
                {avgColTime <= 48 ? "✓ Na meta" : "✗ Acima"}
              </Badge>
            </div>
            <p className="text-2xl font-bold">
              {avgColTime > 0 ? `${avgColTime}h` : "-"}
            </p>
            <p className="text-xs text-muted-foreground">Tempo Médio Coleta</p>
            <p className="text-xs text-muted-foreground">Meta: ≤48h</p>
          </div>
        </div>

        {/* Volume Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="stat-card text-center p-3">
            <Truck className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold">{kpis.totalEntregas}</p>
            <p className="text-[10px] text-muted-foreground">Entregas</p>
            <GrowthIndicator value={kpis.entregasGrowth} />
          </div>
          <div className="stat-card text-center p-3">
            <CheckCircle2 className="w-5 h-5 text-success mx-auto mb-1" />
            <p className="text-xl font-bold">{kpis.entregues}</p>
            <p className="text-[10px] text-muted-foreground">Concluídas</p>
          </div>
          <div className="stat-card text-center p-3">
            <Package className="w-5 h-5 text-warning mx-auto mb-1" />
            <p className="text-xl font-bold">{kpis.totalColetas}</p>
            <p className="text-[10px] text-muted-foreground">Coletas</p>
          </div>
          <div className="stat-card text-center p-3">
            <AlertTriangle className="w-5 h-5 text-destructive mx-auto mb-1" />
            <p className="text-xl font-bold">{kpis.ocorrencias}</p>
            <p className="text-[10px] text-muted-foreground">Ocorrências</p>
          </div>
        </div>

        {/* Dashboard Sections */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-black/20 border-white/5 p-1.5 rounded-[1.5rem] h-auto backdrop-blur-xl">
            <TabsTrigger
              value="overview"
              className="rounded-xl px-6 py-2.5 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Visão_Estratégica
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="rounded-xl px-6 py-2.5 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Análise_Profunda
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="overview"
            className="space-y-6 animate-in fade-in duration-500"
          >
            {/* Trend Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* OTIF Evolution (6 months) */}
              <div className="card-base p-6 border-white/5 bg-black/40 backdrop-blur-xl rounded-[2.5rem]">
                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary mb-6">
                  Evolução OTIF — 6 Meses
                </h3>
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient
                          id="otifGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-white/5"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="month"
                        className="text-[10px] fill-white/40 font-black uppercase"
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, 100]}
                        className="text-[10px] fill-white/40 font-black"
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#000",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "1rem",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="otif"
                        stroke="hsl(var(--primary))"
                        fill="url(#otifGradient)"
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-center py-8 font-black uppercase tracking-widest text-[10px]">
                    Sincronizando Tendências...
                  </p>
                )}
              </div>

              {/* Freight Cost Evolution */}
              <div className="card-base p-6 border-white/5 bg-black/40 backdrop-blur-xl rounded-[2.5rem]">
                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-success mb-6">
                  Fluxo de Custos Logísticos
                </h3>
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={trendData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-white/5"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="month"
                        className="text-[10px] fill-white/40 font-black uppercase"
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        className="text-[10px] fill-white/40 font-black"
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#000",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "1rem",
                        }}
                      />
                      <Bar
                        dataKey="custoFrete"
                        fill="hsl(var(--success))"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-center py-8 font-black uppercase tracking-widest text-[10px]">
                    Mapeando Fluxo Financeiro...
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="analytics"
            className="animate-in fade-in slide-in-from-bottom-4 duration-700"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <OperationalPulse />
              </div>
              <div className="lg:col-span-1">
                <PerformanceChart data={monthlyData} />
              </div>
              <div className="lg:col-span-1">
                <DistributionChart data={monthlyData} />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Volume Trend + Carrier OTIF */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Volume Trend */}
          <div className="card-base p-6 border-white/5 bg-black/40 backdrop-blur-xl rounded-[2.5rem]">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary mb-6">
              Volume Operacional — 6 meses
            </h3>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-white/5"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    className="text-[10px] fill-white/40 font-black uppercase"
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    className="text-[10px] fill-white/40 font-black"
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#000",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "1rem",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="entregas"
                    name="Entregas"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "hsl(var(--primary))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="coletas"
                    name="Coletas"
                    stroke="hsl(var(--warning))"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "hsl(var(--warning))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="ocorrencias"
                    name="Ocorrências"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "hsl(var(--destructive))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8 font-black uppercase tracking-widest text-[10px]">
                Mapeando Volume Histórico...
              </p>
            )}
          </div>

          {/* Carrier OTIF Breakdown */}
          <div className="card-base p-6 border-white/5 bg-black/40 backdrop-blur-xl rounded-[2.5rem]">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary mb-6">
              OTIF por Transportadora
            </h3>
            {carrierData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={carrierData.slice(0, 8)} layout="vertical">
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-white/5"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    className="text-[10px] fill-white/40 font-black"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    className="text-[10px] fill-white/40 font-black uppercase"
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => v.substring(0, 12)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#000",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "1rem",
                    }}
                  />
                  <Bar
                    dataKey="otifRate"
                    fill="hsl(var(--primary))"
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8 font-black uppercase tracking-widest text-[10px]">
                Analisando Rankings de Performance...
              </p>
            )}
          </div>
        </div>

        {/* Status Distribution + Carrier Cost */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-base p-6 border-white/5 bg-black/40 backdrop-blur-xl rounded-[2.5rem]">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-warning mb-6">
              Distribuição de Status
            </h3>
            {statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusDistribution.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#000",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "1rem",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8 font-black uppercase tracking-widest text-[10px]">
                Mapeando Estados Operacionais...
              </p>
            )}
          </div>

          {/* Carrier avg cost ranking */}
          <div className="card-base p-6 border-white/5 bg-black/40 backdrop-blur-xl rounded-[2.5rem]">
            <h3 className="text-xs font-black uppercase tracking-[0.4em] text-success mb-6">
              Custo Médio por Transportadora
            </h3>
            {carrierData.length > 0 ? (
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {carrierData.slice(0, 10).map((c, i) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-white/20 w-4">
                        {i + 1}.
                      </span>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-white group-hover:text-primary transition-colors">
                          {c.name}
                        </p>
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-tighter mt-1">
                          {c.total} entregas vinculadas
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-success italic tracking-tighter">
                      {formatCurrency(c.avgCost)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8 font-black uppercase tracking-widest text-[10px]">
                Auditando Custos Unitários...
              </p>
            )}
          </div>
        </div>

        {/* Goals Summary */}
        <div className="card-base p-8 border-white/5 bg-black/40 backdrop-blur-xl rounded-[2.5rem]">
          <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary mb-8 flex items-center gap-3">
            <LayoutGrid className="w-5 h-5" /> Resumo de Metas Estratégicas
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="pb-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/30">
                    Métrica_KPI
                  </th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/30 text-center">
                    Status_Atual
                  </th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/30 text-center">
                    Meta_Benchmark
                  </th>
                  <th className="pb-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/30 text-right">
                    Status_Geral
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  {
                    name: "SLA / OTIF Geral",
                    current: `${kpis.otifRate.toFixed(1)}%`,
                    target: "≥95%",
                    ok: kpis.otifRate >= 95,
                  },
                  {
                    name: "Taxa de Incidentes",
                    current: `${kpis.incidentRate.toFixed(1)}%`,
                    target: "≤1%",
                    ok: kpis.incidentRate <= 1,
                  },
                  {
                    name: "Divergência Coletas",
                    current: `${kpis.avgDivergencia.toFixed(1)}%`,
                    target: "≤5%",
                    ok: kpis.avgDivergencia <= 5,
                  },
                  {
                    name: "Tempo Médio Coleta",
                    current: avgColTime > 0 ? `${avgColTime}h` : "-",
                    target: "≤48h",
                    ok: avgColTime <= 48,
                  },
                  {
                    name: "Ocorrências Resolvidas",
                    current: `${kpis.ocorrencias > 0 ? ((kpis.ocorrenciasResolvidas / kpis.ocorrencias) * 100).toFixed(0) : 100}%`,
                    target: "≥90%",
                    ok:
                      kpis.ocorrencias === 0 ||
                      kpis.ocorrenciasResolvidas / kpis.ocorrencias >= 0.9,
                  },
                ].map((row, i) => (
                  <tr
                    key={i}
                    className="group hover:bg-white/5 transition-colors"
                  >
                    <td className="py-5 font-black uppercase tracking-widest text-[11px] italic text-white">
                      {row.name}
                    </td>
                    <td className="py-5 text-center font-black text-xs text-white/60">
                      {row.current}
                    </td>
                    <td className="py-5 text-center font-bold text-[10px] text-white/30">
                      {row.target}
                    </td>
                    <td className="py-5 text-right">
                      <Badge
                        variant="outline"
                        className={cn(
                          "px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest border-2",
                          row.ok
                            ? "bg-success/10 text-success border-success/20"
                            : "bg-destructive/10 text-destructive border-destructive/20",
                        )}
                      >
                        {row.ok ? "Atingida" : "Em Alerta"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
