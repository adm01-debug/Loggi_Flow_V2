import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import { useHealthScoreRegression } from "../hooks/useHealthScoreRegression";

export function HealthRegressionAlert() {
  const { data } = useHealthScoreRegression();

  if (!data) return null;

  const isRegression = data.regression_detected;
  const isImprovement = data.delta > 5;

  if (!isRegression && !isImprovement) return null;

  return (
    <Alert variant={isRegression ? "destructive" : "default"} className={isImprovement ? "border-emerald-500/50 bg-emerald-500/5" : ""}>
      {isRegression ? (
        <AlertTriangle className="h-4 w-4" />
      ) : (
        <TrendingUp className="h-4 w-4 text-emerald-600" />
      )}
      <AlertTitle className="flex items-center gap-2">
        {isRegression ? (
          <>
            <TrendingDown className="h-4 w-4" />
            Regressão de saúde detectada
          </>
        ) : (
          "Melhoria significativa nas últimas 24h"
        )}
      </AlertTitle>
      <AlertDescription>
        Score global variou <strong>{data.delta > 0 ? "+" : ""}{Number(data.delta).toFixed(1)}</strong> pontos
        {" "}({Number(data.previous_score).toFixed(1)} → {Number(data.current_score).toFixed(1)})
        {" "}entre {new Date(data.previous_at).toLocaleString("pt-BR")} e {new Date(data.current_at).toLocaleString("pt-BR")}.
        {isRegression && " Verifique anomalias, capacidade e regressões de queries abaixo."}
      </AlertDescription>
    </Alert>
  );
}
