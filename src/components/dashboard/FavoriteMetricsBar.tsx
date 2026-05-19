import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  Navigation,
  CheckSquare,
  AlertTriangle,
  Target,
  DollarSign,
  TrendingDown,
  Star,
  Award,
  Pin,
  PinOff,
  Plus,
  Settings,
  RotateCcw,
  TrendingUp,
  Minus,
  X,
  Zap,
  Activity,
  ShieldCheck,
  Cpu
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFavoriteMetrics, AVAILABLE_METRICS } from "@/hooks";
import { useDashboardMetrics } from "@/hooks";
import { useSLAMetrics } from "@/hooks";
import { useLogisticsCosts } from "@/hooks";
import { useGamification } from "@/hooks";
import { cn } from "@/lib/utils";
import { subMonths, startOfMonth, endOfMonth } from "date-fns";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Package,
  Truck,
  CheckCircle,
  Clock,
  Navigation,
  CheckSquare,
  AlertTriangle,
  Target,
  DollarSign,
  TrendingDown,
  Star,
  Award,
};

const categoryLabels: Record<string, string> = {
  coletas: "Coletas",
  entregas: "Entregas",
  ocorrencias: "Ocorrências",
  performance: "Performance",
  financeiro: "Financeiro",
  gamificacao: "Gamificação",
};

