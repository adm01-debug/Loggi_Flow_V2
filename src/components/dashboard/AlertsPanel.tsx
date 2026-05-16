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
      <div ref={ref} className={cn("card-base overflow-hidden border-2 shadow-2xl bg-gradient-to-br from-card via-card/95 to-background backdrop-blur-3xl group/panel", className)} {...props}>
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-warning/10 rounded-full blur-[100px] pointer-events-none group-hover/panel:bg-warning/20 transition-colors duration-700" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-destructive/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-warning/20 to-warning/5 border border-warning/20 shadow-inner group/icon overflow-hidden">
              <AlertTriangle className="w-6 h-6 text-warning animate-pulse" />
              <div className="absolute inset-0 bg-gradient-to-t from-warning/10 to-transparent opacity-0 group-hover/icon:opacity-100 transition-opacity" />
            </div>
            <div>
              <h3 className="font-display font-black text-2xl tracking-tighter uppercase leading-none italic">
                Nexus <span className="text-warning">Alerts</span>
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex h-1.5 w-1.5 rounded-full bg-warning animate-ping" />
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">Tempo Real</p>
              </div>
            </div>
          </div>
          {alerts.length > 0 && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-end"
            >
              <div className="bg-destructive text-white px-3 py-1 rounded-lg border-b-4 border-destructive-foreground/30 font-black text-sm shadow-lg shadow-destructive/20 transform -rotate-2">
                {alerts.length} CRÍTICOS
              </div>
            </motion.div>
          )}
        </div>

        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-success/5 rounded-3xl border-2 border-dashed border-success/20 relative overflow-hidden group/empty">
            <div className="absolute inset-0 bg-gradient-to-tr from-success/5 to-transparent opacity-0 group-hover/empty:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-5 shadow-xl shadow-success/10 border border-success/20">
              <ShieldCheck className="w-10 h-10 text-success" />
            </div>
            <p className="text-xl font-black text-foreground italic uppercase tracking-tighter relative z-10">Nexus Safe</p>
            <p className="text-xs text-muted-foreground mt-2 max-w-[220px] font-medium leading-relaxed relative z-10">Protocolos de segurança operando em conformidade total.</p>
          </div>
        ) : (
          <ScrollArea className="h-[340px] pr-4 -mr-2">
            <AnimatePresence mode="popLayout">
              {alerts.map((alert, index) => {
                const Icon = getAlertIcon(alert.type);
                const styles = getSeverityStyles(alert.severity);

                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: 20 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                      delay: index * 0.05 
                    }}
                    className={cn(
                      "relative p-5 rounded-2xl border-2 mb-4 cursor-pointer transition-all duration-300 group overflow-hidden",
                      styles.container,
                      "hover:shadow-2xl hover:translate-x-2 hover:border-opacity-100 border-opacity-30",
                      alert.severity === 'error' ? "border-destructive/40 bg-destructive/5" : "border-warning/40 bg-warning/5"
                    )}
                    onClick={() => onViewDetails?.(alert)}
                  >
                    {/* Glossy overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none" />
                    
                    <div className="relative z-10 flex items-start gap-5">
                      <div className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-xl shrink-0 shadow-lg border-b-4 transition-transform group-hover:scale-110 group-hover:rotate-3",
                        styles.icon,
                        alert.severity === 'error' ? "border-destructive-foreground/20" : "border-warning-foreground/20"
                      )}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className={cn(
                            "px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest border shadow-sm",
                            alert.severity === 'error' ? "bg-destructive text-white border-destructive-foreground/20" : "bg-warning text-warning-foreground border-warning-foreground/10"
                          )}>
                            {getTypeLabel(alert.type)}
                          </span>
                          <div className="flex items-center gap-1 bg-background/40 backdrop-blur-sm px-2 py-0.5 rounded-md border border-border/20">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[10px] font-black text-foreground tabular-nums tracking-tighter">
                              {new Date(alert.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <h4 className="text-base font-black text-foreground leading-tight tracking-tight group-hover:text-primary transition-colors">
                          {alert.message}
                        </h4>
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center gap-1.5">
                            <div className={cn("w-2 h-2 rounded-full", alert.severity === 'error' ? "bg-destructive animate-pulse" : "bg-warning")} />
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                              Prioridade: <span className={alert.severity === 'error' ? "text-destructive" : "text-warning"}>{alert.severity === 'error' ? 'CRÍTICA' : 'MÉDIA'}</span>
                            </p>
                          </div>
                          <div className="h-1 w-1 rounded-full bg-border" />
                          <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">Protocolo: 24-{index+102}</p>
                        </div>
                      </div>
                      {onDismiss && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive hover:text-white rounded-xl shadow-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDismiss(alert.id);
                          }}
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </ScrollArea>
        )}
        <div className="mt-6 pt-6 border-t border-border/50 relative">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full h-12 text-xs font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all rounded-2xl group/btn"
          >
            Central de Comando <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    );
  }
);
AlertsPanel.displayName = "AlertsPanel";

export { AlertsPanel };
