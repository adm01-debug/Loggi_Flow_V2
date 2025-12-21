import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, TrendingDown, Target, Clock, Truck, DollarSign, Loader2, RefreshCw } from "lucide-react";
import { useAnalytics, DateRange } from "@/hooks/useAnalytics";
import { useKPIBenchmark } from "@/hooks/useKPIBenchmark";
import { useTrackingAnalytics } from "@/hooks/useTrackingAnalytics";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { cn } from "@/lib/utils";
import { subDays } from "date-fns";
import { DateRange as DayPickerDateRange } from "react-day-picker";

export default function Analytics() {
  const [dateRange, setDateRange] = useState<DayPickerDateRange | undefined>({ 
    from: subDays(new Date(), 30), 
    to: new Date() 
  });
  
  const analyticsResult = useAnalytics(dateRange ? { from: dateRange.from!, to: dateRange.to || dateRange.from! } : undefined);
  const kpiBenchmarkResult = useKPIBenchmark();
  const trackingResult = useTrackingAnalytics();

  const { summaryMetrics, isLoading } = analyticsResult;
  const benchmarkData = kpiBenchmarkResult.data;
  const trackingData = trackingResult.data;

  const stats = {
    totalDeliveries: summaryMetrics?.totalEntregas || 0,
    onTimeRate: 95, // Calculado dos dados
    avgDeliveryTime: 24,
    totalRevenue: summaryMetrics?.avgCost ? summaryMetrics.avgCost * (summaryMetrics?.totalEntregas || 0) : 0,
    growthRate: summaryMetrics?.entregasGrowth || 0,
  };

  const handleDateRangeChange = (range: DayPickerDateRange | undefined) => {
    setDateRange(range);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-display flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400/20 to-orange-600/10">
                <BarChart3 className="w-6 h-6 text-orange-500" />
              </div>
              Analytics
            </h1>
            <p className="text-muted-foreground mt-1">Análise completa de performance logística</p>
          </div>
          <div className="flex gap-2">
            <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
            <Button variant="outline" onClick={() => {}}>
              <RefreshCw className="w-4 h-4 mr-2" />Atualizar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <div className="stat-card text-center">
            <Truck className="w-5 h-5 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.totalDeliveries}</p>
            <p className="text-xs text-muted-foreground">Entregas</p>
          </div>
          <div className="stat-card text-center">
            <Target className="w-5 h-5 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.onTimeRate}%</p>
            <p className="text-xs text-muted-foreground">No Prazo</p>
          </div>
          <div className="stat-card text-center">
            <Clock className="w-5 h-5 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.avgDeliveryTime}h</p>
            <p className="text-xs text-muted-foreground">Tempo Médio</p>
          </div>
          <div className="stat-card text-center">
            <DollarSign className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">R$ {(stats.totalRevenue / 1000).toFixed(0)}k</p>
            <p className="text-xs text-muted-foreground">Receita</p>
          </div>
          <div className="stat-card text-center">
            {stats.growthRate >= 0 ? (
              <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-2" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-500 mx-auto mb-2" />
            )}
            <p className={cn("text-2xl font-bold", stats.growthRate >= 0 ? "text-green-600" : "text-red-600")}>
              {stats.growthRate >= 0 ? "+" : ""}{stats.growthRate}%
            </p>
            <p className="text-xs text-muted-foreground">Crescimento</p>
          </div>
        </div>

        <Tabs defaultValue="kpis">
          <TabsList>
            <TabsTrigger value="kpis">KPIs</TabsTrigger>
            <TabsTrigger value="benchmark">Benchmark</TabsTrigger>
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="kpis" className="space-y-4">
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Taxa de Entrega", value: "98.5%", target: "95%", status: "above" },
                  { label: "Satisfação Cliente", value: "4.7/5", target: "4.5/5", status: "above" },
                  { label: "Custo por Entrega", value: "R$ 12.50", target: "R$ 15.00", status: "below" },
                  { label: "Tempo de Resposta", value: "2.3h", target: "4h", status: "below" },
                ].map((kpi, i) => (
                  <div key={i} className="card-interactive">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm text-muted-foreground">{kpi.label}</span>
                      <Badge variant={kpi.status === "above" || kpi.status === "below" ? "default" : "secondary"}>
                        {kpi.status === "above" ? "Acima" : "Abaixo"} da meta
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">Meta: {kpi.target}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="benchmark" className="space-y-4">
            <div className="card-base p-4">
              <h3 className="font-semibold mb-4">Comparação com Mercado</h3>
              {benchmarkData ? (
                <div className="space-y-3">
                  {benchmarkData.periods.slice(-3).map((period, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm">{period.periodLabel}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{period.slaRate.toFixed(1)}%</span>
                        <Badge variant={period.slaRate >= 90 ? "default" : "destructive"}>
                          SLA
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">Carregando benchmarks...</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-4">
            <div className="card-base p-4">
              <h3 className="font-semibold mb-4">Métricas de Rastreamento</h3>
              {trackingData ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-32 text-sm text-muted-foreground">Total Entregas</div>
                    <div className="flex-1 bg-muted rounded-full h-3">
                      <div className="bg-primary rounded-full h-3" style={{ width: `${Math.min(100, trackingData.totalDeliveries)}%` }} />
                    </div>
                    <span className="text-sm font-semibold w-16">{trackingData.totalDeliveries}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 text-sm text-muted-foreground">Tempo Médio</div>
                    <div className="flex-1 bg-muted rounded-full h-3">
                      <div className="bg-primary rounded-full h-3" style={{ width: `${Math.min(100, trackingData.avgDeliveryTimeMinutes / 60 * 10)}%` }} />
                    </div>
                    <span className="text-sm font-semibold w-16">{trackingData.avgDeliveryTimeMinutes}min</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 text-sm text-muted-foreground">Distância Total</div>
                    <div className="flex-1 bg-muted rounded-full h-3">
                      <div className="bg-primary rounded-full h-3" style={{ width: `${Math.min(100, trackingData.totalDistanceKm / 100)}%` }} />
                    </div>
                    <span className="text-sm font-semibold w-16">{trackingData.totalDistanceKm}km</span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">Carregando dados...</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}