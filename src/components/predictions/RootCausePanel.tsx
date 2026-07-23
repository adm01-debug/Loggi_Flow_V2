import { useMemo, useState } from "react";
import { AlertOctagon, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { useRootCauseAnalysis } from "@/hooks/logistics/useRootCauseAnalysis";
import { ROOT_CAUSE_LABELS, type RootCauseCategory } from "@/lib/predictions/rootCauseAnalyzer";
import { buildMitigations, PRIORITY_LABELS, type MitigationPriority } from "@/lib/predictions/mitigationRecommender";
import { Lightbulb } from "lucide-react";

const WINDOW_OPTIONS = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
];

interface RootCausePanelProps {
  transportadora?: string | null;
  availableCarriers?: string[];
}

export function RootCausePanel({ transportadora, availableCarriers = [] }: RootCausePanelProps) {
  const [carrier, setCarrier] = useState<string>(transportadora ?? "all");
  const [windowDays, setWindowDays] = useState<string>("30");

  const { data, isLoading, error } = useRootCauseAnalysis({
    transportadora: carrier === "all" ? null : carrier,
    windowDays: Number(windowDays),
  });

  const maxCount = useMemo(
    () => (data?.buckets.length ? Math.max(...data.buckets.map((b) => b.count)) : 0),
    [data],
  );

  return (
    <Card className="card-raised">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <AlertOctagon className="h-5 w-5 text-primary" />
          <CardTitle>Causa Raiz de Atrasos</CardTitle>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={carrier} onValueChange={setCarrier}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Transportadora" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas transportadoras</SelectItem>
              {availableCarriers.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={windowDays} onValueChange={setWindowDays}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WINDOW_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            icon={AlertOctagon}
            title="Falha ao carregar análise"
            description={(error as Error).message}
          />
        ) : !data || data.totalWithDelay === 0 ? (
          <EmptyState
            icon={AlertOctagon}
            title="Sem atrasos no período"
            description="Nenhum atraso confirmado foi registrado para o filtro selecionado."
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SummaryCard label="Predições analisadas" value={data.totalAnalyzed} />
              <SummaryCard label="Com atraso confirmado" value={data.totalWithDelay} />
              <SummaryCard
                label="Principal causa"
                value={data.topCategory ? ROOT_CAUSE_LABELS[data.topCategory] : "—"}
              />
            </div>
            <div className="space-y-3">
              {data.buckets.map((b) => (
                <BucketRow
                  key={b.category}
                  category={b.category}
                  count={b.count}
                  totalDelayHours={b.totalDelayHours}
                  maxCount={maxCount}
                  sampleMotivos={b.sampleMotivos}
                  topCarrier={topCarrierOf(b.carriers)}
                />
              ))}
            </div>
            <MitigationList report={data} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function topCarrierOf(carriers: Record<string, number>): string | null {
  const entries = Object.entries(carriers).sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ?? null;
}

interface SummaryCardProps {
  label: string;
  value: string | number;
}
function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

interface BucketRowProps {
  category: RootCauseCategory;
  count: number;
  totalDelayHours: number;
  maxCount: number;
  sampleMotivos: string[];
  topCarrier: string | null;
}
function BucketRow({ category, count, totalDelayHours, maxCount, sampleMotivos, topCarrier }: BucketRowProps) {
  const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium">{ROOT_CAUSE_LABELS[category]}</span>
          {topCarrier ? (
            <Badge variant="outline" className="text-xs">
              Principal: {topCarrier}
            </Badge>
          ) : null}
        </div>
        <span className="text-muted-foreground">
          {count} ocorrências · {totalDelayHours.toFixed(1)}h acumuladas
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
          aria-label={`Barra de proporção ${pct}%`}
        />
      </div>
      {sampleMotivos.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          Ex.: {sampleMotivos.slice(0, 3).join(" · ")}
        </p>
      ) : null}
    </div>
  );
}

const PRIORITY_STYLES: Record<MitigationPriority, string> = {
  alta: "border-destructive/40 bg-destructive/5",
  media: "border-warning/40 bg-warning/5",
  baixa: "border-border bg-muted/30",
};

const PRIORITY_BADGE: Record<MitigationPriority, "destructive" | "secondary" | "outline"> = {
  alta: "destructive",
  media: "secondary",
  baixa: "outline",
};

interface MitigationListProps {
  report: import("@/lib/predictions/rootCauseAnalyzer").RootCauseReport;
}
function MitigationList({ report }: MitigationListProps) {
  const suggestions = buildMitigations(report);
  if (!suggestions.length) return null;
  const sorted = [...suggestions].sort((a, b) => b.impactScore - a.impactScore);
  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Ações recomendadas</h3>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {sorted.map((s) => (
          <div key={s.category} className={`rounded-lg border p-3 ${PRIORITY_STYLES[s.priority]}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {ROOT_CAUSE_LABELS[s.category]}
                </p>
                <p className="font-medium">{s.headline}</p>
              </div>
              <Badge variant={PRIORITY_BADGE[s.priority]} className="shrink-0">
                {PRIORITY_LABELS[s.priority]} · {s.impactScore}
              </Badge>
            </div>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {s.actions.map((a) => (
                <li key={a} className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
            {s.focusCarrier ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Foco: <span className="font-medium">{s.focusCarrier}</span>
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
