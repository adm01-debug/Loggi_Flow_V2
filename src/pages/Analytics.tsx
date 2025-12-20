import { useState, useMemo } from 'react';
import { subMonths, format } from 'date-fns';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAnalytics, MonthlyData, DemandForecast, HeatmapData } from '@/hooks/useAnalytics';
import { useExport } from '@/hooks/useExport';
import { AnalyticsSummaryCards } from '@/components/analytics/AnalyticsSummaryCards';
import { MonthlyComparisonChart } from '@/components/analytics/MonthlyComparisonChart';
import { DemandForecastChart } from '@/components/analytics/DemandForecastChart';
import { RegionHeatmap } from '@/components/analytics/RegionHeatmap';
import { AnalyticsFilters, DateRange } from '@/components/analytics/AnalyticsFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export default function Analytics() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subMonths(new Date(), 6),
    to: new Date(),
  });
  const [isExporting, setIsExporting] = useState(false);

  const { monthlyData, demandForecast, heatmapData, summaryMetrics, isLoading } = useAnalytics(dateRange);
  const { exportToPDF, exportToExcel } = useExport();

  // Prepare data for export
  const exportData = useMemo(() => {
    const data: Record<string, unknown>[] = [];
    
    // Add monthly summary
    monthlyData.forEach((m: MonthlyData) => {
      data.push({
        tipo: 'Resumo Mensal',
        periodo: m.month,
        entregas: m.entregas,
        coletas: m.coletas,
        custo_total: `R$ ${m.custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        sla_atingido: `${m.slaAtingido}%`,
        ocorrencias: m.ocorrencias,
      });
    });

    // Add forecast data
    demandForecast.slice(-30).forEach((f: DemandForecast) => {
      if (f.actual === null) {
        data.push({
          tipo: 'Previsão',
          periodo: f.date,
          entregas: f.predicted,
          coletas: '-',
          custo_total: '-',
          sla_atingido: '-',
          ocorrencias: '-',
        });
      }
    });

    return data;
  }, [monthlyData, demandForecast]);

  // Prepare heatmap export
  const heatmapExportData = useMemo(() => {
    return heatmapData.map((h: HeatmapData) => ({
      regiao: h.region,
      horario: `${h.hour.toString().padStart(2, '0')}:00`,
      operacoes: h.count,
      intensidade: `${Math.round(h.intensity * 100)}%`,
    }));
  }, [heatmapData]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const allData = [
        ...exportData,
        ...heatmapExportData.map(h => ({
          tipo: 'Heatmap',
          periodo: h.horario,
          entregas: h.operacoes,
          coletas: '-',
          custo_total: '-',
          sla_atingido: h.intensidade,
          ocorrencias: h.regiao,
        })),
      ];
      
      exportToPDF(allData, {
        filename: 'analytics_relatorio',
        title: 'Relatório de Analytics',
        subtitle: `Período: ${format(dateRange.from, 'dd/MM/yyyy')} a ${format(dateRange.to, 'dd/MM/yyyy')}`,
      });
    } catch (error) {
      toast.error('Erro ao exportar PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      // Create multiple sheets worth of data
      exportToExcel(exportData, {
        filename: 'analytics_relatorio',
        sheetName: 'Resumo Mensal',
      });
      
      // Export heatmap separately
      setTimeout(() => {
        exportToExcel(heatmapExportData, {
          filename: 'analytics_heatmap',
          sheetName: 'Heatmap Horários',
        });
      }, 500);
    } catch (error) {
      toast.error('Erro ao exportar Excel');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
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
          
          {/* Filters */}
          <AnalyticsFilters
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            isExporting={isExporting}
          />
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
