/**
 * WhatIfPanel — Simulador de impacto combinado de mitigações selecionadas.
 * Determinístico (via simulateWhatIf), sem I/O.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlaskConical, Sparkles, Star, Trash2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/common/EmptyState";
import { simulateWhatIf } from "@/lib/predictions/whatIfSimulator";
import { ROOT_CAUSE_LABELS, type RootCauseCategory } from "@/lib/predictions/rootCauseAnalyzer";
import type { RankedMitigation } from "@/lib/predictions/mitigationRecommender";
import {
  deleteScenario,
  listScenarios,
  saveScenario,
  type SavedScenario,
} from "@/lib/predictions/whatIfScenarios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WhatIfPanelProps {
  ranked: readonly RankedMitigation[];
  baselineOtif: number | null | undefined;
}

const getStore = (): Storage | null => {
  if (typeof window === "undefined") return null;
  try { return window.localStorage; } catch { return null; }
};

export function WhatIfPanel({ ranked, baselineOtif }: WhatIfPanelProps) {
  const [selected, setSelected] = useState<Set<RootCauseCategory>>(new Set());
  const [scenarios, setScenarios] = useState<SavedScenario[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    const store = getStore();
    if (store) setScenarios(listScenarios(store));
  }, []);

  const projection = useMemo(
    () => simulateWhatIf(ranked, selected, baselineOtif ?? 0),
    [ranked, selected, baselineOtif],
  );

  const toggle = (cat: RootCauseCategory) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <Card className="card-raised">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-primary" />
          <CardTitle>Simulador What-if</CardTitle>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline">Baseline: {projection.baselineOtif.toFixed(1)}%</Badge>
          <Badge variant={projection.totalGain >= 0 ? "default" : "destructive"}>
            Projetado: {projection.projectedOtif.toFixed(1)}%
          </Badge>
          <Badge variant="secondary">Confiança: {Math.round(projection.confidence * 100)}%</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {ranked.length === 0 ? (
          <EmptyState
            icon={FlaskConical}
            title="Sem sugestões para simular"
            description="Selecione um período com atrasos para habilitar as mitigações."
          />
        ) : (
          <>
            <div className="rounded-lg border bg-muted/20 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <TrendingUp className="h-4 w-4 text-primary" /> Ganho combinado projetado
                </span>
                <span className={cn("text-lg font-bold tabular-nums", projection.totalGain >= 0 ? "text-success" : "text-destructive")}>
                  {projection.totalGain > 0 ? "+" : ""}{projection.totalGain.toFixed(2)} pts
                </span>
              </div>
              <Progress value={projection.projectedOtif} className="mt-2 h-2" />
              <p className="mt-1 text-xs text-muted-foreground">
                {projection.selectedCount} mitigação(ões) selecionada(s) · retornos decrescentes aplicados
              </p>
            </div>

            <ul className="space-y-2">
              {ranked.map((m) => {
                const isOn = selected.has(m.category);
                const contribution = projection.contributions.find((c) => c.category === m.category);
                return (
                  <li
                    key={m.category}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                      isOn ? "border-primary/50 bg-primary/5" : "bg-muted/10",
                    )}
                  >
                    <Checkbox
                      checked={isOn}
                      onCheckedChange={() => toggle(m.category)}
                      aria-label={`Selecionar ${ROOT_CAUSE_LABELS[m.category]}`}
                      className="mt-1"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">
                            {ROOT_CAUSE_LABELS[m.category]}
                          </p>
                          <p className="truncate font-medium">{m.headline}</p>
                        </div>
                        {contribution ? (
                          <Badge variant={contribution.source === "historico" ? "default" : "outline"} className="shrink-0 gap-1">
                            <Sparkles className="h-3 w-3" />
                            {contribution.expectedGain > 0 ? "+" : ""}
                            {contribution.expectedGain.toFixed(1)} pts · {contribution.source}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="shrink-0">Score {m.effectiveScore}</Badge>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
