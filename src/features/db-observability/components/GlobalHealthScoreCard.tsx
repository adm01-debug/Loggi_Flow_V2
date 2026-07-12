import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, TrendingUp, AlertTriangle, Clock, HardDrive } from "lucide-react";
import { useGlobalHealthScore } from "../hooks/useGlobalHealthScore";

const gradeColor = (grade: string) => {
  if (grade === "A+" || grade === "A") return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30";
  if (grade === "B") return "bg-sky-500/15 text-sky-600 border-sky-500/30";
  if (grade === "C") return "bg-amber-500/15 text-amber-600 border-amber-500/30";
  return "bg-destructive/15 text-destructive border-destructive/30";
};

const scoreColor = (score: number) => {
  if (score >= 90) return "text-emerald-600";
  if (score >= 75) return "text-sky-600";
  if (score >= 60) return "text-amber-600";
  return "text-destructive";
};

export function GlobalHealthScoreCard() {
  const { data, isLoading, error } = useGlobalHealthScore();

  return (
    <Card className="card-prominent border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Health Score Global
          {data && (
            <Badge variant="outline" className={`ml-auto text-lg px-3 py-1 ${gradeColor(data.grade)}`}>
              {data.grade}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-40 w-full" />}
        {error && <p className="text-sm text-destructive">Erro ao carregar score global.</p>}
        {data && (
          <div className="space-y-6">
            <div className="flex items-baseline gap-3">
              <span className={`text-6xl font-bold ${scoreColor(data.overall_score)}`}>
                {Number(data.overall_score).toFixed(1)}
              </span>
              <span className="text-lg text-muted-foreground">/ 100</span>
            </div>
            <Progress value={data.overall_score} className="h-3" />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ScoreMetric
                icon={<TrendingUp className="h-4 w-4" />}
                label="SLO (7d)"
                value={data.slo_score}
                weight={40}
              />
              <ScoreMetric
                icon={<AlertTriangle className="h-4 w-4" />}
                label="Anomalias"
                value={data.anomaly_score}
                weight={25}
                detail={`${data.details.critical_anomalies} crit / ${data.details.warning_anomalies} warn`}
              />
              <ScoreMetric
                icon={<Clock className="h-4 w-4" />}
                label="MTTR (30d)"
                value={data.mttr_score}
                weight={20}
                detail={`${data.details.avg_mttr_hours}h médio`}
              />
              <ScoreMetric
                icon={<HardDrive className="h-4 w-4" />}
                label="Capacidade"
                value={data.capacity_score}
                weight={15}
                detail={`${data.details.critical_capacity} crit / ${data.details.warning_capacity} warn`}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Atualizado em {new Date(data.computed_at).toLocaleString("pt-BR")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreMetric({
  icon,
  label,
  value,
  weight,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  weight: number;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-3 space-y-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1">{icon} {label}</span>
        <span className="text-[10px]">peso {weight}%</span>
      </div>
      <div className={`text-2xl font-semibold ${scoreColor(value)}`}>
        {Number(value).toFixed(1)}
      </div>
      {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}
