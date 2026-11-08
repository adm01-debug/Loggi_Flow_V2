import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, AlertCircle, Calendar, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

interface AIFreightForecastingProps {
  currentTotal: number;
}

export function AIFreightForecasting({ currentTotal }: AIFreightForecastingProps) {
  // Mock data for AI Forecasting
  const data = [
    { name: "Jan", real: currentTotal * 0.8, pred: currentTotal * 0.82 },
    { name: "Fev", real: currentTotal * 0.9, pred: currentTotal * 0.88 },
    { name: "Mar", real: currentTotal, pred: currentTotal * 1.05 },
    { name: "Abr", real: null, pred: currentTotal * 1.15 },
    { name: "Mai", real: null, pred: currentTotal * 1.08 },
    { name: "Jun", real: null, pred: currentTotal * 1.25 },
  ];

  const insights = [
    {
      title: "Pico de Demanda Junho",
      desc: "Previsão de aumento de 25% no volume devido à sazonalidade. Recomenda-se pré-agendamento de coletas.",
      type: "warning",
      icon: TrendingUp
    },
    {
      title: "Otimização de Rota Sul",
      desc: "IA detectou oportunidade de reduzir 12% nos custos em SC/PR via transportadora local ABC.",
      type: "success",
      icon: ShieldCheck
    },
    {
      title: "Risco de Atraso (Clima)",
      desc: "Frente fria prevista para Sudeste pode atrasar entregas em 48h na próxima semana.",
      type: "info",
      icon: Calendar
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-warning" />
            Previsão de Custos (IA Gemini)
          </CardTitle>
          <Badge variant="outline" className="bg-warning/5 text-warning border-warning/20">
            Beta - Preditivo
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={v => `R$${v/1000}k`} />
                <Tooltip 
                  formatter={(v) => formatCurrency(Number(v))}
                  contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
                />
                <Area type="monotone" dataKey="real" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorReal)" strokeWidth={3} name="Realizado" />
                <Area type="monotone" dataKey="pred" stroke="hsl(var(--warning))" fillOpacity={1} fill="url(#colorPred)" strokeDasharray="5 5" strokeWidth={2} name="Previsão IA" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-4 px-2">
             <div className="flex items-center gap-1.5">
               <div className="w-3 h-3 rounded-full bg-primary" />
               <span className="text-[10px] text-muted-foreground">Histórico Real</span>
             </div>
             <div className="flex items-center gap-1.5">
               <div className="w-3 h-3 rounded-full bg-warning border-dashed border border-warning" />
               <span className="text-[10px] text-muted-foreground">Projeção Gemini AI</span>
             </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-sm font-bold flex items-center gap-2 px-1">
          <AlertCircle className="w-4 h-4 text-primary" />
          Insights Preditivos
        </h3>
        {insights.map((insight, i) => (
          <div key={i} className="p-3 rounded-xl border bg-card/50 space-y-2 hover:border-primary/50 transition-colors">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${({ warning: 'bg-warning/10 text-warning', success: 'bg-success/10 text-success', info: 'bg-info/10 text-info' } as Record<string,string>)[insight.type] ?? 'bg-info/10 text-info'}`}>
                <insight.icon className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold">{insight.title}</h4>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {insight.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}