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
  Cell
} from "recharts";

interface StrategySimulatorProps {
  currentMonthlyFreight: number;
  totalDeliveries: number;
}

export function StrategySimulator({ currentMonthlyFreight, totalDeliveries }: StrategySimulatorProps) {
  const [volumeChange, setVolumeChange] = useState(0); 
  const [rateChange, setRateChange] = useState(0); 
  const [negotiationTarget, setNegotiationTarget] = useState(0); 
  const [consolidationLevel, setConsolidationLevel] = useState(0);

  const avgFreight = totalDeliveries > 0 ? currentMonthlyFreight / totalDeliveries : 0;
  
  const simulation = useMemo(() => {
    const newVolume = totalDeliveries * (1 + volumeChange / 100);
    // Consolidation reduces total shipments while keeping total weight/volume the same, 
    // usually resulting in ~20% lower cost for consolidated volume
    const consolidatedVolume = newVolume * (consolidationLevel / 100);
    const standardVolume = newVolume - consolidatedVolume;
    
    const standardRate = avgFreight * (1 + rateChange / 100) * (1 - negotiationTarget / 100);
    const consolidatedRate = standardRate * 0.75; // 25% discount for consolidated
    
    const newTotal = (standardVolume * standardRate) + (consolidatedVolume * consolidatedRate);
    const costWithoutOptimization = (totalDeliveries * (1 + volumeChange / 100)) * avgFreight;
    const savings = costWithoutOptimization - newTotal;
    
    return {
      volume: Math.round(newVolume),
      avgRate: newTotal / newVolume,
      total: newTotal,
      savings: savings,
      percentChange: currentMonthlyFreight > 0 ? ((newTotal - currentMonthlyFreight) / currentMonthlyFreight) * 100 : 0
    };
  }, [currentMonthlyFreight, totalDeliveries, volumeChange, rateChange, negotiationTarget, consolidationLevel, avgFreight]);

  const scenarios = [
    { name: "Conservador", vol: 5, rate: 0, neg: 2, cons: 5 },
    { name: "Otimizado", vol: 10, rate: -2, neg: 5, cons: 15 },
    { name: "Agressivo", vol: 20, rate: -5, neg: 10, cons: 30 },
  ];

  const applyScenario = (s: typeof scenarios[0]) => {
    setVolumeChange(s.vol);
    setRateChange(s.rate);
    setNegotiationTarget(s.neg);
    setConsolidationLevel(s.cons);
  };

  const chartData = [
    { name: "Atual", valor: currentMonthlyFreight },
    { name: "Projetado", valor: simulation.total },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            Parâmetros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Variação Volume</Label>
              <Badge>{volumeChange}%</Badge>
            </div>
            <Slider value={[volumeChange]} onValueChange={(v) => setVolumeChange(v[0])} min={-50} max={100} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Ajuste Taxas</Label>
              <Badge>{rateChange}%</Badge>
            </div>
            <Slider value={[rateChange]} onValueChange={(v) => setRateChange(v[0])} min={-30} max={30} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Negociação</Label>
              <Badge>-{negotiationTarget}%</Badge>
            </div>
            <Slider value={[negotiationTarget]} onValueChange={(v) => setNegotiationTarget(v[0])} min={0} max={20} />
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-2 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-primary/10 rounded-lg">
            <p className="text-xs font-bold uppercase">Total Projetado</p>
            <p className="text-2xl font-bold">{formatCurrency(simulation.total)}</p>
          </div>
          <div className="p-4 bg-success/10 rounded-lg">
            <p className="text-xs font-bold uppercase">Economia Est.</p>
            <p className="text-2xl font-bold">{formatCurrency(simulation.savings)}</p>
          </div>
        </div>
        <Card className="p-4">
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => `R$${v/1000}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}