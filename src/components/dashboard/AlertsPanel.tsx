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
      <div ref={ref} className={cn("card-base overflow-hidden border-2 shadow-[0_0_80px_-20px_rgba(0,0,0,0.6)] bg-gradient-to-br from-card via-card/95 to-background backdrop-blur-3xl group/panel relative", className)} {...props}>
        {/* Camadas Táticas de Background */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-warning/15 rounded-full blur-[120px] pointer-events-none group-hover/panel:bg-warning/25 transition-all duration-1000" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-destructive/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between mb-8">
          <div className="flex items-center gap-5">
            <div className="relative group/icon">
              <div className="absolute inset-0 bg-warning/20 blur-xl rounded-full animate-pulse" />
              <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-warning/30 to-warning/5 border border-warning/30 shadow-[inset_0_0_20px_rgba(234,179,8,0.1)] overflow-hidden">
                <AlertTriangle className="w-7 h-7 text-warning drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                <div className="absolute inset-0 bg-gradient-to-t from-warning/20 to-transparent opacity-0 group-hover/icon:opacity-100 transition-opacity" />
              </div>
            </div>
            <div>
              <h3 className="font-display font-black text-3xl tracking-tighter uppercase leading-none italic group-hover/panel:translate-x-1 transition-transform">
                Nexus <span className="text-warning drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]">Terminal</span>
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex gap-0.5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-3 h-1 bg-warning/40 rounded-full" />
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-black italic">Monitor de Protocolos</p>
              </div>
            </div>
          </div>
          {alerts.length > 0 && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-end relative"
            >
              <div className="absolute inset-0 bg-destructive/20 blur-lg rounded-lg" />
              <div className="relative bg-destructive text-white px-5 py-2 rounded-xl border-b-[6px] border-destructive-foreground/40 font-black text-sm shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform cursor-help">
                {alerts.length} INTERRUPÇÕES
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
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95, x: 30 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 500,
                      damping: 35,
                      delay: index * 0.08 
                    }}
                    className={cn(
                      "relative p-6 rounded-2xl border-2 mb-5 cursor-pointer transition-all duration-500 group overflow-hidden",
                      styles.container,
                      "hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] hover:-translate-y-1 hover:translate-x-1 hover:border-opacity-100 border-opacity-20",
                      alert.severity === 'error' ? "border-destructive/50 bg-destructive/10" : "border-warning/50 bg-warning/10"
                    )}
                    onClick={() => onViewDetails?.(alert)}
                  >
                    {/* Brilho de varredura (Sweep animation) */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
                    
                    <div className="relative z-10 flex items-start gap-6">
                      <div className={cn(
                        "flex items-center justify-center w-14 h-14 rounded-2xl shrink-0 shadow-2xl border-2 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6",
                        styles.icon,
                        alert.severity === 'error' ? "border-destructive/40 shadow-destructive/20" : "border-warning/40 shadow-warning/20"
                      )}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-[0.2em] border shadow-lg",
                              alert.severity === 'error' ? "bg-destructive text-white border-white/20" : "bg-warning text-black border-black/10"
                            )}>
                              {getTypeLabel(alert.type)}
                            </span>
                            <div className="w-1.5 h-1.5 rounded-full bg-border/40" />
                            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest italic opacity-60">Priority {alert.severity === 'error' ? '01' : '02'}</span>
                          </div>
                          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-xl border border-white/5">
                            <Clock className="w-3.5 h-3.5 text-primary/70" />
                            <span className="text-[11px] font-black text-foreground tabular-nums tracking-widest italic">
                              {new Date(alert.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <h4 className="text-lg font-black text-foreground leading-tight tracking-tight group-hover:text-primary transition-colors italic">
                          {alert.message}
                        </h4>
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center gap-2 px-3 py-1 bg-background/40 rounded-full border border-white/5">
                            <div className={cn("w-2 h-2 rounded-full", alert.severity === 'error' ? "bg-destructive animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" : "bg-warning")} />
                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                              Status: <span className={alert.severity === 'error' ? "text-destructive" : "text-warning"}>{alert.severity === 'error' ? 'CRITICAL_FAILURE' : 'PENDING_ACTION'}</span>
                            </p>
                          </div>
                          <p className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.2em] italic">NX-{index+102}-SRV</p>
                        </div>
                      </div>
                      {onDismiss && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 shrink-0 opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive hover:text-white rounded-2xl shadow-2xl border border-white/5 group-hover:rotate-12"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDismiss(alert.id);
                          }}
                        >
                          <X className="w-6 h-6" />
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
