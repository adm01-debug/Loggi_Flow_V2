import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Package, DollarSign, Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryMetrics {
  totalEntregas: number;
  entregasGrowth: number;
  avgCost: number;
  peakHour: number;
  peakRegion: string;
}

interface Props {
  metrics: SummaryMetrics | undefined;
}

export function AnalyticsSummaryCards({ metrics }: Props) {
  const cards = [
    {
      title: 'Entregas este mês',
      value: metrics?.totalEntregas || 0,
      growth: metrics?.entregasGrowth || 0,
      icon: Package,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Custo Médio/Entrega',
      value: metrics?.avgCost 
        ? `R$ ${metrics.avgCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : 'R$ 0,00',
      icon: DollarSign,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Horário de Pico',
      value: metrics?.peakHour !== undefined 
        ? `${metrics.peakHour.toString().padStart(2, '0')}:00`
        : '--:--',
      icon: Clock,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      title: 'Região Mais Ativa',
      value: metrics?.peakRegion || '--',
      icon: MapPin,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold">{card.value}</p>
                {'growth' in card && card.growth !== undefined && (
                  <div className={cn(
                    "flex items-center gap-1 text-sm",
                    card.growth >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {card.growth >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span>{card.growth >= 0 ? '+' : ''}{card.growth}% vs mês anterior</span>
                  </div>
                )}
              </div>
              <div className={cn(
                "p-3 rounded-xl",
                card.bgColor
              )}>
                <card.icon className={cn("w-6 h-6", card.color)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
