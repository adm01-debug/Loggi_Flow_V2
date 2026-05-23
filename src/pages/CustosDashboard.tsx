import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Truck, Package, Loader2, RefreshCw, PieChart, BarChart3, Calendar } from "lucide-react";
import { useLogisticsCosts } from "@/hooks/logistics/useLogisticsCosts";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { useRealtime } from "@/hooks/data/useRealtime";
import { cn } from "@/lib/utils";
import { subDays, format, eachMonthOfInterval, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, Legend, LineChart, Line, Area, AreaChart,
} from "recharts";

const COLORS = [
  "hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--muted-foreground))",
  "hsl(var(--secondary))", "hsl(var(--destructive))", "hsl(var(--chart-1, 220 70% 50%))",
  "hsl(var(--chart-2, 160 60% 45%))", "hsl(var(--chart-3, 30 80% 55%))",
];

export default function CustosDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>({ from: subDays(new Date(), 90), to: new Date() });
  const startDate = dateRange?.from || subDays(new Date(), 90);
  const endDate = dateRange?.to || new Date();
  const { costsByCarrier, costsByRoute, summary, isLoading, entregas } = useLogisticsCosts(startDate, endDate);

  const handleRefetch = () => setDateRange({ from: startDate, to: endDate });
  useRealtime({ table: "entregas", onUpdate: handleRefetch });

  const stats = {
    totalCost: summary?.total_spent || 0,
    avgCostPerDelivery: summary?.avg_per_delivery || 0,
    totalDeliveries: summary?.total_deliveries || 0,
  };

  // Monthly evolution data
  const monthlyData = useMemo(() => {
    if (!entregas?.length) return [];
    const months = eachMonthOfInterval({ start: startDate, end: endDate });
    return months.map((month) => {
      const monthEntregas = (entregas || []).filter((e) => isSameMonth(new Date(e.created_at), month));
      const total = monthEntregas.reduce((sum, e) => sum + (e.valor_frete || 0), 0);
      const count = monthEntregas.length;
      return {
        name: format(month, "MMM/yy", { locale: ptBR }),
        custo: Math.round(total),
        entregas: count,
        medio: count > 0 ? Math.round(total / count) : 0,
      };
    });
  }, [entregas, startDate, endDate]);

  // Carrier pie data
  const carrierPieData = useMemo(() => {
    return (costsByCarrier || []).map((c) => ({
      name: c.transportadora_nome || "Sem transportadora",
      value: Math.round(c.total_value || 0),
    }));
  }, [costsByCarrier]);

  // Region bar data
  const regionBarData = useMemo(() => {
    return (costsByRoute || []).slice(0, 10).map((r) => ({
      name: r.estado_destino || "N/A",
      custo: Math.round(r.total_value || 0),
      entregas: r.total_deliveries || 0,
    }));
  }, [costsByRoute]);

  // Month-over-month variation
  const variation = useMemo(() => {
    if (monthlyData.length < 2) return 0;
    const last = monthlyData[monthlyData.length - 1]?.custo || 0;
    const prev = monthlyData[monthlyData.length - 2]?.custo || 1;
    return ((last - prev) / prev) * 100;
  }, [monthlyData]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-display flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              Dashboard de Custos
            </h1>
            <p className="text-muted-foreground mt-1">Análise completa de custos logísticos por período</p>
          </div>
          <div className="flex gap-2">
            <DateRangePicker value={dateRange} onChange={(r) => r && setDateRange(r)} />
            <Button variant="outline" onClick={handleRefetch}>
              <RefreshCw className="w-4 h-4 mr-2" />Atualizar
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6 text-center">
            <DollarSign className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">R$ {stats.totalCost.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Custo Total</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <Package className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">R$ {stats.avgCostPerDelivery.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Custo Médio/Entrega</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <Truck className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.totalDeliveries}</p>
            <p className="text-xs text-muted-foreground">Total Entregas</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            {variation >= 0 ? <TrendingUp className="w-5 h-5 text-destructive mx-auto mb-2" /> : <TrendingDown className="w-5 h-5 text-primary mx-auto mb-2" />}
            <p className={cn("text-2xl font-bold", variation >= 0 ? "text-destructive" : "text-primary")}>
              {variation >= 0 ? "+" : ""}{variation.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">vs. Mês Anterior</p>
          </CardContent></Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Evolution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="w-4 h-4" />Evolução Mensal de Custos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString()}`, "Custo"]} />
                    <Area type="monotone" dataKey="custo" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Carrier Pie */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PieChart className="w-4 h-4" />Distribuição por Transportadora
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie data={carrierPieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                      {carrierPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString()}`, "Custo"]} />
                  </RechartsPie>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Region Bar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="w-4 h-4" />Custos por Região/Estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={regionBarData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString()}`, "Custo"]} />
                    <Bar dataKey="custo" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Cost per delivery trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-4 h-4" />Custo Médio por Entrega (Mensal)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" fontSize={12} />
                    <YAxis fontSize={12} tickFormatter={(v) => `R$${v}`} />
                    <Tooltip formatter={(v: number) => [`R$ ${v.toLocaleString()}`, "Médio"]} />
                    <Line type="monotone" dataKey="medio" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ fill: "hsl(var(--accent))" }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tables */}
        <Tabs defaultValue="carriers">
          <TabsList>
            <TabsTrigger value="carriers"><Truck className="w-4 h-4 mr-2" />Por Transportadora</TabsTrigger>
            <TabsTrigger value="regions"><PieChart className="w-4 h-4 mr-2" />Por Região</TabsTrigger>
          </TabsList>
          <TabsContent value="carriers" className="space-y-3">
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
              (costsByCarrier || []).map((c, i) => (
                <Card key={i}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <div>
                        <p className="font-semibold">{c.transportadora_nome}</p>
                        <p className="text-sm text-muted-foreground">{c.total_deliveries} entregas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">R$ {c.total_value?.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">R$ {c.avg_value?.toFixed(2)}/ent</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          <TabsContent value="regions" className="space-y-3">
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
              (costsByRoute || []).map((r, i) => (
                <Card key={i}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <p className="font-semibold">{r.estado_destino}</p>
                      <p className="text-sm text-muted-foreground">{r.total_deliveries} entregas</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary">R$ {r.total_value?.toLocaleString()}</p>
                      <Badge variant="outline">
                        {((r.total_value / (stats.totalCost || 1)) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
