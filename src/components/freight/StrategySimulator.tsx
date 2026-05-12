import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import { 
  TrendingDown, 
  Calculator, 
  ArrowRight, 
  Sparkles, 
  PieChart as PieChartIcon,
  BarChart3,
  TrendingUp,
  Percent
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend
} from "recharts";

interface SimulatorProps {
  currentMonthlyFreight: number;
  totalDeliveries: number;
}

export function ScenarioSimulator({ currentMonthlyFreight, totalDeliveries }: SimulatorProps) {
  const [volumeChange, setVolumeChange] = useState(0); // -50% to +100%
  const [rateChange, setRateChange] = useState(0); // -30% to +30%
  const [negotiationTarget, setNegotiationTarget] = useState(0); // 0% to 15%

  const avgFreight = totalDeliveries > 0 ? currentMonthlyFreight / totalDeliveries : 0;
  
  const simulation = useMemo(() => {
    const newVolume = totalDeliveries * (1 + volumeChange / 100);
    const newRate = avgFreight * (1 + rateChange / 100) * (1 - negotiationTarget / 100);
    const newTotal = newVolume * newRate;
    const savings = currentMonthlyFreight * (1 + volumeChange / 100) - newTotal;
    
    return {
      volume: Math.round(newVolume),
      avgRate: newRate,
      total: newTotal,
      savings: savings,
      percentChange: currentMonthlyFreight > 0 ? ((newTotal - currentMonthlyFreight) / currentMonthlyFreight) * 100 : 0
    };
  }, [currentMonthlyFreight, totalDeliveries, volumeChange, rateChange, negotiationTarget, avgFreight]);

  const chartData = [
    { name: "Atual", valor: currentMonthlyFreight },
    { name: "Projetado", valor: simulation.total },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="lg:col-span-1 border-none shadow-lg bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Parâmetros de Simulação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                Variação de Volume
              </Label>
              <Badge variant={volumeChange >= 0 ? "outline" : "destructive"} className="font-mono">
                {volumeChange >= 0 ? "+" : ""}{volumeChange}%
              </Badge>
            </div>
            <Slider 
              value={[volumeChange]} 
              onValueChange={(v) => setVolumeChange(v[0])} 
              min={-50} 
              max={100} 
              step={5}
              className="py-4"
            />
            <p className="text-[10px] text-muted-foreground italic">Projeção de crescimento ou redução de demanda.</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                Ajuste de Tabela (Reajuste)
              </Label>
              <Badge variant={rateChange <= 0 ? "success" : "destructive"} className="font-mono">
                {rateChange >= 0 ? "+" : ""}{rateChange}%
              </Badge>
            </div>
            <Slider 
              value={[rateChange]} 
              onValueChange={(v) => setRateChange(v[0])} 
              min={-30} 
              max={30} 
              step={1}
              className="py-4"
            />
            <p className="text-[10px] text-muted-foreground italic">Impacto de novos reajustes das transportadoras.</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-warning" />
                Meta de Negociação
              </Label>
              <Badge variant="warning" className="font-mono">
                -{negotiationTarget}%
              </Badge>
            </div>
            <Slider 
              value={[negotiationTarget]} 
              onValueChange={(v) => setNegotiationTarget(v[0])} 
              min={0} 
              max={20} 
              step={0.5}
              className="py-4"
            />
            <p className="text-[10px] text-muted-foreground italic">Redução agressiva via troca de parceiro ou BID.</p>
          </div>

          <div className="pt-4 border-t border-border/50">
            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Insight de IA</p>
              <p className="text-xs leading-relaxed">
                {negotiationTarget > 10 
                  ? "Meta agressiva. Recomendamos diversificar transportadoras para SP e RJ para atingir este patamar."
                  : "Meta conservadora. Focar em consolidação de carga pode garantir esse resultado sem trocar de frota."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-none shadow-md bg-gradient-to-br from-primary/10 to-transparent overflow-hidden relative">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">Custo Projetado</p>
              <h3 className="text-3xl font-black text-primary">{formatCurrency(simulation.total)}</h3>
              <div className="flex items-center gap-2 mt-2">
                {simulation.percentChange !== 0 && (
                  <Badge variant={simulation.percentChange < 0 ? "success" : "destructive"} className="h-5">
                    {simulation.percentChange > 0 ? "+" : ""}{simulation.percentChange.toFixed(1)}%
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">vs. Atual</span>
              </div>
              <TrendingDown className="absolute -right-4 -bottom-4 w-24 h-24 text-primary/5 -rotate-12" />
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-success/10 to-transparent overflow-hidden relative">
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">Impacto no EBITDA</p>
              <h3 className="text-3xl font-black text-success">
                {simulation.savings > 0 ? "+" : ""}{formatCurrency(simulation.savings)}
              </h3>
              <p className="text-xs text-muted-foreground mt-2">Economia mensal estimada</p>
              <Sparkles className="absolute -right-4 -bottom-4 w-24 h-24 text-success/5 rotate-12" />
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Comparativo de Cenários</CardTitle>
            <div className="flex gap-2">
              <Badge variant="outline" className="gap-1">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/30" /> Atual
              </Badge>
              <Badge variant="outline" className="gap-1 border-primary/50 text-primary">
                <div className="w-2 h-2 rounded-full bg-primary" /> Projetado
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    tickFormatter={(v) => `R$ ${v/1000}k`}
                  />
                  <Tooltip 
                    cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background/95 border border-border p-3 shadow-xl rounded-lg backdrop-blur-sm">
                            <p className="text-xs font-bold uppercase text-muted-foreground mb-1">{payload[0].payload.name}</p>
                            <p className="text-lg font-black text-foreground">{formatCurrency(payload[0].value as number)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="valor" radius={[10, 10, 0, 0]} barSize={80}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === 0 ? "hsl(var(--muted-foreground)/0.2)" : "hsl(var(--primary))"} 
                        fillOpacity={index === 0 ? 0.5 : 1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-6 grid grid-cols-2 gap-8 border-t border-border/50 pt-6">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">KPI: Volume</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                    <PieChartIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{totalDeliveries} <ArrowRight className="inline w-3 h-3 text-muted-foreground mx-1" /> {simulation.volume}</p>
                    <p className="text-[10px] text-muted-foreground">Entregas/mês</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">KPI: Ticket Médio</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                    <Percent className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-lg font-bold">{formatCurrency(avgFreight)} <ArrowRight className="inline w-3 h-3 text-muted-foreground mx-1" /> {formatCurrency(simulation.avgRate)}</p>
                    <p className="text-[10px] text-muted-foreground">Frete Médio</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}