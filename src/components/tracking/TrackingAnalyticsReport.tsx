import { useState } from "react";
import { useTrackingAnalytics } from "@/hooks/useTrackingAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Clock, 
  Gauge, 
  MapPin, 
  Route, 
  CalendarIcon,
  TrendingUp,
  Truck,
  Timer
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const TrackingAnalyticsReport = () => {
  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState<Date>(new Date());

  const { data: analytics, isLoading } = useTrackingAnalytics(dateFrom, dateTo);

  const chartConfig = {
    time: { label: "Tempo (min)", color: "hsl(var(--primary))" },
    distance: { label: "Distância (km)", color: "hsl(var(--chart-2))" },
    stops: { label: "Paradas", color: "hsl(var(--chart-3))" },
  };

  const speedDistribution = analytics?.deliveries.reduce((acc, d) => {
    const speedRange = d.averageSpeedKmh < 20 ? "0-20" : 
                       d.averageSpeedKmh < 40 ? "20-40" : 
                       d.averageSpeedKmh < 60 ? "40-60" : "60+";
    acc[speedRange] = (acc[speedRange] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const pieData = Object.entries(speedDistribution).map(([name, value]) => ({ name: `${name} km/h`, value }));
  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  const barData = analytics?.deliveries.slice(0, 10).map(d => ({
    name: d.orderId.slice(-6),
    time: d.totalDeliveryTimeMinutes,
    distance: d.totalDistanceKm,
  })) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Período de Análise
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">De:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateFrom, "dd/MM/yyyy", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={(d) => d && setDateFrom(d)} locale={ptBR} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Até:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(dateTo, "dd/MM/yyyy", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={(d) => d && setDateTo(d)} locale={ptBR} />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Entregas</p>
                <p className="text-2xl font-bold">{analytics?.totalDeliveries || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-chart-2/10">
                <Clock className="h-6 w-6 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tempo Médio</p>
                <p className="text-2xl font-bold">{analytics?.avgDeliveryTimeMinutes || 0} min</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-chart-3/10">
                <Gauge className="h-6 w-6 text-chart-3" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Velocidade Média</p>
                <p className="text-2xl font-bold">{analytics?.avgSpeedKmh || 0} km/h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-chart-4/10">
                <MapPin className="h-6 w-6 text-chart-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Paradas Médias</p>
                <p className="text-2xl font-bold">{analytics?.avgStopsPerDelivery || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tempo e Distância por Entrega
            </CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="time" name="Tempo (min)" fill="hsl(var(--primary))" radius={4} />
                    <Bar dataKey="distance" name="Distância (km)" fill="hsl(var(--chart-2))" radius={4} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Distribuição de Velocidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Route className="h-5 w-5" />
            Detalhamento por Entrega
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics?.deliveries && analytics.deliveries.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Motorista</TableHead>
                    <TableHead className="text-center">Tempo Total</TableHead>
                    <TableHead className="text-center">Distância</TableHead>
                    <TableHead className="text-center">Vel. Média</TableHead>
                    <TableHead className="text-center">Paradas</TableHead>
                    <TableHead className="text-center">Maior Parada</TableHead>
                    <TableHead className="text-center">Pontos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.deliveries.map((delivery) => (
                    <TableRow key={delivery.orderId}>
                      <TableCell className="font-mono text-sm">
                        {delivery.orderId.slice(-8)}
                      </TableCell>
                      <TableCell>{delivery.driverName}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="gap-1">
                          <Timer className="h-3 w-3" />
                          {delivery.totalDeliveryTimeMinutes} min
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {delivery.totalDistanceKm} km
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={delivery.averageSpeedKmh > 40 ? "default" : "secondary"}
                          className="gap-1"
                        >
                          <Gauge className="h-3 w-3" />
                          {delivery.averageSpeedKmh} km/h
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {delivery.numberOfStops}
                      </TableCell>
                      <TableCell className="text-center">
                        {delivery.longestStopMinutes > 0 ? `${delivery.longestStopMinutes} min` : '-'}
                      </TableCell>
                      <TableCell className="text-center text-muted-foreground">
                        {delivery.pointsRecorded}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Route className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum dado de rastreamento encontrado no período selecionado</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TrackingAnalyticsReport;
