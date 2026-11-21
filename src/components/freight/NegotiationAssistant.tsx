import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquare, ShieldCheck } from "lucide-react";

interface NegotiationAssistantProps {
  bestValue: number | null;
  carrierName: string | null;
  /** Média dos valores respondidos na cotação atual; null quando sem referência. */
  averageValue: number | null;
}

/** Percentual real de economia frente à média das cotações respondidas. */
function percentBelow(bestValue: number, averageValue: number): number | null {
  if (averageValue <= 0) return null;
  const diff = averageValue - bestValue;
  const pct = (diff / averageValue) * 100;
  // Só exibe comparação quando o valor é de fato menor que a média.
  return pct > 0 ? Math.round(Math.abs(pct)) : null;
}

/** Frase honesta do contexto do valor: comparação real ou indicação de melhor oferta. */
function comparisonText(
  bestValue: number,
  averageValue: number | null,
): string {
  if (averageValue === null) {
    return "é a melhor oferta disponível neste momento.";
  }
  const pct = percentBelow(bestValue, averageValue);
  if (pct !== null) {
    return `está ${pct}% abaixo da média das cotações desta consulta.`;
  }
  return "é a melhor oferta desta consulta.";
}

export function NegotiationAssistant({
  bestValue,
  carrierName,
  averageValue,
}: NegotiationAssistantProps) {
  if (!bestValue || !carrierName) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h4 className="font-bold text-sm flex items-center justify-center sm:justify-start gap-2">
            Assistente de Negociação LogiFlow
            <Badge variant="outline" className="text-[10px] bg-background">
              IA Ativa
            </Badge>
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            Detectamos que o valor de{" "}
            <span className="text-foreground font-bold">
              R$ {bestValue.toFixed(2)}
            </span>{" "}
            ({carrierName}) {comparisonText(bestValue, averageValue)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-8 text-[11px] gap-2">
            <MessageSquare className="w-3.5 h-3.5" /> Argumentos
          </Button>
          <Button size="sm" className="h-8 text-[11px] gap-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Aceitar Oferta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
