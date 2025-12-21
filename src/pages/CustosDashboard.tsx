import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, TrendingDown, Truck, Package, Calendar, Loader2, RefreshCw, PieChart, BarChart3 } from "lucide-react";
import { useLogisticsCosts } from "@/hooks/useLogisticsCosts";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { useRealtime } from "@/hooks/useRealtime";
import { cn } from "@/lib/utils";
import { subDays } from "date-fns";

export default function CustosDashboard() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({ from: subDays(new Date(), 30), to: new Date() });
  const { costs, isLoading, refetch, costsByCarrier, costsByRegion, trends, summary } = useLogisticsCosts({ startDate: dateRange.from, endDate: dateRange.to });

  useRealtime({ table: "entregas", onUpdate: () => refetch?.() });

  const stats = summary || { totalCost: 0, avgCostPerDelivery: 0, totalDeliveries: 0, costPerKg: 0 };
  const trend = trends?.percentChange || 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><h1 className="text-display flex items-center gap-3"><div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-400/20 to-green-600/10"><DollarSign className="w-6 h-6 text-green-500" /></div>Dashboard de Custos</h1><p className="text-muted-foreground mt-1">Análise de custos logísticos</p></div>
          <div className="flex gap-2"><DateRangePicker value={dateRange} onChange={setDateRange} /><Button variant="outline" onClick={() => refetch?.()}><RefreshCw className="w-4 h-4 mr-2" />Atualizar</Button></div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="stat-card text-center"><DollarSign className="w-5 h-5 text-green-500 mx-auto mb-2" /><p className="text-2xl font-bold">R$ {(stats.totalCost || 0).toLocaleString()}</p><p className="text-xs text-muted-foreground">Custo Total</p></div>
          <div className="stat-card text-center"><Package className="w-5 h-5 text-blue-500 mx-auto mb-2" /><p className="text-2xl font-bold">R$ {(stats.avgCostPerDelivery || 0).toFixed(2)}</p><p className="text-xs text-muted-foreground">Custo Médio/Entrega</p></div>
          <div className="stat-card text-center"><Truck className="w-5 h-5 text-purple-500 mx-auto mb-2" /><p className="text-2xl font-bold">{stats.totalDeliveries || 0}</p><p className="text-xs text-muted-foreground">Total Entregas</p></div>
          <div className="stat-card text-center">{trend >= 0 ? <TrendingUp className="w-5 h-5 text-red-500 mx-auto mb-2" /> : <TrendingDown className="w-5 h-5 text-green-500 mx-auto mb-2" />}<p className={cn("text-2xl font-bold", trend >= 0 ? "text-red-600" : "text-green-600")}>{trend >= 0 ? "+" : ""}{trend.toFixed(1)}%</p><p className="text-xs text-muted-foreground">vs. Período Anterior</p></div>
        </div>
        <Tabs defaultValue="carriers"><TabsList><TabsTrigger value="carriers"><Truck className="w-4 h-4 mr-2" />Por Transportadora</TabsTrigger><TabsTrigger value="regions"><PieChart className="w-4 h-4 mr-2" />Por Região</TabsTrigger></TabsList>
          <TabsContent value="carriers" className="space-y-3">{isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (costsByCarrier || []).map((c: any, i: number) => (<div key={i} className="card-interactive flex items-center justify-between"><div className="flex items-center gap-3"><Truck className="w-5 h-5 text-muted-foreground" /><div><p className="font-semibold">{c.name}</p><p className="text-sm text-muted-foreground">{c.deliveries} entregas</p></div></div><div className="text-right"><p className="text-xl font-bold text-green-600">R$ {c.total?.toLocaleString()}</p><p className="text-sm text-muted-foreground">R$ {c.avgPerDelivery?.toFixed(2)}/ent</p></div></div>))}</TabsContent>
          <TabsContent value="regions" className="space-y-3">{isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (costsByRegion || []).map((r: any, i: number) => (<div key={i} className="card-interactive flex items-center justify-between"><div><p className="font-semibold">{r.region}</p><p className="text-sm text-muted-foreground">{r.deliveries} entregas</p></div><div className="text-right"><p className="text-xl font-bold text-green-600">R$ {r.total?.toLocaleString()}</p><Badge variant="outline">{((r.total / (stats.totalCost || 1)) * 100).toFixed(1)}%</Badge></div></div>))}</TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
