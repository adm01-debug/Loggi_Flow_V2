import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Truck,
  DollarSign,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useAnalytics } from "@/hooks/analytics/useAnalytics";
import { useKPIBenchmark } from "@/hooks/analytics/useKPIBenchmark";
import { useTrackingAnalytics } from "@/hooks/logistics/useTrackingAnalytics";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/EmptyState";
import { subDays } from "date-fns";
import { DateRange as DayPickerDateRange } from "react-day-picker";
import {
  PerformanceChart,
  DistributionChart,
} from "@/components/analytics/AnalyticsCharts";

function anyError(...flags: Array<boolean | undefined>): boolean {
  return flags.some(Boolean);
}

function GrowthStatCard({ growthRate }: { growthRate: number }) {
  const positive = growthRate >= 0;
  return (
    <div className="stat-card text-center p-3 sm:p-4 col-span-2 sm:col-span-1">
      {positive ? (
        <TrendingUp className="w-5 h-5 text-success mx-auto mb-2" />
      ) : (
        <TrendingDown className="w-5 h-5 text-destructive mx-auto mb-2" />
      )}
      <p
        className={cn(
          "text-xl sm:text-2xl font-bold",
          positive ? "text-success" : "text-destructive",
        )}
      >
        {positive ? "+" : ""}
        {growthRate}%
      </p>
      <p className="text-[10px] sm:text-xs text-muted-foreground">
        Crescimento
      </p>
    </div>
  );
}