export function FavoriteMetricsBar() {
  const {
    favorites,
    isEditMode,
    toggleFavorite,
    resetFavorites,
    toggleEditMode,
    getFavoriteMetrics,
    getMetricsByCategory,
  } = useFavoriteMetrics();

  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const favoriteMetrics = getFavoriteMetrics();
  const metricsByCategory = getMetricsByCategory();

  // Data fetching
  const { data: dashboardData } = useDashboardMetrics();
  const { data: slaData } = useSLAMetrics();
  const { userLevel } = useGamification();
  
  const now = new Date();
  const startDate = startOfMonth(subMonths(now, 1));
  const endDate = endOfMonth(now);
  const { summary: costSummary } = useLogisticsCosts(startDate, endDate);

  const realMetricValues = useMemo(() => {
    return {
      "coletas-pendentes": { 
        value: dashboardData?.coletasPendentes ?? 0, 
        change: dashboardData?.coletasAtrasadas ?? 0, 
        changeType: (dashboardData?.coletasAtrasadas ?? 0) > 0 ? "negative" as const : "neutral" as const 
      },
      "coletas-transito": { 
        value: dashboardData?.coletasEmTransito ?? 0, 
        change: undefined, 
        changeType: "neutral" as const 
      },
      "coletas-finalizadas": { 
        value: dashboardData?.coletasFinalizadas ?? 0, 
        change: undefined, 
        changeType: "positive" as const 
      },
      "entregas-pendentes": { 
        value: dashboardData?.entregasPendentes ?? 0, 
        change: undefined, 
        changeType: "neutral" as const 
      },
      "entregas-transito": { 
        value: dashboardData?.entregasEmTransito ?? 0, 
        change: undefined, 
        changeType: "neutral" as const 
      },
      "entregas-finalizadas": { 
        value: dashboardData?.entregasFinalizadas ?? 0, 
        change: undefined, 
        changeType: "positive" as const 
      },
      "ocorrencias-abertas": { 
        value: dashboardData?.entregasComOcorrencia ?? 0, 
        change: undefined, 
        changeType: (dashboardData?.entregasComOcorrencia ?? 0) > 0 ? "negative" as const : "neutral" as const 
      },
      "sla-cumprido": { 
        value: `${dashboardData?.taxaEntregaNoPrazo ?? 0}%`, 
        change: slaData?.taxaOTIF ? Math.round(slaData.taxaOTIF) : undefined, 
        changeType: (dashboardData?.taxaEntregaNoPrazo ?? 0) > 90 ? "positive" as const : "negative" as const 
      },
      "custo-mensal": { 
        value: `R$ ${costSummary?.total_spent?.toLocaleString('pt-BR') ?? "0"}`, 
        change: undefined, 
        changeType: "neutral" as const 
      },
      "economia-mes": { 
        value: `R$ ${(costSummary?.total_spent ? (costSummary.total_spent * 0.05) : 0).toLocaleString('pt-BR')}`, 
        change: undefined, 
        changeType: "positive" as const 
      },
      "xp-total": { 
        value: userLevel?.total_xp ?? 0, 
        change: undefined, 
        changeType: "positive" as const 
      },
      "nivel-atual": { 
        value: userLevel?.level ?? 1, 
        change: undefined, 
        changeType: "positive" as const 
      },
    };
  }, [dashboardData, costSummary, userLevel, slaData]);


  if (favorites.length === 0 && !isEditMode) {
    return (
      <Card className="border-dashed border-2 border-primary/20 bg-black/40 backdrop-blur-xl rounded-[2rem] p-10">
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20 animate-pulse">
               <Pin className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black italic uppercase tracking-widest text-white">Nenhum Registro Fixado</h3>
              <p className="text-sm text-white/40 font-bold uppercase tracking-[0.2em] max-w-xs mx-auto leading-relaxed">
                Configure seu painel de comando fixando as métricas críticas de sua operação.
              </p>
            </div>
            <Button 
              variant="outline" 
              size="lg" 
              onClick={toggleEditMode}
              className="h-12 px-10 rounded-full bg-primary/10 border-primary/30 text-primary hover:bg-primary hover:text-white transition-all font-black uppercase tracking-[0.2em]"
            >
              <Settings className="h-4 w-4 mr-3 group-hover:rotate-90 transition-transform" />
              INICIAR CONFIGURAÇÃO
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className="relative overflow-hidden group border-none bg-transparent p-[2px] rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-white/5 to-primary/10 rounded-[1.5rem] sm:rounded-[2.5rem]" />
        <div className="relative bg-black/95 backdrop-blur-[50px] rounded-[1.4rem] sm:rounded-[2.4rem] p-4 sm:p-6 border border-white/5">
          
          {/* Scanning Line Effect */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 animate-scan" />

          <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-6 px-2">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="absolute -inset-2 bg-primary/20 rounded-xl blur-lg animate-pulse" />
                <div className="relative p-3 rounded-xl bg-black border border-primary/30 shadow-[0_0_15px_rgba(234,56,76,0.3)]">
                  <Activity className="h-5 w-5 text-primary animate-pulse" />
                </div>
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-[0.3em] italic bg-gradient-to-br from-white via-white to-white/50 bg-clip-text text-transparent">Métricas de Comando <span className="text-primary">Nexus</span></span>
                <div className="flex items-center gap-2 mt-1">
                   <div className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
                   <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em]">Grid_Telemetry_Active</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-black bg-white/5 text-primary border-primary/30 px-3 rounded-lg h-6">
                {favorites.length} ATIVAS
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <AnimatePresence>
                {isEditMode && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-3"
                  >
                    <Popover open={isAddMenuOpen} onOpenChange={setIsAddMenuOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="h-10 px-6 text-[11px] font-black uppercase tracking-widest bg-primary/10 border-primary/30 text-primary hover:bg-primary hover:text-white rounded-xl transition-all shadow-lg">
                          <Plus className="h-4 w-4 mr-2" />
                          INJETAR DADO
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 bg-black/95 border-primary/20 backdrop-blur-2xl p-6 rounded-3xl shadow-2xl" align="end">
                        <div className="space-y-6">
                          <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <h4 className="font-black text-sm italic tracking-widest uppercase text-white">Central de Métricas</h4>
                            <Badge variant="outline" className="text-[9px] font-black border-primary/30 text-primary">SELECT_CORE</Badge>
                          </div>
                          {Object.entries(metricsByCategory).map(([category, metrics]) => (
                            <div key={category} className="space-y-3">
                              <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] px-1">
                                {categoryLabels[category] || category}
                              </div>
                              <div className="grid gap-2">
                                {metrics.map((metric) => {
                                  const isFavorite = favorites.includes(metric.id);
                                  const IconComponent = iconMap[metric.icon];
                                  return (
                                    <button
                                      key={metric.id}
                                      onClick={() => {
                                        toggleFavorite(metric.id);
                                        if (!isFavorite) {
                                          setIsAddMenuOpen(false);
                                        }
                                      }}
                                      className={cn(
                                        "w-full flex items-center gap-4 p-3 rounded-xl text-left transition-all duration-300 group/btn border",
                                        isFavorite
                                          ? "bg-primary/20 border-primary/40 text-primary"
                                          : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20 text-white/60"
                                      )}
                                    >
                                      {IconComponent && (
                                        <div className={cn("p-2 rounded-lg bg-black border border-white/10 group-hover/btn:border-primary/40 transition-colors")}>
                                          <IconComponent className={cn("h-4 w-4", metric.color)} />
                                        </div>
                                      )}
                                      <span className="flex-1 text-xs font-bold uppercase tracking-tight">{metric.label}</span>
                                      {isFavorite ? (
                                        <PinOff className="h-3.5 w-3.5" />
                                      ) : (
                                        <Pin className="h-3.5 w-3.5 opacity-30 group-hover/btn:opacity-100" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                          <Button variant="ghost" className="w-full h-10 text-[10px] font-black text-white/40 hover:text-white" onClick={resetFavorites}>
                            <RotateCcw className="h-3 w-3 mr-2" /> RESETAR PADRÕES
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                variant={isEditMode ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "h-10 px-6 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all duration-500",
                  isEditMode 
                    ? "bg-primary text-white shadow-[0_0_20px_rgba(234,56,76,0.5)] scale-105 border-b-[4px] border-black/40" 
                    : "bg-white/5 text-white/60 hover:text-primary hover:bg-primary/10 border border-white/5"
                )}
                onClick={toggleEditMode}
              >
                {isEditMode ? (
                  <>
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    CONCLUIR COMANDO
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
                    EDITAR GRID
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <AnimatePresence mode="popLayout">
              {favoriteMetrics.map((metric, idx) => {
                const IconComponent = iconMap[metric.icon];
                const data = (realMetricValues as Record<string, { value: string | number; change?: number; changeType: string }>) [metric.id] || { value: "-", change: undefined, changeType: "neutral" as const };

                return (
                  <motion.div
                    key={metric.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    transition={{ delay: idx * 0.05, type: "spring", stiffness: 100 }}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "relative p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border-2 transition-all duration-500 overflow-hidden",
                            "bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-transparent border-white/5",
                            isEditMode ? "ring-2 ring-primary/40 cursor-move" : "hover:border-primary/40 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] hover:-translate-y-2",
                            "group/metric"
                          )}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover/metric:opacity-100 transition-opacity duration-700" />
                          
                          {isEditMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(metric.id);
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded-full bg-primary text-white shadow-xl hover:scale-125 transition-all z-20"
                            >
                              <X className="h-3 w-3 stroke-[3]" />
                            </button>
                          )}
                          
                          <div className="flex items-center gap-3 mb-5 relative z-10">
                            <div className={cn("p-2 rounded-xl bg-black border border-white/10 group-hover/metric:border-primary/40 group-hover/metric:shadow-[0_0_15px_rgba(234,56,76,0.3)] transition-all duration-500")}>
                              {IconComponent && (
                                <IconComponent className={cn("h-4 w-4", metric.color)} />
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                               <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover/metric:text-primary transition-colors truncate">
                                 {metric.label}
                               </span>
                               <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.2em] group-hover/metric:text-white/40 transition-colors">Sensor_Active</span>
                            </div>
                          </div>

                          <div className="flex items-baseline justify-between relative z-10">
                            <span className="text-2xl font-black italic tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] tabular-nums">{data.value}</span>
                            {data.change !== undefined && (
                              <div
                                className={cn(
                                  "flex items-center text-[10px] font-black tracking-widest px-2 py-0.5 rounded-full bg-black/40 border border-white/5",
                                  data.changeType === ("positive" as string) && "text-success border-success/30",
                                  data.changeType === ("negative" as string) && "text-destructive border-destructive/30",
                                  data.changeType === ("neutral" as string) && "text-muted-foreground"
                                )}
                              >
                                {data.changeType === ("positive" as string) ? (
                                  <TrendingUp className="h-2.5 w-2.5 mr-1" />
                                ) : data.changeType === ("negative" as string) ? (
                                  <TrendingDown className="h-2.5 w-2.5 mr-1" />
                                ) : (
                                  <Minus className="h-2.5 w-2.5 mr-1" />
                                )}
                                {typeof data.change === "number" && Math.abs(data.change)}
                              </div>
                            )}
                          </div>

                          {/* Detail Bar */}
                          <div className="mt-4 h-[2px] w-full bg-white/5 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: "100%" }}
                               transition={{ duration: 1.5, delay: idx * 0.1 }}
                               className={cn("h-full bg-gradient-to-r from-transparent via-primary/40 to-transparent", idx % 2 === 0 ? "animate-pulse" : "")} 
                             />
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-black/95 border-primary/30 backdrop-blur-xl px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                           <Cpu className="w-3 h-3 text-primary" />
                           {metric.label}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {isEditMode && favorites.length < 12 && (
              <Popover>
                <PopoverTrigger asChild>
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    className="p-5 rounded-[2rem] border-2 border-dashed border-primary/20 bg-primary/5 hover:border-primary/50 hover:bg-primary/10 transition-all flex flex-col items-center justify-center gap-3 min-h-[140px] group/add"
                  >
                    <div className="p-3 rounded-full bg-black border border-primary/20 group-hover/add:border-primary/40 transition-colors shadow-lg">
                       <Plus className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 group-hover/add:text-primary transition-colors">Fixar Métrica</span>
                  </motion.button>
                </PopoverTrigger>
                <PopoverContent className="w-80 bg-black/95 border-primary/20 backdrop-blur-2xl p-6 rounded-3xl shadow-2xl" align="center">
                   <div className="space-y-4">
                     <h4 className="font-black text-sm italic tracking-widest uppercase text-white pb-3 border-b border-white/10">Injetar Novo Módulo</h4>
                     <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                        {AVAILABLE_METRICS.filter((m) => !favorites.includes(m.id))
                          .map((metric) => {
                            const IconComponent = iconMap[metric.icon];
                            return (
                              <button
                                key={metric.id}
                                onClick={() => toggleFavorite(metric.id)}
                                className="w-full flex items-center gap-4 p-3 rounded-xl text-left bg-white/5 border border-white/5 hover:border-primary/30 hover:bg-primary/10 transition-all group/btn"
                              >
                                {IconComponent && (
                                  <div className="p-2 rounded-lg bg-black border border-white/10 group-hover/btn:border-primary/30">
                                    <IconComponent className={cn("h-4 w-4", metric.color)} />
                                  </div>
                                )}
                                <span className="text-xs font-bold uppercase tracking-tight text-white/70 group-hover/btn:text-white">{metric.label}</span>
                              </button>
                            );
                          })}
                     </div>
                   </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      </Card>
    </TooltipProvider>
  );
}
