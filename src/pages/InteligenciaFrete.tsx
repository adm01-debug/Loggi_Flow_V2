import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useFreightIntelligence } from "@/hooks/useFreightIntelligence";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DollarSign, TrendingDown, AlertTriangle, Package, Truck, Target, Loader2, ArrowDownRight, Zap, Calculator, Sparkles, FileText, CheckCircle2 } from "lucide-react";
import { StrategySimulator, AIFreightForecasting } from "@/components/freight";

const pieColors = ["hsl(var(--primary))", "hsl(var(--warning))", "hsl(var(--success))", "hsl(var(--destructive))", "hsl(var(--accent))", "hsl(var(--muted))", "hsl(var(--secondary))"];

export default function InteligenciaFrete() {
  const { isLoading, regionAnalysis, carrierRouteComparison, abusiveFreights, consolidationOpportunities, bestCarrierPerState, summary } = useFreightIntelligence();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const regionChartData = regionAnalysis.slice(0, 10).map(r => ({
    name: r.estado,
    custoMedio: Math.round(r.custoMedio * 100) / 100,
    entregas: r.entregas,
  }));

  const regionPieData = regionAnalysis.slice(0, 8).map(r => ({
    name: r.estado,
    value: Math.round(r.custoTotal * 100) / 100,
  }));

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-destructive/20 to-warning/10">
              <TrendingDown className="w-6 h-6 text-destructive" />
            </div>
            Inteligência de Frete
          </h1>
          <p className="text-muted-foreground mt-1">Reduza custos com frete grátis — simulação, consolidação, negociação e alertas</p>
        </div>

        {/* Savings Summary */}
        <div className="card-base p-4 border-2 border-success/30 bg-success/5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-5 h-5 text-success" />
            <h3 className="font-semibold text-success">Potencial de Economia Identificado</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-success">{formatCurrency(summary.totalPotentialSavings)}</p>
              <p className="text-xs text-muted-foreground">Economia Total Estimada</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-destructive">{formatCurrency(summary.totalAbusiveValue)}</p>
              <p className="text-xs text-muted-foreground">Excesso Fretes Abusivos ({summary.abusiveCount})</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-warning">{formatCurrency(summary.consolidationSavings)}</p>
              <p className="text-xs text-muted-foreground">Economia Consolidação ({summary.consolidationOpps} oport.)</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-primary">{formatCurrency(summary.negotiationSavings)}</p>
              <p className="text-xs text-muted-foreground">Economia Negociação</p>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="stat-card text-center p-3">
            <DollarSign className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold">{formatCurrency(summary.totalFreight)}</p>
            <p className="text-[10px] text-muted-foreground">Custo Total Frete</p>
          </div>
          <div className="stat-card text-center p-3">
            <Target className="w-5 h-5 text-warning mx-auto mb-1" />
            <p className="text-xl font-bold">{formatCurrency(summary.avgFreight)}</p>
            <p className="text-[10px] text-muted-foreground">Custo Médio/Entrega</p>
          </div>
          <div className="stat-card text-center p-3">
            <AlertTriangle className="w-5 h-5 text-destructive mx-auto mb-1" />
            <p className="text-xl font-bold">{summary.abusiveCount}</p>
            <p className="text-[10px] text-muted-foreground">Fretes Abusivos</p>
          </div>
          <div className="stat-card text-center p-3">
            <Package className="w-5 h-5 text-success mx-auto mb-1" />
            <p className="text-xl font-bold">{summary.consolidationOpps}</p>
            <p className="text-[10px] text-muted-foreground">Oport. Consolidação</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="impacto" className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-4">
            <TabsTrigger value="impacto">Impacto Regional</TabsTrigger>
            <TabsTrigger value="consolidacao">Consolidação</TabsTrigger>
            <TabsTrigger value="negociacao">Negociação</TabsTrigger>
            <TabsTrigger value="simulador"><Calculator className="w-4 h-4 mr-1" />Simulador</TabsTrigger>
            <TabsTrigger value="previsao"><Sparkles className="w-4 h-4 mr-1" />Previsão IA</TabsTrigger>
            <TabsTrigger value="abusivos">Alertas</TabsTrigger>
          </TabsList>

          <TabsContent value="previsao" className="space-y-4">
            <AIFreightForecasting currentTotal={summary.totalFreight} />
          </TabsContent>

          <TabsContent value="simulador" className="space-y-4">
            <StrategySimulator 
              currentMonthlyFreight={summary.totalFreight} 
              totalDeliveries={summary.totalEntregas} 
            />
          </TabsContent>

          {/* Tab 1: Regional Impact */}
          <TabsContent value="impacto" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card-base p-4">
                <h3 className="font-semibold mb-4">Custo Médio por Estado</h3>
                {regionChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={regionChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
                      <YAxis className="text-xs fill-muted-foreground" tickFormatter={v => `R$${v}`} />
                      <Tooltip formatter={(v: number) => [formatCurrency(v), "Custo Médio"]} />
                      <Bar dataKey="custoMedio" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-muted-foreground text-center py-8">Sem dados</p>}
              </div>
              <div className="card-base p-4">
                <h3 className="font-semibold mb-4">Distribuição de Custo por Estado</h3>
                {regionPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={regionPieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false}>
                        {regionPieData.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => [formatCurrency(v), "Custo Total"]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-muted-foreground text-center py-8">Sem dados</p>}
              </div>
            </div>

            <div className="card-base p-4">
              <h3 className="font-semibold mb-4">Detalhamento por Estado</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-muted-foreground font-medium">Estado</th>
                      <th className="text-center py-2 text-muted-foreground font-medium">Entregas</th>
                      <th className="text-center py-2 text-muted-foreground font-medium">Custo Total</th>
                      <th className="text-center py-2 text-muted-foreground font-medium">Custo Médio</th>
                      <th className="text-center py-2 text-muted-foreground font-medium">Custo Máximo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regionAnalysis.map((r, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 font-semibold">{r.estado}</td>
                        <td className="py-2 text-center">{r.entregas}</td>
                        <td className="py-2 text-center font-medium">{formatCurrency(r.custoTotal)}</td>
                        <td className="py-2 text-center">{formatCurrency(r.custoMedio)}</td>
                        <td className="py-2 text-center text-destructive font-medium">{formatCurrency(r.custoMax)}</td>
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
                <p className="text-muted-foreground">Nenhuma oportunidade de consolidação detectada no momento</p>
                <p className="text-xs text-muted-foreground mt-1">O sistema busca entregas pendentes para o mesmo destino</p>
              </div>
            ) : (
              consolidationOpportunities.map((opp, i) => (
                <div key={i} className="card-base p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-success" />
                      <h4 className="font-semibold">{opp.cidade}, {opp.estado}</h4>
                      <Badge variant="secondary">{opp.entregas.length} entregas</Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-success font-bold">Economia est.: {formatCurrency(opp.potentialSavings)}</p>
                      <p className="text-xs text-muted-foreground">~30% com consolidação</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {opp.entregas.map(e => (
                      <div key={e.id} className="flex items-center justify-between py-1 px-2 rounded bg-muted/30 text-sm">
                        <span className="font-mono text-xs">{e.numero_entrega}</span>
                        <span className="truncate max-w-[150px]">{e.cliente}</span>
                        <span className="font-medium">{formatCurrency(e.valor_frete)}</span>
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
              <h3 className="font-semibold mb-4">Melhor vs Pior Transportadora por Estado</h3>
              {Object.keys(bestCarrierPerState).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(bestCarrierPerState).sort(([, a], [, b]) => b.savings - a.savings).map(([estado, v]) => (
                    <div key={estado} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <span className="font-bold text-sm">{estado}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-success/20 text-success text-xs">✓ {v.best}: {formatCurrency(v.bestAvg)}/entrega</Badge>
                          <Badge className="bg-destructive/20 text-destructive text-xs">✗ {v.worst}: {formatCurrency(v.worstAvg)}/entrega</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-success font-bold flex items-center gap-1">
                          <ArrowDownRight className="w-4 h-4" />
                          {formatCurrency(v.savings)}
                        </p>
                        <p className="text-xs text-muted-foreground">economia/entrega</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Necessário dados de 2+ transportadoras por estado</p>
              )}
            </div>

            <div className="card-base p-4">
              <h3 className="font-semibold mb-4">Custo Médio por Transportadora × Estado</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-muted-foreground font-medium">Transportadora</th>
                      <th className="text-center py-2 text-muted-foreground font-medium">Estado</th>
                      <th className="text-center py-2 text-muted-foreground font-medium">Entregas</th>
                      <th className="text-center py-2 text-muted-foreground font-medium">Custo Total</th>
                      <th className="text-center py-2 text-muted-foreground font-medium">Custo Médio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carrierRouteComparison.slice(0, 20).map((c, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 font-medium">{c.transportadora}</td>
                        <td className="py-2 text-center">{c.estado}</td>
                        <td className="py-2 text-center">{c.entregas}</td>
                        <td className="py-2 text-center">{formatCurrency(c.custoTotal)}</td>
                        <td className="py-2 text-center font-semibold">{formatCurrency(c.custoMedio)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Tab 4: Abusive Freight Alerts */}
          <TabsContent value="abusivos" className="space-y-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
              <span className="text-destructive">Fretes com custo <strong>&gt;20% acima</strong> da média histórica para a mesma região</span>
            </div>

            {abusiveFreights.length === 0 ? (
              <div className="card-base p-8 text-center">
                <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum frete abusivo detectado — ótimo controle!</p>
              </div>
            ) : (
              <div className="card-base p-4">
                <h3 className="font-semibold mb-4">Fretes Acima da Média ({abusiveFreights.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 text-muted-foreground font-medium">Entrega</th>
                        <th className="text-left py-2 text-muted-foreground font-medium">Cliente</th>
                        <th className="text-center py-2 text-muted-foreground font-medium">Estado</th>
                        <th className="text-center py-2 text-muted-foreground font-medium">Transportadora</th>
                        <th className="text-center py-2 text-muted-foreground font-medium">Valor Frete</th>
                        <th className="text-center py-2 text-muted-foreground font-medium">Média Estado</th>
                        <th className="text-center py-2 text-muted-foreground font-medium">% Acima</th>
                      </tr>
                    </thead>
                    <tbody>
                      {abusiveFreights.slice(0, 30).map((e, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-2 font-mono text-xs">{e.numero_entrega}</td>
                          <td className="py-2 truncate max-w-[120px]">{e.cliente}</td>
                          <td className="py-2 text-center">{e.estado}</td>
                          <td className="py-2 text-center text-xs">{e.transportadora}</td>
                          <td className="py-2 text-center font-bold text-destructive">{formatCurrency(e.valor_frete)}</td>
                          <td className="py-2 text-center text-muted-foreground">{formatCurrency(e.avgForState)}</td>
                          <td className="py-2 text-center">
                            <Badge className="bg-destructive/20 text-destructive text-xs">+{e.percentAbove.toFixed(0)}%</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
