import { useMemo, useState, useEffect, useRef, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Truck, Clock, AlertTriangle, CheckCircle2, RefreshCw, Settings2, RotateCcw, Activity, ShieldCheck } from "lucide-react";
import { QUERY_STALE_TIME } from "@/lib/queryConfig";
import { MainLayout } from "@/components/layout/MainLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { TransportadoraRanking } from "@/components/dashboard/TransportadoraRanking";
import { XPProgressBar } from "@/components/dashboard/XPProgressBar";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { DelayPredictionPanel } from "@/components/predictions/DelayPredictionPanel";
import { DraggableDashboard, DashboardWidget } from "@/components/dashboard/DraggableDashboard";
import { WidgetPicker } from "@/components/dashboard/WidgetPicker";
import { WidgetErrorBoundary } from "@/components/common/WidgetErrorBoundary";
import { FavoriteMetricsBar } from "@/components/dashboard/FavoriteMetricsBar";
import { LiveStatusBar } from "@/components/dashboard/LiveStatusBar";
import { Button } from "@/components/ui/button";
import { useDashboardMetrics, useRecentAlerts, useTransportadoraPerformance } from "@/hooks/useDashboardMetrics";
import { useRealtime } from "@/hooks/useRealtime";
import { useGamification } from "@/hooks/useGamification";
import { useDashboardWidgets } from "@/hooks/useDashboardWidgets";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { format, subDays, eachDayOfInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { runSystemSanityChecks } from "@/utils/systemTester";
import { toast } from "sonner";

// Isolated timer component to prevent full-page re-renders
const RefreshTimer = memo(({ lastRefresh }: { lastRefresh: Date }) => {
  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    setSecondsAgo(0);
    const interval = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastRefresh.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastRefresh]);

  const formatTimeSince = (secs: number) => {
    if (secs < 60) return `${secs}s atrás`;
    return `${Math.floor(secs / 60)}m atrás`;
  };

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
      <Activity className="w-3 h-3 animate-pulse" />
      <span className="hidden sm:inline">{formatTimeSince(secondsAgo)}</span>
    </div>
  );
});
RefreshTimer.displayName = "RefreshTimer";

