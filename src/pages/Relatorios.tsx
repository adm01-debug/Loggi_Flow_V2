/* eslint-disable max-lines */
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart3,
  TrendingUp,
  Package,
  Truck,
  Calendar,
  ArrowUpRight,
  Target,
  Trophy,
  Loader2,
  Mail,
  FileDown,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { EmptyState } from "@/components/common/EmptyState";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DrillDownModal } from "@/components/analytics/DrillDownModal";
import { useDrillDown } from "@/hooks/analytics/useDrillDown";
import { ScheduledReportsManager } from "@/components/reports/ScheduledReportsManager";
import { toast } from "sonner";
import { useExport } from "@/hooks/common/useExport";

type Period = "7d" | "30d" | "90d" | "12m";

const COLORS = {
  success: "hsl(142, 71%, 45%)",
  info: "hsl(199, 89%, 48%)",
  warning: "hsl(38, 92%, 50%)",
  danger: "hsl(0, 84%, 60%)",
  primary: "hsl(252, 87%, 64%)",
};

export default function Relatorios() {
  const [period, setPeriod] = useState<Period>("30d");
  const drillDown = useDrillDown();
  const { exportToCSV, exportToPDF } = useExport();

  const { data: performanceMetrics = [] } = useQuery({
    queryKey: ["performance-metrics-report"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("performance_metrics")
        .select("*")
        .limit(1000);
      if (error) throw error;
      return data || [];
    },
  });

  const periodDays = { "7d": 7, "30d": 30, "90d": 90, "12m": 365 };
  const startDate = subDays(new Date(), periodDays[period]);

  // Fetch all data
  const {
    data: coletas = [],
    isLoading: loadingColetas,
    isError: isErrorColetas,
    error: errorColetas,
  } = useQuery({
    queryKey: ["relatorios-coletas", period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coletas")
        .select("id, status, created_at, data_efetiva_coleta")
        .is("deleted_at", null)
        .gte("created_at", startDate.toISOString())
        .limit(5000);
      if (error) throw error;
      return data || [];
    },
  });

  const {
    data: entregas = [],
    isLoading: loadingEntregas,
    isError: isErrorEntregas,
    error: errorEntregas,
  } = useQuery({
    queryKey: ["relatorios-entregas", period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entregas")
        .select("id, status, created_at, data_entrega_efetiva, tipo_frete")
        .is("deleted_at", null)
        .gte("created_at", startDate.toISOString())
        .limit(5000);
      if (error) throw error;
      return data || [];
    },
  });

  const {
    data: fretesInternos = [],
    isLoading: loadingFretes,
    isError: isErrorFretes,
    error: errorFretes,
  } = useQuery({
    queryKey: ["relatorios-fretes", period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fretes_internos")
        .select("id, status, created_at, data_entrega_efetiva")
        .is("deleted_at", null)
        .gte("created_at", startDate.toISOString())
        .limit(5000);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: userLevels = [] } = useQuery({
    queryKey: ["relatorios-users"],
    queryFn: async () => {
      const { data: levels, error } = await supabase
        .from("user_levels")
        .select("*")
        .order("total_xp", { ascending: false })
        .limit(5);
      if (error) throw error;
      const userIds = (levels || []).map((l) => l.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      const profilesMap = new Map((profiles || []).map((p) => [p.id, p]));
      return (levels || []).map((l) => ({
        ...l,
        name:
          profilesMap.get(l.user_id)?.full_name ||
          `User ${l.user_id.slice(0, 6)}`,
      }));
    },
  });

  const isLoading = loadingColetas || loadingEntregas || loadingFretes;
  const isError = isErrorColetas || isErrorEntregas || isErrorFretes;
  const errorMessage =
    errorColetas?.message || errorEntregas?.message || errorFretes?.message;

  // Process data for charts
  const dailyData = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    });
    return days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayLabel = format(day, "EEE", { locale: ptBR });
      const coletasDia = coletas.filter((c) =>
        c.created_at?.startsWith(dayStr),
      ).length;
      const entregasDia = entregas.filter((e) =>
        e.created_at?.startsWith(dayStr),
      ).length;
      return {
        day: dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1),
        coletas: coletasDia,
        entregas: entregasDia,
        fullDate: dayStr,
      };
    });
  }, [coletas, entregas]);

  const statusDistribution = useMemo(() => {
    const all = [...coletas, ...entregas, ...fretesInternos];
    const counts: Record<string, number> = {};
    all.forEach((item) => {
      counts[item.status] = (counts[item.status] || 0) + 1;
    });
    const statusLabels: Record<string, string> = {
      entregue: "Entregue",
      finalizado: "Finalizado",
      em_transito: "Em Trânsito",
      pendente: "Pendente",
      aguardando_producao: "Aguardando",
      ocorrencia: "Ocorrência",
      atrasado: "Atrasado",
    };
    const statusColors: Record<string, string> = {
      entregue: COLORS.success,
      finalizado: COLORS.success,
      em_transito: COLORS.info,
      pendente: COLORS.warning,
      aguardando_producao: COLORS.warning,
      ocorrencia: COLORS.danger,
      atrasado: COLORS.danger,
    };
    return Object.entries(counts)
      .slice(0, 6)
      .map(([status, count]) => ({
        status: statusLabels[status] || status,
        statusKey: status,
        count,
        color: statusColors[status] || COLORS.primary,
      }));
  }, [coletas, entregas, fretesInternos]);

  const freteTypeData = useMemo(() => {
    const tipos = { cif: 0, fob: 0, cortesia: 0 };
    entregas.forEach((e) => {
      if (
        e.tipo_frete &&
        tipos[e.tipo_frete as keyof typeof tipos] !== undefined
      )
        tipos[e.tipo_frete as keyof typeof tipos]++;
    });
    return [
      { name: "CIF", value: tipos.cif, color: COLORS.info },
      { name: "FOB", value: tipos.fob, color: COLORS.success },
      { name: "Cortesia", value: tipos.cortesia, color: COLORS.primary },
    ].filter((t) => t.value > 0);
  }, [entregas]);

  const driverPerformance = useMemo(() => {
    const maxXp = Math.max(1, ...userLevels.map((u) => u.total_xp || 0));
    return userLevels.slice(0, 5).map((u) => ({
      name: u.name?.split(" ")[0] || "User",
      xp: u.total_xp,
      nivel: u.level,
      eficiencia: Math.round(((u.total_xp || 0) / maxXp) * 100), // XP relativo ao líder (antes: valor aleatório)
    }));
  }, [userLevels]);

  // Stats
  const stats = {
    totalColetas: coletas.length,
    totalEntregas: entregas.length,
    totalFretes: fretesInternos.length,
    coletasConcluidas: coletas.filter((c) => c.status === "finalizada").length,
    entregasConcluidas: entregas.filter((e) =>
      ["entregue", "finalizado"].includes(e.status),
    ).length,
    taxaSucesso: coletas.length
      ? Math.round(
          (coletas.filter((c) => c.status === "finalizada").length /
            coletas.length) *
            100,
        )
      : 0,
  };

  // Drill-down handlers
  const handleBarClick = (data: {
    activePayload?: Array<{
      payload: { fullDate: string; coletas: number; entregas: number };
    }>;
  }) => {
    if (data.activePayload?.[0]) {
      const payload = data.activePayload[0].payload;
      drillDown.openDrillDown({
        category: "entregas",
        filter: { day: payload.fullDate },
        title: `Atividades em ${format(new Date(payload.fullDate), "dd/MM/yyyy")}`,
        value: payload.coletas + payload.entregas,
      });
    }
  };

  const handlePieClick = (data: {
    statusKey?: string;
    status?: string;
    count?: number;
  }) => {
    if (data.statusKey) {
      drillDown.openDrillDown({
        category: "entregas",
        filter: { status: data.statusKey },
        title: `Registros com status: ${data.status}`,
        value: data.count || 0,
      });
    }
  };

  const handleKPIClick = (
    category: "coletas" | "entregas" | "fretes_internos",
    title: string,
    value: number,
  ) => {
    drillDown.openDrillDown({
      category,
      filter: {
        dateRange: {
          start: startDate.toISOString(),
          end: new Date().toISOString(),
        },
      },
      title,
      value,
    });
  };

  if (isError) {
    return (
      <MainLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <EmptyState
            variant="error"
            title="Erro ao carregar relatórios"
            description={
              errorMessage ||
              "Não foi possível carregar os dados dos relatórios. Tente novamente."
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

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between px-2">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white flex items-center gap-4 tracking-tighter uppercase italic">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black border border-white/10 shadow-2xl transition-transform hover:scale-110">
                  <BarChart3 className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="drop-shadow-2xl">Métricas Nexus</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                    <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                      Insights_Engine_Active
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">
                    DATA • ANALYTICS • PERFORMANCE
                  </span>
                </div>
              </div>
            </h1>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2 border-primary/20 text-primary hover:bg-primary/5"
              onClick={() => {
                if (performanceMetrics.length === 0) {
                  toast.error("Sem dados de performance para exportar");
                  return;
                }
                exportToCSV(performanceMetrics, {
                  filename: "performance_logistica",
                });
              }}
            >
              <FileDown className="w-4 h-4" />
              Exportar CSV
            </Button>
            <Button
              className="gap-2 shadow-lg shadow-primary/20"
              onClick={() => {
                if (performanceMetrics.length === 0) {
                  toast.error("Sem dados de performance para exportar");
                  return;
                }
                exportToPDF(performanceMetrics, {
                  filename: "relatorio_performance",
                  title: "Relatório de Performance e SLA Logístico",
                  subtitle: `Período de Análise: ${period} - Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
                });
              }}
            >
              <FileDown className="w-4 h-4" />
              Gerar PDF
            </Button>
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="agendados" className="gap-2">
              <Mail className="h-4 w-4" />
              Agendados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="flex justify-end">
              <Select
                value={period}
                onValueChange={(v) => setPeriod(v as Period)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 90 dias</SelectItem>
                  <SelectItem value="12m">Último ano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* KPI Cards - Now clickable */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card
                className="cursor-pointer transition-all hover:shadow-md hover:border-info/50"
                onClick={() =>
                  handleKPIClick(
                    "coletas",
                    "Todas as Coletas",
                    stats.totalColetas,
                  )
                }
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-info/10">
                      <Package className="w-6 h-6 text-info" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalColetas}</p>
                      <p className="text-sm text-muted-foreground">Coletas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer transition-all hover:shadow-md hover:border-success/50"
                onClick={() =>
                  handleKPIClick(
                    "entregas",
                    "Todas as Entregas",
                    stats.totalEntregas,
                  )
                }
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-success/10">
                      <Truck className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {stats.totalEntregas}
                      </p>
                      <p className="text-sm text-muted-foreground">Entregas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card
                className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                onClick={() =>
                  handleKPIClick(
                    "fretes_internos",
                    "Fretes Internos",
                    stats.totalFretes,
                  )
                }
              >
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <TrendingUp className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.totalFretes}</p>
                      <p className="text-sm text-muted-foreground">
                        Fretes Int.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-warning/10">
                      <Target className="w-6 h-6 text-warning" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.taxaSucesso}%</p>
                      <p className="text-sm text-muted-foreground">
                        Taxa Sucesso
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Activity - Clickable */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Atividade Diária{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      (clique na barra)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dailyData.some((d) => d.coletas > 0 || d.entregas > 0) ? (
                    <ResponsiveContainer width="100%" height={250}>
                      {/* Recharts 3 alargou as assinaturas de onClick; o runtime continua
                          entregando activePayload / a fatia clicada. */}
                      <BarChart
                        data={dailyData}
                        onClick={(state) =>
                          handleBarClick(
                            state as unknown as Parameters<
                              typeof handleBarClick
                            >[0],
                          )
                        }
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-muted"
                        />
                        <XAxis dataKey="day" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="coletas"
                          name="Coletas"
                          fill={COLORS.info}
                          radius={[4, 4, 0, 0]}
                          className="cursor-pointer"
                        />
                        <Bar
                          dataKey="entregas"
                          name="Entregas"
                          fill={COLORS.success}
                          radius={[4, 4, 0, 0]}
                          className="cursor-pointer"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                      Sem dados para o período
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status Distribution - Clickable */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Distribuição por Status{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      (clique na fatia)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {statusDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="status"
                          label={({ name, percent }) =>
                            `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                          }
                          onClick={(sector) =>
                            handlePieClick(
                              sector as unknown as Parameters<
                                typeof handlePieClick
                              >[0],
                            )
                          }
                          className="cursor-pointer"
                        >
                          {statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                      Sem dados para o período
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Freight Types */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Tipos de Frete
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {freteTypeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={freteTypeData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {freteTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                      Sem dados de tipos de frete
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Performers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    Top Colaboradores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {driverPerformance.length > 0 ? (
                    <div className="space-y-4">
                      {driverPerformance.map((user, idx) => {
                        const rankBg =
                          [
                            "bg-warning",
                            "bg-muted-foreground",
                            "bg-destructive/80",
                          ][idx] ?? "bg-muted";
                        return (
                          <div key={idx} className="flex items-center gap-4">
                            <div
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold",
                                rankBg,
                              )}
                            >
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {user.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {user.xp.toLocaleString()} XP • Nível{" "}
                                {user.nivel}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-success">
                                {user.eficiencia}%
                              </p>
                              <p className="text-xs text-muted-foreground">
                                eficiência
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                      Sem dados de usuários
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Summary Cards - Clickable */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card
                className="border-info/20 bg-info/5 cursor-pointer transition-all hover:shadow-md"
                onClick={() =>
                  drillDown.openDrillDown({
                    category: "coletas",
                    filter: { status: "finalizada" },
                    title: "Coletas Finalizadas",
                    value: stats.coletasConcluidas,
                  })
                }
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-info">
                        {stats.coletasConcluidas}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Coletas Finalizadas
                      </p>
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-1 text-sm",
                        stats.coletasConcluidas > 0
                          ? "text-success"
                          : "text-muted-foreground",
                      )}
                    >
                      {stats.coletasConcluidas > 0 && (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                      {stats.totalColetas > 0
                        ? Math.round(
                            (stats.coletasConcluidas / stats.totalColetas) *
                              100,
                          )
                        : 0}
                      %
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card
                className="border-success/20 bg-success/5 cursor-pointer transition-all hover:shadow-md"
                onClick={() =>
                  drillDown.openDrillDown({
                    category: "entregas",
                    filter: { status: "entregue" },
                    title: "Entregas Concluídas",
                    value: stats.entregasConcluidas,
                  })
                }
              >
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-success">
                        {stats.entregasConcluidas}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Entregas Concluídas
                      </p>
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-1 text-sm",
                        stats.entregasConcluidas > 0
                          ? "text-success"
                          : "text-muted-foreground",
                      )}
                    >
                      {stats.entregasConcluidas > 0 && (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                      {stats.totalEntregas > 0
                        ? Math.round(
                            (stats.entregasConcluidas / stats.totalEntregas) *
                              100,
                          )
                        : 0}
                      %
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-primary">
                        {stats.totalColetas +
                          stats.totalEntregas +
                          stats.totalFretes}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Total Operações
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-primary/30" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="agendados">
            <ScheduledReportsManager />
          </TabsContent>
        </Tabs>

        {/* Drill-down Modal */}
        <DrillDownModal
          open={drillDown.isOpen}
          onOpenChange={drillDown.setIsOpen}
          data={drillDown.data}
          isLoading={drillDown.isLoading}
        />
      </div>
    </MainLayout>
  );
}
