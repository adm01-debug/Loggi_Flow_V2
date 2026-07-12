import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Trophy, Medal, Award } from "lucide-react";
import { useMaintenanceWindows } from "../hooks/useMaintenanceWindows";

const rankIcon = [Trophy, Medal, Award];
const rankColor = [
  "text-amber-500 bg-amber-500/10 border-amber-500/30",
  "text-slate-400 bg-slate-500/10 border-slate-500/30",
  "text-orange-500 bg-orange-500/10 border-orange-500/30",
];

function fmtHour(h: number) {
  return `${String(h).padStart(2, "0")}:00`;
}

export function MaintenanceWindowsCard() {
  const { data, isLoading, error } = useMaintenanceWindows(30, 2, 3);

  return (
    <Card className="card-raised">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          Janelas Recomendadas de Manutenção
        </CardTitle>
        <CardDescription>
          Melhores blocos de 2 horas dos últimos 30 dias para migrations, backups e operações pesadas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-32 w-full" />}
        {error && <p className="text-sm text-destructive">Erro ao calcular janelas.</p>}
        {!isLoading && data && data.length === 0 && (
          <p className="text-sm text-muted-foreground">Sem dados suficientes ainda.</p>
        )}
        {data && data.length > 0 && (
          <div className="grid gap-3 md:grid-cols-3">
            {data.map((w, i) => {
              const Icon = rankIcon[i] ?? Award;
              const color = rankColor[i] ?? rankColor[2];
              return (
                <div
                  key={`${w.day_of_week}-${w.start_hour}`}
                  className={`rounded-lg border p-4 ${color}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="h-5 w-5" />
                    <Badge variant="outline" className="text-xs">
                      #{w.rank}
                    </Badge>
                  </div>
                  <p className="font-semibold text-base text-foreground">{w.day_name}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {fmtHour(w.start_hour)} – {fmtHour((w.end_hour + 1) % 24)}
                  </p>
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    <p>
                      Carga média: <b className="text-foreground">{w.avg_load}</b> conn
                    </p>
                    <p>
                      Pico: <b className="text-foreground">{w.peak_load}</b> conn
                    </p>
                    <p>
                      vs. pico diário: <b className="text-foreground">{w.vs_daily_peak_pct}%</b>
                    </p>
                  </div>
                  <p className="mt-3 text-xs font-medium text-foreground">{w.recommendation}</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