export default function Index() {
  const { data: metrics, refetch: refetchMetrics } = useDashboardMetrics();
  const { data: alerts = [], isLoading: alertsLoading, refetch: refetchAlerts } = useRecentAlerts();
  const { data: transportadoras = [], isLoading: transportadorasLoading } = useTransportadoraPerformance();
  const { userLevel } = useGamification();
  const { isEditMode, toggleEditMode, resetLayout, getAvailableWidgetsToAdd, addWidget } = useDashboardWidgets();

  const [dateRange, setDateRange] = useState<DateRange>({ from: subDays(new Date(), 6), to: new Date() });

  const [widgetOrder, setWidgetOrder] = useLocalStorage<string[]>("dashboard-widget-order", [
    "xp-progress", "kpi-pendentes", "kpi-transito", "kpi-finalizadas", "kpi-problemas",
    "chart-performance", "alerts-panel", "quick-actions"
  ]);

  useRealtime({ table: "entregas", onInsert: () => { refetchMetrics(); refetchAlerts(); }, onUpdate: () => { refetchMetrics(); refetchAlerts(); } });
  useRealtime({ table: "coletas", onInsert: () => refetchMetrics(), onUpdate: () => refetchMetrics() });

  const { data: weeklyChartData, refetch: refetchChart } = useQuery({
    queryKey: ["dashboard-weekly", dateRange.from, dateRange.to],
    queryFn: async () => {
      if (!dateRange.from || !dateRange.to) return { coletas: [], entregas: [] };
      const [{ data: coletas }, { data: entregas }] = await Promise.all([
        supabase.from("coletas").select("created_at").gte("created_at", startOfDay(dateRange.from).toISOString()).lte("created_at", endOfDay(dateRange.to).toISOString()),
        supabase.from("entregas").select("created_at").gte("created_at", startOfDay(dateRange.from).toISOString()).lte("created_at", endOfDay(dateRange.to).toISOString()),
      ]);
      return { coletas: coletas || [], entregas: entregas || [] };
    },
    staleTime: QUERY_STALE_TIME.DASHBOARD,
  });

  const { data: statusData } = useQuery({
    queryKey: ["dashboard-status", dateRange.from, dateRange.to],
    queryFn: async () => {
      if (!dateRange.from || !dateRange.to) return { coletas: [], entregas: [] };
      const [{ data: coletas }, { data: entregas }] = await Promise.all([
        supabase.from("coletas").select("status").gte("created_at", startOfDay(dateRange.from).toISOString()).lte("created_at", endOfDay(dateRange.to).toISOString()),
        supabase.from("entregas").select("status").gte("created_at", startOfDay(dateRange.from).toISOString()).lte("created_at", endOfDay(dateRange.to).toISOString()),
      ]);
      return { coletas: coletas || [], entregas: entregas || [] };
    },
    staleTime: QUERY_STALE_TIME.DASHBOARD,
  });

  const chartData = useMemo(() => {
    if (!weeklyChartData || !dateRange.from || !dateRange.to) return [];
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    return days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const coletas = weeklyChartData.coletas.filter((c) => format(new Date(c.created_at), "yyyy-MM-dd") === dayStr).length;
      const entregas = weeklyChartData.entregas.filter((e) => format(new Date(e.created_at), "yyyy-MM-dd") === dayStr).length;
      return { name: format(day, "EEE", { locale: ptBR }), coletas, entregas, total: coletas + entregas };
    });
  }, [weeklyChartData, dateRange]);

  const statusStats = useMemo(() => {
    if (!statusData) return { pendentes: 0, transito: 0, finalizadas: 0, problemas: 0 };
    const coletasPendentes = statusData.coletas.filter((c) => ["aguardando_liberacao", "solicitada"].includes(c.status)).length;
    const coletasTransito = statusData.coletas.filter((c) => c.status === "em_transito").length;
    const coletasOk = statusData.coletas.filter((c) => ["conferencia_ok", "finalizada"].includes(c.status)).length;
    const coletasProblema = statusData.coletas.filter((c) => c.status === "divergencia").length;
    const entregasPendentes = statusData.entregas.filter((e) => ["aguardando_producao", "pronto_despacho", "cotacao_frete"].includes(e.status)).length;
    const entregasTransito = statusData.entregas.filter((e) => ["em_transito", "despachado", "saiu_entrega"].includes(e.status)).length;
    const entregasOk = statusData.entregas.filter((e) => ["entregue", "finalizado"].includes(e.status)).length;
    const entregasProblema = statusData.entregas.filter((e) => e.status === "ocorrencia").length;
    return { pendentes: coletasPendentes + entregasPendentes, transito: coletasTransito + entregasTransito, finalizadas: coletasOk + entregasOk, problemas: coletasProblema + entregasProblema };
  }, [statusData]);

  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const autoRefresh = setInterval(() => {
      refetchMetrics(); refetchAlerts(); refetchChart();
      setLastRefresh(new Date());
    }, 120000);
    return () => clearInterval(autoRefresh);
  }, [refetchMetrics, refetchAlerts, refetchChart]);

  const handleRefresh = () => { refetchMetrics(); refetchAlerts(); refetchChart(); setLastRefresh(new Date()); };
  const handleDateRangeChange = (range: DateRange | undefined) => { if (range) setDateRange(range); };

  const widgetDefinitions: Record<string, { size: DashboardWidget["size"]; render: () => React.ReactNode }> = {
    "xp-progress": { size: "full", render: () => <WidgetErrorBoundary widgetName="XP Progress">{userLevel ? <XPProgressBar currentXP={userLevel.current_xp} nextLevelXP={userLevel.level * 1000} level={userLevel.level} /> : null}</WidgetErrorBoundary> },
    "kpi-pendentes": { size: "small", render: () => <WidgetErrorBoundary widgetName="KPI Pendentes"><KPICard title="Pendentes" value={statusStats.pendentes} icon={Clock} trend="neutral" status="warning" /></WidgetErrorBoundary> },
    "kpi-transito": { size: "small", render: () => <WidgetErrorBoundary widgetName="KPI Trânsito"><KPICard title="Em Trânsito" value={statusStats.transito} icon={Truck} trend="neutral" status="neutral" /></WidgetErrorBoundary> },
    "kpi-finalizadas": { size: "small", render: () => <WidgetErrorBoundary widgetName="KPI Finalizadas"><KPICard title="Finalizadas" value={statusStats.finalizadas} icon={CheckCircle2} trend="neutral" status="success" /></WidgetErrorBoundary> },
    "kpi-problemas": { size: "small", render: () => <WidgetErrorBoundary widgetName="KPI Problemas"><KPICard title="Problemas" value={statusStats.problemas} icon={AlertTriangle} trend="neutral" status="danger" /></WidgetErrorBoundary> },
    "chart-performance": { size: "large", render: () => <WidgetErrorBoundary widgetName="Gráfico Performance"><PerformanceChart title="Movimentação" subtitle="Coletas vs Entregas" data={chartData} dataKey="coletas" secondaryDataKey="entregas" /></WidgetErrorBoundary> },
    "alerts-panel": { size: "large", render: () => <WidgetErrorBoundary widgetName="Alertas"><AlertsPanel alerts={alerts} isLoading={alertsLoading} /></WidgetErrorBoundary> },
    "quick-actions": { size: "full", render: () => <WidgetErrorBoundary widgetName="Ações Rápidas"><QuickActions /></WidgetErrorBoundary> },
    "transportadora-ranking": { size: "large", render: () => <WidgetErrorBoundary widgetName="Ranking Transportadoras"><TransportadoraRanking transportadoras={transportadoras} isLoading={transportadorasLoading} /></WidgetErrorBoundary> },
    "delay-prediction": { size: "full", render: () => <WidgetErrorBoundary widgetName="Predição Atrasos"><DelayPredictionPanel /></WidgetErrorBoundary> },
  };

  const widgets: DashboardWidget[] = widgetOrder.filter(id => widgetDefinitions[id]).map(id => ({ id, ...widgetDefinitions[id] }));

  const handleReorder = (newWidgets: DashboardWidget[]) => setWidgetOrder(newWidgets.map(w => w.id));
  const handleRemove = (id: string) => setWidgetOrder(widgetOrder.filter(wid => wid !== id));

  return (
    <MainLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header with responsive layout */}
        <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
          <div className="animate-in slide-in-from-left-4 duration-500">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <span className="truncate">Dashboard</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Visão geral das operações logísticas</p>
          </div>
          
          {/* Actions - Scrollable on mobile */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none animate-in fade-in duration-500 delay-100">
            <div className="shrink-0"><DateRangePicker value={dateRange} onChange={handleDateRangeChange} /></div>
            <div className="shrink-0">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={async () => {
                  const loader = toast.loading("Validando integridade do sistema...");
                  await runSystemSanityChecks();
                  toast.dismiss(loader);
                }} 
                className="h-9 w-9 sm:h-10 sm:w-10 text-success border-success/20 hover:bg-success/5" 
                title="Auditoria de Sistema"
              >
                <ShieldCheck className="w-4 h-4" />
              </Button>
            </div>
            <div className="shrink-0"><Button variant="outline" size="icon" onClick={handleRefresh} className="h-9 w-9 sm:h-10 sm:w-10" title="Atualizar dados"><RefreshCw className="w-4 h-4" /></Button></div>
            <div className="shrink-0"><RefreshTimer lastRefresh={lastRefresh} /></div>
            <div className="shrink-0"><div className="h-6 w-px bg-border hidden sm:block" /></div>
            {isEditMode && (
              <>
                <div className="shrink-0"><WidgetPicker availableWidgets={getAvailableWidgetsToAdd()} onAddWidget={addWidget} /></div>
                <div className="shrink-0"><Button variant="outline" size="sm" onClick={resetLayout} className="whitespace-nowrap"><RotateCcw className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">Resetar</span></Button></div>
              </>
            )}
            <div className="shrink-0">
              <Button variant={isEditMode ? "default" : "outline"} size="sm" onClick={toggleEditMode} className="whitespace-nowrap">
                <Settings2 className="w-4 h-4 sm:mr-2" /><span className="hidden sm:inline">{isEditMode ? "Salvar" : "Personalizar"}</span>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="animate-in fade-in duration-500 delay-150">
          <LiveStatusBar />
        </div>

        <div className="animate-in fade-in duration-500 delay-200">
          <FavoriteMetricsBar />
        </div>
        
        <div className="animate-in fade-in duration-500 delay-300">
          <DraggableDashboard widgets={widgets} isEditMode={isEditMode} onReorder={handleReorder} onRemove={handleRemove} />
        </div>
      </div>
    </MainLayout>
  );
}
