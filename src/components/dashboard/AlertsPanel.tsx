import * as React from "react";
import { AlertTriangle, AlertCircle, Info, Clock, X, ShieldCheck, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { RecentAlert } from "@/hooks/useDashboardMetrics";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AlertsPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  alerts: RecentAlert[];
  isLoading?: boolean;
  onDismiss?: (alertId: string) => void;
  onViewDetails?: (alert: RecentAlert) => void;
}

const AlertsPanel = React.forwardRef<HTMLDivElement, AlertsPanelProps>(
  ({ alerts, isLoading, onDismiss, onViewDetails, className, ...props }, ref) => {
    const getAlertIcon = (type: RecentAlert['type']) => {
      switch (type) {
        case 'coleta_atrasada':
          return Clock;
        case 'divergencia':
          return AlertTriangle;
        case 'ocorrencia':
          return AlertCircle;
        case 'prazo_critico':
          return AlertTriangle;
        case 'ia_previsao':
          return AlertTriangle; // Ideally a Brain icon, but AlertTriangle works for now
        default:
          return Info;
      }
    };

    const getSeverityStyles = (severity: RecentAlert['severity']) => {
      switch (severity) {
        case 'error':
          return {
            container: 'border-destructive/30 bg-destructive/5',
            icon: 'text-destructive bg-destructive/10',
            badge: 'bg-destructive text-destructive-foreground',
          };
        case 'warning':
          return {
            container: 'border-warning/30 bg-warning/5',
            icon: 'text-warning bg-warning/10',
            badge: 'bg-warning text-warning-foreground',
          };
        default:
          return {
            container: 'border-info/30 bg-info/5',
            icon: 'text-info bg-info/10',
            badge: 'bg-info text-info-foreground',
          };
      }
    };

    const getTypeLabel = (type: RecentAlert['type']) => {
      switch (type) {
        case 'coleta_atrasada':
          return 'Atraso';
        case 'divergencia':
          return 'Divergência';
        case 'ocorrencia':
          return 'Ocorrência';
        case 'prazo_critico':
          return 'Prazo';
        case 'ia_previsao':
          return 'IA Previsão';
        default:
          return 'Alerta';
      }
    };

    if (isLoading) {
      return (
        <div ref={ref} className={cn("card-base", className)} {...props}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <h3 className="font-display font-semibold">Alertas do Sistema</h3>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div ref={ref} className={cn("card-base overflow-hidden border-none shadow-xl bg-gradient-to-b from-card to-card/95", className)} {...props}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-warning/10 shadow-inner">
              <AlertTriangle className="w-5 h-5 text-warning animate-bounce-subtle" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg leading-none">Central de Alertas</h3>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-bold">Monitoramento Crítico</p>
            </div>
          </div>
          {alerts.length > 0 && (
            <div className="flex items-center gap-2 bg-destructive/10 px-3 py-1 rounded-full border border-destructive/20">
              <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-ping" />
              <span className="text-xs font-bold text-destructive">
                {alerts.length} ATIVOS
              </span>
            </div>
          )}
        </div>

        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-success/5 rounded-2xl border border-dashed border-success/20">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4 shadow-lg shadow-success/10">
              <ShieldCheck className="w-8 h-8 text-success" />
            </div>
            <p className="text-base font-bold text-foreground">Sistema Seguro</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Nenhuma anormalidade detectada nas últimas 24h.</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4 -mr-2">
            <AnimatePresence mode="popLayout">
              {alerts.map((alert, index) => {
                const Icon = getAlertIcon(alert.type);
                const styles = getSeverityStyles(alert.severity);

                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "relative p-4 rounded-xl border-l-4 mb-3 cursor-pointer transition-all hover:translate-x-1 group overflow-hidden shadow-sm",
                      styles.container,
                      alert.severity === 'error' ? "border-l-destructive shadow-destructive/5" : "border-l-warning shadow-warning/5"
                    )}
                    onClick={() => onViewDetails?.(alert)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-xl shrink-0 shadow-sm",
                        styles.icon
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className={cn(
                            "px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-tighter",
                            styles.badge
                          )}>
                            {getTypeLabel(alert.type)}
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground/60 tabular-nums">
                            {new Date(alert.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-foreground leading-tight">
                          {alert.message}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                          <p className="text-[10px] font-medium text-muted-foreground/70 uppercase">
                            Impacto: {alert.severity === 'error' ? 'Crítico' : 'Moderado'}
                          </p>
                        </div>
                      </div>
                      {onDismiss && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive hover:text-white rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDismiss(alert.id);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </ScrollArea>
        )}
        <div className="mt-4 pt-4 border-t border-border/50">
          <Button variant="ghost" size="sm" className="w-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
            Ver Histórico Completo <ArrowRight className="w-3 h-3 ml-2" />
          </Button>
        </div>
      </div>
    );
  }
);
AlertsPanel.displayName = "AlertsPanel";

export { AlertsPanel };
