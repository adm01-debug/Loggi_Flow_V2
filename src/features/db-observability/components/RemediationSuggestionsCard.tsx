import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench } from "lucide-react";
import { useRemediationSuggestions } from "../hooks/useRemediationSuggestions";

const variant = (s: string): "destructive" | "secondary" | "default" =>
  s === "critical" ? "destructive" : s === "warning" ? "secondary" : "default";

export function RemediationSuggestionsCard() {
  const { data, isLoading, error } = useRemediationSuggestions();

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
          <div key={s.id} className="rounded-md border border-border p-3 space-y-1">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium">{s.title}</p>
              <Badge variant={variant(s.severity)}>{s.severity}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{s.detail}</p>
            <p className="text-xs">
              <span className="font-medium text-foreground">Ação:</span>{" "}
              <span className="text-muted-foreground">{s.recommended_action}</span>
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
