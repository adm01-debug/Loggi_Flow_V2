import { useState, useMemo } from "react";
import { 
  Bell, 
  Search, 
  Filter,
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  Trophy, 
  Info,
  X,
  CheckCheck,
  Trash2,
  Calendar,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { motion, AnimatePresence } from "framer-motion";
import { useNotifications, Notification } from "@/hooks/useNotifications";
import { NotificationStats } from "@/components/notifications/NotificationStats";
import { NotificationPermissionStatus } from "@/components/notifications/BrowserNotificationPrompt";
import { format, subDays, subMonths, isAfter, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type Period = "today" | "week" | "month" | "all";
type TypeFilter = "all" | "info" | "success" | "warning" | "error" | "achievement";
type StatusFilter = "all" | "read" | "unread";

const TYPE_CONFIG = {
  info: { 
    label: "Informação", 
    icon: Info,
    bgColor: "bg-info/10",
    textColor: "text-info",
    borderColor: "border-info/30",
  },
  success: { 
    label: "Sucesso", 
    icon: CheckCircle,
    bgColor: "bg-success/10",
    textColor: "text-success",
    borderColor: "border-success/30",
  },
  warning: { 
    label: "Alerta", 
    icon: AlertTriangle,
    bgColor: "bg-warning/10",
    textColor: "text-warning",
    borderColor: "border-warning/30",
  },
  error: { 
    label: "Erro", 
    icon: AlertCircle,
    bgColor: "bg-destructive/10",
    textColor: "text-destructive",
    borderColor: "border-destructive/30",
  },
  achievement: { 
    label: "Conquista", 
    icon: Trophy,
    bgColor: "bg-coins/10",
    textColor: "text-coins",
    borderColor: "border-coins/30",
  },
};

export default function Notificacoes() {
  const { 
    notifications,
    unreadCount,
    isLoading,
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
  } = useNotifications();

  const [searchQuery, setSearchQuery] = useState("");
  const [period, setPeriod] = useState<Period>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showStats, setShowStats] = useState(false);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    let result = [...notifications];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(n => 
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query)
      );
    }

    // Period filter
    if (period !== "all") {
      const now = new Date();
      let startDate: Date;
      switch (period) {
        case "today":
          startDate = startOfDay(now);
          break;
        case "week":
          startDate = subDays(now, 7);
          break;
        case "month":
          startDate = subMonths(now, 1);
          break;
        default:
          startDate = new Date(0);
      }
      result = result.filter(n => isAfter(new Date(n.created_at), startDate));
    }

    // Type filter
    if (typeFilter !== "all") {
      result = result.filter(n => n.type === typeFilter);
    }

    // Status filter
    if (statusFilter === "read") {
      result = result.filter(n => n.read);
    } else if (statusFilter === "unread") {
      result = result.filter(n => !n.read);
    }

    return result;
  }, [notifications, searchQuery, period, typeFilter, statusFilter]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setPeriod("all");
    setTypeFilter("all");
    setStatusFilter("all");
  };

  const hasActiveFilters = searchQuery || period !== "all" || typeFilter !== "all" || statusFilter !== "all";

  const renderNotification = (notification: Notification, index: number) => {
    const config = TYPE_CONFIG[notification.type];
    const Icon = config.icon;

    return (
      <motion.div
        key={notification.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ delay: index * 0.02 }}
        className={cn(
          "group relative p-4 rounded-lg border transition-all",
          !notification.read ? "bg-muted/50 border-primary/20" : "bg-card border-border",
          "hover:shadow-md hover:border-primary/30"
        )}
      >
        <div className="flex gap-4">
          {/* Icon */}
          <div className={cn(
            "flex items-center justify-center w-12 h-12 rounded-xl shrink-0",
            config.bgColor
          )}>
            <Icon className={cn("w-6 h-6", config.textColor)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground">
                    {notification.title}
                  </h3>
                  {!notification.read && (
                    <Badge variant="default" className="text-[10px] h-5">
                      Nova
                    </Badge>
                  )}
                  <Badge variant="outline" className={cn("text-[10px] h-5", config.textColor, config.borderColor)}>
                    {config.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {notification.message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => markAsRead(notification.id)}
                    title="Marcar como lida"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => deleteNotification(notification.id)}
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(new Date(notification.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </span>
              {notification.action_url && (
                <a 
                  href={notification.action_url}
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  Ver detalhes
                </a>
              )}
              {notification.read && notification.read_at && (
                <span className="flex items-center gap-1 text-success">
                  <CheckCheck className="w-3 h-3" />
                  Lida em {format(new Date(notification.read_at), "dd/MM HH:mm")}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-display text-foreground flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                <Bell className="w-6 h-6 text-primary" />
              </div>
              Notificações
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount} nova{unreadCount > 1 ? "s" : ""}
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">
              Central de notificações e alertas do sistema
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <NotificationPermissionStatus />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowStats(!showStats)}
            >
              {showStats ? "Ocultar Estatísticas" : "Ver Estatísticas"}
            </Button>
            {unreadCount > 0 && (
              <Button onClick={() => markAllAsRead()} className="gap-2">
                <CheckCheck className="w-4 h-4" />
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </div>

        {/* Stats Panel */}
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <NotificationStats />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título ou mensagem..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Period filter */}
              <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                <SelectTrigger className="w-[150px]">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Últimos 7 dias</SelectItem>
                  <SelectItem value="month">Últimos 30 dias</SelectItem>
                  <SelectItem value="all">Todo o histórico</SelectItem>
                </SelectContent>
              </Select>

              {/* Type filter */}
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="info">Informação</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="warning">Alerta</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                  <SelectItem value="achievement">Conquista</SelectItem>
                </SelectContent>
              </Select>

              {/* Status filter */}
              <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <TabsList>
                  <TabsTrigger value="all">Todas</TabsTrigger>
                  <TabsTrigger value="unread">Não lidas</TabsTrigger>
                  <TabsTrigger value="read">Lidas</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Clear filters */}
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters} className="gap-2">
                  <X className="w-4 h-4" />
                  Limpar filtros
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filteredNotifications.length} notificação{filteredNotifications.length !== 1 ? "ões" : ""} encontrada{filteredNotifications.length !== 1 ? "s" : ""}
            {hasActiveFilters && ` (de ${notifications.length} total)`}
          </span>
        </div>

        {/* Notification list */}
        <div className="space-y-3">
          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-muted-foreground" />
                </div>
                {hasActiveFilters ? (
                  <>
                    <p className="font-medium text-foreground">Nenhuma notificação encontrada</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tente ajustar os filtros para ver mais resultados
                    </p>
                    <Button variant="outline" className="mt-4" onClick={handleClearFilters}>
                      Limpar filtros
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-foreground">Nenhuma notificação</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Você será notificado sobre eventos importantes do sistema
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((notification, index) => 
                renderNotification(notification, index)
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
