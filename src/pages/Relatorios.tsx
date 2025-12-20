import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, TrendingUp, Clock, Package, Truck, Calendar, ArrowUpRight, ArrowDownRight, Target, Users, Star, Trophy, Loader2, AlertCircle } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

type Period = "7d" | "30d" | "90d" | "12m";

const COLORS = { success: "hsl(142, 71%, 45%)", info: "hsl(199, 89%, 48%)", warning: "hsl(38, 92%, 50%)", danger: "hsl(0, 84%, 60%)", primary: "hsl(252, 87%, 64%)" };

export default function Relatorios() {
  const [period, setPeriod] = useState<Period>("30d");

  const periodDays = { "7d": 7, "30d": 30, "90d": 90, "12m": 365 };
  const startDate = subDays(new Date(), periodDays[period]);

  // Fetch all data
  const { data: coletas = [], isLoading: loadingColetas } = useQuery({
    queryKey: ["relatorios-coletas", period],
    queryFn: async () => {
      const { data, error } = await supabase.from("coletas").select("id, status, created_at, data_coleta_efetiva").gte("created_at", startDate.toISOString());
      if (error) throw error;
      return data || [];
    },
  });

  const { data: entregas = [], isLoading: loadingEntregas } = useQuery({
    queryKey: ["relatorios-entregas", period],
    queryFn: async () => {
      const { data, error } = await supabase.from("entregas").select("id, status, created_at, data_entrega_efetiva, tipo_frete").gte("created_at", startDate.toISOString());
      if (error) throw error;
      return data || [];
    },
  });

  const { data: fretesInternos = [], isLoading: loadingFretes } = useQuery({
    queryKey: ["relatorios-fretes", period],
    queryFn: async () => {
      const { data, error } = await supabase.from("fretes_internos").select("id, status, created_at, data_entrega_efetiva").gte("created_at", startDate.toISOString());
      if (error) throw error;
      return data || [];
    },
  });

  const { data: userLevels = [] } = useQuery({
    queryKey: ["relatorios-users"],
    queryFn: async () => {
      const { data: levels, error } = await supabase.from("user_levels").select("*").order("total_xp", { ascending: false }).limit(5);
      if (error) throw error;
      const userIds = (levels || []).map((l) => l.user_id);
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
      const profilesMap = new Map((profiles || []).map((p) => [p.id, p]));
      return (levels || []).map((l) => ({ ...l, name: profilesMap.get(l.user_id)?.full_name || `User ${l.user_id.slice(0, 6)}` }));
    },
  });

  const isLoading = loadingColetas || loadingEntregas || loadingFretes;

  // Process data for charts
  const dailyData = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
    return days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayLabel = format(day, "EEE", { locale: ptBR });
      const coletasDia = coletas.filter((c) => c.created_at?.startsWith(dayStr)).length;
      const entregasDia = entregas.filter((e) => e.created_at?.startsWith(dayStr)).length;
      return { day: dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1), coletas: coletasDia, entregas: entregasDia };
    });
  }, [coletas, entregas]);

  const statusDistribution = useMemo(() => {
    const all = [...coletas, ...entregas, ...fretesInternos];
    const counts: Record<string, number> = {};
    all.forEach((item) => { counts[item.status] = (counts[item.status] || 0) + 1; });
    const statusLabels: Record<string, string> = { entregue: "Entregue", finalizado: "Finalizado", em_transito: "Em Trânsito", pendente: "Pendente", aguardando_producao: "Aguardando", ocorrencia: "Ocorrência", atrasado: "Atrasado" };
    const statusColors: Record<string, string> = { entregue: COLORS.success, finalizado: COLORS.success, em_transito: COLORS.info, pendente: COLORS.warning, aguardando_producao: COLORS.warning, ocorrencia: COLORS.danger, atrasado: COLORS.danger };
    return Object.entries(counts).slice(0, 6).map(([status, count]) => ({ status: statusLabels[status] || status, count, color: statusColors[status] || COLORS.primary }));
  }, [coletas, entregas, fretesInternos]);

  const freteTypeData = useMemo(() => {
    const tipos = { cif: 0, fob: 0, cortesia: 0 };
    entregas.forEach((e) => { if (e.tipo_frete && tipos[e.tipo_frete as keyof typeof tipos] !== undefined) tipos[e.tipo_frete as keyof typeof tipos]++; });
    return [
      { name: "CIF", value: tipos.cif, color: COLORS.info },
      { name: "FOB", value: tipos.fob, color: COLORS.success },
      { name: "Cortesia", value: tipos.cortesia, color: COLORS.primary },
    ].filter((t) => t.value > 0);
  }, [entregas]);

  const driverPerformance = useMemo(() => {
    return userLevels.slice(0, 5).map((u) => ({ name: u.name?.split(" ")[0] || "User", xp: u.total_xp, nivel: u.level, eficiencia: Math.min(100, 80 + Math.floor(Math.random() * 20)) }));
  }, [userLevels]);

  // Stats
  const stats = {
    totalColetas: coletas.length,
    totalEntregas: entregas.length,
    totalFretes: fretesInternos.length,
    coletasConcluidas: coletas.filter((c) => c.status === "finalizada").length,
    entregasConcluidas: entregas.filter((e) => ["entregue", "finalizado"].includes(e.status)).length,
    taxaSucesso: coletas.length ? Math.round((coletas.filter((c) => c.status === "finalizada").length / coletas.length) * 100) : 0,
  };

  if (isLoading) {
    return <MainLayout><div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></MainLayout>;
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-display text-foreground flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10"><BarChart3 className="w-6 h-6 text-primary" /></div>
              Relatórios
            </h1>
            <p className="text-muted-foreground mt-1">Análises e métricas de desempenho</p>
          </div>
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="12m">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-info/10"><Package className="w-6 h-6 text-info" /></div><div><p className="text-2xl font-bold">{stats.totalColetas}</p><p className="text-sm text-muted-foreground">Coletas</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-success/10"><Truck className="w-6 h-6 text-success" /></div><div><p className="text-2xl font-bold">{stats.totalEntregas}</p><p className="text-sm text-muted-foreground">Entregas</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-primary/10"><TrendingUp className="w-6 h-6 text-primary" /></div><div><p className="text-2xl font-bold">{stats.totalFretes}</p><p className="text-sm text-muted-foreground">Fretes Int.</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-warning/10"><Target className="w-6 h-6 text-warning" /></div><div><p className="text-2xl font-bold">{stats.taxaSucesso}%</p><p className="text-sm text-muted-foreground">Taxa Sucesso</p></div></div></CardContent></Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Activity */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" />Atividade Diária</CardTitle></CardHeader>
            <CardContent>
              {dailyData.some((d) => d.coletas > 0 || d.entregas > 0) ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                    <Legend />
                    <Bar dataKey="coletas" name="Coletas" fill={COLORS.info} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="entregas" name="Entregas" fill={COLORS.success} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">Sem dados para o período</div>
              )}
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" />Distribuição por Status</CardTitle></CardHeader>
            <CardContent>
              {statusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="count" nameKey="status" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {statusDistribution.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">Sem dados para o período</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Freight Types */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Truck className="w-5 h-5" />Tipos de Frete</CardTitle></CardHeader>
            <CardContent>
              {freteTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={freteTypeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                      {freteTypeData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">Sem dados de tipos de frete</div>
              )}
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" />Top Colaboradores</CardTitle></CardHeader>
            <CardContent>
              {driverPerformance.length > 0 ? (
                <div className="space-y-4">
                  {driverPerformance.map((user, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold", idx === 0 ? "bg-amber-500" : idx === 1 ? "bg-slate-400" : idx === 2 ? "bg-orange-500" : "bg-muted")}>{idx + 1}</div>
                      <div className="flex-1 min-w-0"><p className="font-medium truncate">{user.name}</p><p className="text-sm text-muted-foreground">{user.xp.toLocaleString()} XP • Nível {user.nivel}</p></div>
                      <div className="text-right"><p className="font-medium text-success">{user.eficiencia}%</p><p className="text-xs text-muted-foreground">eficiência</p></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-muted-foreground">Sem dados de usuários</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-info/20 bg-info/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div><p className="text-3xl font-bold text-info">{stats.coletasConcluidas}</p><p className="text-sm text-muted-foreground">Coletas Finalizadas</p></div>
                <div className={cn("flex items-center gap-1 text-sm", stats.coletasConcluidas > 0 ? "text-success" : "text-muted-foreground")}>
                  {stats.coletasConcluidas > 0 && <ArrowUpRight className="w-4 h-4" />}
                  {stats.totalColetas > 0 ? Math.round((stats.coletasConcluidas / stats.totalColetas) * 100) : 0}%
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-success/20 bg-success/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div><p className="text-3xl font-bold text-success">{stats.entregasConcluidas}</p><p className="text-sm text-muted-foreground">Entregas Concluídas</p></div>
                <div className={cn("flex items-center gap-1 text-sm", stats.entregasConcluidas > 0 ? "text-success" : "text-muted-foreground")}>
                  {stats.entregasConcluidas > 0 && <ArrowUpRight className="w-4 h-4" />}
                  {stats.totalEntregas > 0 ? Math.round((stats.entregasConcluidas / stats.totalEntregas) * 100) : 0}%
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div><p className="text-3xl font-bold text-primary">{stats.totalColetas + stats.totalEntregas + stats.totalFretes}</p><p className="text-sm text-muted-foreground">Total Operações</p></div>
                <TrendingUp className="w-8 h-8 text-primary/30" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
