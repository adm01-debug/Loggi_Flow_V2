import { useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Truck,
  Package,
  Timer,
  Target,
  Building2,
  ArrowRight,
  RefreshCw,
  Calendar,
  BarChart3,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { cn } from "@/lib/utils";
import { useSLAMetrics, type SLAAlert, type TransportadoraPerformance } from "@/hooks/useSLAMetrics";
import { useQueryClient } from "@tanstack/react-query";

function SLAKPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  status,
  className,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  status?: "success" | "warning" | "danger" | "neutral";
  className?: string;
}) {
  const statusColors = {
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
    neutral: "text-muted-foreground",
  };

  const statusBgColors = {
    success: "bg-success/10",
    warning: "bg-warning/10",
    danger: "bg-destructive/10",
    neutral: "bg-muted/30",
  };

  const trendIcons = {
    up: TrendingUp,
    down: TrendingDown,
    stable: Minus,
  };

  const TrendIcon = trend ? trendIcons[trend] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("card-elevated", className)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className={cn("text-3xl font-display font-bold", statusColors[status || "neutral"])}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
          {trend && trendValue && TrendIcon && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-sm",
              trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground"
            )}>
              <TrendIcon className="w-4 h-4" />
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className={cn(
          "flex items-center justify-center w-12 h-12 rounded-xl",
          statusBgColors[status || "neutral"]
        )}>
          <Icon className={cn("w-6 h-6", statusColors[status || "neutral"])} />
        </div>
      </div>
    </motion.div>
  );
}

