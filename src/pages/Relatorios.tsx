import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Clock,
  Package,
  Truck,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Users,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Mock data for charts
const deliveriesPerDay = [
  { day: "Seg", entregas: 45, fretes: 52 },
  { day: "Ter", entregas: 52, fretes: 48 },
  { day: "Qua", entregas: 38, fretes: 42 },
  { day: "Qui", entregas: 65, fretes: 58 },
  { day: "Sex", entregas: 72, fretes: 68 },
  { day: "Sáb", entregas: 28, fretes: 32 },
  { day: "Dom", entregas: 12, fretes: 15 },
];

const monthlyTrend = [
  { month: "Jan", value: 420 },
  { month: "Fev", value: 380 },
  { month: "Mar", value: 510 },
  { month: "Abr", value: 455 },
  { month: "Mai", value: 520 },
  { month: "Jun", value: 610 },
  { month: "Jul", value: 580 },
  { month: "Ago", value: 650 },
  { month: "Set", value: 720 },
  { month: "Out", value: 680 },
  { month: "Nov", value: 750 },
  { month: "Dez", value: 820 },
];

const averageTimeData = [
  { day: "Seg", tempo: 2.5 },
  { day: "Ter", tempo: 2.8 },
  { day: "Qua", tempo: 2.2 },
  { day: "Qui", tempo: 3.1 },
  { day: "Sex", tempo: 2.9 },
  { day: "Sáb", tempo: 2.0 },
  { day: "Dom", tempo: 1.8 },
];

const freightTypeData = [
  { name: "Internos", value: 45, color: "hsl(199, 89%, 48%)" },
  { name: "Fornecedores", value: 30, color: "hsl(142, 71%, 45%)" },
  { name: "Clientes", value: 25, color: "hsl(252, 87%, 64%)" },
];

const driverPerformance = [
  { name: "Carlos M.", entregas: 128, xp: 3200, eficiencia: 98 },
  { name: "Ana S.", entregas: 115, xp: 2890, eficiencia: 96 },
  { name: "Pedro O.", entregas: 102, xp: 2650, eficiencia: 94 },
  { name: "Maria S.", entregas: 98, xp: 2420, eficiencia: 92 },
  { name: "João C.", entregas: 87, xp: 2100, eficiencia: 90 },
];

const statusDistribution = [
  { status: "Entregue", count: 156, color: "hsl(142, 71%, 45%)" },
  { status: "Em Trânsito", count: 42, color: "hsl(199, 89%, 48%)" },
  { status: "Pendente", count: 28, color: "hsl(38, 92%, 50%)" },
  { status: "Atrasado", count: 8, color: "hsl(0, 84%, 60%)" },
];

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

function MetricCard({ title, value, change, icon: Icon, iconColor, iconBg }: MetricCardProps) {
  const isPositive = change >= 0;

  return (
    <div className="card-elevated hover-lift-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-display font-bold">{value}</p>
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium",
            isPositive ? "text-success" : "text-destructive"
          )}>
            {isPositive ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span>{Math.abs(change)}% vs mês anterior</span>
          </div>
        </div>
        <div className={cn("flex items-center justify-center w-12 h-12 rounded-xl", iconBg)}>
          <Icon className={cn("w-6 h-6", iconColor)} />
        </div>
      </div>
    </div>
  );
}

export default function Relatorios() {
  const [period, setPeriod] = useState("week");

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-display text-foreground flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              Relatórios
            </h1>
            <p className="text-muted-foreground mt-1">
              Análise de performance e métricas de logística
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Esta Semana</SelectItem>
                <SelectItem value="month">Este Mês</SelectItem>
                <SelectItem value="quarter">Este Trimestre</SelectItem>
                <SelectItem value="year">Este Ano</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              Exportar
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total de Entregas"
            value="234"
            change={12}
            icon={Package}
            iconColor="text-success"
            iconBg="bg-success/10"
          />
          <MetricCard
            title="Tempo Médio"
            value="2.4h"
            change={-8}
            icon={Clock}
            iconColor="text-info"
            iconBg="bg-info/10"
          />
          <MetricCard
            title="Taxa de Sucesso"
            value="94%"
            change={3}
            icon={Target}
            iconColor="text-primary"
            iconBg="bg-primary/10"
          />
          <MetricCard
            title="Motoristas Ativos"
            value="18"
            change={5}
            icon={Users}
            iconColor="text-xp"
            iconBg="bg-xp/10"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deliveries per Day */}
          <div className="card-base space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-lg">Entregas por Dia</h3>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Entregas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-success" />
                  <span className="text-muted-foreground">Fretes</span>
                </div>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deliveriesPerDay} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      boxShadow: "var(--shadow-lg)",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar 
                    dataKey="entregas" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                    name="Entregas"
                  />
                  <Bar 
                    dataKey="fretes" 
                    fill="hsl(var(--success))" 
                    radius={[4, 4, 0, 0]}
                    name="Fretes"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Trend Chart */}
          <div className="card-base space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-lg">Tendência Anual</h3>
              <div className="flex items-center gap-2 text-sm text-success">
                <TrendingUp className="w-4 h-4" />
                <span>+23% crescimento</span>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      boxShadow: "var(--shadow-lg)",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#colorValue)"
                    name="Entregas"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Average Time */}
          <div className="card-base space-y-4">
            <h3 className="font-display font-semibold text-lg">Tempo Médio de Entrega</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={averageTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    unit="h"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      boxShadow: "var(--shadow-lg)",
                    }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(value: number) => [`${value}h`, "Tempo médio"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="tempo"
                    stroke="hsl(var(--info))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--info))", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Freight Types Distribution */}
          <div className="card-base space-y-4">
            <h3 className="font-display font-semibold text-lg">Tipos de Frete</h3>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={freightTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {freightTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      boxShadow: "var(--shadow-lg)",
                    }}
                    formatter={(value: number) => [`${value}%`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6">
              {freightTypeData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-semibold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Distribution */}
          <div className="card-base space-y-4">
            <h3 className="font-display font-semibold text-lg">Status das Entregas</h3>
            <div className="space-y-3">
              {statusDistribution.map((item) => {
                const total = statusDistribution.reduce((acc, i) => acc + i.count, 0);
                const percentage = Math.round((item.count / total) * 100);
                
                return (
                  <div key={item.status} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.status}</span>
                      <span className="font-semibold">{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: item.color 
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Driver Performance Table */}
        <div className="card-base space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-lg">Performance dos Motoristas</h3>
            <Button variant="outline" size="sm">Ver todos</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Posição</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Motorista</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Entregas</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">XP</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Eficiência</th>
                </tr>
              </thead>
              <tbody>
                {driverPerformance.map((driver, index) => (
                  <tr 
                    key={driver.name} 
                    className="border-b border-border/50 hover:bg-accent/30 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="py-3 px-4">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                        index === 0 && "rank-gold",
                        index === 1 && "rank-silver",
                        index === 2 && "rank-bronze",
                        index > 2 && "bg-muted text-muted-foreground"
                      )}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Truck className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium">{driver.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold">{driver.entregas}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xp font-semibold">{driver.xp.toLocaleString()}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-success transition-all duration-500"
                            style={{ width: `${driver.eficiencia}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-success">{driver.eficiencia}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
