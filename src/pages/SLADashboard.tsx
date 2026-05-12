import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, TrendingUp, AlertTriangle, CheckCircle2, Target, Calendar, Loader2, RefreshCw } from "lucide-react";
import { useSLAMetrics } from "@/hooks/useSLAMetrics";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { useRealtime } from "@/hooks/useRealtime";
import { cn } from "@/lib/utils";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";

interface PerformanceTransportadora {
  nome: string;
  totalEntregas: number;
  taxaOTIF: number;
}

interface TendenciaSemanal {
  data: string;
  total: number;
  taxaOTIF: number;
}

export default function SLADashboard() {
  const [dateRange, setDateRange] = useState<DateRange>({ from: subDays(new Date(), 30), to: new Date() });
  const { data: metrics, isLoading, refetch } = useSLAMetrics();

  useRealtime({ table: "entregas", onInsert: () => refetch(), onUpdate: () => refetch() });

  const stats = metrics || { 
    totalEntregas: 0, 
    entregasNoPrazo: 0, 
    entregasAtrasadas: 0, 
    tempoMedioEntrega: 0,
    taxaOTIF: 0,
    performancePorTransportadora: []
  };
  const slaRate = stats.taxaOTIF ? Math.round(stats.taxaOTIF) : 0;

  const handleDateChange = (range: DateRange | undefined) => {
    if (range) setDateRange(range);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><h1 className="text-display flex items-center gap-3"><div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-success/20 to-success/5"><Target className="w-6 h-6 text-success" /></div>Dashboard SLA</h1><p className="text-muted-foreground mt-1">Monitoramento de Service Level Agreement</p></div>
          <div className="flex gap-2"><DateRangePicker value={dateRange} onChange={handleDateChange} /><Button variant="outline" onClick={() => refetch()}><RefreshCw className="w-4 h-4 mr-2" />Atualizar</Button></div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="stat-card text-center"><CheckCircle2 className="w-5 h-5 text-success mx-auto mb-2" /><p className="text-2xl font-bold text-success">{stats.entregasNoPrazo}</p><p className="text-xs text-muted-foreground">No Prazo</p></div>
          <div className="stat-card text-center"><AlertTriangle className="w-5 h-5 text-destructive mx-auto mb-2" /><p className="text-2xl font-bold text-destructive">{stats.entregasAtrasadas}</p><p className="text-xs text-muted-foreground">Atrasados</p></div>
          <div className="stat-card text-center"><Clock className="w-5 h-5 text-info mx-auto mb-2" /><p className="text-2xl font-bold">{stats.tempoMedioEntrega ? stats.tempoMedioEntrega.toFixed(1) : 0}h</p><p className="text-xs text-muted-foreground">Tempo Médio</p></div>
          <div className="stat-card text-center"><Target className="w-5 h-5 text-primary mx-auto mb-2" /><p className="text-2xl font-bold">{slaRate}%</p><p className="text-xs text-muted-foreground">Taxa SLA</p></div>
        </div>
        <div className="card-base p-6"><div className="flex items-center justify-between mb-4"><h3 className="font-semibold">Taxa de Cumprimento SLA</h3><Badge variant={slaRate >= 95 ? "default" : slaRate >= 80 ? "secondary" : "destructive"}>{slaRate >= 95 ? "Excelente" : slaRate >= 80 ? "Bom" : "Crítico"}</Badge></div><Progress value={slaRate} className={cn("h-4", slaRate >= 95 ? "[&>div]:bg-success" : slaRate >= 80 ? "[&>div]:bg-warning" : "[&>div]:bg-destructive")} /><div className="flex justify-between mt-2 text-sm text-muted-foreground"><span>Meta: 95%</span><span>Atual: {slaRate}%</span></div></div>
        <Tabs defaultValue="carriers"><TabsList><TabsTrigger value="carriers">Por Transportadora</TabsTrigger><TabsTrigger value="trends">Tendências</TabsTrigger></TabsList>
          <TabsContent value="carriers" className="space-y-3">
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (stats.performancePorTransportadora || []).map((c: PerformanceTransportadora, i: number) => (
              <div key={i} className="card-interactive flex items-center justify-between">
                <div><p className="font-semibold">{c.nome}</p><p className="text-sm text-muted-foreground">{c.totalEntregas} entregas</p></div>
                <div className="text-right"><p className={cn("text-xl font-bold", c.taxaOTIF >= 95 ? "text-success" : c.taxaOTIF >= 80 ? "text-warning" : "text-destructive")}>{c.taxaOTIF.toFixed(0)}%</p><Progress value={c.taxaOTIF} className="w-24 h-2" /></div>
              </div>
            ))}
          </TabsContent>
          <TabsContent value="trends" className="space-y-3">
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (metrics?.tendenciaSemanal || []).map((t: TendenciaSemanal, i: number) => (
              <div key={i} className="card-interactive flex items-center justify-between">
                <div><p className="font-semibold">{t.data}</p><p className="text-sm text-muted-foreground">{t.total} entregas</p></div>
                <div className="text-right"><p className={cn("text-xl font-bold", t.taxaOTIF >= 95 ? "text-success" : t.taxaOTIF >= 80 ? "text-warning" : "text-destructive")}>{t.taxaOTIF.toFixed(0)}%</p></div>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}