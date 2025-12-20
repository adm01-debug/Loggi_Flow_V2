import { useState } from "react";
import { 
  Bell, 
  X, 
  CheckCheck,
  Trash2,
  Trophy,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function UserNotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    notifications,
    unreadNotifications,
    unreadCount, 
    isLoading,
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
  } = useNotifications();

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return CheckCircle;
      case 'warning':
        return AlertTriangle;
      case 'error':
        return AlertCircle;
      case 'achievement':
        return Trophy;
      default:
        return Info;
    }
  };

  const getTypeStyles = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-success/10',
          border: 'border-success/30',
          icon: 'text-success',
          dot: 'bg-success',
        };
      case 'warning':
        return {
          bg: 'bg-warning/10',
          border: 'border-warning/30',
          icon: 'text-warning',
          dot: 'bg-warning',
        };
      case 'error':
        return {
          bg: 'bg-destructive/10',
          border: 'border-destructive/30',
          icon: 'text-destructive',
          dot: 'bg-destructive',
        };
      case 'achievement':
        return {
          bg: 'bg-coins/10',
          border: 'border-coins/30',
          icon: 'text-coins',
          dot: 'bg-coins',
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

  const renderNotification = (notification: Notification, index: number) => {
    const TypeIcon = getTypeIcon(notification.type);
    const styles = getTypeStyles(notification.type);

    return (
      <motion.div
        key={notification.id}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: 50 }}
        transition={{ delay: index * 0.03 }}
        className={cn(
          "group relative p-4 border-b border-border transition-colors",
          !notification.read && "bg-muted/30",
          "hover:bg-muted/50 cursor-pointer"
        )}
        onClick={() => {
          if (!notification.read) markAsRead(notification.id);
          if (notification.action_url) {
            window.location.href = notification.action_url;
          }
        }}
      >
        {/* Unread indicator */}
        {!notification.read && (
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
            <TypeIcon className={cn("w-5 h-5", styles.icon)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {notification.title}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                  {notification.message}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex items-center gap-3 mt-2">
              {notification.action_url && (
                <span className="flex items-center gap-1 text-xs text-primary">
                  <ExternalLink className="w-3 h-3" />
                  Ver detalhes
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.created_at), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    );
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
        className="w-[400px] p-0" 
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
                onClick={() => markAllAsRead()}
                className="h-8 text-xs"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Marcar lidas
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto">
            <TabsTrigger 
              value="all" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
            >
              Todas ({notifications.length})
            </TabsTrigger>
            <TabsTrigger 
              value="unread"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
            >
              Não lidas ({unreadCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <ScrollArea className="h-[350px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Bell className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="font-medium text-foreground">Nenhuma notificação</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Você será notificado sobre eventos importantes
                  </p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {notifications.map((notification, index) => 
                    renderNotification(notification, index)
                  )}
                </AnimatePresence>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="unread" className="mt-0">
            <ScrollArea className="h-[350px]">
              {unreadNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-success" />
                  </div>
                  <p className="font-medium text-foreground">Tudo em dia!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Você não tem notificações não lidas
                  </p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {unreadNotifications.map((notification, index) => 
                    renderNotification(notification, index)
                  )}
                </AnimatePresence>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