function AlertCard({ alert, index }: { alert: SLAAlert; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "p-4 rounded-xl border-l-4 bg-card",
        alert.nivel === "critico" 
          ? "border-l-destructive bg-destructive/5" 
          : "border-l-warning bg-warning/5"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
            alert.nivel === "critico" ? "bg-destructive/10" : "bg-warning/10"
          )}>
            {alert.tipo === "entrega" ? (
              <Truck className={cn("w-4 h-4", alert.nivel === "critico" ? "text-destructive" : "text-warning")} />
            ) : (
              <Package className={cn("w-4 h-4", alert.nivel === "critico" ? "text-destructive" : "text-warning")} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={alert.nivel === "critico" ? "destructive" : "secondary"} className="text-xs">
                {alert.numero}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {alert.tipo === "entrega" ? "Entrega" : "Coleta"}
              </span>
            </div>
            <p className="text-sm font-medium">{alert.mensagem}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {alert.cliente || alert.fornecedor}
              {alert.transportadora && ` • ${alert.transportadora}`}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground">Prazo</p>
          <p className="text-sm font-medium">
            {format(alert.prazo, "dd/MM HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function TransportadoraRow({ transp, index }: { transp: TransportadoraPerformance; index: number }) {
  const getTrendIcon = () => {
    switch (transp.tendencia) {
      case "up": return <TrendingUp className="w-4 h-4 text-success" />;
      case "down": return <TrendingDown className="w-4 h-4 text-destructive" />;
      default: return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (taxa: number) => {
    if (taxa >= 95) return "text-success";
    if (taxa >= 85) return "text-warning";
    return "text-destructive";
  };

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="hover:bg-muted/50"
    >
      <TableCell>
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold",
            index === 0 ? "rank-gold" :
            index === 1 ? "rank-silver" :
            index === 2 ? "rank-bronze" :
            "bg-muted text-muted-foreground"
          )}>
            {index + 1}
          </div>
          <div>
            <p className="font-medium">{transp.nome}</p>
            <p className="text-xs text-muted-foreground">Score: {transp.score}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-center">{transp.totalEntregas}</TableCell>
      <TableCell className="text-center">{transp.entregasNoPrazo}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Progress 
            value={transp.taxaOTIF} 
            className="h-2 w-20"
          />
          <span className={cn("text-sm font-semibold", getStatusColor(transp.taxaOTIF))}>
            {transp.taxaOTIF.toFixed(1)}%
          </span>
        </div>
      </TableCell>
      <TableCell className="text-center">
        {transp.tempoMedio > 0 ? `${Math.round(transp.tempoMedio)}h` : "-"}
      </TableCell>
      <TableCell className="text-center">{getTrendIcon()}</TableCell>
    </motion.tr>
  );
}

export default function SLADashboard() {
  const { data: metrics, isLoading, error } = useSLAMetrics();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["sla-metrics"] });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </MainLayout>
    );
  }

  if (error || !metrics) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">Erro ao carregar métricas de SLA</p>
        </div>
      </MainLayout>
    );
  }

  const getOTIFStatus = (taxa: number) => {
    if (taxa >= 95) return "success";
    if (taxa >= 85) return "warning";
    return "danger";
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-display text-foreground flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-warning glow-primary">
                <Target className="w-6 h-6 text-primary-foreground" />
              </div>
              Dashboard SLA
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitoramento de prazos e performance logística
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            <Badge variant="secondary" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Última atualização: {format(new Date(), "HH:mm", { locale: ptBR })}
            </Badge>
          </div>
        </div>

        {/* Critical Alerts Banner */}
        {metrics.alertasCriticos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-4"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/20">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-destructive">
                {metrics.alertasCriticos.length} {metrics.alertasCriticos.length === 1 ? "alerta crítico" : "alertas críticos"} de SLA
              </p>
              <p className="text-sm text-muted-foreground">
                Ações imediatas necessárias para evitar atrasos
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Ver Alertas
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SLAKPICard
            title="Taxa OTIF"
            value={`${metrics.taxaOTIF.toFixed(1)}%`}
            subtitle={`${metrics.entregasNoPrazo}/${metrics.totalEntregas} no prazo`}
            icon={Target}
            status={getOTIFStatus(metrics.taxaOTIF)}
            trend={metrics.taxaOTIF >= 95 ? "up" : metrics.taxaOTIF >= 85 ? "stable" : "down"}
            trendValue={metrics.taxaOTIF >= 95 ? "Meta atingida" : `${(95 - metrics.taxaOTIF).toFixed(1)}% abaixo da meta`}
          />
          
          <SLAKPICard
            title="Entregas Pendentes"
            value={metrics.entregasPendentes}
            subtitle={`${metrics.alertasCriticos.filter(a => a.tipo === "entrega").length} em atraso`}
            icon={Truck}
            status={metrics.alertasCriticos.filter(a => a.tipo === "entrega").length > 0 ? "danger" : "success"}
          />
          
          <SLAKPICard
            title="Tempo Médio Entrega"
            value={`${Math.round(metrics.tempoMedioEntrega)}h`}
            subtitle="Despacho até entrega"
            icon={Timer}
            status={metrics.tempoMedioEntrega <= 48 ? "success" : metrics.tempoMedioEntrega <= 72 ? "warning" : "danger"}
          />
          
          <SLAKPICard
            title="Coletas"
            value={`${metrics.coletasNoPrazo}/${metrics.totalColetas}`}
            subtitle={`${metrics.coletasAtrasadas} atrasadas`}
            icon={Package}
            status={metrics.coletasAtrasadas === 0 ? "success" : metrics.coletasAtrasadas <= 2 ? "warning" : "danger"}
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="w-4 h-4 mr-2" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="alerts" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Alertas ({metrics.alertasCriticos.length + metrics.alertasAviso.length})
            </TabsTrigger>
            <TabsTrigger value="carriers" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Building2 className="w-4 h-4 mr-2" />
              Transportadoras
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Tendência Semanal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={metrics.tendenciaSemanal}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis 
                        dataKey="data" 
                        tickFormatter={(v) => format(new Date(v), "EEE", { locale: ptBR })}
                        className="text-muted-foreground"
                      />
                      <YAxis className="text-muted-foreground" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="noPrazo"
                        stackId="1"
                        stroke="hsl(var(--success))"
                        fill="hsl(var(--success) / 0.3)"
                        name="No Prazo"
                      />
                      <Area
                        type="monotone"
                        dataKey="atrasadas"
                        stackId="1"
                        stroke="hsl(var(--destructive))"
                        fill="hsl(var(--destructive) / 0.3)"
                        name="Atrasadas"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* OTIF Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Evolução OTIF
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={metrics.tendenciaMensal}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="data" className="text-muted-foreground" />
                      <YAxis domain={[0, 100]} className="text-muted-foreground" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, "OTIF"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="taxaOTIF"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                        name="OTIF %"
                      />
                      {/* Meta line at 95% */}
                      <Line
                        type="monotone"
                        dataKey={() => 95}
                        stroke="hsl(var(--success))"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        dot={false}
                        name="Meta (95%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-success/5 border-success/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-success" />
                  <div>
                    <p className="text-2xl font-bold text-success">{metrics.entregasNoPrazo}</p>
                    <p className="text-xs text-muted-foreground">No prazo</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-destructive/5 border-destructive/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <XCircle className="w-8 h-8 text-destructive" />
                  <div>
                    <p className="text-2xl font-bold text-destructive">{metrics.entregasAtrasadas}</p>
                    <p className="text-xs text-muted-foreground">Atrasadas</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-warning/5 border-warning/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-warning" />
                  <div>
                    <p className="text-2xl font-bold text-warning">{metrics.alertasAviso.length}</p>
                    <p className="text-xs text-muted-foreground">Em risco</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-info/5 border-info/20">
                <CardContent className="p-4 flex items-center gap-3">
                  <Timer className="w-8 h-8 text-info" />
                  <div>
                    <p className="text-2xl font-bold text-info">{Math.round(metrics.tempoMedioColeta)}h</p>
                    <p className="text-xs text-muted-foreground">Tempo médio coleta</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Critical Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-5 h-5" />
                    Alertas Críticos ({metrics.alertasCriticos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3 pr-4">
                      {metrics.alertasCriticos.length > 0 ? (
                        metrics.alertasCriticos.map((alert, index) => (
                          <AlertCard key={alert.id} alert={alert} index={index} />
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-success" />
                          <p>Nenhum alerta crítico</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Warning Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-warning">
                    <Clock className="w-5 h-5" />
                    Atenção ({metrics.alertasAviso.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3 pr-4">
                      {metrics.alertasAviso.length > 0 ? (
                        metrics.alertasAviso.map((alert, index) => (
                          <AlertCard key={alert.id} alert={alert} index={index} />
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-success" />
                          <p>Nenhum alerta de atenção</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="carriers" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  Performance por Transportadora
                </CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.performancePorTransportadora.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transportadora</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">No Prazo</TableHead>
                        <TableHead>Taxa OTIF</TableHead>
                        <TableHead className="text-center">Tempo Médio</TableHead>
                        <TableHead className="text-center">Tendência</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metrics.performancePorTransportadora.map((transp, index) => (
                        <TransportadoraRow key={transp.id} transp={transp} index={index} />
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhuma entrega registrada para análise</p>
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
