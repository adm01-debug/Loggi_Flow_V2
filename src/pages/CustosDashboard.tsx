import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Truck,
  MapPin,
  CalendarIcon,
  BarChart3,
  PieChart,
  Package,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useLogisticsCosts } from '@/hooks/useLogisticsCosts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--xp))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', '#8884d8', '#82ca9d', '#ffc658'];

export default function CustosDashboard() {
  const [startDate, setStartDate] = useState<Date>(startOfMonth(subMonths(new Date(), 5)));
  const [endDate, setEndDate] = useState<Date>(endOfMonth(new Date()));

  const {
    costsByCarrier,
    costsByRoute,
    costsByPeriod,
    summary,
    isLoading,
  } = useLogisticsCosts(startDate, endDate);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calculate month-over-month change
  const getMonthChange = () => {
    if (costsByPeriod.length < 2) return 0;
    const lastMonth = costsByPeriod[costsByPeriod.length - 1]?.total_value || 0;
    const prevMonth = costsByPeriod[costsByPeriod.length - 2]?.total_value || 0;
    if (prevMonth === 0) return 0;
    return ((lastMonth - prevMonth) / prevMonth) * 100;
  };

  const monthChange = getMonthChange();

  // Prepare pie chart data
  const pieData = costsByCarrier.slice(0, 5).map((c) => ({
    name: c.transportadora_nome,
    value: c.total_value,
  }));

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Dashboard de Custos
            </h1>
            <p className="text-muted-foreground">
              Análise de gastos logísticos por transportadora, rota e período
            </p>
          </div>

          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(startDate, 'dd/MM/yyyy')} - {format(endDate, 'dd/MM/yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="flex">
                  <div className="border-r p-2">
                    <p className="mb-2 text-sm font-medium text-center">Data Inicial</p>
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => date && setStartDate(date)}
                      locale={ptBR}
                    />
                  </div>
                  <div className="p-2">
                    <p className="mb-2 text-sm font-medium text-center">Data Final</p>
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                      locale={ptBR}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Gasto</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(summary.total_spent)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1 text-sm">
                {monthChange >= 0 ? (
                  <>
                    <ArrowUpRight className="h-4 w-4 text-destructive" />
                    <span className="text-destructive">+{monthChange.toFixed(1)}%</span>
                  </>
                ) : (
                  <>
                    <ArrowDownRight className="h-4 w-4 text-success" />
                    <span className="text-success">{monthChange.toFixed(1)}%</span>
                  </>
                )}
                <span className="text-muted-foreground">vs mês anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Entregas</p>
                  <p className="text-2xl font-bold text-foreground">
                    {summary.total_deliveries}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-xp/20 flex items-center justify-center">
                  <Package className="h-6 w-6 text-xp" />
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                No período selecionado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Custo Médio</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(summary.avg_per_delivery)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Por entrega
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Maior Gasto</p>
                  <p className="text-lg font-bold text-foreground truncate">
                    {summary.most_expensive_carrier}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-warning/20 flex items-center justify-center">
                  <Truck className="h-6 w-6 text-warning" />
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Transportadora
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Cost Evolution Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Evolução de Custos
              </CardTitle>
              <CardDescription>
                Gastos mensais com frete no período
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : costsByPeriod.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={costsByPeriod}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Valor']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="total_value" 
                      name="Custo Total"
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Bar 
                      dataKey="total_deliveries" 
                      name="Entregas"
                      fill="hsl(var(--xp))" 
                      opacity={0.3}
                      yAxisId="right"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Nenhum dado disponível para o período
                </div>
              )}
            </CardContent>
          </Card>

          {/* Costs by Carrier Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                Custos por Transportadora
              </CardTitle>
              <CardDescription>
                Distribuição de gastos entre transportadoras
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>

          {/* Costs by Route Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Custos por Rota
              </CardTitle>
              <CardDescription>
                Gastos por estado de destino
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : costsByRoute.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={costsByRoute.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      type="number"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    />
                    <YAxis 
                      type="category"
                      dataKey="estado_destino" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      width={40}
                    />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="total_value" 
                      name="Total"
                      fill="hsl(var(--xp))" 
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tables */}
        <Tabs defaultValue="carriers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="carriers" className="gap-2">
              <Truck className="h-4 w-4" />
              Por Transportadora
            </TabsTrigger>
            <TabsTrigger value="routes" className="gap-2">
              <MapPin className="h-4 w-4" />
              Por Rota
            </TabsTrigger>
          </TabsList>

          <TabsContent value="carriers">
            <Card>
              <CardHeader>
                <CardTitle>Detalhamento por Transportadora</CardTitle>
                <CardDescription>
                  Análise completa de custos por transportadora
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : costsByCarrier.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transportadora</TableHead>
                        <TableHead className="text-right">Total Gasto</TableHead>
                        <TableHead className="text-right">Entregas</TableHead>
                        <TableHead className="text-right">Custo Médio</TableHead>
                        <TableHead className="text-right">% do Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {costsByCarrier.map((carrier, index) => (
                        <TableRow key={carrier.transportadora_id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              {carrier.transportadora_nome}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(carrier.total_value)}
                          </TableCell>
                          <TableCell className="text-right">
                            {carrier.total_deliveries}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(carrier.avg_value)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">
                              {((carrier.total_value / summary.total_spent) * 100).toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum dado disponível
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="routes">
            <Card>
              <CardHeader>
                <CardTitle>Detalhamento por Rota</CardTitle>
                <CardDescription>
                  Análise completa de custos por estado de destino
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  </div>
                ) : costsByRoute.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Total Gasto</TableHead>
                        <TableHead className="text-right">Entregas</TableHead>
                        <TableHead className="text-right">Custo Médio</TableHead>
                        <TableHead className="text-right">% do Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {costsByRoute.map((route) => (
                        <TableRow key={route.estado_destino}>
                          <TableCell className="font-medium">
                            <Badge variant="outline">
                              <MapPin className="mr-1 h-3 w-3" />
                              {route.estado_destino}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(route.total_value)}
                          </TableCell>
                          <TableCell className="text-right">
                            {route.total_deliveries}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(route.avg_value)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">
                              {((route.total_value / summary.total_spent) * 100).toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum dado disponível
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
