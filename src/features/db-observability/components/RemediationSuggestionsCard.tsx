import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wrench, PlayCircle } from "lucide-react";
import { useRemediationSuggestions } from "../hooks/useRemediationSuggestions";
import { useApplyRemediation } from "../hooks/useRemediationActions";

function variant(s: string): "destructive" | "secondary" | "default" {
  if (s === "critical") return "destructive";
  if (s === "warning") return "secondary";
  return "default";
}

export function RemediationSuggestionsCard() {
  const { data, isLoading, error } = useRemediationSuggestions();
  const apply = useApplyRemediation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          Sugestões de Remediação
        </CardTitle>
        <CardDescription>
          Ações priorizadas com base em regressões, hot paths e capacidade.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Analisando sinais…</p>}
        {error && <p className="text-sm text-destructive">Erro ao gerar sugestões.</p>}
        {data && data.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Sem ações necessárias — banco saudável ✅
          </p>
        )}
        {data?.map((s) => (
          <div key={s.id} className="rounded-md border border-border p-3 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium">{s.title}</p>
              <Badge variant={variant(s.severity)}>{s.severity}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{s.detail}</p>
            <p className="text-xs">
              <span className="font-medium text-foreground">Ação:</span>{" "}
              <span className="text-muted-foreground">{s.recommended_action}</span>
            </p>
            <div className="pt-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => apply.mutate(s)}
                disabled={apply.isPending}
                className="gap-1"
              >
                <PlayCircle className="h-3.5 w-3.5" />
                Aplicar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
