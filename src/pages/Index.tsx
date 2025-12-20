import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Truck, Building2, Send, Clock, TrendingUp, Package, AlertTriangle, Trophy, Target, Timer, CheckCircle2, XCircle } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { KPICard } from "@/components/dashboard/KPICard";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { TransportadoraRanking } from "@/components/dashboard/TransportadoraRanking";
import { XPProgressBar } from "@/components/dashboard/XPProgressBar";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAchievementNotifications } from "@/hooks/useAchievementNotifications";
import { useDashboardMetrics, useRecentAlerts, useTransportadoraPerformance } from "@/hooks/useDashboardMetrics";
import { motion } from "framer-motion";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Index() {
  const { unlockAchievement } = useAchievementNotifications();
  const { data: metrics } = useDashboardMetrics();
  const { data: alerts = [], isLoading: alertsLoading } = useRecentAlerts();
  const { data: transportadoras = [], isLoading: transportadorasLoading } = useTransportadoraPerformance();

  // Fetch weekly data for charts
  const { data: weeklyChartData } = useQuery({
    queryKey: ["dashboard-weekly"],
    queryFn: async () => {
      const startDate = subDays(new Date(), 6);
      const [{ data: coletas }, { data: entregas }] = await Promise.all([
        supabase.from("coletas").select("created_at").gte("created_at", startDate.toISOString()),
        supabase.from("entregas").select("created_at").gte("created_at", startDate.toISOString()),
      ]);
      return { coletas: coletas || [], entregas: entregas || [] };
    },
  });

  // Fetch status distribution
  const { data: statusData } = useQuery({
    queryKey: ["dashboard-status"],
    queryFn: async () => {
      const [{ data: coletas }, { data: entregas }] = await Promise.all([
        supabase.from("coletas").select("status"),
        supabase.from("entregas").select("status"),
      ]);
      return { coletas: coletas || [], entregas: entregas || [] };
    },
  });

  // Fetch user XP
  const { data: userLevel } = useQuery({
    queryKey: ["user-level"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase.from("user_levels").select("*").eq("user_id", user.id).single();
      return data;
    },
  });

  // Process weekly data
  const weeklyData = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
    return days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayLabel = format(day, "EEE", { locale: ptBR });
      const coletasDia = weeklyChartData?.coletas.filter((c) => c.created_at?.startsWith(dayStr)).length || 0;
      const entregasDia = weeklyChartData?.entregas.filter((e) => e.created_at?.startsWith(dayStr)).length || 0;
      return { name: dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1, 3), entregas: entregasDia, coletas: coletasDia };
    });
  }, [weeklyChartData]);

  // Process status distribution
  const statusDistribution = useMemo(() => {
    const all = [...(statusData?.coletas || []), ...(statusData?.entregas || [])];
    const finalizadas = all.filter((i) => ["finalizada", "entregue", "finalizado"].includes(i.status)).length;
    const emTransito = all.filter((i) => ["em_transito", "saiu_entrega", "despachado"].includes(i.status)).length;
    const pendentes = all.filter((i) => ["aguardando_liberacao", "solicitada", "aguardando_producao", "pronto_despacho", "pendente"].includes(i.status)).length;
    const ocorrencias = all.filter((i) => ["ocorrencia", "divergencia", "atrasado"].includes(i.status)).length;
    return [
      { name: "Finalizadas", value: finalizadas, color: "hsl(var(--success))" },
      { name: "Em Trânsito", value: emTransito, color: "hsl(var(--info))" },
      { name: "Pendentes", value: pendentes, color: "hsl(var(--warning))" },
      { name: "Ocorrências", value: ocorrencias, color: "hsl(var(--destructive))" },
    ];
  }, [statusData]);

  const demoAchievements = [
    { id: "first-delivery", name: "Primeira Entrega", description: "Complete sua primeira entrega", icon: "🚚", rarity: "common" as const, xpReward: 100, coinsReward: 50 },
    { id: "streak-7", name: "Streak de 7 Dias", description: "Mantenha entregas por 7 dias seguidos", icon: "🔥", rarity: "rare" as const, xpReward: 500, coinsReward: 200 },
    { id: "top-performer", name: "Top Performer", description: "Seja o melhor da semana", icon: "⭐", rarity: "epic" as const, xpReward: 1000, coinsReward: 500 },
    { id: "legend", name: "Lenda Logística", description: "Alcance o nível máximo", icon: "👑", rarity: "legendary" as const, xpReward: 5000, coinsReward: 2000 },
  ];

  const triggerRandomAchievement = () => {
    const randomIndex = Math.floor(Math.random() * demoAchievements.length);
    unlockAchievement(demoAchievements[randomIndex]);
  };

  const getOTIFStatus = (rate: number) => rate >= 95 ? "success" : rate >= 90 ? "warning" : "danger";
  const getDeliveryRateStatus = (rate: number) => rate >= 98 ? "success" : rate >= 95 ? "warning" : "danger";
  const getIncidentStatus = (rate: number) => rate <= 1 ? "success" : rate <= 3 ? "warning" : "danger";
  const getLeadTimeStatus = (hours: number) => hours <= 48 ? "success" : hours <= 72 ? "warning" : "danger";

  // XP calculations
  const currentXP = userLevel?.total_xp || 0;
  const level = userLevel?.level || 1;
  const xpForCurrentLevel = (level - 1) * 500;
  const xpForNextLevel = level * 500;
  const xpProgress = currentXP - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-display text-foreground">Dashboard Analítico</h1>
            <p className="text-muted-foreground mt-1">KPIs em tempo real e performance operacional</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={triggerRandomAchievement} className="border-xp/50 text-xp hover:bg-xp/10"><Trophy className="w-4 h-4 mr-2" />Testar Conquista</Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary press-scale"><Truck className="w-4 h-4 mr-2" />Novo Frete</Button>
          </div>
        </div>

        <XPProgressBar currentXP={xpProgress} nextLevelXP={xpNeeded} level={level} />

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Taxa OTIF" value={`${metrics?.otifRate ?? 0}%`} subtitle="On-Time In-Full" target={95} icon={Target} status={getOTIFStatus(metrics?.otifRate ?? 0)} trend={metrics?.otifRate && metrics.otifRate >= 95 ? "up" : "down"} trendValue="vs meta 95%" />
          <KPICard title="Entregas no Prazo" value={`${metrics?.taxaEntregaNoPrazo ?? 0}%`} subtitle="Meta: >98%" target={98} icon={CheckCircle2} status={getDeliveryRateStatus(metrics?.taxaEntregaNoPrazo ?? 0)} trend={metrics?.taxaEntregaNoPrazo && metrics.taxaEntregaNoPrazo >= 98 ? "up" : "down"} trendValue="vs meta 98%" />
          <KPICard title="Taxa de Ocorrências" value={`${metrics?.taxaOcorrencias ?? 0}%`} subtitle="Meta: <1%" icon={XCircle} status={getIncidentStatus(metrics?.taxaOcorrencias ?? 0)} trend={metrics?.taxaOcorrencias && metrics.taxaOcorrencias <= 1 ? "up" : "down"} trendValue="vs meta 1%" />
          <KPICard title="Lead Time SP" value={`${metrics?.tempoMedioColetaSP ?? 0}h`} subtitle="Meta: <48h" icon={Timer} status={getLeadTimeStatus(metrics?.tempoMedioColetaSP ?? 0)} trend={metrics?.tempoMedioColetaSP && metrics.tempoMedioColetaSP <= 48 ? "up" : "down"} trendValue="vs meta 48h" />
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="stat-card text-center"><Package className="w-5 h-5 text-freight-internal mx-auto mb-2" /><p className="text-2xl font-bold">{metrics?.totalColetas ?? 0}</p><p className="text-xs text-muted-foreground">Coletas Total</p></motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="stat-card text-center"><Clock className="w-5 h-5 text-warning mx-auto mb-2" /><p className="text-2xl font-bold">{metrics?.coletasPendentes ?? 0}</p><p className="text-xs text-muted-foreground">Pendentes</p></motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="stat-card text-center"><Truck className="w-5 h-5 text-info mx-auto mb-2" /><p className="text-2xl font-bold">{metrics?.coletasEmTransito ?? 0}</p><p className="text-xs text-muted-foreground">Em Trânsito</p></motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="stat-card text-center"><CheckCircle2 className="w-5 h-5 text-success mx-auto mb-2" /><p className="text-2xl font-bold">{metrics?.coletasFinalizadas ?? 0}</p><p className="text-xs text-muted-foreground">Finalizadas</p></motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="stat-card text-center"><Send className="w-5 h-5 text-freight-customer mx-auto mb-2" /><p className="text-2xl font-bold">{metrics?.totalEntregas ?? 0}</p><p className="text-xs text-muted-foreground">Entregas Total</p></motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="stat-card text-center"><Building2 className="w-5 h-5 text-freight-supplier mx-auto mb-2" /><p className="text-2xl font-bold">{metrics?.entregasEmTransito ?? 0}</p><p className="text-xs text-muted-foreground">Despachadas</p></motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="stat-card text-center"><TrendingUp className="w-5 h-5 text-success mx-auto mb-2" /><p className="text-2xl font-bold">{metrics?.entregasFinalizadas ?? 0}</p><p className="text-xs text-muted-foreground">Entregues</p></motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="stat-card text-center"><AlertTriangle className="w-5 h-5 text-destructive mx-auto mb-2" /><p className="text-2xl font-bold">{metrics?.alertasCriticos ?? 0}</p><p className="text-xs text-muted-foreground">Alertas</p></motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="entregas" className="w-full">
              <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="entregas">Volume Semanal</TabsTrigger><TabsTrigger value="status">Distribuição</TabsTrigger></TabsList>
              <TabsContent value="entregas" className="mt-4"><PerformanceChart title="Volume de Operações" subtitle="Últimos 7 dias" type="area" data={weeklyData} dataKey="entregas" /></TabsContent>
              <TabsContent value="status" className="mt-4"><PerformanceChart title="Distribuição por Status" subtitle="Entregas ativas" type="bar" data={statusDistribution} dataKey="value" /></TabsContent>
            </Tabs>
            <QuickActions />
          </div>
          <div className="space-y-6">
            <AlertsPanel alerts={alerts} isLoading={alertsLoading} />
            <TransportadoraRanking transportadoras={transportadoras} isLoading={transportadorasLoading} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