export default function Analytics() {
  const [dateRange, setDateRange] = useState<DayPickerDateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const analyticsResult = useAnalytics(
    dateRange
      ? { from: dateRange.from!, to: dateRange.to || dateRange.from! }
      : undefined,
  );
  const kpiBenchmarkResult = useKPIBenchmark();
  const trackingRange = {
    from: dateRange?.from ?? subDays(new Date(), 30),
    to: dateRange?.to || dateRange?.from || new Date(),
  };
  const trackingResult = useTrackingAnalytics(trackingRange);

  const { summaryMetrics, monthlyData, isLoading, isError, error } =
    analyticsResult;
  const benchmarkData = kpiBenchmarkResult.data;
  const trackingData = trackingResult.data;
  const isErrorBenchmark = kpiBenchmarkResult.isError;
  const isErrorTracking = trackingResult.isError;

  const stats = useMemo(
    () => ({
      totalDeliveries: summaryMetrics?.totalEntregas || 0,
      onTimeRate: summaryMetrics?.onTimeRate ?? 0,
      avgDeliveryTime: summaryMetrics?.avgDeliveryTime ?? 0,
      totalRevenue:
        (summaryMetrics?.avgCost ?? 0) * (summaryMetrics?.totalEntregas || 0),
      growthRate: summaryMetrics?.entregasGrowth || 0,
    }),
    [summaryMetrics],
  );

  const handleDateRangeChange = (range: DayPickerDateRange | undefined) => {
    setDateRange(range);
  };

  if (anyError(isError, isErrorBenchmark, isErrorTracking)) {
    return (
      <MainLayout>
        <div className="px-2">
          <EmptyState
            variant="error"
            icon={BarChart3}
            title="Erro ao carregar Analytics"
            description={String(
              error?.message ?? "Falha na consulta de métricas",
            )}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <span className="truncate">Analytics</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Análise completa de performance logística
            </p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">
            <div className="shrink-0">
              <DateRangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setDateRange({ from: subDays(new Date(), 30), to: new Date() })
              }
              className="shrink-0 h-10"
            >
              <RefreshCw className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          </div>
        </div>

        {/* Stats Grid - Responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="stat-card text-center p-3 sm:p-4">
            <Truck className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-xl sm:text-2xl font-bold">
              {stats.totalDeliveries}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Entregas
            </p>
          </div>
          <div className="stat-card text-center p-3 sm:p-4">
            <Target className="w-5 h-5 text-success mx-auto mb-2" />
            <p className="text-xl sm:text-2xl font-bold">{stats.onTimeRate}%</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              No Prazo
            </p>
          </div>
          <div className="stat-card text-center p-3 sm:p-4">
            <Clock className="w-5 h-5 text-accent-foreground mx-auto mb-2" />
            <p className="text-xl sm:text-2xl font-bold">
              {stats.avgDeliveryTime}h
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Tempo Médio
            </p>
          </div>
          <div className="stat-card text-center p-3 sm:p-4">
            <DollarSign className="w-5 h-5 text-success mx-auto mb-2" />
            <p className="text-xl sm:text-2xl font-bold">
              R$ {(stats.totalRevenue / 1000).toFixed(0)}k
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Receita
            </p>
          </div>
          <GrowthStatCard growthRate={stats.growthRate} />
        </div>

        <Tabs defaultValue="kpis">
          <TabsList>
            <TabsTrigger value="kpis">KPIs</TabsTrigger>
            <TabsTrigger value="benchmark">Benchmark</TabsTrigger>
            <TabsTrigger value="tracking">Tracking</TabsTrigger>
          </TabsList>

          <TabsContent value="kpis" className="space-y-4 mt-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {[
                  {
                    label: "Taxa de Entrega",
                    value: `${stats.onTimeRate}%`,
                    target: "95%",
                    status: stats.onTimeRate >= 95 ? "above" : "below",
                  },
                  {
                    label: "Total Entregas",
                    value: `${stats.totalDeliveries}`,
                    target: "-",
                    status: stats.totalDeliveries > 0 ? "above" : "below",
                  },
                  {
                    label: "Custo Médio",
                    value: `R$ ${(summaryMetrics?.avgCost ?? 0).toFixed(2)}`,
                    target: "R$ 15.00",
                    status:
                      (summaryMetrics?.avgCost ?? 0) <= 15 ? "above" : "below",
                  },
                  {
                    label: "Tempo Médio",
                    value: `${stats.avgDeliveryTime}h`,
                    target: "48h",
                    status: stats.avgDeliveryTime <= 48 ? "above" : "below",
                  },
                ].map((kpi, i) => (
                  <div key={i} className="card-interactive p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                      <span className="text-sm text-muted-foreground">
                        {kpi.label}
                      </span>
                      <Badge
                        variant={
                          kpi.status === "above" || kpi.status === "below"
                            ? "default"
                            : "secondary"
                        }
                        className="w-fit text-xs"
                      >
                        {kpi.status === "above" ? "Acima" : "Abaixo"} da meta
                      </Badge>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">
                      Meta: {kpi.target}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
              <PerformanceChart data={monthlyData} />
              <DistributionChart data={monthlyData} />
            </div>
          </TabsContent>

          <TabsContent value="benchmark" className="space-y-4">
            <div className="card-base p-4">
              <h3 className="font-semibold mb-4">Comparação com Mercado</h3>
              {benchmarkData ? (
                <div className="space-y-3">
                  {benchmarkData.periods.slice(-3).map((period, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <span className="text-sm">{period.periodLabel}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {period.slaRate.toFixed(1)}%
                        </span>
                        <Badge
                          variant={
                            period.slaRate >= 90 ? "default" : "destructive"
                          }
                        >
                          SLA
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Carregando benchmarks...
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-4">
            <div className="card-base p-4">
              <h3 className="font-semibold mb-4">Métricas de Rastreamento</h3>
              {trackingData ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-32 text-sm text-muted-foreground">
                      Total Entregas
                    </div>
                    <div className="flex-1 bg-muted rounded-full h-3">
                      <div
                        className="bg-primary rounded-full h-3"
                        style={{
                          width: `${Math.min(100, trackingData.totalDeliveries)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-16">
                      {trackingData.totalDeliveries}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 text-sm text-muted-foreground">
                      Tempo Médio
                    </div>
                    <div className="flex-1 bg-muted rounded-full h-3">
                      <div
                        className="bg-primary rounded-full h-3"
                        style={{
                          width: `${Math.min(100, (trackingData.avgDeliveryTimeMinutes / 60) * 10)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-16">
                      {trackingData.avgDeliveryTimeMinutes}min
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 text-sm text-muted-foreground">
                      Distância Total
                    </div>
                    <div className="flex-1 bg-muted rounded-full h-3">
                      <div
                        className="bg-primary rounded-full h-3"
                        style={{
                          width: `${Math.min(100, trackingData.totalDistanceKm / 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold w-16">
                      {trackingData.totalDistanceKm}km
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Carregando dados...
                </p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
