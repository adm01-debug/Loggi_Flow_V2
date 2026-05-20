import { useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatsCard } from '@/components/common/StatsCard';
import { EmptyState } from '@/components/common/EmptyState';
import {
  Target, Truck, Clock, DollarSign, TrendingUp, Award,
  CheckCircle2, AlertTriangle, BarChart3, Timer
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks';
import { motion } from 'framer-motion';
import { differenceInDays, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadialBarChart, RadialBar, Legend } from 'recharts';
import { Progress } from '@/components/ui/progress';

interface TransportadoraOTIF {
  id: string;
  nome_fantasia: string;
  score_performance: number | null;
  total_entregas: number;
  entregas_no_prazo: number;
  entregas_atrasadas: number;
  otif_rate: number;
  custo_total: number;
  peso_total_kg: number;
  custo_por_kg: number;
  tempo_medio_dias: number;
}

export default function PainelOTIF() {
  const { user } = useAuth();

  const { data: entregas, isLoading } = useQuery({
    queryKey: ['otif-entregas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entregas')
        .select(`
          id, status, previsao_entrega, data_entrega_efetiva, data_despacho,
          valor_frete, transportadora_id,
          transportadora:transportadoras (id, nome_fantasia, score_performance)
        `)
        .in('status', ['entregue', 'despachado', 'em_transito', 'saiu_entrega']);

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const transportadoraStats = useMemo(() => {
    if (!entregas) return [];

    const map: Record<string, TransportadoraOTIF> = {};

    entregas.forEach((e) => {
      const t = e.transportadora as { id: string; nome_fantasia: string; score_performance: number | null } | null;
      if (!t) return;

      if (!map[t.id]) {
        map[t.id] = {
          id: t.id,
          nome_fantasia: t.nome_fantasia || 'N/A',
          score_performance: t.score_performance,
          total_entregas: 0,
          entregas_no_prazo: 0,
          entregas_atrasadas: 0,
          otif_rate: 0,
          custo_total: 0,
          peso_total_kg: 0,
          custo_por_kg: 0,
          tempo_medio_dias: 0,
        };
      }

      const stat = map[t.id];
      stat.total_entregas++;
      stat.custo_total += e.valor_frete || 0;

      if (e.status === 'entregue' && e.data_entrega_efetiva && e.previsao_entrega) {
        const efetiva = parseISO(e.data_entrega_efetiva);
        const prevista = parseISO(e.previsao_entrega);
        if (efetiva <= prevista) {
          stat.entregas_no_prazo++;
        } else {
          stat.entregas_atrasadas++;
        }
      }

      if (e.data_despacho && e.data_entrega_efetiva) {
        const dias = differenceInDays(parseISO(e.data_entrega_efetiva), parseISO(e.data_despacho));
        stat.tempo_medio_dias += Math.max(0, dias);
      }
    });

    return Object.values(map).map(stat => {
      const entregasComPrazo = stat.entregas_no_prazo + stat.entregas_atrasadas;
      stat.otif_rate = entregasComPrazo > 0 ? (stat.entregas_no_prazo / entregasComPrazo) * 100 : 0;
      stat.custo_por_kg = stat.peso_total_kg > 0 ? stat.custo_total / stat.peso_total_kg : 0;
      const entregasEntregues = stat.entregas_no_prazo + stat.entregas_atrasadas;
      stat.tempo_medio_dias = entregasEntregues > 0 ? stat.tempo_medio_dias / entregasEntregues : 0;
      return stat;
    }).sort((a, b) => b.otif_rate - a.otif_rate);
  }, [entregas]);

  const globalOTIF = useMemo(() => {
    const total = transportadoraStats.reduce((sum, t) => sum + t.entregas_no_prazo + t.entregas_atrasadas, 0);
    const noPrazo = transportadoraStats.reduce((sum, t) => sum + t.entregas_no_prazo, 0);
    return total > 0 ? (noPrazo / total) * 100 : 0;
  }, [transportadoraStats]);

  const custoMedioGlobal = useMemo(() => {
    const total = transportadoraStats.reduce((sum, t) => sum + t.custo_total, 0);
    const entregas_total = transportadoraStats.reduce((sum, t) => sum + t.total_entregas, 0);
    return entregas_total > 0 ? total / entregas_total : 0;
  }, [transportadoraStats]);

  const chartData = transportadoraStats.slice(0, 10).map(t => ({
    name: t.nome_fantasia.length > 12 ? t.nome_fantasia.substring(0, 12) + '…' : t.nome_fantasia,
    otif: Math.round(t.otif_rate),
    entregas: t.total_entregas,
    custo_medio: t.total_entregas > 0 ? t.custo_total / t.total_entregas : 0,
  }));

  const getOTIFColor = (rate: number) => {
    if (rate >= 95) return 'text-primary';
    if (rate >= 85) return 'text-warning';
    return 'text-destructive';
  };

  const getOTIFBadge = (rate: number) => {
    if (rate >= 95) return <Badge className="bg-primary/10 text-primary border-primary/20">Excelente</Badge>;
    if (rate >= 85) return <Badge className="bg-warning/10 text-warning border-warning/20">Bom</Badge>;
    if (rate >= 70) return <Badge variant="secondary">Regular</Badge>;
    return <Badge variant="destructive">Crítico</Badge>;
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between px-2">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white flex items-center gap-4 tracking-tighter uppercase italic">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black border border-white/10 shadow-2xl transition-transform hover:scale-110">
                  <Target className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="drop-shadow-2xl">Gestão OTIF</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                    <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Operational_Elite</span>
                  </div>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">ON TIME • IN FULL • AT COST</span>
                </div>
              </div>
            </h1>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard title="OTIF Global" value={`${globalOTIF.toFixed(1)}%`} icon={Target} color={globalOTIF >= 95 ? 'success' : globalOTIF >= 85 ? 'warning' : 'destructive'} />
          <StatsCard title="Transportadoras" value={transportadoraStats.length} icon={Truck} color="primary" />
          <StatsCard title="Custo Médio/Entrega" value={`R$ ${custoMedioGlobal.toFixed(0)}`} icon={DollarSign} color="info" />
          <StatsCard title="Total Entregas" value={transportadoraStats.reduce((s, t) => s + t.total_entregas, 0)} icon={CheckCircle2} color="success" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* OTIF Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="w-5 h-5 text-primary" />
                Taxa OTIF por Transportadora
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis domain={[0, 100]} unit="%" />
                    <Tooltip formatter={(val: number) => `${val}%`} />
                    <Bar dataKey="otif" name="OTIF %" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell key={index} fill={entry.otif >= 95 ? 'hsl(142 76% 36%)' : entry.otif >= 85 ? 'hsl(45 93% 47%)' : 'hsl(0 84% 60%)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon={BarChart3} title="Sem dados" description="Nenhuma entrega encontrada" />
              )}
            </CardContent>
          </Card>

          {/* Cost per delivery chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="w-5 h-5 text-green-500" />
                Custo Médio por Entrega
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis />
                    <Tooltip formatter={(val: number) => `R$ ${val.toFixed(2)}`} />
                    <Bar dataKey="custo_medio" name="Custo Médio" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon={DollarSign} title="Sem dados" description="Nenhum dado de custo" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Ranking Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="w-5 h-5 text-amber-500" />
              Ranking Comparativo de Transportadoras
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transportadoraStats.length === 0 ? (
              <EmptyState icon={Truck} title="Sem transportadoras" description="Cadastre entregas com transportadoras" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Transportadora</TableHead>
                      <TableHead className="text-center">Entregas</TableHead>
                      <TableHead className="text-center">No Prazo</TableHead>
                      <TableHead className="text-center">Atrasadas</TableHead>
                      <TableHead className="text-center">OTIF</TableHead>
                      <TableHead className="text-center">Tempo Médio</TableHead>
                      <TableHead className="text-right">Custo Total</TableHead>
                      <TableHead className="text-center">Classificação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transportadoraStats.map((t, index) => (
                      <motion.tr
                        key={t.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b"
                      >
                        <TableCell className="font-bold text-lg">{getRankIcon(index)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{t.nome_fantasia}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{t.total_entregas}</TableCell>
                        <TableCell className="text-center text-success font-medium">{t.entregas_no_prazo}</TableCell>
                        <TableCell className="text-center text-destructive font-medium">{t.entregas_atrasadas}</TableCell>
                        <TableCell className="text-center">
                          <div className="space-y-1">
                            <span className={`font-bold ${getOTIFColor(t.otif_rate)}`}>
                              {t.otif_rate.toFixed(1)}%
                            </span>
                            <Progress value={t.otif_rate} className="h-1.5" />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Timer className="w-3 h-3 text-muted-foreground" />
                            {t.tempo_medio_dias.toFixed(1)}d
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          R$ {t.custo_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-center">{getOTIFBadge(t.otif_rate)}</TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
