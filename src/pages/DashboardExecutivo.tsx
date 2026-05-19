import { useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QUERY_STALE_TIME } from "@/lib/queryConfig";
import { BarChart3, Target, Truck, DollarSign, Clock, AlertTriangle, CheckCircle2, Package, ArrowUpRight, ArrowDownRight, Minus, Bot, BrainCircuit, Sparkles, X, LayoutGrid } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from "recharts";
import { formatCurrency } from "@/lib/formatters";
import { useExecutiveMetrics } from "@/hooks";
import { AIAssistant } from "@/components/ai/AIAssistant";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PerformanceChart, DistributionChart } from "@/components/analytics/AnalyticsCharts";
import { useAnalytics } from "@/hooks/analytics/useAnalytics";

export default function DashboardExecutivo() {
  const [showAI, setShowAI] = useState(false);
  const { trends, carrierOtif, avgCollectionTime } = useExecutiveMetrics();
  const { monthlyData } = useAnalytics();

  // Core monthly metrics (current vs previous)
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

  // KPI calculation
  const kpis = useMemo(() => {
    const curr = entregasData?.current || [];
    const prev = entregasData?.previous || [];
    const coletas = coletasData || [];
    const ocorrencias = ocorrenciasData || [];

    const totalEntregas = curr.length;
    const prevTotal = prev.length;
    const entregues = curr.filter(e => e.status === "entregue" || e.status === "finalizado");

    const onTime = entregues.filter(e => {
      if (!e.previsao_entrega || !e.data_entrega_efetiva) return false;
      return new Date(e.data_entrega_efetiva) <= new Date(e.previsao_entrega);
    });
    const otifRate = entregues.length > 0 ? (onTime.length / entregues.length) * 100 : 0;

    const totalFrete = curr.reduce((acc, e) => acc + (e.valor_frete || 0), 0);
    const prevFrete = prev.reduce((acc, e) => acc + (e.valor_frete || 0), 0);

    const incidentRate = totalEntregas > 0 ? (ocorrencias.length / totalEntregas) * 100 : 0;

    const coletasComDiv = coletas.filter(c => c.divergencia_percentual != null && c.divergencia_percentual > 0);
    const avgDivergencia = coletasComDiv.length > 0 ? coletasComDiv.reduce((acc, c) => acc + (c.divergencia_percentual || 0), 0) / coletasComDiv.length : 0;

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

  const trendData = trends.data || [];
  const carrierData = carrierOtif.data || [];
  const avgColTime = avgCollectionTime.data || 0;

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
            <p className="text-muted-foreground mt-1">Visão C-level — {format(new Date(), "MMMM yyyy", { locale: ptBR })}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant={showAI ? "secondary" : "default"}
              className={cn(
                "gap-2 transition-all duration-300",
                !showAI && "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              )}
              onClick={() => setShowAI(!showAI)}
            >
              {showAI ? <X className="w-4 h-4" /> : <BrainCircuit className="w-4 h-4 animate-pulse" />}
              {showAI ? "Fechar Assistente" : "Assistente Logístico IA"}
              {!showAI && <Badge variant="secondary" className="ml-1 h-5 bg-white/20 text-white border-none text-[10px]">Gemini 2.0</Badge>}
            </Button>
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
                    <p className="text-sm text-muted-foreground">Análise preditiva em tempo real sobre sua operação.</p>
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
                <div className="mt-3 space-y-3">
                  <div className="p-3 bg-background rounded-lg border text-xs">
                    <p className="font-semibold text-destructive">⚠️ Risco Alto: Rota Curitiba → SP</p>
                    <p className="text-muted-foreground mt-1">Obras na BR-116 podem causar atrasos de até 4h em 12 entregas.</p>
                  </div>
                  <div className="p-3 bg-background rounded-lg border text-xs">
                    <p className="font-semibold text-warning">⚡ Oportunidade: Consolidação</p>
                    <p className="text-muted-foreground mt-1">8 encomendas para Campinas podem ser consolidadas na Rodonaves para economia de 12%.</p>
                  </div>
                </div>
              </div>
              <div className="card-base p-4 border-primary/30 bg-primary/5">
                <h3 className="text-sm font-bold flex items-center gap-2 text-primary">
                  <Target className="w-4 h-4" />
                  Metas em Foco
                </h3>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Meta OTIF (95%)</span>
                    <span className="font-bold">92.4%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: '92.4%' }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">"IA sugere priorizar coletas pendentes para subir 1.5%."</p>
                </div>
              </div>
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
            <p className="text-xs text-muted-foreground">OTIF (On Time In Full)</p>
            <p className="text-xs text-muted-foreground">Meta: ≥{kpis.targetOtif}%</p>
          </div>

          <div className="card-base p-4 space-y-2">
            <div className="flex items-center justify-between">
              <DollarSign className="w-5 h-5 text-success" />
              <GrowthIndicator value={kpis.freteGrowth} />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(kpis.totalFrete)}</p>
            <p className="text-xs text-muted-foreground">Custo Frete Mensal</p>
            <p className="text-xs text-muted-foreground">Anterior: {formatCurrency(kpis.prevFrete)}</p>
          </div>

          <div className="card-base p-4 space-y-2">
            <div className="flex items-center justify-between">
              <AlertTriangle className="w-5 h-5 text-warning" />
              <KPIStatus value={kpis.incidentRate} target={kpis.targetIncident} inverted />
            </div>
            <p className="text-2xl font-bold">{kpis.incidentRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Taxa de Incidentes</p>
            <p className="text-xs text-muted-foreground">Meta: ≤{kpis.targetIncident}%</p>
          </div>

          <div className="card-base p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Package className="w-5 h-5 text-accent-foreground" />
              <KPIStatus value={kpis.avgDivergencia} target={kpis.targetDivergencia} inverted />
            </div>
            <p className="text-2xl font-bold">{kpis.avgDivergencia.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Diverg. Média Coletas</p>
            <p className="text-xs text-muted-foreground">Meta: ≤{kpis.targetDivergencia}%</p>
          </div>

          <div className="card-base p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Clock className="w-5 h-5 text-primary" />
              <Badge variant="secondary" className={cn("text-xs", avgColTime <= 48 ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive")}>
                {avgColTime <= 48 ? "✓ Na meta" : "✗ Acima"}
              </Badge>
            </div>
            <p className="text-2xl font-bold">{avgColTime > 0 ? `${avgColTime}h` : "-"}</p>
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

        {/* Trend Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* OTIF Evolution (6 months) */}
          <div className="card-base p-4">
            <h3 className="font-semibold mb-4">Evolução OTIF — Últimos 6 meses</h3>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="otifGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
                  <YAxis domain={[0, 100]} className="text-xs fill-muted-foreground" tickFormatter={v => `${v}%`} />
                  <Tooltip formatter={(value: number) => [`${value}%`, "OTIF"]} />
                  <Area type="monotone" dataKey="otif" stroke="hsl(var(--primary))" fill="url(#otifGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">Carregando tendências...</p>
            )}
          </div>

          {/* Freight Cost Evolution */}
          <div className="card-base p-4">
            <h3 className="font-semibold mb-4">Custo de Frete Mensal</h3>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
                  <YAxis className="text-xs fill-muted-foreground" tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), "Custo Frete"]} />
                  <Bar dataKey="custoFrete" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">Carregando tendências...</p>
            )}
          </div>
        </div>

        {/* Volume Trend + Carrier OTIF */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Volume Trend */}
          <div className="card-base p-4">
            <h3 className="font-semibold mb-4">Volume Operacional — 6 meses</h3>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs fill-muted-foreground" />
                  <YAxis className="text-xs fill-muted-foreground" />
                  <Tooltip />
                  <Line type="monotone" dataKey="entregas" name="Entregas" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="coletas" name="Coletas" stroke="hsl(var(--warning))" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="ocorrencias" name="Ocorrências" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">Carregando tendências...</p>
            )}
          </div>

          {/* Carrier OTIF Breakdown */}
          <div className="card-base p-4">
            <h3 className="font-semibold mb-4">OTIF por Transportadora</h3>
            {carrierData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={carrierData.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" domain={[0, 100]} className="text-xs fill-muted-foreground" tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="name" width={100} className="text-xs fill-muted-foreground" tickFormatter={v => v.substring(0, 12)} />
                  <Tooltip formatter={(value: number) => [`${value}%`, "OTIF"]} />
                  <Bar dataKey="otifRate" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">Sem dados de transportadoras</p>
            )}
          </div>
        </div>

        {/* Status Distribution + Carrier Cost */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          {/* Carrier avg cost ranking */}
          <div className="card-base p-4">
            <h3 className="font-semibold mb-4">Custo Médio por Transportadora</h3>
            {carrierData.length > 0 ? (
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {carrierData.slice(0, 10).map((c, i) => (
                  <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}.</span>
                      <span className="text-sm font-medium truncate max-w-[140px]">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">{c.total} entregas</Badge>
                      <span className="text-sm font-semibold text-success">{formatCurrency(c.avgCost)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Sem dados</p>
            )}
          </div>
        </div>

        {/* Goals Summary */}
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
                  { name: "Tempo Médio Coleta", current: avgColTime > 0 ? `${avgColTime}h` : "-", target: "≤48h", ok: avgColTime <= 48 },
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
