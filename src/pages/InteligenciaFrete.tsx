/* eslint-disable max-lines */
import { useState } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { MainLayout } from "@/components/layout/MainLayout";
import { useFreightIntelligence } from "@/hooks/logistics/useFreightIntelligence";
import { formatCurrency } from "@/lib/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "recharts";
import {
  DollarSign,
  AlertTriangle,
  Package,
  Target,
  Loader2,
  ArrowDownRight,
  Zap,
  Calculator,
  Sparkles,
  FileText,
  CheckCircle2,
  Wand2,
  Download,
  FileCheck,
  Brain,
} from "lucide-react";
import {
  StrategySimulator,
  AIFreightForecasting,
  FreightAudit,
} from "@/components/freight";

const pieColors = [
  "hsl(var(--primary))",
  "hsl(var(--warning))",
  "hsl(var(--success))",
  "hsl(var(--destructive))",
  "hsl(var(--accent))",
  "hsl(var(--muted))",
  "hsl(var(--secondary))",
];

export default function InteligenciaFrete() {
  const [activeTab, setActiveTab] = useState("impacto");
  const {
    isLoading,
    isError,
    error,
    rawData,
    regionAnalysis,
    carrierRouteComparison,
    abusiveFreights,
    consolidationOpportunities,
    bestCarrierPerState,
    summary,
  } = useFreightIntelligence();

  if (isError) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <EmptyState
            variant="error"
            title="Erro ao carregar Inteligência de Frete"
            description={
              error?.message ||
              "Não foi possível carregar os dados. Tente novamente."
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
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const regionChartData = regionAnalysis.slice(0, 10).map((r) => ({
    name: r.estado,
    custoMedio: Math.round(r.custoMedio * 100) / 100,
    entregas: r.entregas,
  }));

  const regionPieData = regionAnalysis.slice(0, 8).map((r) => ({
    name: r.estado,
    value: Math.round(r.custoTotal * 100) / 100,
  }));

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex-1 min-w-0 animate-in slide-in-from-left-6 duration-700 ease-out-expo">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-foreground flex items-center gap-3 sm:gap-4 tracking-tighter">
              <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/40 shadow-xl shadow-primary/20 group cursor-pointer transition-transform hover:rotate-6">
                <Brain className="w-6 h-6 sm:w-9 sm:h-9 text-white animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="truncate drop-shadow-sm">
                  Inteligência Frete
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-primary uppercase tracking-[0.2em]">
                    Redução de Custos Nexus IA
                  </span>
                </div>
              </div>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-2xl font-medium">
              Análise preditiva, consolidação tática e auditoria de malha
              logística.
            </p>
          </div>
        </div>

        {/* Savings Summary */}
        <div className="group relative overflow-hidden p-8 rounded-[2rem] sm:rounded-[2.5rem] bg-black/90 border-2 border-success/30 shadow-[0_0_40px_rgba(34,197,94,0.1)] backdrop-blur-3xl animate-in fade-in duration-1000 delay-100">
          <div className="absolute inset-0 bg-gradient-to-br from-success/10 via-transparent to-transparent opacity-50" />
          <div className="relative z-10 flex items-center gap-4 mb-6">
            <div className="p-3 rounded-2xl bg-success/10 text-success shadow-inner">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="font-black italic text-xl uppercase tracking-tighter text-success">
              Potencial de Economia_Grid_Nexus
            </h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black text-success tabular-nums tracking-tighter italic">
                {formatCurrency(summary.totalPotentialSavings)}
              </p>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                Economia Total Est.
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-black text-destructive tabular-nums tracking-tighter italic">
                {formatCurrency(summary.totalAbusiveValue)}
              </p>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                Excesso Abusivo ({summary.abusiveCount})
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-black text-warning tabular-nums tracking-tighter italic">
                {formatCurrency(summary.consolidationSavings)}
              </p>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                Consolidação ({summary.consolidationOpps})
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-black text-primary tabular-nums tracking-tighter italic">
                {formatCurrency(summary.negotiationSavings)}
              </p>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                Economia Negociação
              </p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-1000 delay-200">
          <div className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-card to-card/90 shadow-xl border-none transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                <DollarSign className="w-6 h-6" />
              </div>
              <p className="text-2xl sm:text-3xl font-black tracking-tighter tabular-nums">
                {formatCurrency(summary.totalFreight)}
              </p>
            </div>
            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
              Custo Total
            </p>
          </div>
          <div className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-card to-card/90 shadow-xl border-none transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 rounded-2xl bg-warning/10 text-warning group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                <Target className="w-6 h-6" />
              </div>
              <p className="text-2xl sm:text-3xl font-black tracking-tighter tabular-nums text-warning">
                {formatCurrency(summary.avgFreight)}
              </p>
            </div>
            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
              Média / Entrega
            </p>
          </div>
          <div className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-card to-card/90 shadow-xl border-none transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 rounded-2xl bg-destructive/10 text-destructive group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-2xl sm:text-3xl font-black tracking-tighter tabular-nums text-destructive">
                {summary.abusiveCount}
              </p>
            </div>
            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
              Fretes Abusivos
            </p>
          </div>
          <div className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-card to-card/90 shadow-xl border-none transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 rounded-2xl bg-success/10 text-success group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                <Package className="w-6 h-6" />
              </div>
              <p className="text-2xl sm:text-3xl font-black tracking-tighter tabular-nums text-success">
                {summary.consolidationOpps}
              </p>
            </div>
            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
              Oport. Consolidação
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 sm:grid-cols-7 mb-4">
            <TabsTrigger value="impacto">Impacto Regional</TabsTrigger>
            <TabsTrigger value="consolidacao">Consolidação</TabsTrigger>
            <TabsTrigger value="negociacao">Negociação</TabsTrigger>
            <TabsTrigger value="simulador">
              <Calculator className="w-4 h-4 mr-1" />
              Simulador
            </TabsTrigger>
            <TabsTrigger value="auditoria">
              <FileCheck className="w-4 h-4 mr-1" />
              Auditoria
            </TabsTrigger>
            <TabsTrigger value="previsao">
              <Sparkles className="w-4 h-4 mr-1" />
              Previsão IA
            </TabsTrigger>
            <TabsTrigger value="abusivos">Alertas</TabsTrigger>
          </TabsList>

          <TabsContent value="previsao" className="space-y-4">
            <AIFreightForecasting
              entregas={rawData}
              abusivos={abusiveFreights}
              consolidacao={consolidationOpportunities}
              melhorTransportadora={bestCarrierPerState}
            />
          </TabsContent>

          <TabsContent value="simulador" className="space-y-4">
            <StrategySimulator
              currentMonthlyFreight={summary.totalFreight}
              totalDeliveries={summary.totalEntregas}
            />
          </TabsContent>

          <TabsContent value="auditoria" className="space-y-4">
            <FreightAudit />
          </TabsContent>

          {/* Tab 1: Regional Impact */}
          <TabsContent value="impacto" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card-base p-4">
                <h3 className="font-semibold mb-4">Custo Médio por Estado</h3>
                {regionChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={regionChartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-border"
                      />
                      <XAxis
                        dataKey="name"
                        className="text-xs fill-muted-foreground"
                      />
                      <YAxis
                        className="text-xs fill-muted-foreground"
                        tickFormatter={(v) => `R$${v}`}
                      />
                      <Tooltip
                        formatter={(v) => [
                          formatCurrency(Number(v)),
                          "Custo Médio",
                        ]}
                      />
                      <Bar
                        dataKey="custoMedio"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Sem dados
                  </p>
                )}
              </div>
              <div className="card-base p-4">
                <h3 className="font-semibold mb-4">
                  Distribuição de Custo por Estado
                </h3>
                {regionPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={regionPieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                        }
                        labelLine={false}
                      >
                        {regionPieData.map((_, i) => (
                          <Cell
                            key={i}
                            fill={pieColors[i % pieColors.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v) => [
                          formatCurrency(Number(v)),
                          "Custo Total",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Sem dados
                  </p>
                )}
              </div>
            </div>

            <div className="card-base p-4">
              <h3 className="font-semibold mb-4">Detalhamento por Estado</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-muted-foreground font-medium">
                        Estado
                      </th>
                      <th className="text-center py-2 text-muted-foreground font-medium">
                        Entregas
                      </th>
                      <th className="text-center py-2 text-muted-foreground font-medium">
                        Custo Total
                      </th>
                      <th className="text-center py-2 text-muted-foreground font-medium">
                        Custo Médio
                      </th>
                      <th className="text-center py-2 text-muted-foreground font-medium">
                        Custo Máximo
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {regionAnalysis.map((r, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 font-semibold">{r.estado}</td>
                        <td className="py-2 text-center">{r.entregas}</td>
                        <td className="py-2 text-center font-medium">
                          {formatCurrency(r.custoTotal)}
                        </td>
                        <td className="py-2 text-center">
                          {formatCurrency(r.custoMedio)}
                        </td>
                        <td className="py-2 text-center text-destructive font-medium">
                          {formatCurrency(r.custoMax)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Consolidation */}
          <TabsContent value="consolidacao" className="space-y-4">
            {consolidationOpportunities.length === 0 ? (
              <div className="card-base p-8 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Nenhuma oportunidade de consolidação detectada no momento
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  O sistema busca entregas pendentes para o mesmo destino
                </p>
              </div>
            ) : (
              consolidationOpportunities.map((opp, i) => (
                <div key={i} className="card-base p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-success" />
                      <h4 className="font-semibold">
                        {opp.cidade}, {opp.estado}
                      </h4>
                      <Badge variant="secondary">
                        {opp.entregas.length} entregas
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-success font-bold">
                        Economia est.: {formatCurrency(opp.potentialSavings)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ~30% com consolidação
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {opp.entregas.map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center justify-between py-1 px-2 rounded bg-muted/30 text-sm"
                      >
                        <span className="font-mono text-xs">
                          {e.numero_entrega}
                        </span>
                        <span className="truncate max-w-[150px]">
                          {e.cliente}
                        </span>
                        <span className="font-medium">
                          {formatCurrency(e.valor_frete)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Tab 3: Negotiation */}
          <TabsContent value="negociacao" className="space-y-4">
            <div className="card-base p-4">
              <h3 className="font-semibold mb-4">
                Melhor vs Pior Transportadora por Estado
              </h3>
              {Object.keys(bestCarrierPerState).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(bestCarrierPerState)
                    .sort(([, a], [, b]) => b.savings - a.savings)
                    .map(([estado, v]) => (
                      <div
                        key={estado}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                      >
                        <div>
                          <span className="font-bold text-sm">{estado}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="bg-success/20 text-success text-xs">
                              ✓ {v.best}: {formatCurrency(v.bestAvg)}/entrega
                            </Badge>
                            <Badge className="bg-destructive/20 text-destructive text-xs">
                              ✗ {v.worst}: {formatCurrency(v.worstAvg)}/entrega
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-success font-bold flex items-center gap-1">
                            <ArrowDownRight className="w-4 h-4" />
                            {formatCurrency(v.savings)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            economia/entrega
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Necessário dados de 2+ transportadoras por estado
                </p>
              )}
            </div>

            <div className="card-base p-4">
              <h3 className="font-semibold mb-4">
                Custo Médio por Transportadora × Estado
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-muted-foreground font-medium">
                        Transportadora
                      </th>
                      <th className="text-center py-2 text-muted-foreground font-medium">
                        Estado
                      </th>
                      <th className="text-center py-2 text-muted-foreground font-medium">
                        Entregas
                      </th>
                      <th className="text-center py-2 text-muted-foreground font-medium">
                        Custo Total
                      </th>
                      <th className="text-center py-2 text-muted-foreground font-medium">
                        Custo Médio
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {carrierRouteComparison.slice(0, 20).map((c, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 font-medium">{c.transportadora}</td>
                        <td className="py-2 text-center">{c.estado}</td>
                        <td className="py-2 text-center">{c.entregas}</td>
                        <td className="py-2 text-center">
                          {formatCurrency(c.custoTotal)}
                        </td>
                        <td className="py-2 text-center font-semibold">
                          {formatCurrency(c.custoMedio)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Tab 4: Abusive Freight Alerts */}
          <TabsContent value="abusivos" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                  <span className="text-destructive font-medium">
                    Alertas de Fretes Atípicos
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    Custo superior a 20% da média histórica
                  </span>
                </div>

                {abusiveFreights.length === 0 ? (
                  <div className="card-base p-8 text-center">
                    <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Nenhum frete abusivo detectado — ótimo controle!
                    </p>
                  </div>
                ) : (
                  <div className="card-base p-4">
                    <h3 className="font-semibold mb-4 text-sm">
                      Listagem de Discrepâncias ({abusiveFreights.length})
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 text-muted-foreground font-medium text-[10px] uppercase">
                              Entrega
                            </th>
                            <th className="text-center py-2 text-muted-foreground font-medium text-[10px] uppercase">
                              Transportadora
                            </th>
                            <th className="text-center py-2 text-muted-foreground font-medium text-[10px] uppercase">
                              Valor
                            </th>
                            <th className="text-center py-2 text-muted-foreground font-medium text-[10px] uppercase">
                              Média Região
                            </th>
                            <th className="text-center py-2 text-muted-foreground font-medium text-[10px] uppercase">
                              %
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {abusiveFreights.slice(0, 15).map((e, i) => (
                            <tr
                              key={i}
                              className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                            >
                              <td className="py-2">
                                <p className="font-mono text-xs">
                                  {e.numero_entrega}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate max-w-[100px]">
                                  {e.cliente}
                                </p>
                              </td>
                              <td className="py-2 text-center text-[10px]">
                                {e.transportadora}
                              </td>
                              <td className="py-2 text-center font-bold text-destructive">
                                {formatCurrency(e.valor_frete)}
                              </td>
                              <td className="py-2 text-center text-muted-foreground text-[10px]">
                                {formatCurrency(e.avgForState)}
                              </td>
                              <td className="py-2 text-center">
                                <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">
                                  +{e.percentAbove.toFixed(0)}%
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="card-base p-4 bg-primary/5 border-primary/20">
                  <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-primary" />
                    Ações Corretivas
                  </h3>
                  <div className="space-y-3">
                    {abusiveFreights.length > 0 ? (
                      <div className="p-3 rounded-lg bg-background border border-border">
                        <p className="text-xs font-bold">
                          Revisar {abusiveFreights[0].transportadora} —{" "}
                          {abusiveFreights[0].estado}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {abusiveFreights.length} fretes custam até{" "}
                          {formatCurrency(
                            abusiveFreights[0].valor_frete -
                              abusiveFreights[0].avgForState,
                          )}{" "}
                          acima da média regional.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2 h-7 text-[10px]"
                          onClick={() => setActiveTab("abusivos")}
                        >
                          Ver Alertas de Fretes
                        </Button>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-background border border-border">
                        <p className="text-xs font-bold text-success">
                          Sem fretes abusivos
                        </p>
                        <p className="text-[10px] text-success/80 mt-1">
                          Nenhum frete acima de 20% da média regional no mês.
                        </p>
                      </div>
                    )}

                    {consolidationOpportunities.length > 0 ? (
                      <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                        <p className="text-xs font-bold text-success">
                          Consolidar {consolidationOpportunities.length}{" "}
                          oportunidades
                        </p>
                        <p className="text-[10px] text-success/80 mt-1">
                          Economia potencial de{" "}
                          {formatCurrency(summary.consolidationSavings)} em
                          entregas para o mesmo destino.
                        </p>
                        <Button
                          className="w-full mt-2 h-7 text-[10px] bg-success hover:bg-success/90"
                          onClick={() => setActiveTab("consolidacao")}
                        >
                          Ver Oportunidades
                        </Button>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                        <p className="text-xs font-bold text-success">
                          Sem consolidação pendente
                        </p>
                        <p className="text-[10px] text-success/80 mt-1">
                          Nenhuma entrega pendente no mesmo destino no momento.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-base p-4">
                  <h4 className="text-xs font-bold mb-2 flex items-center gap-2">
                    <FileText className="w-3 h-3" />
                    Exportar Relatório
                  </h4>
                  <p className="text-[10px] text-muted-foreground mb-3">
                    Baixe a análise detalhada de custos e oportunidades para a
                    diretoria.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-[11px] gap-2"
                  >
                    <Download className="w-3 h-3" /> PDF Detalhado
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
