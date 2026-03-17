import { useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QUERY_STALE_TIME } from "@/lib/queryConfig";
import { BarChart3, TrendingUp, TrendingDown, Target, Truck, DollarSign, Clock, AlertTriangle, CheckCircle2, Package, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, subDays, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { formatCurrency } from "@/lib/formatters";

export default function DashboardExecutivo() {
  // Fetch all core metrics
  const { data: entregasData } = useQuery({
    queryKey: ["exec-entregas"],
    queryFn: async () => {
      const now = new Date();
      const thisMonth = startOfMonth(now);
      const lastMonth = startOfMonth(subMonths(now, 1));
      const endLastMonth = endOfMonth(subMonths(now, 1));

      const [current, previous] = await Promise.all([
        supabase.from("entregas").select("status, valor_frete, previsao_entrega, data_entrega_efetiva, created_at, transportadora_id").gte("created_at", thisMonth.toISOString()),
        supabase.from("entregas").select("status, valor_frete, previsao_entrega, data_entrega_efetiva, created_at").gte("created_at", lastMonth.toISOString()).lte("created_at", endLastMonth.toISOString()),
      ]);
      return { current: current.data || [], previous: previous.data || [] };
    },
    staleTime: QUERY_STALE_TIME.DASHBOARD,
  });

  const { data: coletasData } = useQuery({
    queryKey: ["exec-coletas"],
    queryFn: async () => {
      const thisMonth = startOfMonth(new Date());
      const { data } = await supabase.from("coletas").select("status, qtd_volumes, qtd_recebida, divergencia_percentual, created_at").gte("created_at", thisMonth.toISOString());
      return data || [];
    },
    staleTime: QUERY_STALE_TIME.DASHBOARD,
  });

  const { data: ocorrenciasData } = useQuery({
    queryKey: ["exec-ocorrencias"],
    queryFn: async () => {
      const thisMonth = startOfMonth(new Date());
      const { data } = await supabase.from("ocorrencias").select("tipo_ocorrencia, resolvida, created_at").gte("created_at", thisMonth.toISOString());
      return data || [];
    },
    staleTime: QUERY_STALE_TIME.DASHBOARD,
  });

  const { data: transportadoras = [] } = useQuery({
    queryKey: ["exec-transportadoras"],
    queryFn: async () => {
      const { data } = await supabase.from("transportadoras").select("id, nome_fantasia, score_performance").order("score_performance", { ascending: false }).limit(10);
      return data || [];
    },
    staleTime: QUERY_STALE_TIME.DASHBOARD,
  });

  // Calculate KPIs
  const kpis = useMemo(() => {
    const curr = entregasData?.current || [];
    const prev = entregasData?.previous || [];
    const coletas = coletasData || [];
    const ocorrencias = ocorrenciasData || [];

    const totalEntregas = curr.length;
    const prevTotal = prev.length;
    const entregues = curr.filter(e => e.status === "entregue" || e.status === "finalizado");
    
    // OTIF: On Time In Full
    const onTime = entregues.filter(e => {
      if (!e.previsao_entrega || !e.data_entrega_efetiva) return true;
      return new Date(e.data_entrega_efetiva) <= new Date(e.previsao_entrega);
    });
    const otifRate = entregues.length > 0 ? (onTime.length / entregues.length) * 100 : 0;

    // Custo total frete
    const totalFrete = curr.reduce((acc, e) => acc + (e.valor_frete || 0), 0);
    const prevFrete = prev.reduce((acc, e) => acc + (e.valor_frete || 0), 0);

    // Taxa de incidentes
    const incidentRate = totalEntregas > 0 ? (ocorrencias.length / totalEntregas) * 100 : 0;

    // Divergência média coletas
    const coletasComDiv = coletas.filter(c => c.divergencia_percentual != null && c.divergencia_percentual > 0);
    const avgDivergencia = coletasComDiv.length > 0 ? coletasComDiv.reduce((acc, c) => acc + (c.divergencia_percentual || 0), 0) / coletasComDiv.length : 0;

    // Growth
    const entregasGrowth = prevTotal > 0 ? ((totalEntregas - prevTotal) / prevTotal) * 100 : 0;
    const freteGrowth = prevFrete > 0 ? ((totalFrete - prevFrete) / prevFrete) * 100 : 0;

    return {
      totalEntregas, prevTotal, entregasGrowth,
      otifRate, targetOtif: 95,
      totalFrete, prevFrete, freteGrowth,
      incidentRate, targetIncident: 1,
      avgDivergencia, targetDivergencia: 5,
      totalColetas: coletas.length,
      entregues: entregues.length,
      ocorrencias: ocorrencias.length,
      ocorrenciasResolvidas: ocorrencias.filter(o => o.resolvida).length,
    };
  }, [entregasData, coletasData, ocorrenciasData]);

  // Pie chart: status distribution
  const statusDistribution = useMemo(() => {
    const curr = entregasData?.current || [];
    const groups: Record<string, number> = {};
    curr.forEach(e => { groups[e.status] = (groups[e.status] || 0) + 1; });
    return Object.entries(groups).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));
  }, [entregasData]);

  const pieColors = ["hsl(var(--primary))", "hsl(var(--warning))", "hsl(var(--success))", "hsl(var(--destructive))", "hsl(var(--accent))", "hsl(var(--muted))"];

  // Transportadora ranking chart
  const rankingData = useMemo(() => {
    return transportadoras.slice(0, 6).map(t => ({
      name: (t.nome_fantasia || "").substring(0, 12),
      score: t.score_performance || 0,
    }));
  }, [transportadoras]);

  const GrowthIndicator = ({ value, suffix = "%" }: { value: number; suffix?: string }) => {
    if (value === 0) return <span className="text-muted-foreground flex items-center gap-1 text-xs"><Minus className="w-3 h-3" />0{suffix}</span>;
    if (value > 0) return <span className="text-success flex items-center gap-1 text-xs"><ArrowUpRight className="w-3 h-3" />+{value.toFixed(1)}{suffix}</span>;
    return <span className="text-destructive flex items-center gap-1 text-xs"><ArrowDownRight className="w-3 h-3" />{value.toFixed(1)}{suffix}</span>;
  };

  const KPIStatus = ({ value, target, inverted = false }: { value: number; target: number; inverted?: boolean }) => {
    const isGood = inverted ? value <= target : value >= target;
    return (
      <Badge variant="secondary" className={cn("text-xs", isGood ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive")}>
        {isGood ? "✓ Na meta" : "✗ Abaixo"}
      </Badge>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            Dashboard Executivo
          </h1>
          <p className="text-muted-foreground mt-1">Visão C-level — {format(new Date(), "MMMM yyyy", { locale: ptBR })}</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* OTIF */}
          <div className="card-base p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Target className="w-5 h-5 text-primary" />
              <KPIStatus value={kpis.otifRate} target={kpis.targetOtif} />
            </div>
            <p className="text-2xl font-bold">{kpis.otifRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">OTIF (On Time In Full)</p>
            <p className="text-xs text-muted-foreground">Meta: ≥{kpis.targetOtif}%</p>
          </div>

          {/* Custo Frete */}
          <div className="card-base p-4 space-y-2">
            <div className="flex items-center justify-between">
              <DollarSign className="w-5 h-5 text-success" />
              <GrowthIndicator value={kpis.freteGrowth} />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(kpis.totalFrete)}</p>
            <p className="text-xs text-muted-foreground">Custo Frete Mensal</p>
            <p className="text-xs text-muted-foreground">Mês anterior: {formatCurrency(kpis.prevFrete)}</p>
          </div>

          {/* Taxa de Incidentes */}
          <div className="card-base p-4 space-y-2">
            <div className="flex items-center justify-between">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <KPIStatus value={kpis.incidentRate} target={kpis.targetIncident} inverted />
            </div>
            <p className="text-2xl font-bold">{kpis.incidentRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Taxa de Incidentes</p>
            <p className="text-xs text-muted-foreground">Meta: ≤{kpis.targetIncident}%</p>
          </div>

          {/* Divergência Coletas */}
          <div className="card-base p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Package className="w-5 h-5 text-accent-foreground" />
              <KPIStatus value={kpis.avgDivergencia} target={kpis.targetDivergencia} inverted />
            </div>
            <p className="text-2xl font-bold">{kpis.avgDivergencia.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Divergência Média Coletas</p>
            <p className="text-xs text-muted-foreground">Meta: ≤{kpis.targetDivergencia}%</p>
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

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <div className="card-base p-4">
            <h3 className="font-semibold mb-4">Distribuição de Status</h3>
            {statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusDistribution} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                    {statusDistribution.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">Sem dados</p>
            )}
          </div>

          {/* Transportadora Ranking */}
          <div className="card-base p-4">
            <h3 className="font-semibold mb-4">Ranking Transportadoras (Score)</h3>
            {rankingData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={rankingData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" domain={[0, 100]} className="text-xs fill-muted-foreground" />
                  <YAxis type="category" dataKey="name" width={100} className="text-xs fill-muted-foreground" />
                  <Tooltip />
                  <Bar dataKey="score" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">Sem dados</p>
            )}
          </div>
        </div>

        {/* Metas Summary Table */}
        <div className="card-base p-4">
          <h3 className="font-semibold mb-4">Resumo de Metas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-muted-foreground font-medium">KPI</th>
                  <th className="text-center py-2 text-muted-foreground font-medium">Atual</th>
                  <th className="text-center py-2 text-muted-foreground font-medium">Meta</th>
                  <th className="text-center py-2 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "OTIF", current: `${kpis.otifRate.toFixed(1)}%`, target: "≥95%", ok: kpis.otifRate >= 95 },
                  { name: "Taxa de Incidentes", current: `${kpis.incidentRate.toFixed(1)}%`, target: "≤1%", ok: kpis.incidentRate <= 1 },
                  { name: "Divergência Coletas", current: `${kpis.avgDivergencia.toFixed(1)}%`, target: "≤5%", ok: kpis.avgDivergencia <= 5 },
                  { name: "Entregas no Prazo", current: `${kpis.otifRate.toFixed(1)}%`, target: "≥98%", ok: kpis.otifRate >= 98 },
                  { name: "Ocorrências Resolvidas", current: `${kpis.ocorrencias > 0 ? ((kpis.ocorrenciasResolvidas / kpis.ocorrencias) * 100).toFixed(0) : 100}%`, target: "≥90%", ok: kpis.ocorrencias === 0 || (kpis.ocorrenciasResolvidas / kpis.ocorrencias) >= 0.9 },
                ].map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 font-medium">{row.name}</td>
                    <td className="py-2 text-center font-semibold">{row.current}</td>
                    <td className="py-2 text-center text-muted-foreground">{row.target}</td>
                    <td className="py-2 text-center">
                      <Badge variant="secondary" className={cn("text-xs", row.ok ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive")}>
                        {row.ok ? "✓ Atingida" : "✗ Pendente"}
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
