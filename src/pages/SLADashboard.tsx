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

export default function SLADashboard() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({ from: subDays(new Date(), 30), to: new Date() });
  const { metrics, isLoading, refetch, slaByCarrier, slaByRegion, trends } = useSLAMetrics({ startDate: dateRange.from, endDate: dateRange.to });

  useRealtime({ table: "entregas", onInsert: () => refetch?.(), onUpdate: () => refetch?.() });

  const stats = metrics || { onTime: 0, late: 0, total: 0, avgDeliveryTime: 0, slaRate: 0 };
  const slaRate = stats.total > 0 ? Math.round((stats.onTime / stats.total) * 100) : 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><h1 className="text-display flex items-center gap-3"><div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/10"><Target className="w-6 h-6 text-emerald-500" /></div>Dashboard SLA</h1><p className="text-muted-foreground mt-1">Monitoramento de Service Level Agreement</p></div>
          <div className="flex gap-2"><DateRangePicker value={dateRange} onChange={setDateRange} /><Button variant="outline" onClick={() => refetch?.()}><RefreshCw className="w-4 h-4 mr-2" />Atualizar</Button></div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="stat-card text-center"><CheckCircle2 className="w-5 h-5 text-green-500 mx-auto mb-2" /><p className="text-2xl font-bold text-green-600">{stats.onTime}</p><p className="text-xs text-muted-foreground">No Prazo</p></div>
          <div className="stat-card text-center"><AlertTriangle className="w-5 h-5 text-red-500 mx-auto mb-2" /><p className="text-2xl font-bold text-red-600">{stats.late}</p><p className="text-xs text-muted-foreground">Atrasados</p></div>
          <div className="stat-card text-center"><Clock className="w-5 h-5 text-blue-500 mx-auto mb-2" /><p className="text-2xl font-bold">{stats.avgDeliveryTime?.toFixed(1) || 0}h</p><p className="text-xs text-muted-foreground">Tempo Médio</p></div>
          <div className="stat-card text-center"><Target className="w-5 h-5 text-emerald-500 mx-auto mb-2" /><p className="text-2xl font-bold">{slaRate}%</p><p className="text-xs text-muted-foreground">Taxa SLA</p></div>
        </div>
        <div className="card-base p-6"><div className="flex items-center justify-between mb-4"><h3 className="font-semibold">Taxa de Cumprimento SLA</h3><Badge variant={slaRate >= 95 ? "default" : slaRate >= 80 ? "secondary" : "destructive"}>{slaRate >= 95 ? "Excelente" : slaRate >= 80 ? "Bom" : "Crítico"}</Badge></div><Progress value={slaRate} className={cn("h-4", slaRate >= 95 ? "[&>div]:bg-green-500" : slaRate >= 80 ? "[&>div]:bg-yellow-500" : "[&>div]:bg-red-500")} /><div className="flex justify-between mt-2 text-sm text-muted-foreground"><span>Meta: 95%</span><span>Atual: {slaRate}%</span></div></div>
        <Tabs defaultValue="carriers"><TabsList><TabsTrigger value="carriers">Por Transportadora</TabsTrigger><TabsTrigger value="regions">Por Região</TabsTrigger></TabsList>
          <TabsContent value="carriers" className="space-y-3">{isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (slaByCarrier || []).map((c: any, i: number) => (<div key={i} className="card-interactive flex items-center justify-between"><div><p className="font-semibold">{c.name}</p><p className="text-sm text-muted-foreground">{c.total} entregas</p></div><div className="text-right"><p className={cn("text-xl font-bold", c.rate >= 95 ? "text-green-600" : c.rate >= 80 ? "text-yellow-600" : "text-red-600")}>{c.rate}%</p><Progress value={c.rate} className="w-24 h-2" /></div></div>))}</TabsContent>
          <TabsContent value="regions" className="space-y-3">{isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (slaByRegion || []).map((r: any, i: number) => (<div key={i} className="card-interactive flex items-center justify-between"><div><p className="font-semibold">{r.region}</p><p className="text-sm text-muted-foreground">{r.total} entregas</p></div><div className="text-right"><p className={cn("text-xl font-bold", r.rate >= 95 ? "text-green-600" : r.rate >= 80 ? "text-yellow-600" : "text-red-600")}>{r.rate}%</p></div></div>))}</TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
