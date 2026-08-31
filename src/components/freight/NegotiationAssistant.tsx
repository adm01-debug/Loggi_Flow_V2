import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquare, ShieldCheck } from "lucide-react";

interface NegotiationAssistantProps {
  bestValue: number | null;
  carrierName: string | null;
}

export function NegotiationAssistant({
  bestValue,
  carrierName,
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
            ({carrierName}) está 12% abaixo da sua média mensal para este
            trecho.
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
