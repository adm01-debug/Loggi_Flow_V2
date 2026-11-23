/**
 * MitigationHistoryPanel — histórico das mitigações executadas e delta de OTIF.
 */
import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  Ruler,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useMitigationActions,
  type MitigationActionRow,
} from "@/hooks/predictions/useMitigationActions";
import { ROOT_CAUSE_LABELS } from "@/lib/predictions/rootCauseAnalyzer";
import { PRIORITY_LABELS } from "@/lib/predictions/mitigationRecommender";
import { cn } from "@/lib/utils";

interface Props {
  currentOtif?: number | null;
}

function getDeltaIcon(delta: number | null) {
  if (delta == null || delta === 0) return Minus;
  return delta > 0 ? TrendingUp : TrendingDown;
}

function DeltaIconDisplay({ delta, className }: { delta: number | null; className?: string }) {
  if (delta == null || delta === 0) return <Minus className={className} />;
  return delta > 0 ? <TrendingUp className={className} /> : <TrendingDown className={className} />;
}

function getDeltaTone(delta: number | null) {
  if (delta == null || delta === 0) return "text-muted-foreground";
  return delta > 0 ? "text-success" : "text-destructive";
}

export function MitigationHistoryPanel({ currentOtif }: Props) {
  const { list, measure, remove } = useMitigationActions();

  const stats = useMemo(() => {
    const rows = list.data ?? [];
    const done = rows.filter(
      (r) => r.status === "concluida" && r.otif_delta !== null,
    );
    const totalDelta = done.reduce((a, r) => a + (r.otif_delta ?? 0), 0);
    const avg = done.length ? totalDelta / done.length : 0;
    return { total: rows.length, concluidas: done.length, mediaDelta: avg };
  }, [list.data]);

  return (
    <Card className="card-raised">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <CardTitle>Histórico de Mitigações</CardTitle>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline">Total: {stats.total}</Badge>
          <Badge variant="outline">Concluídas: {stats.concluidas}</Badge>
          <Badge variant={stats.mediaDelta >= 0 ? "default" : "destructive"}>
            Δ OTIF médio: {stats.mediaDelta.toFixed(2)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {(() => {
          if (list.isLoading) {
            return (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            );
          }
          if (!list.data || list.data.length === 0) {
            return (
              <EmptyState
                icon={History}
                title="Nenhuma mitigação registrada"
                description="Registre uma ação recomendada no painel de Causa Raiz para começar a medir o impacto no OTIF."
              />
            );
          }
          return (
            <ul className="divide-y">
              {list.data.map((row) => (
                <MitigationRow
                  key={row.id}
                  row={row}
                  currentOtif={currentOtif}
                  onMeasure={(otif_after, notes) =>
                    measure.mutate({
                      id: row.id,
                      otif_after,
                      notes: notes ?? null,
                    })
                  }
                  onDelete={() => remove.mutate(row.id)}
                />
              ))}
            </ul>
          );
        })()}
      </CardContent>
    </Card>
  );
}

interface RowProps {
  row: MitigationActionRow;
  currentOtif?: number | null;
  onMeasure: (otifAfter: number, notes?: string) => void;
  onDelete: () => void;
}

function MitigationRow({ row, currentOtif, onMeasure, onDelete }: RowProps) {
  const [open, setOpen] = useState(false);
  const [otif, setOtif] = useState<string>(
    currentOtif != null
      ? currentOtif.toString()
      : (row.otif_after?.toString() ?? ""),
  );
  const [notes, setNotes] = useState(row.notes ?? "");

  const delta = row.otif_delta;
  const deltaTone = getDeltaTone(delta);

  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{row.headline}</span>
          <Badge variant="outline" className="text-xs">
            {ROOT_CAUSE_LABELS[row.category]}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {PRIORITY_LABELS[row.priority]}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {row.status}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {row.executed_at
            ? `Executada em ${format(parseISO(row.executed_at), "dd/MM HH:mm", { locale: ptBR })}`
            : "Sem data de execução"}
          {row.focus_carrier ? ` · Foco: ${row.focus_carrier}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Δ OTIF</p>
          <p
            className={cn(
              "flex items-center gap-1 text-sm font-semibold",
              deltaTone,
            )}
          >
            <DeltaIconDisplay delta={delta} className="h-4 w-4" />
            {delta == null ? "—" : `${delta.toFixed(2)}%`}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Ruler className="h-4 w-4" /> Medir
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Medir impacto no OTIF</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="text-sm text-muted-foreground">
                OTIF antes:{" "}
                <strong>{row.otif_before?.toFixed(2) ?? "—"}%</strong>
              </div>
              <div className="space-y-2">
                <Label>OTIF atual (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  value={otif}
                  onChange={(e) => setOtif(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  const parsed = Number(otif);
                  if (Number.isFinite(parsed)) {
                    onMeasure(parsed, notes || undefined);
                    setOpen(false);
                  }
                }}
              >
                Salvar medição
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          aria-label="Remover"
        >
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </li>
  );
}
