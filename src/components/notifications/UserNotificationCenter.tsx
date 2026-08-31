import { useState } from "react";
import {
  X,
  Trophy,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Mail,
  Filter,
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
import {
  useNotifications,
  Notification,
} from "@/hooks/notifications/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

  const getTypeIcon = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return CheckCircle;
      case "warning":
        return AlertTriangle;
      case "error":
        return AlertCircle;
      case "achievement":
        return Trophy;
      default:
        return Mail;
    }
  };

  const getTypeStyles = (type: Notification["type"]) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-success/10",
          border: "border-success/20",
          icon: "text-success",
          dot: "bg-success shadow-[0_0_8px_rgba(34,197,94,0.5)]",
          gradient: "from-success/5 to-transparent",
        };
      case "warning":
        return {
          bg: "bg-warning/10",
          border: "border-warning/20",
          icon: "text-warning",
          dot: "bg-warning shadow-[0_0_8px_rgba(245,158,11,0.5)]",
          gradient: "from-warning/5 to-transparent",
        };
      case "error":
        return {
          bg: "bg-destructive/10",
          border: "border-destructive/20",
          icon: "text-destructive",
          dot: "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]",
          gradient: "from-destructive/5 to-transparent",
        };
      case "achievement":
        return {
          bg: "bg-coins/10",
          border: "border-coins/20",
          icon: "text-coins",
          dot: "bg-coins shadow-[0_0_8px_rgba(234,179,8,0.5)]",
          gradient: "from-coins/5 to-transparent",
        };
      default:
        return {
          bg: "bg-primary/10",
          border: "border-primary/20",
          icon: "text-primary",
          dot: "bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]",
          gradient: "from-primary/5 to-transparent",
        };
    }
  };

  const renderNotification = (notification: Notification, index: number) => {
    const TypeIcon = getTypeIcon(notification.type);
    const styles = getTypeStyles(notification.type);

    return (
      <motion.div
        key={notification.id}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
        className={cn(
          "group relative p-4 transition-all duration-300",
          !notification.read
            ? cn("bg-gradient-to-r", styles.gradient)
            : "hover:bg-muted/30",
          "cursor-pointer border-b border-border/30",
        )}
        onClick={() => {
          if (!notification.read) markAsRead(notification.id);
          if (notification.action_url) {
            window.location.href = notification.action_url;
          }
        }}
      >
        <div className="flex gap-4">
          <div
            className={cn(
              "relative flex items-center justify-center w-11 h-11 rounded-2xl shrink-0 transition-all group-hover:rotate-6 group-hover:scale-110",
              styles.bg,
              "border border-white/5",
            )}
          >
            <TypeIcon className={cn("w-5 h-5", styles.icon)} />
            {!notification.read && (
              <span
                className={cn(
                  "absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-background animate-pulse",
                  styles.dot,
                )}
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm tracking-tight",
                    !notification.read
                      ? "font-bold text-foreground"
                      : "font-medium text-muted-foreground",
                  )}
                >
                  {notification.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                  {notification.message}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg shrink-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-3">
                {notification.action_url && (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">
                    <ExternalLink className="w-3 h-3" />
                    Abrir
                  </span>
                )}
                <span className="text-[10px] font-medium text-muted-foreground opacity-60">
                  {formatDistanceToNow(new Date(notification.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
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
                  unreadCount > 0 &&
                    "after:content-[''] after:absolute after:inset-[-2px] after:rounded-full after:border-2 after:border-primary/30 after:animate-ping after:pointer-events-none",
                )}
                aria-label="Notificações pessoais"
              >
                <Mail
                  className={cn(
                    "h-5 w-5 transition-transform",
                    isOpen && "scale-110",
                  )}
                />
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black bg-primary text-primary-foreground rounded-full ring-2 ring-background z-10"
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          {!isOpen && (
            <TooltipContent
              side="bottom"
              className="font-bold text-[10px] uppercase tracking-wider"
            >
              Minhas Notificações
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>

      <PopoverContent
        className="w-[420px] p-0 border-2 border-primary/5 bg-black/95 backdrop-blur-xl shadow-2xl overflow-hidden rounded-2xl animate-in zoom-in-95 duration-200"
        align="end"
        sideOffset={12}
      >
        <div className="p-4 bg-gradient-to-br from-primary/10 to-background border-b border-border/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/20 shadow-inner">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-black text-base tracking-tight leading-none">
                  Notificações
                </h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter mt-1 opacity-70">
                  Mensagens e Conquistas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10"
                onClick={() => markAllAsRead()}
                disabled={unreadCount === 0}
              >
                Lidas
              </Button>
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

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full h-9 bg-accent/30 p-1 rounded-xl">
              <TabsTrigger
                value="all"
                className="flex-1 rounded-lg text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                Todas ({notifications.length})
              </TabsTrigger>
              <TabsTrigger
                value="unread"
                className="flex-1 rounded-lg text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                Não Lidas ({unreadCount})
              </TabsTrigger>
            </TabsList>

            <div className="mt-4">
              <TabsContent value="all" className="m-0 border-none outline-none">
                <ScrollArea className="h-[380px] -mx-4 px-4">
                  {(() => {
                    if (isLoading) return (
                      <div className="flex items-center justify-center py-20">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                          </div>
                        </div>
                      </div>
                    );
                    if (notifications.length === 0) return (
                      <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-in fade-in duration-500">
                        <div className="w-20 h-20 rounded-3xl bg-muted/30 flex items-center justify-center mb-6 border border-border/50 rotate-3">
                          <Mail className="w-10 h-10 text-muted-foreground/30" />
                        </div>
                        <p className="font-black text-base text-foreground tracking-tight">Inbox Vazio</p>
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-[220px]">
                          Fique tranquilo! Você receberá mensagens aqui quando houver novidades.
                        </p>
                      </div>
                    );
                    return (
                      <div className="pb-4">
                        <AnimatePresence mode="popLayout" initial={false}>
                          {notifications.map((notification, index) => renderNotification(notification, index))}
                        </AnimatePresence>
                      </div>
                    );
                  })()}
                </ScrollArea>
              </TabsContent>

              <TabsContent
                value="unread"
                className="m-0 border-none outline-none"
              >
                <ScrollArea className="h-[380px] -mx-4 px-4">
                  {unreadNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-in fade-in duration-500">
                      <div className="relative mb-6">
                        <div className="absolute inset-0 bg-success/20 blur-2xl rounded-full" />
                        <div className="relative w-20 h-20 rounded-3xl bg-success/10 flex items-center justify-center border border-success/20 -rotate-3">
                          <CheckCircle className="w-10 h-10 text-success opacity-50" />
                        </div>
                      </div>
                      <p className="font-black text-base text-foreground tracking-tight">
                        Zero Pendências
                      </p>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-[220px]">
                        Ótimo trabalho! Você leu todas as suas notificações
                        importantes.
                      </p>
                    </div>
                  ) : (
                    <div className="pb-4">
                      <AnimatePresence mode="popLayout" initial={false}>
                        {unreadNotifications.map((notification, index) =>
                          renderNotification(notification, index),
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="p-3 bg-muted/10 border-t border-border/30 flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-[10px] font-black uppercase tracking-widest h-8 hover:bg-background/50"
          >
            <Filter className="w-3 h-3 mr-2" />
            Preferências de Email
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
