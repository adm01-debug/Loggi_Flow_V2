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
import { compareScenarios, toScenarioLike, type ScenarioLike } from "@/lib/predictions/whatIfCompare";
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
  const [pickA, setPickA] = useState<string>("");
  const [pickB, setPickB] = useState<string>("__current__");

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

  const handleSave = useCallback(() => {
    const store = getStore();
    if (!store) { toast.error("Armazenamento local indisponível"); return; }
    try {
      const next = saveScenario(store, { name, projection });
      setScenarios(next);
      setName("");
      toast.success("Cenário salvo");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar");
    }
  }, [name, projection]);

  const handleDelete = useCallback((id: string) => {
    const store = getStore();
    if (!store) return;
    setScenarios(deleteScenario(store, id));
    toast.success("Cenário removido");
  }, []);

  const handleRestore = useCallback((s: SavedScenario) => {
    setSelected(new Set(s.categories));
    toast.info(`Cenário "${s.name}" carregado`);
  }, []);

  const canSave = projection.selectedCount > 0 && name.trim().length > 0;

  const currentAsScenario: ScenarioLike = useMemo(() => ({
    id: "__current__",
    name: "Seleção atual",
    baselineOtif: projection.baselineOtif,
    projectedOtif: projection.projectedOtif,
    totalGain: projection.totalGain,
    confidence: projection.confidence,
    categories: projection.contributions.map((c) => c.category),
  }), [projection]);

  const resolveScenario = useCallback((id: string): ScenarioLike | null => {
    if (!id) return null;
    if (id === "__current__") return currentAsScenario;
    const s = scenarios.find((x) => x.id === id);
    return s ? toScenarioLike(s) : null;
  }, [scenarios, currentAsScenario]);

  const diff = useMemo(() => {
    const A = resolveScenario(pickA);
    const B = resolveScenario(pickB);
    if (!A || !B || A.id === B.id) return null;
    return compareScenarios(A, B);
  }, [pickA, pickB, resolveScenario]);

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

            <div className="rounded-lg border bg-muted/10 p-3 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Star className="h-4 w-4 text-primary" /> Cenários favoritos
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do cenário (ex: Blitz clima Sudeste)"
                  maxLength={80}
                />
                <Button onClick={handleSave} disabled={!canSave} size="sm">
                  Salvar seleção
                </Button>
              </div>
              {scenarios.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Nenhum cenário salvo. Selecione mitigações e salve para comparar projeções depois.
                </p>
              ) : (
                <ul className="space-y-2">
                  {scenarios.map((s) => {
                    const gain = s.totalGain;
                    return (
                      <li key={s.id} className="flex items-start justify-between gap-2 rounded-md border bg-background p-2">
                        <button
                          type="button"
                          onClick={() => handleRestore(s)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="truncate text-sm font-medium">{s.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(s.createdAt).toLocaleString("pt-BR")} · {s.categories.length} mitigação(ões)
                          </p>
                          <div className="mt-1 flex flex-wrap gap-1 text-[11px]">
                            <Badge variant="outline">Base {s.baselineOtif.toFixed(1)}%</Badge>
                            <Badge variant={gain >= 0 ? "default" : "destructive"}>
                              Proj {s.projectedOtif.toFixed(1)}% ({gain >= 0 ? "+" : ""}{gain.toFixed(1)})
                            </Badge>
                            <Badge variant="secondary">Conf {Math.round(s.confidence * 100)}%</Badge>
                          </div>
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(s.id)}
                          aria-label={`Remover cenário ${s.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {scenarios.length > 0 && (
              <div className="rounded-lg border bg-muted/10 p-3 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-primary" /> Comparar cenários
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <select
                    className="rounded-md border bg-background px-2 py-1 text-sm"
                    value={pickA}
                    onChange={(e) => setPickA(e.target.value)}
                    aria-label="Cenário A"
                  >
                    <option value="">— Cenário A —</option>
                    {scenarios.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  <select
                    className="rounded-md border bg-background px-2 py-1 text-sm"
                    value={pickB}
                    onChange={(e) => setPickB(e.target.value)}
                    aria-label="Cenário B"
                  >
                    <option value="__current__">Seleção atual</option>
                    {scenarios.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                {diff ? (
                  <div className="space-y-2 rounded-md border bg-background p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">
                        {diff.a.name} <span className="text-muted-foreground">vs</span> {diff.b.name}
                      </span>
                      <Badge variant={diff.winner === "tie" ? "outline" : "default"}>
                        Vencedor: {diff.winner === "tie" ? "empate" : (diff.winner === "a" ? diff.a.name : diff.b.name)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                      <Metric label="Δ OTIF proj." value={diff.projectedDelta} suffix="pts" />
                      <Metric label="Δ Ganho" value={diff.gainDelta} suffix="pts" />
                      <Metric label="Δ Confiança" value={diff.confidenceDelta * 100} suffix="%" digits={0} />
                      <Metric label="Similaridade" value={diff.jaccard * 100} suffix="%" digits={0} neutral />
                    </div>
                    {Math.abs(diff.baselineDrift) > 0.01 && (
                      <p className="text-xs text-warning">
                        ⚠ Baseline diferente entre cenários (drift {diff.baselineDrift > 0 ? "+" : ""}{diff.baselineDrift} pts) — comparação pode ser enviesada.
                      </p>
                    )}
                    <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-3">
                      <CatList title="Compartilhadas" items={diff.sharedCategories} />
                      <CatList title={`Só em ${diff.a.name}`} items={diff.onlyInA} />
                      <CatList title={`Só em ${diff.b.name}`} items={diff.onlyInB} />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Selecione dois cenários distintos para ver o diff.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
