import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Truck, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

interface TransportadoraStats {
  nome: string;
  entregas: number;
  sla: number;
  custoMedio: number;
  ocorrencias: number;
  prazoMedio: number;
}

interface Props {
  data: TransportadoraStats[];
}

export function TransportadoraComparisonChart({ data }: Props) {
  // Prepare radar chart data (normalized 0-100)
  const radarData = data.slice(0, 5).map(t => {
    const maxEntregas = Math.max(...data.map(d => d.entregas)) || 1;
    const maxCusto = Math.max(...data.map(d => d.custoMedio)) || 1;
    const maxPrazo = Math.max(...data.map(d => d.prazoMedio)) || 1;
    
    return {
      transportadora: t.nome.length > 10 ? t.nome.substring(0, 10) + '...' : t.nome,
      Volume: Math.round((t.entregas / maxEntregas) * 100),
      SLA: t.sla,
      Custo: Math.round(100 - (t.custoMedio / maxCusto) * 100), // Inverted: lower cost = better
      Qualidade: Math.max(0, 100 - t.ocorrencias * 10),
      Prazo: Math.round(100 - (t.prazoMedio / maxPrazo) * 100), // Inverted: lower = better
    };
  });

  // Top performer
  const topPerformer = data.length > 0 
    ? data.reduce((best, curr) => 
        (curr.sla > best.sla) ? curr : best
      , data[0])
    : null;

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-primary" />
              Comparativo de Transportadoras
            </CardTitle>
            <CardDescription>
              Análise de performance entre transportadoras
            </CardDescription>
          </div>
          {topPerformer && (
            <Badge variant="outline" className="gap-2 text-success border-success/30 bg-success/10">
              <TrendingUp className="w-3 h-3" />
              Top: {topPerformer.nome} ({topPerformer.sla}% SLA)
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Nenhum dado de transportadora disponível
          </div>
        ) : (
          <Tabs defaultValue="bar" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="bar">Volume & SLA</TabsTrigger>
              <TabsTrigger value="cost">Custo & Prazo</TabsTrigger>
              <TabsTrigger value="radar">Radar Geral</TabsTrigger>
            </TabsList>
            
            {/* Volume & SLA Chart */}
            <TabsContent value="bar" className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.slice(0, 8)} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis 
                    dataKey="nome" 
                    className="text-xs fill-muted-foreground"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis yAxisId="left" className="text-xs fill-muted-foreground" />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    domain={[0, 100]}
                    className="text-xs fill-muted-foreground"
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'sla' ? `${value}%` : value,
                      name === 'entregas' ? 'Entregas' : 'SLA'
                    ]}
                  />
                  <Legend />
                  <Bar 
                    yAxisId="left"
                    dataKey="entregas" 
                    name="Entregas" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    yAxisId="right"
                    dataKey="sla" 
                    name="SLA %" 
                    fill="hsl(var(--success))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            
            {/* Cost & Time Chart */}
            <TabsContent value="cost" className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.slice(0, 8)} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis 
                    dataKey="nome" 
                    className="text-xs fill-muted-foreground"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis yAxisId="left" className="text-xs fill-muted-foreground" tickFormatter={(v) => `R$${v}`} />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    className="text-xs fill-muted-foreground"
                    tickFormatter={(v) => `${v}d`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'custoMedio' 
                        ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                        : `${value} dias`,
                      name === 'custoMedio' ? 'Custo Médio' : 'Prazo Médio'
                    ]}
                  />
                  <Legend />
                  <Bar 
                    yAxisId="left"
                    dataKey="custoMedio" 
                    name="Custo Médio" 
                    fill="hsl(var(--warning))" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    yAxisId="right"
                    dataKey="prazoMedio" 
                    name="Prazo Médio (dias)" 
                    fill="hsl(var(--info))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            
            {/* Radar Chart */}
            <TabsContent value="radar" className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                  { metric: 'Volume', ...Object.fromEntries(radarData.map(r => [r.transportadora, r.Volume])) },
                  { metric: 'SLA', ...Object.fromEntries(radarData.map(r => [r.transportadora, r.SLA])) },
                  { metric: 'Custo', ...Object.fromEntries(radarData.map(r => [r.transportadora, r.Custo])) },
                  { metric: 'Qualidade', ...Object.fromEntries(radarData.map(r => [r.transportadora, r.Qualidade])) },
                  { metric: 'Prazo', ...Object.fromEntries(radarData.map(r => [r.transportadora, r.Prazo])) },
                ]}>
                  <PolarGrid className="stroke-border" />
                  <PolarAngleAxis dataKey="metric" className="text-xs fill-muted-foreground" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} className="text-xs fill-muted-foreground" />
                  {radarData.map((r, i) => (
                    <Radar
                      key={r.transportadora}
                      name={r.transportadora}
                      dataKey={r.transportadora}
                      stroke={`hsl(${(i * 60) % 360}, 70%, 50%)`}
                      fill={`hsl(${(i * 60) % 360}, 70%, 50%)`}
                      fillOpacity={0.2}
                    />
                  ))}
                  <Legend />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        )}
        
        {/* Quick stats */}
        {data.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{data.length}</p>
              <p className="text-xs text-muted-foreground">Transportadoras</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-success">
                {Math.round(data.reduce((sum, t) => sum + t.sla, 0) / data.length)}%
              </p>
              <p className="text-xs text-muted-foreground">SLA Médio</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-warning">
                R$ {(data.reduce((sum, t) => sum + t.custoMedio, 0) / data.length).toFixed(0)}
              </p>
              <p className="text-xs text-muted-foreground">Custo Médio</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-destructive">
                {data.reduce((sum, t) => sum + t.ocorrencias, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total Ocorrências</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
