import { useState } from "react";
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck,
  Trash2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Info,
  Package,
  Truck,
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
import { useSmartAlerts, SystemAlert } from "@/hooks/useSmartAlerts";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

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
          border: 'border-destructive/30',
          icon: 'text-destructive',
          dot: 'bg-destructive',
        };
      case 'warning':
        return {
          bg: 'bg-warning/10',
          border: 'border-warning/30',
          icon: 'text-warning',
          dot: 'bg-warning',
        };
      default:
        return {
          bg: 'bg-info/10',
          border: 'border-info/30',
          icon: 'text-info',
          dot: 'bg-info',
        };
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[380px] p-0" 
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="font-display font-semibold">Notificações</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-destructive text-destructive-foreground rounded-full">
                {unreadCount} nova{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-8 text-xs"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Marcar lidas
              </Button>
            )}
            {alerts.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={clearAllAlerts}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">Tudo tranquilo!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Você não tem notificações pendentes
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {alerts.map((alert, index) => {
                const AlertIcon = getAlertIcon(alert.type);
                const EntityIcon = getEntityIcon(alert.entityType);
                const styles = getSeverityStyles(alert.severity);

                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      "relative p-4 border-b border-border transition-colors",
                      !alert.read && "bg-muted/30",
                      "hover:bg-muted/50 cursor-pointer"
                    )}
                    onClick={() => {
                      if (!alert.read) markAsRead(alert.id);
                    }}
                  >
                    {/* Unread indicator */}
                    {!alert.read && (
                      <span className={cn(
                        "absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full",
                        styles.dot
                      )} />
                    )}

                    <div className="flex gap-3 ml-3">
                      <div className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-lg shrink-0",
                        styles.bg
                      )}>
                        <AlertIcon className={cn("w-5 h-5", styles.icon)} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {alert.title}
                            </p>
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                              {alert.message}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearAlert(alert.id);
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-3 mt-2">
                          {alert.entityType && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <EntityIcon className="w-3 h-3" />
                              {alert.entityType === 'coleta' ? 'Coleta' : 
                               alert.entityType === 'entrega' ? 'Entrega' : 'Ocorrência'}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(alert.createdAt, { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
