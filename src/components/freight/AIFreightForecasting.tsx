import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import {
  montarPrevisaoFrete,
  gerarInsightsFrete,
  MESES_PROJECAO,
  MINIMO_MESES_REAIS,
  type EntradaFrete,
  type FonteInsights,
  type InsightFrete,
} from "@/lib/freightForecast";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface AIFreightForecastingProps {
  entregas: EntradaFrete[];
  abusivos: FonteInsights["abusivos"];
  consolidacao: FonteInsights["consolidacao"];
  melhorTransportadora: FonteInsights["melhorTransportadora"];
}

const ESTILO_INSIGHT: Record<InsightFrete["type"], string> = {
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
  info: "bg-info/10 text-info",
};

const ICONE_INSIGHT: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  tendencia: TrendingUp,
  abusivos: AlertCircle,
  consolidacao: ShieldCheck,
  transportadora: Truck,
};

export function AIFreightForecasting({
  entregas,
  abusivos,
  consolidacao,
  melhorTransportadora,
}: AIFreightForecastingProps) {
  const previsao = useMemo(() => montarPrevisaoFrete(entregas), [entregas]);

  const insights = useMemo(
    () =>
      gerarInsightsFrete({
        abusivos,
        consolidacao,
        melhorTransportadora,
        variacaoProjetada: previsao.variacaoProjetada,
      }),
    [abusivos, consolidacao, melhorTransportadora, previsao.variacaoProjetada],
  );

  const IconeTendencia =
    (previsao.variacaoProjetada ?? 0) < 0 ? TrendingDown : TrendingUp;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-warning" />
            Previsão de Custos de Frete
          </CardTitle>
          <Badge
            variant="outline"
            className="bg-warning/5 text-warning border-warning/20"
          >
            {previsao.temProjecao
              ? `Tendência · ${previsao.mesesReais} meses de base`
              : "Base insuficiente"}
          </Badge>
        </CardHeader>
        <CardContent>
          {previsao.pontos.length === 0 ? (
            <div className="h-[300px] flex flex-col items-center justify-center gap-2 text-center">
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm font-semibold">Sem frete registrado</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Assim que houver entregas com valor de frete, o histórico e a
                projeção aparecem aqui.
              </p>
            </div>
          ) : (
            <div className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={previsao.pontos}>
                  <defs>
                    <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--warning))"
                        stopOpacity={0.2}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--warning))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    className="stroke-border"
                  />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis
                    className="text-xs"
                    tickFormatter={(v) => `R$${Math.round(Number(v) / 1000)}k`}
                  />
                  <Tooltip
                    formatter={(v) => formatCurrency(Number(v))}
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      borderColor: "hsl(var(--border))",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="real"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#colorReal)"
                    strokeWidth={3}
                    name="Realizado"
                    connectNulls={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="pred"
                    stroke="hsl(var(--warning))"
                    fillOpacity={1}
                    fill="url(#colorPred)"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    name="Projeção por tendência"
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="flex items-center gap-4 mt-4 px-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-[10px] text-muted-foreground">
                Frete realizado
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-warning border-dashed border border-warning" />
              <span className="text-[10px] text-muted-foreground">
                {previsao.temProjecao
                  ? `Projeção linear (${MESES_PROJECAO} meses)`
                  : `Projeção exige ${MINIMO_MESES_REAIS} meses de histórico`}
              </span>
            </div>
            {previsao.variacaoProjetada !== null && (
              <div className="flex items-center gap-1.5 ml-auto">
                <IconeTendencia className="w-3.5 h-3.5 text-warning" />
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {previsao.variacaoProjetada > 0 ? "+" : ""}
                  {previsao.variacaoProjetada}% em {MESES_PROJECAO} meses
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-sm font-bold flex items-center gap-2 px-1">
          <AlertCircle className="w-4 h-4 text-primary" />
          Insights Preditivos
        </h3>
        {insights.length === 0 ? (
          <div className="p-3 rounded-xl border bg-card/50">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Nenhum desvio relevante nos fretes analisados: sem valor acima da
              média do estado, sem carga consolidável e sem diferença entre
              transportadoras no mesmo destino.
            </p>
          </div>
        ) : (
          insights.map((insight) => {
            const Icone = ICONE_INSIGHT[insight.id] ?? AlertCircle;
            return (
              <div
                key={insight.id}
                className="p-3 rounded-xl border bg-card/50 space-y-2 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-lg ${ESTILO_INSIGHT[insight.type]}`}
                  >
                    <Icone className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold">{insight.title}</h4>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {insight.desc}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
