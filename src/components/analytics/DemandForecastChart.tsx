import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Calendar } from 'lucide-react';

interface DemandForecast {
  date: string;
  actual: number | null;
  predicted: number;
}

interface Props {
  data: DemandForecast[];
}

export function DemandForecastChart({ data }: Props) {
  // Find the split point between actual and predicted
  const splitIndex = data.findIndex(d => d.actual === null);
  const todayIndex = splitIndex > 0 ? splitIndex - 1 : data.length - 1;
  
  // Calculate predicted trend
  const predictedData = data.filter(d => d.actual === null);
  const avgPredicted = predictedData.length > 0 
    ? predictedData.reduce((sum, d) => sum + d.predicted, 0) / predictedData.length 
    : 0;
  
  const lastActual = data.filter(d => d.actual !== null).pop();
  const trend = lastActual && lastActual.actual 
    ? ((avgPredicted - lastActual.actual) / lastActual.actual * 100).toFixed(1)
    : '0';

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Previsão de Demanda
            </CardTitle>
            <CardDescription>
              Histórico de 30 dias + previsão para os próximos 30 dias
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Calendar className="w-3 h-3" />
              Hoje: {data[todayIndex]?.date}
            </Badge>
            <Badge 
              variant={Number(trend) >= 0 ? 'default' : 'destructive'}
              className="gap-1"
            >
              <TrendingUp className="w-3 h-3" />
              {Number(trend) >= 0 ? '+' : ''}{trend}% previsto
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis 
                dataKey="date" 
                className="text-xs fill-muted-foreground"
                interval={4}
              />
              <YAxis className="text-xs fill-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number, name: string) => [
                  value,
                  name === 'actual' ? 'Real' : 'Previsto'
                ]}
              />
              {splitIndex > 0 && (
                <ReferenceLine
                  x={data[splitIndex - 1]?.date}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="5 5"
                  label={{
                    value: 'Hoje',
                    position: 'top',
                    fill: 'hsl(var(--muted-foreground))',
                    fontSize: 12,
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="actual"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorActual)"
                connectNulls={false}
              />
              <Area
                type="monotone"
                dataKey="predicted"
                stroke="hsl(var(--warning))"
                strokeWidth={2}
                strokeDasharray="5 5"
                fillOpacity={1}
                fill="url(#colorPredicted)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-muted-foreground">Dados Reais</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning" />
            <span className="text-muted-foreground">Previsão</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
