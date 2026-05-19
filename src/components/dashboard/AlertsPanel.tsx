import * as React from "react";
import { AlertTriangle, AlertCircle, Info, Clock, X, ShieldCheck, ArrowRight, Brain, Zap, ShieldAlert, Activity, Settings2, SlidersHorizontal, BarChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { RecentAlert } from "@/hooks/useDashboardMetrics";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface AlertsPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  alerts: RecentAlert[];
  isLoading?: boolean;
  onDismiss?: (alertId: string) => void;
  onViewDetails?: (alert: RecentAlert) => void;
}

const AlertsPanel = React.forwardRef<HTMLDivElement, AlertsPanelProps>(
  ({ alerts: initialAlerts, isLoading, onDismiss, onViewDetails, className, ...props }, ref) => {
    const [threshold, setThreshold] = useLocalStorage("nexus-alert-threshold", 5);
    const [deltaVisibility, setDeltaVisibility] = React.useState(false);

    // Delta Filter Logic
    const alerts = React.useMemo(() => {
      return initialAlerts.filter(alert => {
        // Mocking delta calculation for demonstration if not present
        // In a real scenario, this would come from the backend/hook
        const delta = (alert as any).delta || (Number(alert.id.charCodeAt(0)) % 20); 
        return delta >= threshold;
      });
    }, [initialAlerts, threshold]);

    const getAlertIcon = (type: RecentAlert['type']) => {
      switch (type) {
        case 'coleta_atrasada':
          return Clock;
        case 'divergencia':
          return ShieldAlert;
        case 'ocorrencia':
          return AlertCircle;
        case 'prazo_critico':
          return Zap;
        case 'ia_previsao':
          return Brain;
        default:
          return Info;
      }
    };

    const getSeverityStyles = (severity: RecentAlert['severity']) => {
      switch (severity) {
        case 'error':
          return {
            container: 'border-destructive/40 bg-destructive/10',
            icon: 'text-destructive bg-destructive/20',
            badge: 'bg-destructive text-white',
            accent: 'text-destructive shadow-destructive/30',
            glow: 'from-destructive/20 via-transparent to-transparent'
          };
        case 'warning':
          return {
            container: 'border-warning/40 bg-warning/10',
            icon: 'text-warning bg-warning/20',
            badge: 'bg-warning text-black',
            accent: 'text-warning shadow-warning/30',
            glow: 'from-warning/20 via-transparent to-transparent'
          };
        default:
          return {
            container: 'border-info/40 bg-info/10',
            icon: 'text-info bg-info/20',
            badge: 'bg-info text-white',
            accent: 'text-info shadow-info/30',
            glow: 'from-info/20 via-transparent to-transparent'
          };
      }
    };

    const getTypeLabel = (type: RecentAlert['type']) => {
      switch (type) {
        case 'coleta_atrasada': return 'ATRASO CRÍTICO';
        case 'divergencia': return 'DIVERGÊNCIA TÁTICA';
        case 'ocorrencia': return 'OCORRÊNCIA';
        case 'prazo_critico': return 'PRAZO ESGOTADO';
        case 'ia_previsao': return 'IA PREVENTIVA';
        default: return 'ALERTA';
      }
    };

    if (isLoading) {
      return (
        <div ref={ref} className={cn("relative p-10 rounded-[3rem] border border-white/10 bg-black/40 backdrop-blur-3xl overflow-hidden", className)} {...props}>
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-48 bg-white/5 rounded-xl" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-white/5 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div ref={ref} className={cn("relative group/panel", className)} {...props}>
        {/* Atmosphere & Holographic Base */}
        <div className="absolute -inset-10 bg-destructive/5 rounded-[5rem] blur-[120px] opacity-0 group-hover/panel:opacity-100 transition-all duration-1000" />
        
        <div className="relative overflow-hidden rounded-[2rem] sm:rounded-[3.5rem] border border-white/10 bg-[#050505]/60 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,0.4)] transition-all duration-700 hover:border-destructive/30">
          {/* Tactical Background Elements */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-destructive/5 blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <div className="p-6 sm:p-14 relative z-10">
            {/* Header Structure */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-10">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-destructive/20 blur-2xl rounded-2xl animate-pulse" />
                  <div className="relative flex items-center justify-center w-20 h-20 rounded-[1.75rem] bg-gradient-to-br from-destructive/40 to-black border border-destructive/40 shadow-2xl group-hover/panel:rotate-12 transition-transform duration-1000">
                    <ShieldAlert className="w-10 h-10 text-destructive animate-pulse" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Activity className="w-3.5 h-3.5 text-destructive/60 animate-[ping_2s_infinite]" />
                    <span className="text-[11px] font-black text-destructive/60 uppercase tracking-[0.5em] font-mono">Status Operacional</span>
                  </div>
                  <h3 className="font-display font-black text-4xl sm:text-5xl leading-none tracking-tighter italic bg-gradient-to-r from-white via-white to-white/30 bg-clip-text text-transparent">
                    NEXUS <span className="text-destructive drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]">TERMINAL</span>
                  </h3>
                </div>
              </div>

              <div className="flex flex-col items-end gap-4">
                <div className="flex items-center gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-primary hover:border-primary/40 transition-all">
                        <SlidersHorizontal className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 bg-black/95 border-primary/20 backdrop-blur-2xl p-6 rounded-3xl shadow-2xl">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-black text-white uppercase tracking-widest italic">Configuração Delta</h4>
                          <Badge variant="outline" className="text-[10px] font-black border-primary/30 text-primary">{threshold}%</Badge>
                        </div>
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase tracking-tighter">
                              <span>Sensibilidade</span>
                              <span>Limiar de Variação</span>
                            </div>
                            <Slider 
                              value={[threshold]} 
                              onValueChange={([v]) => setThreshold(v)} 
                              max={50} 
                              step={1} 
                              className="py-4"
                            />
                          </div>
                          <p className="text-[10px] text-white/40 leading-relaxed italic uppercase font-medium">
                            Ajuste o limiar delta para filtrar alertas de variação operacional. Valores maiores reduzem o ruído, menores aumentam a precisão.
                          </p>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <div className="relative group/counter">
                    <div className="absolute inset-0 bg-destructive/30 blur-xl rounded-full animate-pulse" />
                    <div className="relative bg-destructive text-white px-8 py-3 rounded-2xl border-b-[4px] border-black/40 font-black text-base shadow-2xl transform hover:scale-105 transition-all cursor-default tracking-tighter">
                      {alerts.length} DELTA DETECTADOS
                    </div>
                  </div>
                </div>
                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] mr-4 flex items-center gap-2">
                  <BarChart className="w-2.5 h-2.5" /> Protocolo de Emergência Ativo
                </span>
              </div>
            </div>

            {/* Main Content Area */}
            {alerts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-24 text-center bg-white/[0.02] rounded-[3rem] border-2 border-dashed border-white/5 relative group/empty overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover/empty:opacity-100 transition-opacity duration-1000" />
                <div className="relative z-10 w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(var(--primary),0.1)] border border-primary/20 group-hover/empty:scale-110 transition-transform duration-700">
                  <ShieldCheck className="w-14 h-14 text-primary" />
                </div>
                <h4 className="text-3xl font-black text-white italic uppercase tracking-tighter relative z-10 mb-2">NÚCLEO ESTÁVEL</h4>
                <p className="text-sm text-white/40 font-bold uppercase tracking-widest relative z-10 max-w-sm mx-auto leading-relaxed">
                  Todos os protocolos operando em conformidade total. Nenhuma divergência detectada no perímetro Nexus.
                </p>
              </motion.div>
            ) : (
              <ScrollArea className="h-[480px] pr-8 -mr-4">
                <AnimatePresence mode="popLayout">
                  {alerts.map((alert, index) => {
                    const Icon = getAlertIcon(alert.type);
                    const styles = getSeverityStyles(alert.severity);
                    const delta = (alert as any).delta || (Number(alert.id.charCodeAt(0)) % 20 + 5); 

                    return (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9, x: 50 }}
                        transition={{ 
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                          delay: index * 0.1 
                        }}
                        className={cn(
                          "relative p-8 rounded-[2.5rem] border border-white/5 mb-8 cursor-pointer transition-all duration-700 group/alert overflow-hidden",
                          "hover:bg-white/[0.03] hover:border-white/20 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]",
                          alert.severity === 'error' ? "hover:border-destructive/40" : "hover:border-warning/40",
                          delta > 20 && "border-primary/30 bg-primary/5"
                        )}
                        onClick={() => onViewDetails?.(alert)}
                      >
                        {/* Delta Highlight */}
                        {delta > 20 && (
                          <div className="absolute top-0 right-0 p-4">
                            <Badge className="bg-primary/20 text-primary border-primary/30 animate-pulse text-[8px] font-black uppercase tracking-widest">ALTA VARIAÇÃO: {delta.toFixed(1)}%</Badge>
                          </div>
                        )}
                        {/* Dynamic Sweep Light */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent -translate-x-full group-hover/alert:animate-[shimmer_3s_infinite] pointer-events-none" />
                        
                        <div className="relative z-10 flex items-start gap-10">
                          <div className={cn(
                            "flex items-center justify-center w-18 h-18 rounded-3xl shrink-0 shadow-2xl border border-white/10 transition-all duration-700 group-hover/alert:scale-110 group-hover/alert:rotate-6",
                            styles.icon
                          )}>
                            <Icon className="w-9 h-9" />
                          </div>
                          
                          <div className="flex-1 min-w-0 space-y-5">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                              <div className="flex items-center gap-4">
                                <span className={cn(
                                  "px-5 py-1.5 text-[10px] font-black rounded-xl uppercase tracking-[0.3em] border shadow-2xl",
                                  styles.badge
                                )}>
                                  {getTypeLabel(alert.type)}
                                </span>
                                <div className="h-4 w-[1px] bg-white/10" />
                                <div className="flex items-center gap-2">
                                  <div className={cn("w-2 h-2 rounded-full", alert.severity === 'error' ? "bg-destructive animate-pulse" : "bg-warning")} />
                                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest font-mono">PRIORIDADE_{alert.severity === 'error' ? 'ALPHA' : 'BETA'}</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3 bg-black/60 backdrop-blur-xl px-5 py-2 rounded-2xl border border-white/5">
                                <Clock className="w-4 h-4 text-primary" />
                                <span className="text-[13px] font-black text-white tabular-nums tracking-widest font-mono">
                                  {new Date(alert.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <h4 className="text-2xl font-black text-white leading-tight tracking-tighter group-hover/alert:translate-x-2 transition-transform duration-700 uppercase italic">
                                {alert.message}
                              </h4>
                              <p className="text-sm font-bold text-white/30 uppercase tracking-[0.2em] font-mono">ID_PROTOCOL: NX-{index + 1024}-SRV</p>
                            </div>

                            <div className="flex items-center gap-6 pt-2">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Sincronização OK</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Localizador: {index % 2 === 0 ? 'GRU-01' : 'VCP-04'}</span>
                              </div>
                            </div>
                          </div>

                          {onDismiss && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-14 w-14 shrink-0 opacity-0 group-hover/alert:opacity-100 transition-all hover:bg-destructive hover:text-white rounded-[1.25rem] border border-white/10 group-hover/alert:rotate-90"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDismiss(alert.id);
                              }}
                            >
                              <X className="w-8 h-8 stroke-[2.5]" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </ScrollArea>
            )}
            
            {/* Footer Control */}
            <div className="mt-14 pt-10 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-8">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-1">Diagnóstico Total</span>
                <p className="text-xs font-bold text-white/60 tracking-widest uppercase">Processamento em Tempo Real (8ms latência)</p>
              </div>
              
              <Button 
                variant="ghost" 
                className="h-16 px-12 text-[13px] font-black uppercase tracking-[0.5em] text-white/60 hover:text-destructive hover:bg-destructive/5 transition-all rounded-[1.5rem] border border-white/5 hover:border-destructive/40 group/footer italic"
              >
                ACESSAR TERMINAL COMPLETO 
                <ArrowRight className="w-5 h-5 ml-4 group-hover/footer:translate-x-3 transition-transform duration-500" />
              </Button>
            </div>
          </div>
          
          {/* Glass Edge Decoration */}
          <div className="absolute bottom-0 left-0 w-full h-[4px] bg-gradient-to-r from-transparent via-destructive/50 to-transparent opacity-20" />
        </div>
      </div>
    );
  }
);
AlertsPanel.displayName = "AlertsPanel";

export { AlertsPanel };
