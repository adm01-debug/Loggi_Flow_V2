import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, PlayCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface RunbookStep {
  id: string;
  title: string;
  description: string;
  action?: () => Promise<void>;
  actionLabel?: string;
}

export function PerformanceRunbook() {
  const qc = useQueryClient();

  const steps: RunbookStep[] = [
    {
      id: "1",
      title: "1. Regressões conhecidas",
      description:
        "Compare execução atual com baseline diário. Regressões >50% são reportadas.",
      actionLabel: "Atualizar regressões",
      action: async () => {
        await qc.invalidateQueries({ queryKey: ["db-observability", "regressions"] });
        toast.success("Dados de regressão atualizados.");
      },
    },
    {
      id: "2",
      title: "2. Top ofensores em tempo real",
      description: "Top 10 queries por tempo total acumulado em pg_stat_statements.",
      actionLabel: "Atualizar top queries",
      action: async () => {
        await qc.invalidateQueries({ queryKey: ["db-observability", "top-queries"] });
        toast.success("Top queries atualizadas.");
      },
    },
    {
      id: "3",
      title: "3. Cron jobs de manutenção",
      description:
        "Verifique se refresh de MV, cleanup, snapshot e monitor de regressões executaram no horário.",
      actionLabel: "Atualizar jobs",
      action: async () => {
        await qc.invalidateQueries({ queryKey: ["db-observability", "cron-jobs"] });
        toast.success("Status de jobs atualizado.");
      },
    },
    {
      id: "4",
      title: "4. Tendência de saúde 7 dias",
      description:
        "Snapshots horários mostram evolução de conexões, cache hit ratio e deadlocks.",
      actionLabel: "Atualizar tendências",
      action: async () => {
        await qc.invalidateQueries({ queryKey: ["db-observability", "health-snapshots"] });
        toast.success("Tendências atualizadas.");
      },
    },
    {
      id: "5",
      title: "5. Escalar quando timeouts atingem o teto",
      description:
        "Se muitos 'canceling statement due to statement timeout' — paginar/otimizar a query; usar SET LOCAL statement_timeout apenas em emergência.",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Runbook: Investigação de Performance
        </CardTitle>
        <CardDescription>
          Passos diagnósticos com ações interativas (baseado em{" "}
          <code>docs/RUNBOOK_DB_PERFORMANCE.md</code>).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step) => (
          <div
            key={step.id}
            className="flex flex-col gap-2 rounded-lg border border-border bg-card/50 p-4 md:flex-row md:items-start md:justify-between"
          >
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{step.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
            </div>
            {step.action && step.actionLabel && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void step.action?.()}
                className="gap-2 shrink-0"
              >
                <PlayCircle className="h-4 w-4" />
                {step.actionLabel}
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
