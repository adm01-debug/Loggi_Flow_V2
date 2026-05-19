import { useMemo, useState, useEffect, memo } from "react";
import { Truck, Clock, AlertTriangle, CheckCircle2, RefreshCw, Settings2, RotateCcw, Activity, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageTransition } from "@/components/common/PageTransition";
import { MainLayout } from "@/components/layout/MainLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { TransportadoraRanking } from "@/components/dashboard/TransportadoraRanking";
import { XPProgressBar } from "@/components/dashboard/XPProgressBar";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { DelayPredictionPanel } from "@/components/predictions/DelayPredictionPanel";
import { IntelligentLogisticsWidget, LogisticsMapWidget } from "@/components/dashboard";
import { DraggableDashboard, DashboardWidget } from "@/components/dashboard/DraggableDashboard";
import { WidgetPicker } from "@/components/dashboard/WidgetPicker";
import { WidgetErrorBoundary } from "@/components/common/WidgetErrorBoundary";
import { FavoriteMetricsBar } from "@/components/dashboard/FavoriteMetricsBar";
import { LiveStatusBar } from "@/components/dashboard/LiveStatusBar";
import { SystemHealthWidget } from "@/components/dashboard/SystemHealthWidget";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { 
  useDashboardMetrics, 
  useRecentAlerts, 
  useTransportadoraPerformance, 
  useDashboardData, 
  useRealtime, 
  useGamification, 
  useDashboardWidgets, 
  useLocalStorage,
  usePerformanceMonitor 
} from "@/hooks";
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
  const [performanceMode, setPerformanceMode] = useState(false);
  usePerformanceMonitor();
  const { data: metrics, refetch: refetchMetrics } = useDashboardMetrics();
  const { data: alerts = [], isLoading: alertsLoading, refetch: refetchAlerts } = useRecentAlerts();
  const { data: transportadoras = [], isLoading: transportadorasLoading } = useTransportadoraPerformance();
  const { userLevel } = useGamification();
  const { isEditMode, toggleEditMode, resetLayout, getAvailableWidgetsToAdd, addWidget } = useDashboardWidgets();

  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Bom dia");
    else if (hour < 18) setGreeting("Boa tarde");
    else setGreeting("Boa noite");
  }, []);

  const [dateRange, setDateRange] = useState<DateRange>({ from: subDays(new Date(), 6), to: new Date() });

  const [widgetOrder, setWidgetOrder] = useLocalStorage<string[]>("dashboard-widget-order", [
    "xp-progress", "logistics-map", "kpi-pendentes", "kpi-transito", "kpi-finalizadas", "kpi-problemas",
    "intelligence-widget", "system-health", "alerts-panel", "chart-performance", "quick-actions"
  ]);

  useRealtime({ table: "entregas", queryKey: ["dashboard-metrics", "recent-alerts"] });
  useRealtime({ table: "coletas", queryKey: ["dashboard-metrics"] });

  const { chartData, statusStats, isLoading: combinedLoading, refetch: combinedRefetch } = useDashboardData(dateRange);


  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const autoRefresh = setInterval(() => {
      refetchMetrics(); 
      refetchAlerts(); 
      combinedRefetch();
      setLastRefresh(new Date());
    }, 120000);
    return () => clearInterval(autoRefresh);
  }, [refetchMetrics, refetchAlerts, combinedRefetch]);

  const handleRefresh = () => { 
    refetchMetrics(); 
    refetchAlerts(); 
    combinedRefetch(); 
    setLastRefresh(new Date()); 
  };
  const handleDateRangeChange = (range: DateRange | undefined) => { if (range) setDateRange(range); };

  const widgetDefinitions: Record<string, { size: DashboardWidget["size"]; render: () => React.ReactNode }> = {
    "xp-progress": { size: "full", render: () => <WidgetErrorBoundary widgetName="XP Progress">{userLevel ? <XPProgressBar currentXP={userLevel.current_xp} nextLevelXP={userLevel.level * 1000} level={userLevel.level} /> : null}</WidgetErrorBoundary> },
    "kpi-pendentes": { size: "small", render: () => <WidgetErrorBoundary widgetName="KPI Pendentes"><KPICard title="Pendentes" value={statusStats.pendentes} icon={Clock} trend="neutral" status={statusStats.pendentes > 20 ? "warning" : "neutral"} target={100} performanceMode={performanceMode} /></WidgetErrorBoundary> },
    "kpi-transito": { size: "small", render: () => <WidgetErrorBoundary widgetName="KPI Trânsito"><KPICard title="Em Trânsito" value={statusStats.transito} icon={Truck} trend="neutral" status="neutral" target={100} performanceMode={performanceMode} /></WidgetErrorBoundary> },
    "kpi-finalizadas": { size: "small", render: () => <WidgetErrorBoundary widgetName="KPI Finalizadas"><KPICard title="Finalizadas" value={statusStats.finalizadas} icon={CheckCircle2} trend="neutral" status="success" target={100} performanceMode={performanceMode} /></WidgetErrorBoundary> },
    "kpi-problemas": { size: "small", render: () => <WidgetErrorBoundary widgetName="KPI Problemas"><KPICard title="Problemas" value={statusStats.problemas} icon={AlertTriangle} trend="neutral" status={statusStats.problemas > 0 ? "danger" : "neutral"} target={10} performanceMode={performanceMode} /></WidgetErrorBoundary> },
    "logistics-map": { size: "full", render: () => <WidgetErrorBoundary widgetName="Mapa Logístico"><LogisticsMapWidget /></WidgetErrorBoundary> },
    "intelligence-widget": { size: "large", render: () => <WidgetErrorBoundary widgetName="Inteligência"><IntelligentLogisticsWidget /></WidgetErrorBoundary> },
    "chart-performance": { size: "large", render: () => <WidgetErrorBoundary widgetName="Gráfico Performance"><PerformanceChart title="Fluxo Operacional" subtitle="Volume de Carga em Tempo Real" data={chartData} dataKey="entregas" secondaryDataKey="coletas" performanceMode={performanceMode} /></WidgetErrorBoundary> },
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
      <PageTransition>
        <div className="space-y-4 md:space-y-6">
          {/* Header with responsive layout */}
          <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-center md:justify-between">
            <div className="animate-in slide-in-from-left-6 duration-700 ease-out-expo">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-foreground flex items-center gap-3 sm:gap-4 tracking-tighter group/title cursor-default">
                <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/40 shadow-xl shadow-primary/20 transition-all duration-500 group-hover/title:rotate-12 group-hover/title:scale-110 relative">
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl opacity-0 group-hover/title:opacity-100 transition-opacity" />
                  <Truck className="w-6 h-6 sm:w-8 sm:h-8 text-white relative z-10" />
                </div>
                <div className="flex flex-col">
                  <span className="truncate drop-shadow-sm bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent italic">LogiFlow Dashboard</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                      <span className="text-[10px] sm:text-xs font-black text-primary uppercase tracking-[0.2em]">{greeting}! Operação em escala.</span>
                    </div>
                  </div>
                </div>
              </h1>

            </div>
            
            {/* Actions - Scrollable on mobile */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none animate-in fade-in duration-500 delay-100">
              <div className="shrink-0"><DateRangePicker value={dateRange} onChange={handleDateRangeChange} /></div>
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
                <Button 
                  variant={performanceMode ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setPerformanceMode(!performanceMode)} 
                  className={cn(
                    "whitespace-nowrap transition-all duration-500",
                    performanceMode ? "bg-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.4)]" : ""
                  )}
                >
                  <Zap className={cn("w-4 h-4 sm:mr-2", performanceMode && "fill-current animate-pulse")} />
                  <span className="hidden sm:inline">{performanceMode ? "Performance ON" : "Modo Performance"}</span>
                </Button>
              </div>
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
      </PageTransition>
    </MainLayout>
  );
}
