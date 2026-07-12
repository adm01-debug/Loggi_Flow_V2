import { MainLayout } from "@/components/layout/MainLayout";
import { Database } from "lucide-react";
import {
  RegressionsCard,
  TopQueriesCard,
  CronJobsCard,
  HealthTrendChart,
  PerformanceRunbook,
  AnomaliesCard,
  SloTrendCard,
  CapacityForecastCard,
  RemediationSuggestionsCard,
  ExportHealthReportButton,
  RemediationHistoryCard,
  MttrMetricsCard,
  GlobalHealthScoreCard,
  HealthScoreHistoryChart,
  HealthRegressionAlert,
  IndexProposalsCard,
  IndexRoiCard,
  LoadHeatmapCard,
  MaintenanceWindowsCard,
  useDbRegressionAlerts,
} from "@/features/db-observability";

export default function DbHealthPage() {
  useDbRegressionAlerts();

  return (
    <MainLayout>
      <div className="space-y-6 p-4 md:p-6">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Saúde do Banco</h1>
              <p className="text-sm text-muted-foreground">
                Observabilidade de queries, cron jobs, anomalias e SLOs.
              </p>
            </div>
          </div>
          <ExportHealthReportButton />
        </header>

        <HealthRegressionAlert />
        <GlobalHealthScoreCard />
        <HealthScoreHistoryChart />

        <div className="grid gap-6 md:grid-cols-2">
          <RegressionsCard />
          <AnomaliesCard />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <SloTrendCard />
          <CapacityForecastCard />
        </div>

        <RemediationSuggestionsCard />
        <RemediationHistoryCard />
        <MttrMetricsCard />



        <CronJobsCard />

        <TopQueriesCard />
        <IndexRoiCard />
        <IndexProposalsCard />
        <LoadHeatmapCard />
        <HealthTrendChart />
        <PerformanceRunbook />
      </div>
    </MainLayout>
  );
}
