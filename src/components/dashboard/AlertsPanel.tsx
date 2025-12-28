import * as React from "react";
import { AlertTriangle, AlertCircle, Info, Clock, X } from "lucide-react";
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
      <div ref={ref} className={cn("card-base", className)} {...props}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-warning/10">
              <AlertTriangle className="w-4 h-4 text-warning" />
            </div>
            <h3 className="font-display font-semibold">Alertas do Sistema</h3>
          </div>
          {alerts.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-destructive text-destructive-foreground rounded-full">
              {alerts.length}
            </span>
          )}
        </div>

        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
              <Info className="w-6 h-6 text-success" />
            </div>
            <p className="text-sm text-muted-foreground">Nenhum alerta pendente</p>
            <p className="text-xs text-muted-foreground mt-1">Sistema operando normalmente</p>
          </div>
        ) : (
          <ScrollArea className="h-[280px] pr-4">
            <AnimatePresence mode="popLayout">
              {alerts.map((alert, index) => {
                const Icon = getAlertIcon(alert.type);
                const styles = getSeverityStyles(alert.severity);

                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "relative p-3 rounded-lg border mb-2 last:mb-0 cursor-pointer transition-all hover:shadow-md",
                      styles.container
                    )}
                    onClick={() => onViewDetails?.(alert)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
                        styles.icon
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "px-1.5 py-0.5 text-[10px] font-medium rounded",
                            styles.badge
                          )}>
                            {getTypeLabel(alert.type)}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-foreground truncate">
                          {alert.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(alert.createdAt).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {onDismiss && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDismiss(alert.id);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </ScrollArea>
        )}
      </div>
    );
  }
);
AlertsPanel.displayName = "AlertsPanel";

export { AlertsPanel };
