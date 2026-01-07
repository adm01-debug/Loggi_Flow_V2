import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  AlertTriangle, 
  MapPin, 
  Truck, 
  Clock, 
  Wifi,
  WifiOff,
  User,
  Navigation,
  CheckCircle2,
  XCircle,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface RealtimeLocation {
  id: string;
  lalamove_order_id: string;
  driver_id: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  driver_plate: string | null;
  latitude: number;
  longitude: number;
  order_status: string | null;
  recorded_at: string;
  created_at: string;
}

interface RealtimeAlert {
  id: string;
  lalamove_order_id: string;
  alert_type: string;
  severity: string;
  message: string;
  latitude: number | null;
  longitude: number | null;
  resolved: boolean;
  created_at: string;
}

interface RealtimeStats {
  activeOrders: number;
  totalLocations: number;
  unresolvedAlerts: number;
  lastUpdate: Date | null;
}

interface RealtimeMonitoringPanelProps {
  onLocationUpdate?: (location: RealtimeLocation) => void;
  onAlertUpdate?: (alert: RealtimeAlert) => void;
}

const RealtimeMonitoringPanel: React.FC<RealtimeMonitoringPanelProps> = ({
  onLocationUpdate,
  onAlertUpdate,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [recentLocations, setRecentLocations] = useState<RealtimeLocation[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<RealtimeAlert[]>([]);
  const [stats, setStats] = useState<RealtimeStats>({
    activeOrders: 0,
    totalLocations: 0,
    unresolvedAlerts: 0,
    lastUpdate: null,
  });

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      // Fetch recent locations
      const { data: locations } = await supabase
        .from('rastreamento_historico')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (locations) {
        setRecentLocations(locations);
      }

      // Fetch recent alerts
      const { data: alerts } = await supabase
        .from('rastreamento_alertas')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (alerts) {
        setRecentAlerts(alerts);
      }

      // Calculate stats
      const uniqueOrders = new Set(locations?.map(l => l.lalamove_order_id) || []);
      const unresolvedCount = alerts?.filter(a => !a.resolved).length || 0;

      setStats({
        activeOrders: uniqueOrders.size,
        totalLocations: locations?.length || 0,
        unresolvedAlerts: unresolvedCount,
        lastUpdate: locations?.[0] ? new Date(locations[0].created_at) : null,
      });
    };

    fetchInitialData();
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('tracking-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rastreamento_historico',
        },
        (payload) => {
          const newLocation = payload.new as RealtimeLocation;
          setRecentLocations(prev => [newLocation, ...prev.slice(0, 19)]);
          setStats(prev => ({
            ...prev,
            totalLocations: prev.totalLocations + 1,
            lastUpdate: new Date(),
          }));

          if (onLocationUpdate) {
            onLocationUpdate(newLocation);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rastreamento_alertas',
        },
        (payload) => {
          const newAlert = payload.new as RealtimeAlert;
          setStats(prev => ({
            ...prev,
            unresolvedAlerts: prev.unresolvedAlerts + 1,
          }));

          if (onAlertUpdate) {
            onAlertUpdate(newAlert);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rastreamento_alertas',
        },
        (payload) => {
          const updatedAlert = payload.new as RealtimeAlert;
          
          setRecentAlerts(prev => 
            prev.map(a => a.id === updatedAlert.id ? updatedAlert : a)
          );

          // Update unresolved count if alert was resolved
          if (updatedAlert.resolved) {
            setStats(prev => ({
              ...prev,
              unresolvedAlerts: Math.max(0, prev.unresolvedAlerts - 1),
            }));
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onLocationUpdate, onAlertUpdate]);

  const getStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'em_transito':
      case 'on_going':
        return 'bg-blue-500';
      case 'entregue':
      case 'completed':
        return 'bg-green-500';
      case 'coletado':
      case 'picked_up':
        return 'bg-amber-500';
      case 'cancelado':
      case 'canceled':
        return 'bg-red-500';
      default:
        return 'bg-muted';
    }
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return { 
          icon: <AlertTriangle className="h-4 w-4" />, 
          color: 'text-destructive',
          bg: 'bg-destructive/10',
          border: 'border-destructive/20'
        };
      case 'warning':
      case 'medium':
        return { 
          icon: <AlertTriangle className="h-4 w-4" />, 
          color: 'text-yellow-500',
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/20'
        };
      default:
        return { 
          icon: <Bell className="h-4 w-4" />, 
          color: 'text-muted-foreground',
          bg: 'bg-muted/50',
          border: 'border-border'
        };
    }
  };

  const formatAlertType = (type: string) => {
    const typeMap: Record<string, string> = {
      'route_deviation': 'Desvio de Rota',
      'stopped': 'Parada Prolongada',
      'speed_anomaly': 'Velocidade Anormal',
      'arrived_pickup': 'Chegou na Coleta',
      'arrived_delivery': 'Chegou no Destino',
      'order_canceled': 'Pedido Cancelado',
      'order_expired': 'Pedido Expirado',
    };
    return typeMap[type] || type;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Monitor em Tempo Real
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 gap-1">
                <Wifi className="h-3 w-3" />
                Conectado
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 gap-1">
                <WifiOff className="h-3 w-3" />
                Desconectado
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Truck className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold text-primary">{stats.activeOrders}</p>
            <p className="text-[10px] text-muted-foreground">Pedidos Ativos</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <MapPin className="h-5 w-5 mx-auto mb-1 text-blue-500" />
            <p className="text-2xl font-bold text-blue-500">{stats.totalLocations}</p>
            <p className="text-[10px] text-muted-foreground">Localizações</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-amber-500" />
            <p className="text-2xl font-bold text-amber-500">{stats.unresolvedAlerts}</p>
            <p className="text-[10px] text-muted-foreground">Alertas Pendentes</p>
          </div>
        </div>

        {stats.lastUpdate && (
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Última atualização: {format(stats.lastUpdate, "HH:mm:ss", { locale: ptBR })}
          </div>
        )}

        <Separator />

        {/* Alerts Section */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Alertas Recentes
          </h4>
          <ScrollArea className="h-[180px]">
            <AnimatePresence mode="popLayout">
              {recentAlerts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhum alerta recente
                </p>
              ) : (
                <div className="space-y-2">
                  {recentAlerts.slice(0, 10).map((alert) => {
                    const config = getSeverityConfig(alert.severity);
                    return (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={cn(
                          "p-2 rounded-lg border",
                          config.bg,
                          config.border,
                          alert.resolved && "opacity-50"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <div className={cn("mt-0.5", config.color)}>
                            {config.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-medium truncate">
                                {formatAlertType(alert.alert_type)}
                              </span>
                              {alert.resolved ? (
                                <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                              ) : (
                                <XCircle className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {alert.message}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {format(new Date(alert.created_at), "dd/MM HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </div>

        <Separator />

        {/* Locations Section */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Navigation className="h-4 w-4 text-blue-500" />
            Atualizações de Localização
          </h4>
          <ScrollArea className="h-[180px]">
            <AnimatePresence mode="popLayout">
              {recentLocations.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhuma localização recente
                </p>
              ) : (
                <div className="space-y-2">
                  {recentLocations.slice(0, 10).map((location) => (
                    <motion.div
                      key={location.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-2 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                          getStatusColor(location.order_status)
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium truncate">
                              {location.driver_name || `Pedido ${location.lalamove_order_id}`}
                            </span>
                            {location.driver_plate && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                {location.driver_plate}
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-2.5 w-2.5" />
                            {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {format(new Date(location.recorded_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealtimeMonitoringPanel;
