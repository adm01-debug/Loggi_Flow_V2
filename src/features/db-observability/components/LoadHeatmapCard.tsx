import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Flame } from "lucide-react";
import { useLoadHeatmap, type HeatmapCell } from "../hooks/useLoadHeatmap";

const DOW = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function cellColor(intensity: number): string {
  if (intensity === 0) return "bg-muted/40";
  if (intensity < 0.2) return "bg-emerald-500/20";
  if (intensity < 0.4) return "bg-emerald-500/40";
  if (intensity < 0.6) return "bg-amber-500/50";
  if (intensity < 0.8) return "bg-orange-500/60";
  return "bg-destructive/70";
}

export function LoadHeatmapCard() {
  const { data, isLoading, error } = useLoadHeatmap(30);

  const grid = useMemo(() => {
    const map = new Map<string, HeatmapCell>();
    (data ?? []).forEach((c) => map.set(`${c.day_of_week}-${c.hour_of_day}`, c));
    return map;
  }, [data]);

  const peak = useMemo(() => {
    if (!data || data.length === 0) return null;
    return data.reduce((max, c) => (c.intensity > max.intensity ? c : max), data[0]);
  }, [data]);

  return (
    <Card className="card-raised">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Heatmap de Carga (últimos 30 dias)
        </CardTitle>
        <CardDescription>
          Conexões ativas médias por dia da semana × hora. Identifique janelas de pico e vales.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-64 w-full" />}
        {error && <p className="text-sm text-destructive">Erro ao carregar heatmap.</p>}
        {!isLoading && data && data.length === 0 && (
          <p className="text-sm text-muted-foreground">Sem dados suficientes ainda.</p>
        )}
        {data && data.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                <div className="grid gap-0.5" style={{ gridTemplateColumns: "40px repeat(24, minmax(20px, 1fr))" }}>
                  <div />
                  {HOURS.map((h) => (
                    <div key={h} className="text-[10px] text-center text-muted-foreground">
                      {h % 3 === 0 ? h : ""}
                    </div>
                  ))}
                  {DOW.map((dow, dowIdx) => (
                    <div key={dow} className="contents">
                      <div className="text-xs text-muted-foreground flex items-center pr-2">{dow}</div>
                      {HOURS.map((h) => {
                        const cell = grid.get(`${dowIdx}-${h}`);
                        const intensity = cell?.intensity ?? 0;
                        return (
                          <div
                            key={`${dowIdx}-${h}`}
                            className={`aspect-square rounded-sm ${cellColor(intensity)} cursor-help transition-transform hover:scale-125`}
                            title={
                              cell
                                ? `${dow} ${h}h — ${cell.avg_active_connections} conn (pico: ${cell.max_active_connections})`
                                : `${dow} ${h}h — sem dados`
                            }
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>Baixo</span>
              <div className="w-3 h-3 rounded-sm bg-muted/40" />
              <div className="w-3 h-3 rounded-sm bg-emerald-500/20" />
              <div className="w-3 h-3 rounded-sm bg-emerald-500/40" />
              <div className="w-3 h-3 rounded-sm bg-amber-500/50" />
              <div className="w-3 h-3 rounded-sm bg-orange-500/60" />
              <div className="w-3 h-3 rounded-sm bg-destructive/70" />
              <span>Pico</span>
              {peak && (
                <span className="ml-auto">
                  🔥 Pico: <b>{DOW[peak.day_of_week]} {peak.hour_of_day}h</b> ({peak.avg_active_connections} conn)
                </span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
