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
  Star,
  Trophy,
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

// XP Evolution Data
const xpEvolutionData = [
  { week: "Sem 1", xp: 1200, level: 8 },
  { week: "Sem 2", xp: 2450, level: 9 },
  { week: "Sem 3", xp: 3800, level: 10 },
  { week: "Sem 4", xp: 5200, level: 11 },
  { week: "Sem 5", xp: 6900, level: 12 },
  { week: "Sem 6", xp: 8100, level: 13 },
  { week: "Sem 7", xp: 9500, level: 14 },
  { week: "Sem 8", xp: 11200, level: 15 },
];

// Achievements over time
const achievementsData = [
  { month: "Jan", conquistas: 3, xpGanho: 450 },
  { month: "Fev", conquistas: 5, xpGanho: 720 },
  { month: "Mar", conquistas: 4, xpGanho: 580 },
  { month: "Abr", conquistas: 7, xpGanho: 1100 },
  { month: "Mai", conquistas: 6, xpGanho: 890 },
  { month: "Jun", conquistas: 9, xpGanho: 1450 },
];

// Deliveries trend
const deliveriesTrendData = [
  { date: "01/12", entregas: 12, meta: 15 },
  { date: "02/12", entregas: 18, meta: 15 },
  { date: "03/12", entregas: 14, meta: 15 },
  { date: "04/12", entregas: 22, meta: 15 },
  { date: "05/12", entregas: 19, meta: 15 },
  { date: "06/12", entregas: 25, meta: 15 },
  { date: "07/12", entregas: 8, meta: 15 },
  { date: "08/12", entregas: 16, meta: 15 },
  { date: "09/12", entregas: 21, meta: 15 },
  { date: "10/12", entregas: 28, meta: 15 },
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

        {/* XP & Gamification Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-xp" />
            <h2 className="font-display font-semibold text-xl">Evolução de XP e Gamificação</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* XP Evolution */}
            <div className="card-base space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-lg">Evolução de XP</h3>
                <div className="flex items-center gap-2 text-sm text-xp">
                  <TrendingUp className="w-4 h-4" />
                  <span>+833% crescimento</span>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={xpEvolutionData}>
                    <defs>
                      <linearGradient id="colorXP" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--xp))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--xp))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                      dataKey="week" 
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
                      formatter={(value: number, name: string) => [
                        name === "xp" ? `${value.toLocaleString()} XP` : `Nível ${value}`,
                        name === "xp" ? "XP Total" : "Nível"
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="xp"
                      stroke="hsl(var(--xp))"
                      strokeWidth={3}
                      fill="url(#colorXP)"
                      name="xp"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Achievements Over Time */}
            <div className="card-base space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-lg">Conquistas Desbloqueadas</h3>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-coins" />
                  <span className="text-sm font-semibold text-coins">34 total</span>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={achievementsData}>
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
                    <Bar 
                      dataKey="conquistas" 
                      fill="hsl(var(--coins))" 
                      radius={[4, 4, 0, 0]}
                      name="Conquistas"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Deliveries Trend with Goal */}
          <div className="card-base space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-lg">Entregas vs Meta Diária</h3>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Entregas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-destructive" />
                  <span className="text-muted-foreground">Meta (15)</span>
                </div>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={deliveriesTrendData}>
                  <defs>
                    <linearGradient id="colorDeliveries" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="date" 
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
                    dataKey="entregas"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#colorDeliveries)"
                    name="Entregas"
                  />
                  <Line
                    type="monotone"
                    dataKey="meta"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Meta"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
