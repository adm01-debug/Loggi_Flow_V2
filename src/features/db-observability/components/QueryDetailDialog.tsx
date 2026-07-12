import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Check, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { useQueryDetail, useQueryIndexSuggestion } from "../hooks/useQueryDetail";

interface Props {
  queryid: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const confidenceColor: Record<string, string> = {
  high: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  low: "bg-muted text-muted-foreground",
};

export function QueryDetailDialog({ queryid, open, onOpenChange }: Props) {
  const { data: detail, isLoading } = useQueryDetail(open ? queryid : null);
  const { data: suggestions } = useQueryIndexSuggestion(open ? queryid : null);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    toast.success("Copiado para a área de transferência");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Query #{queryid}</DialogTitle>
          <DialogDescription>
            Estatísticas de execução + sugestão heurística de índice.
          </DialogDescription>
        </DialogHeader>

        {isLoading && <Skeleton className="h-40 w-full" />}

        {detail && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Query</span>
                <Button size="sm" variant="ghost" onClick={() => copy(detail.query_text, "q")}>
                  {copied === "q" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
              <pre className="text-xs font-mono whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
                {detail.query_text}
              </pre>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Chamadas" value={detail.calls.toLocaleString("pt-BR")} />
              <Metric label="Média" value={`${Number(detail.mean_exec_ms).toFixed(2)} ms`} />
              <Metric label="Total" value={`${Number(detail.total_exec_ms).toFixed(0)} ms`} />
              <Metric label="Máx" value={`${Number(detail.max_exec_ms).toFixed(2)} ms`} />
              <Metric label="Mín" value={`${Number(detail.min_exec_ms).toFixed(2)} ms`} />
              <Metric label="Desvio" value={`${Number(detail.stddev_exec_ms).toFixed(2)} ms`} />
              <Metric label="Linhas" value={detail.rows_returned.toLocaleString("pt-BR")} />
              <Metric
                label="Cache hit"
                value={detail.cache_hit_pct !== null ? `${detail.cache_hit_pct}%` : "—"}
              />
            </div>

            {suggestions && suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Sugestões de otimização
                </h4>
                {suggestions.map((s, i) => (
                  <div key={i} className="rounded-lg border bg-card p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={confidenceColor[s.confidence]}>
                        {s.confidence}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{s.suggestion_type}</span>
                    </div>
                    <p className="text-sm">{s.rationale}</p>
                    <div className="flex items-center justify-between gap-2 rounded bg-muted/50 p-2">
                      <code className="text-xs font-mono break-all">{s.recommended_ddl}</code>
                      <Button size="sm" variant="ghost" onClick={() => copy(s.recommended_ddl, `s-${i}`)}>
                        {copied === `s-${i}` ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-2">
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
