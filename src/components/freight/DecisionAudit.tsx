import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, MapPin, Scale, Truck, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FreightDecision {
  id: string;
  created_at: string;
  request_params: {
    estado_destino: string;
    peso_kg: number;
    urgencia?: string;
    tipo_carga?: string;
  };
  selected_carrier_name: string | null;
  recommendations: Array<{
    carrier_name: string;
    score: number;
    estimated_cost: number;
    estimated_days: number;
  }>;
  rule_applied: {
    event_type?: string;
    price_weight: number;
    time_weight: number;
    performance_weight: number;
  };
  status: string;
  error_message: string | null;
}

export function DecisionAudit() {
  const { data: decisions, isLoading } = useQuery({
    queryKey: ["freight-decisions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("freight_decisions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as unknown as FreightDecision[];
    },
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="text-center py-8">
        Carregando auditoria de decisões...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Nexus Decision Audit
          </h2>
          <p className="text-sm text-muted-foreground">
            Rastreamento em tempo real da inteligência de seleção de frete
          </p>
        </div>
        <Badge
          variant="outline"
          className="bg-primary/5 text-primary border-primary/20 animate-pulse"
        >
          Live Monitoring Active
        </Badge>
      </div>

      <div className="grid gap-4">
        {decisions?.map((decision) => (
          <Card
            key={decision.id}
            className="overflow-hidden border-l-4 border-l-primary"
          >
            <CardHeader className="py-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      decision.status === "success" ? "default" : "destructive"
                    }
                  >
                    {decision.status === "success" ? "Calculado" : "Falha"}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    {format(
                      new Date(decision.created_at),
                      "HH:mm:ss 'em' dd/MM",
                      { locale: ptBR },
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm font-medium">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    {decision.request_params?.estado_destino}
                  </div>
                  <div className="flex items-center gap-1">
                    <Scale className="h-3 w-3 text-muted-foreground" />
                    {decision.request_params?.peso_kg}kg
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="py-4">
              {decision.status === "success" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Truck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Vencedor Selecionado
                        </p>
                        <h3 className="text-lg font-bold">
                          {decision.selected_carrier_name}
                        </h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Score Nexus
                      </p>
                      <p className="text-xl font-black text-primary">
                        {decision.recommendations?.[0]?.score}/100
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-2">
                        <Scale className="h-3 w-3" /> Pesos da Estratégia:{" "}
                        {decision.rule_applied?.event_type || "Geral"}
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-muted/50 p-2 rounded text-center">
                          <p className="text-[10px] text-muted-foreground">
                            Preço
                          </p>
                          <p className="text-sm font-bold">
                            {(
                              Number(decision.rule_applied?.price_weight || 0) *
                              100
                            ).toFixed(0)}
                            %
                          </p>
                        </div>
                        <div className="bg-muted/50 p-2 rounded text-center">
                          <p className="text-[10px] text-muted-foreground">
                            Prazo
                          </p>
                          <p className="text-sm font-bold">
                            {(
                              Number(decision.rule_applied?.time_weight || 0) *
                              100
                            ).toFixed(0)}
                            %
                          </p>
                        </div>
                        <div className="bg-muted/50 p-2 rounded text-center">
                          <p className="text-[10px] text-muted-foreground">
                            Perf.
                          </p>
                          <p className="text-sm font-bold">
                            {(
                              Number(
                                decision.rule_applied?.performance_weight || 0,
                              ) * 100
                            ).toFixed(0)}
                            %
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                        Rankings de Comparação
                      </h4>
                      <div className="max-h-[150px] overflow-y-auto pr-2 space-y-1">
                        {decision.recommendations?.map(
                          (
                            rec: FreightDecision["recommendations"][number],
                            idx: number,
                          ) => (
                            <div
                              key={idx}
                              className={`flex items-center justify-between text-xs p-2 rounded ${idx === 0 ? "bg-primary/5 border border-primary/20" : "bg-muted/30"}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold w-4">
                                  {idx + 1}.
                                </span>
                                <span className="truncate max-w-[120px]">
                                  {rec.carrier_name}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-medium">
                                  {formatCurrency(rec.estimated_cost)}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] py-0 h-4"
                                >
                                  {rec.score}
                                </Badge>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-destructive p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                  <AlertCircle className="h-5 w-5" />
                  <div>
                    <p className="font-bold">Falha na Seleção</p>
                    <p className="text-sm">{decision.error_message}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
