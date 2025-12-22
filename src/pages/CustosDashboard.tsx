import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, TrendingDown, Truck, Package, Loader2, RefreshCw, PieChart } from "lucide-react";
import { useLogisticsCosts } from "@/hooks/useLogisticsCosts";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { useRealtime } from "@/hooks/useRealtime";
import { cn } from "@/lib/utils";
import { subDays } from "date-fns";
import { DateRange } from "react-day-picker";

export default function CustosDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>({ from: subDays(new Date(), 30), to: new Date() });
  
  const startDate = dateRange?.from || subDays(new Date(), 30);
  const endDate = dateRange?.to || new Date();
  
  const { costsByCarrier, costsByRoute, summary, isLoading, entregas } = useLogisticsCosts(startDate, endDate);

  // Refetch function - using query invalidation would be better but for now we can trigger a re-render
  const handleRefetch = () => {
    // Force re-render by updating date range slightly
    setDateRange({ from: startDate, to: endDate });
  };

  useRealtime({ table: "entregas", onUpdate: handleRefetch });

  const stats = {
    totalCost: summary?.total_spent || 0,
    avgCostPerDelivery: summary?.avg_per_delivery || 0,
    totalDeliveries: summary?.total_deliveries || 0,
  };

  // Calculate trend (simplified - would need previous period data for real comparison)
  const trend = 0; // Placeholder

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range) {
      setDateRange(range);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-display flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-400/20 to-green-600/10">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
              Dashboard de Custos
            </h1>
            <p className="text-muted-foreground mt-1">Análise de custos logísticos</p>
          </div>
          <div className="flex gap-2">
            <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
            <Button variant="outline" onClick={handleRefetch}>
              <RefreshCw className="w-4 h-4 mr-2" />Atualizar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="stat-card text-center">
            <DollarSign className="w-5 h-5 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">R$ {stats.totalCost.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Custo Total</p>
          </div>
          <div className="stat-card text-center">
            <Package className="w-5 h-5 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">R$ {stats.avgCostPerDelivery.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Custo Médio/Entrega</p>
          </div>
          <div className="stat-card text-center">
            <Truck className="w-5 h-5 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.totalDeliveries}</p>
            <p className="text-xs text-muted-foreground">Total Entregas</p>
          </div>
          <div className="stat-card text-center">
            {trend >= 0 ? <TrendingUp className="w-5 h-5 text-red-500 mx-auto mb-2" /> : <TrendingDown className="w-5 h-5 text-green-500 mx-auto mb-2" />}
            <p className={cn("text-2xl font-bold", trend >= 0 ? "text-red-600" : "text-green-600")}>
              {trend >= 0 ? "+" : ""}{trend.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">vs. Período Anterior</p>
          </div>
        </div>

        <Tabs defaultValue="carriers">
          <TabsList>
            <TabsTrigger value="carriers"><Truck className="w-4 h-4 mr-2" />Por Transportadora</TabsTrigger>
            <TabsTrigger value="regions"><PieChart className="w-4 h-4 mr-2" />Por Região</TabsTrigger>
          </TabsList>
          
          <TabsContent value="carriers" className="space-y-3">
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            ) : (
              (costsByCarrier || []).map((c, i) => (
                <div key={i} className="card-interactive flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Truck className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-semibold">{c.transportadora_nome}</p>
                      <p className="text-sm text-muted-foreground">{c.total_deliveries} entregas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">R$ {c.total_value?.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">R$ {c.avg_value?.toFixed(2)}/ent</p>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="regions" className="space-y-3">
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            ) : (
              (costsByRoute || []).map((r, i) => (
                <div key={i} className="card-interactive flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{r.estado_destino}</p>
                    <p className="text-sm text-muted-foreground">{r.total_deliveries} entregas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">R$ {r.total_value?.toLocaleString()}</p>
                    <Badge variant="outline">
                      {((r.total_value / (stats.totalCost || 1)) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}