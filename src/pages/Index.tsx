import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Truck, Clock, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { TransportadoraRanking } from "@/components/dashboard/TransportadoraRanking";
import { XPProgressBar } from "@/components/dashboard/XPProgressBar";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { DelayPredictionPanel } from "@/components/predictions/DelayPredictionPanel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAchievementNotifications } from "@/hooks/useAchievementNotifications";
import { useDashboardMetrics, useRecentAlerts, useTransportadoraPerformance } from "@/hooks/useDashboardMetrics";
import { useRealtime } from "@/hooks/useRealtime";
import { useGamification } from "@/hooks/useGamification";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { motion } from "framer-motion";
import { format, subDays, eachDayOfInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";

export default function Index() {
  const { unlockAchievement } = useAchievementNotifications();
  const { data: metrics, refetch: refetchMetrics } = useDashboardMetrics();
  const { data: alerts = [], isLoading: alertsLoading, refetch: refetchAlerts } = useRecentAlerts();
  const { data: transportadoras = [], isLoading: transportadorasLoading } = useTransportadoraPerformance();
  const { userLevel } = useGamification();

  // Estado para DateRangePicker
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 6),
    to: new Date()
  });

  // Realtime updates
  useRealtime({
    table: "entregas",
    onInsert: () => { refetchMetrics(); refetchAlerts(); },
    onUpdate: () => { refetchMetrics(); refetchAlerts(); },
  });

  useRealtime({
    table: "coletas",
    onInsert: () => refetchMetrics(),
    onUpdate: () => refetchMetrics(),
  });

  // Fetch data based on date range
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

  const handleRefresh = () => { refetchMetrics(); refetchAlerts(); refetchChart(); };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range) setDateRange(range);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-display text-foreground flex items-center gap-3"><div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10"><Truck className="w-6 h-6 text-primary" /></div>Dashboard</h1>
            <p className="text-muted-foreground mt-1">Visão geral das operações logísticas</p>
          </motion.div>
          <div className="flex items-center gap-3">
            <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
            <Button variant="outline" size="icon" onClick={handleRefresh}><RefreshCw className="w-4 h-4" /></Button>
          </div>
        </div>

        {userLevel && (
          <XPProgressBar 
            currentXP={userLevel.current_xp} 
            nextLevelXP={userLevel.level * 1000} 
            level={userLevel.level} 
          />
        )}

        <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <KPICard title="Pendentes" value={statusStats.pendentes} icon={Clock} trend="neutral" status="warning" />
          <KPICard title="Em Trânsito" value={statusStats.transito} icon={Truck} trend="neutral" status="neutral" />
          <KPICard title="Finalizadas" value={statusStats.finalizadas} icon={CheckCircle2} trend="neutral" status="success" />
          <KPICard title="Problemas" value={statusStats.problemas} icon={AlertTriangle} trend="neutral" status="danger" />
        </motion.div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList><TabsTrigger value="overview">Visão Geral</TabsTrigger><TabsTrigger value="performance">Performance</TabsTrigger><TabsTrigger value="predictions">Previsões IA</TabsTrigger></TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2"><PerformanceChart title="Movimentação Semanal" subtitle="Coletas e entregas por dia" data={chartData} dataKey="total" /></div>
              <div><AlertsPanel alerts={alerts} isLoading={alertsLoading} /></div>
            </div>
            <QuickActions />
          </TabsContent>
          <TabsContent value="performance"><div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><TransportadoraRanking transportadoras={transportadoras} isLoading={transportadorasLoading} /><div className="stat-card"><h3 className="font-semibold mb-4">Métricas do Período</h3><div className="space-y-3"><div className="flex justify-between"><span className="text-muted-foreground">Total Coletas</span><span className="font-bold">{metrics?.totalColetas || 0}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Total Entregas</span><span className="font-bold">{metrics?.totalEntregas || 0}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Taxa Sucesso</span><span className="font-bold text-success">{((statusStats.finalizadas / (statusStats.finalizadas + statusStats.problemas || 1)) * 100).toFixed(1)}%</span></div></div></div></div></TabsContent>
          <TabsContent value="predictions"><DelayPredictionPanel /></TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}