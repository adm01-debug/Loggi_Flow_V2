import { useMemo, useState } from "react";
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  Trophy, 
  Info,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { format, subDays, subMonths, isAfter, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type Period = "today" | "week" | "month" | "all";

const TYPE_CONFIG = {
  info: { 
    label: "Informação", 
    color: "hsl(var(--info))", 
    icon: Info,
    bgColor: "bg-info/10",
    textColor: "text-info",
  },
  success: { 
    label: "Sucesso", 
    color: "hsl(var(--success))", 
    icon: CheckCircle,
    bgColor: "bg-success/10",
    textColor: "text-success",
  },
  warning: { 
    label: "Alerta", 
    color: "hsl(var(--warning))", 
    icon: AlertTriangle,
    bgColor: "bg-warning/10",
    textColor: "text-warning",
  },
  error: { 
    label: "Erro", 
    color: "hsl(var(--destructive))", 
    icon: AlertCircle,
    bgColor: "bg-destructive/10",
    textColor: "text-destructive",
  },
  achievement: { 
    label: "Conquista", 
    color: "hsl(var(--coins))", 
    icon: Trophy,
    bgColor: "bg-coins/10",
    textColor: "text-coins",
  },
};

export function NotificationStats() {
  const { notifications } = useNotifications();
  const [period, setPeriod] = useState<Period>("week");

  // Filter notifications by period
  const filteredNotifications = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case "today":
        startDate = startOfDay(now);
        break;
      case "week":
        startDate = subDays(now, 7);
        break;
      case "month":
        startDate = subMonths(now, 1);
        break;
      case "all":
      default:
        return notifications;
    }

    return notifications.filter(n => 
      isAfter(new Date(n.created_at), startDate)
    );
  }, [notifications, period]);

  // Calculate stats by type
  const statsByType = useMemo(() => {
    const counts: Record<string, number> = {
      info: 0,
      success: 0,
      warning: 0,
      error: 0,
      achievement: 0,
    };

    filteredNotifications.forEach(n => {
      counts[n.type] = (counts[n.type] || 0) + 1;
    });

    return Object.entries(counts).map(([type, count]) => ({
      type,
      count,
      ...TYPE_CONFIG[type as keyof typeof TYPE_CONFIG],
    }));
  }, [filteredNotifications]);

  // Calculate daily distribution for bar chart
  const dailyDistribution = useMemo(() => {
    const days = period === "today" ? 1 : period === "week" ? 7 : period === "month" ? 30 : 30;
    const data: { date: string; count: number; label: string }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "yyyy-MM-dd");
      const label = format(date, "dd/MM", { locale: ptBR });
      
      const count = filteredNotifications.filter(n => 
        format(new Date(n.created_at), "yyyy-MM-dd") === dateStr
      ).length;

      data.push({ date: dateStr, count, label });
    }

    return data;
  }, [filteredNotifications, period]);

  // Pie chart data
  const pieData = useMemo(() => {
    return statsByType
      .filter(s => s.count > 0)
      .map(s => ({
        name: s.label,
        value: s.count,
        color: s.color,
      }));
  }, [statsByType]);

  // Summary stats
  const totalCount = filteredNotifications.length;
  const unreadCount = filteredNotifications.filter(n => !n.read).length;
  const readRate = totalCount > 0 ? Math.round((1 - unreadCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Estatísticas de Notificações</h3>
        </div>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList>
            <TabsTrigger value="today">Hoje</TabsTrigger>
            <TabsTrigger value="week">7 dias</TabsTrigger>
            <TabsTrigger value="month">30 dias</TabsTrigger>
            <TabsTrigger value="all">Tudo</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                <Bell className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Não lidas</p>
                <p className="text-2xl font-bold">{unreadCount}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-warning/10">
                <AlertTriangle className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de leitura</p>
                <p className="text-2xl font-bold">{readRate}%</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-success/10">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Type breakdown */}
      <div className="grid gap-4 md:grid-cols-5">
        {statsByType.map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.type} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg",
                    stat.bgColor
                  )}>
                    <Icon className={cn("w-5 h-5", stat.textColor)} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold">{stat.count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Bar chart - Daily distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribuição Diária</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {dailyDistribution.some(d => d.count > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyDistribution}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 12 }} 
                      className="fill-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }} 
                      className="fill-muted-foreground"
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Bar 
                      dataKey="count" 
                      name="Notificações"
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Sem dados para o período selecionado
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pie chart - Type distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribuição por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value) => (
                        <span className="text-sm text-foreground">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Sem dados para o período selecionado
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
