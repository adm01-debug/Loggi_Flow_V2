import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck, 
  Trash2, 
  Settings,
  Filter,
  Package,
  Truck,
  AlertTriangle,
  Trophy,
  Info,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'achievement';
  title: string;
  message: string;
  createdAt: Date;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
}

interface NotificationCenterPremiumProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onNotificationClick?: (notification: Notification) => void;
}

const typeIcons = {
  info: Info,
  success: Check,
  warning: AlertTriangle,
  error: AlertTriangle,
  achievement: Trophy
};

const typeColors = {
  info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  success: 'bg-green-500/10 text-green-500 border-green-500/20',
  warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  error: 'bg-red-500/10 text-red-500 border-red-500/20',
  achievement: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
};

export function NotificationCenterPremium({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onClearAll,
  onNotificationClick
}: NotificationCenterPremiumProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread' && n.read) return false;
    if (selectedType && n.type !== selectedType) return false;
    return true;
  });

  const groupedNotifications = filteredNotifications.reduce((acc, notification) => {
    const today = new Date();
    const notifDate = new Date(notification.createdAt);
    const isToday = notifDate.toDateString() === today.toDateString();
    const isYesterday = notifDate.toDateString() === new Date(today.setDate(today.getDate() - 1)).toDateString();
    
    let group = 'Anteriores';
    if (isToday) group = 'Hoje';
    else if (isYesterday) group = 'Ontem';
    
    if (!acc[group]) acc[group] = [];
    acc[group].push(notification);
    return acc;
  }, {} as Record<string, Notification[]>);

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-lg">Notificações</h2>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="rounded-full px-2 py-0.5 text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-3 border-b border-border space-y-3">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">Todas</TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">
              Não lidas
              {unreadCount > 0 && (
                <span className="ml-1 text-xs">({unreadCount})</span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Type filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['info', 'success', 'warning', 'achievement'].map((type) => {
            const Icon = typeIcons[type as keyof typeof typeIcons];
            const count = notifications.filter(n => n.type === type).length;
            
            return (
              <Button
                key={type}
                variant={selectedType === type ? 'default' : 'outline'}
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={() => setSelectedType(selectedType === type ? null : type)}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="capitalize">{type}</span>
                <span className="text-xs opacity-60">({count})</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-muted/30">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onMarkAllAsRead}
            disabled={unreadCount === 0}
            className="gap-1.5 text-xs"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Marcar todas como lidas
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearAll}
            className="gap-1.5 text-xs text-destructive hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpar
          </Button>
        </div>
      )}

      {/* Notifications List */}
      <ScrollArea className="flex-1">
        {filteredNotifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 px-6"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-center">
              {filter === 'unread' 
                ? 'Nenhuma notificação não lida'
                : 'Nenhuma notificação'}
            </p>
          </motion.div>
        ) : (
          <div className="divide-y divide-border">
            {Object.entries(groupedNotifications).map(([group, items]) => (
              <div key={group}>
                <div className="px-4 py-2 bg-muted/50 sticky top-0 z-10">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {group}
                  </span>
                </div>
                <AnimatePresence>
                  {items.map((notification, index) => {
                    const Icon = typeIcons[notification.type];
                    
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => {
                          if (!notification.read) onMarkAsRead(notification.id);
                          onNotificationClick?.(notification);
                        }}
                        className={cn(
                          "relative flex gap-3 p-4 cursor-pointer transition-colors",
                          "hover:bg-muted/50",
                          !notification.read && "bg-primary/5"
                        )}
                      >
                        {/* Unread indicator */}
                        {!notification.read && (
                          <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                        )}

                        {/* Icon */}
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border",
                          typeColors[notification.type]
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={cn(
                              "text-sm line-clamp-1",
                              !notification.read ? "font-semibold" : "font-medium"
                            )}>
                              {notification.title}
                            </h4>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(notification.id);
                              }}
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                                locale: ptBR
                              })}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
