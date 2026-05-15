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
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFavoriteMetrics, AVAILABLE_METRICS } from "@/hooks/useFavoriteMetrics";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { useSLAMetrics } from "@/hooks/useSLAMetrics";
import { useLogisticsCosts } from "@/hooks/useLogisticsCosts";
import { useGamification } from "@/hooks/useGamification";
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
      <Card className="border-dashed border-2 border-muted-foreground/25">
        <CardContent className="py-6">
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <Pin className="h-8 w-8 text-muted-foreground/50" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Nenhuma métrica fixada
              </p>
              <p className="text-xs text-muted-foreground/70">
                Clique em editar para adicionar métricas favoritas
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={toggleEditMode}>
              <Settings className="h-4 w-4 mr-2" />
              Configurar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Pin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Métricas Fixadas</span>
            <Badge variant="secondary" className="text-xs">
              {favorites.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {isEditMode && (
              <>
                <Popover open={isAddMenuOpen} onOpenChange={setIsAddMenuOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Adicionar
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-4">
                      <div className="font-medium text-sm">Adicionar Métrica</div>
                      {Object.entries(metricsByCategory).map(([category, metrics]) => (
                        <div key={category}>
                          <div className="text-xs text-muted-foreground mb-2">
                            {categoryLabels[category] || category}
                          </div>
                          <div className="space-y-1">
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
                                    "w-full flex items-center gap-2 p-2 rounded-md text-left text-sm transition-colors",
                                    isFavorite
                                      ? "bg-primary/10 text-primary"
                                      : "hover:bg-muted"
                                  )}
                                >
                                  {IconComponent && (
                                    <IconComponent className={cn("h-4 w-4", metric.color)} />
                                  )}
                                  <span className="flex-1">{metric.label}</span>
                                  {isFavorite ? (
                                    <PinOff className="h-3 w-3" />
                                  ) : (
                                    <Pin className="h-3 w-3 opacity-50" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <Button variant="ghost" size="sm" onClick={resetFavorites}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </>
            )}
            <Button
              variant={isEditMode ? "default" : "ghost"}
              size="sm"
              onClick={toggleEditMode}
            >
              {isEditMode ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Concluir
                </>
              ) : (
                <Settings className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          <AnimatePresence mode="popLayout">
            {favoriteMetrics.map((metric) => {
              const IconComponent = iconMap[metric.icon];
              const data = (realMetricValues as any)[metric.id] || { value: "-", change: undefined, changeType: "neutral" as const };

              return (
                <motion.div
                  key={metric.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "relative p-3 rounded-lg border bg-card transition-all",
                          isEditMode && "ring-2 ring-primary/20 cursor-move",
                          "hover:shadow-md"
                        )}
                      >
                        {isEditMode && (
                          <button
                            onClick={() => toggleFavorite(metric.id)}
                            className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                          {IconComponent && (
                            <IconComponent className={cn("h-4 w-4", metric.color)} />
                          )}
                          <span className="text-xs text-muted-foreground truncate">
                            {metric.label}
                          </span>
                        </div>
                        <div className="flex items-end justify-between">
                          <span className="text-lg font-bold">{data.value}</span>
                          {data.change !== undefined && (
                            <div
                              className={cn(
                                "flex items-center text-xs",
                                data.changeType === ("positive" as string) && "text-success",
                                data.changeType === ("negative" as string) && "text-destructive",
                                data.changeType === ("neutral" as string) && "text-muted-foreground"
                              )}
                            >
                              {data.changeType === ("positive" as string) ? (
                                <TrendingUp className="h-3 w-3 mr-0.5" />
                              ) : data.changeType === ("negative" as string) ? (
                                <TrendingDown className="h-3 w-3 mr-0.5" />
                              ) : (
                                <Minus className="h-3 w-3 mr-0.5" />
                              )}
                              {typeof data.change === "number" && Math.abs(data.change)}
                            </div>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{metric.label}</p>
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {isEditMode && favorites.length < 6 && (
            <Popover>
              <PopoverTrigger asChild>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-1 min-h-[80px]"
                >
                  <Plus className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Adicionar</span>
                </motion.button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-2">
                  <div className="font-medium text-sm mb-3">Selecionar Métrica</div>
                  {AVAILABLE_METRICS.filter((m) => !favorites.includes(m.id))
                    .slice(0, 5)
                    .map((metric) => {
                      const IconComponent = iconMap[metric.icon];
                      return (
                        <button
                          key={metric.id}
                          onClick={() => toggleFavorite(metric.id)}
                          className="w-full flex items-center gap-2 p-2 rounded-md text-left text-sm hover:bg-muted transition-colors"
                        >
                          {IconComponent && (
                            <IconComponent className={cn("h-4 w-4", metric.color)} />
                          )}
                          <span>{metric.label}</span>
                        </button>
                      );
                    })}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
