import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Package,
  Clock,
  DollarSign,
  AlertTriangle,
  Target,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useKPIBenchmark, PeriodKPIs } from '@/hooks/useKPIBenchmark';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  ComposedChart,
  Area
} from 'recharts';
import { motion } from 'framer-motion';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const TrendIndicator = ({ value, inverted = false }: { value: number; inverted?: boolean }) => {
  const isPositive = inverted ? value < 0 : value > 0;
  const isNeutral = Math.abs(value) < 0.5;

  if (isNeutral) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Minus className="h-4 w-4" />
        <span className="text-sm">0%</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
      {isPositive ? (
        <ArrowUpRight className="h-4 w-4" />
      ) : (
        <ArrowDownRight className="h-4 w-4" />
      )}
      <span className="text-sm font-medium">
        {value > 0 ? '+' : ''}{value.toFixed(1)}%
      </span>
    </div>
  );
};

export function KPIBenchmarkDashboard() {
  const { data, isLoading } = useKPIBenchmark(6);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-[300px] mt-6" />
        </CardContent>
      </Card>
    );
  }

  const periods = data?.periods || [];
  const comparison = data?.comparison;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Dashboard Comparativo de KPIs
          </CardTitle>
          <CardDescription>
            Benchmarking de indicadores-chave por período
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Comparison Cards */}
      {comparison && (
        <div className="grid gap-4 md:grid-cols-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
          >
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <Package className="h-8 w-8 text-blue-500" />
                  <TrendIndicator value={comparison.changes.entregas} />
                </div>
                <p className="mt-2 text-2xl font-bold">{comparison.current.totalEntregas}</p>
                <p className="text-xs text-muted-foreground">Entregas ({comparison.current.periodLabel})</p>
                <p className="text-xs text-muted-foreground mt-1">
                  vs {comparison.previous.totalEntregas} ({comparison.previous.periodLabel})
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <Target className="h-8 w-8 text-green-500" />
                  <TrendIndicator value={comparison.changes.sla} />
                </div>
                <p className="mt-2 text-2xl font-bold">{comparison.current.slaRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">SLA ({comparison.current.periodLabel})</p>
                <p className="text-xs text-muted-foreground mt-1">
                  vs {comparison.previous.slaRate.toFixed(1)}% ({comparison.previous.periodLabel})
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <DollarSign className="h-8 w-8 text-amber-500" />
                  <TrendIndicator value={comparison.changes.custo} inverted />
                </div>
                <p className="mt-2 text-2xl font-bold">{formatCurrency(comparison.current.custoMedio)}</p>
                <p className="text-xs text-muted-foreground">Custo Médio ({comparison.current.periodLabel})</p>
                <p className="text-xs text-muted-foreground mt-1">
                  vs {formatCurrency(comparison.previous.custoMedio)} ({comparison.previous.periodLabel})
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                  <TrendIndicator value={comparison.changes.ocorrencias} inverted />
                </div>
                <p className="mt-2 text-2xl font-bold">{comparison.current.ocorrencias}</p>
                <p className="text-xs text-muted-foreground">Ocorrências ({comparison.current.periodLabel})</p>
                <p className="text-xs text-muted-foreground mt-1">
                  vs {comparison.previous.ocorrencias} ({comparison.previous.periodLabel})
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <Clock className="h-8 w-8 text-purple-500" />
                  <TrendIndicator value={comparison.changes.tempoEntrega} inverted />
                </div>
                <p className="mt-2 text-2xl font-bold">{comparison.current.tempoMedioEntrega.toFixed(1)} dias</p>
                <p className="text-xs text-muted-foreground">Tempo Médio ({comparison.current.periodLabel})</p>
                <p className="text-xs text-muted-foreground mt-1">
                  vs {comparison.previous.tempoMedioEntrega.toFixed(1)} dias ({comparison.previous.periodLabel})
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Charts */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução dos Indicadores</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="volume" className="space-y-4">
            <TabsList>
              <TabsTrigger value="volume">Volume</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="custos">Custos</TabsTrigger>
              <TabsTrigger value="qualidade">Qualidade</TabsTrigger>
            </TabsList>

            <TabsContent value="volume">
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={periods}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="periodLabel" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="totalEntregas" name="Entregas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="totalColetas" name="Coletas" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="slaRate" name="SLA %" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="performance">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={periods}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="periodLabel" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="slaRate" name="SLA %" stroke="#22c55e" strokeWidth={3} dot={{ fill: '#22c55e', r: 6 }} />
                  <Line type="monotone" dataKey="ocorrenciaRate" name="Ocorrências %" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="custos">
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={periods}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="periodLabel" />
                  <YAxis yAxisId="left" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `R$${v.toFixed(0)}`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                    formatter={(value: number, name: string) => [
                      name.includes('Médio') ? formatCurrency(value) : formatCurrency(value),
                      name
                    ]}
                  />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="custoTotal" name="Custo Total" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" />
                  <Line yAxisId="right" type="monotone" dataKey="custoMedio" name="Custo Médio" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="qualidade">
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={periods}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="periodLabel" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="ocorrencias" name="Ocorrências" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="tempoMedioEntrega" name="Tempo Médio (dias)" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 5 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Period Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Período</th>
                  <th className="text-right py-3 px-2">Entregas</th>
                  <th className="text-right py-3 px-2">SLA %</th>
                  <th className="text-right py-3 px-2">Custo Total</th>
                  <th className="text-right py-3 px-2">Custo Médio</th>
                  <th className="text-right py-3 px-2">Ocorrências</th>
                  <th className="text-right py-3 px-2">Tempo Médio</th>
                </tr>
              </thead>
              <tbody>
                {periods.map((p, i) => (
                  <tr key={p.period} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2 font-medium">{p.periodLabel}</td>
                    <td className="text-right py-3 px-2">{p.totalEntregas}</td>
                    <td className="text-right py-3 px-2">
                      <Badge variant={p.slaRate >= 90 ? 'default' : p.slaRate >= 70 ? 'secondary' : 'destructive'}>
                        {p.slaRate.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="text-right py-3 px-2">{formatCurrency(p.custoTotal)}</td>
                    <td className="text-right py-3 px-2">{formatCurrency(p.custoMedio)}</td>
                    <td className="text-right py-3 px-2">{p.ocorrencias}</td>
                    <td className="text-right py-3 px-2">{p.tempoMedioEntrega.toFixed(1)} dias</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
