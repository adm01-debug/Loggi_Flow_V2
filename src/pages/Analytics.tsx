import { MainLayout } from '@/components/layout/MainLayout';
import { useAnalytics } from '@/hooks/useAnalytics';
import { AnalyticsSummaryCards } from '@/components/analytics/AnalyticsSummaryCards';
import { MonthlyComparisonChart } from '@/components/analytics/MonthlyComparisonChart';
import { DemandForecastChart } from '@/components/analytics/DemandForecastChart';
import { RegionHeatmap } from '@/components/analytics/RegionHeatmap';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function Analytics() {
  const { monthlyData, demandForecast, heatmapData, summaryMetrics, isLoading } = useAnalytics();

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              Analytics Avançado
            </h1>
            <p className="text-muted-foreground mt-1">
              Análise detalhada de performance, previsões e padrões operacionais
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-[400px] w-full" />
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <AnalyticsSummaryCards metrics={summaryMetrics} />

            {/* Monthly Comparison */}
            <MonthlyComparisonChart data={monthlyData} />

            {/* Forecast and Heatmap */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <DemandForecastChart data={demandForecast} />
              <RegionHeatmap data={heatmapData} />
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
