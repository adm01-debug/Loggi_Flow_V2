import { useState } from "react";
import { 
  Bell, 
  X, 
  CheckCheck,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Info,
  Package,
  Truck,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { useSmartAlerts, SystemAlert } from "@/hooks";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    alerts, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearAlert,
    clearAllAlerts,
  } = useSmartAlerts();

  const getAlertIcon = (type: SystemAlert['type']) => {
    switch (type) {
      case 'coleta_atrasada':
      case 'entrega_atrasada':
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

  const getEntityIcon = (entityType?: SystemAlert['entityType']) => {
    switch (entityType) {
      case 'coleta':
        return Package;
      case 'entrega':
        return Truck;
      default:
        return Info;
    }
  };

  const getSeverityStyles = (severity: SystemAlert['severity']) => {
    switch (severity) {
      case 'error':
        return {
          bg: 'bg-destructive/10',
          border: 'border-destructive/20',
          icon: 'text-destructive',
          dot: 'bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]',
          glow: 'bg-destructive/5',
        };
      case 'warning':
        return {
          bg: 'bg-warning/10',
          border: 'border-warning/20',
          icon: 'text-warning',
          dot: 'bg-warning shadow-[0_0_8px_rgba(245,158,11,0.5)]',
          glow: 'bg-warning/5',
        };
      default:
        return {
          bg: 'bg-primary/10',
          border: 'border-primary/20',
          icon: 'text-primary',
          dot: 'bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]',
          glow: 'bg-primary/5',
        };
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "relative h-9 w-9 sm:h-10 sm:w-10 rounded-full transition-all duration-300",
                  isOpen ? "bg-accent" : "hover:bg-accent/50",
                  unreadCount > 0 && "after:content-[''] after:absolute after:inset-0 after:rounded-full after:animate-ping after:bg-destructive/20 after:pointer-events-none"
                )}
                aria-label="Alertas do sistema"
              >
                <Bell className={cn("h-5 w-5 transition-transform", isOpen && "scale-110")} />
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black bg-destructive text-destructive-foreground rounded-full ring-2 ring-background z-10"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          {!isOpen && (
            <TooltipContent side="bottom" className="font-bold text-[10px] uppercase tracking-wider">
              Alertas Operacionais
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      <PopoverContent 
        className="w-[380px] p-0 border-2 border-primary/5 bg-black/95 backdrop-blur-xl shadow-2xl overflow-hidden rounded-2xl animate-in zoom-in-95 duration-200" 
        align="end"
        sideOffset={12}
      >
        <div className="flex items-center justify-between p-4 bg-gradient-to-br from-accent/50 to-background border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <h3 className="font-bold text-sm tracking-tight">Alertas do Sistema</h3>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Central Operacional</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-8 text-[10px] font-bold uppercase tracking-wider hover:bg-primary/5 text-primary"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
                Lidas
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg hover:bg-accent"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[420px] bg-background/50">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center border border-primary/10">
                  <CheckCheck className="w-10 h-10 text-primary opacity-50" />
                </div>
              </div>
              <p className="font-bold text-base text-foreground tracking-tight">Status: Nominal</p>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-[200px]">
                Nenhuma divergência operacional detectada no momento.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              <AnimatePresence mode="popLayout" initial={false}>
                {alerts.map((alert, index) => {
                  const AlertIcon = getAlertIcon(alert.type);
                  const EntityIcon = getEntityIcon(alert.entityType);
                  const styles = getSeverityStyles(alert.severity);

                  return (
                    <motion.div
                      key={alert.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 50, transition: { duration: 0.2 } }}
                      className={cn(
                        "group relative p-4 transition-all duration-300",
                        !alert.read ? cn("bg-muted/10", styles.glow) : "hover:bg-muted/30",
                        "cursor-pointer overflow-hidden border-l-4",
                        !alert.read ? (alert.severity === 'error' ? 'border-l-destructive' : alert.severity === 'warning' ? 'border-l-warning' : 'border-l-primary') : 'border-l-transparent'
                      )}
                      onClick={() => {
                        if (!alert.read) markAsRead(alert.id);
                      }}
                    >
                      <div className="flex gap-4">
                        <div className={cn(
                          "flex items-center justify-center w-11 h-11 rounded-xl shrink-0 transition-transform group-hover:scale-105",
                          styles.bg,
                          "border border-white/10"
                        )}>
                          <AlertIcon className={cn("w-5 h-5", styles.icon)} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "text-sm tracking-tight",
                                !alert.read ? "font-bold text-foreground" : "font-medium text-muted-foreground"
                              )}>
                                {alert.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                {alert.message}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-lg shrink-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearAlert(alert.id);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-3">
                              {alert.entityType && (
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/50 px-2 py-0.5 rounded-md">
                                  <EntityIcon className="w-3 h-3" />
                                  {alert.entityType === 'coleta' ? 'Coleta' : 
                                   alert.entityType === 'entrega' ? 'Entrega' : 'Ocorrência'}
                                </span>
                              )}
                              <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground opacity-60">
                                <Clock className="w-2.5 h-2.5" />
                                {formatDistanceToNow(alert.createdAt, { 
                                  addSuffix: true, 
                                  locale: ptBR 
                                })}
                              </span>
                            </div>
                            
                            {!alert.read && (
                              <div className={cn("w-2 h-2 rounded-full animate-pulse", styles.dot)} />
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
        
        <div className="p-3 bg-muted/20 border-t border-border/50 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="text-[10px] font-bold uppercase tracking-wider hover:bg-background/50 h-8"
            onClick={clearAllAlerts}
            disabled={alerts.length === 0}
          >
            Limpar Todos
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-[10px] font-bold uppercase tracking-wider hover:bg-background/50 h-8 gap-2"
          >
            <Settings className="w-3 h-3" />
            Configurações
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
