import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Truck, 
  MapPin, 
  Navigation, 
  AlertTriangle, 
  Phone, 
  User, 
  Clock,
  Play,
  Square,
  Bell,
  X,
  RefreshCw,
  Car
} from 'lucide-react';
import { useLalamoveTracking } from '@/hooks/useLalamoveTracking';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const DriverTrackingMap: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const driverMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const routeSourceRef = useRef<boolean>(false);
  
  const [orderId, setOrderId] = useState('');
  const [useSandbox, setUseSandbox] = useState(true);
  
  const {
    driverLocation,
    orderDetails,
    alerts,
    locationHistory,
    isTracking,
    isLoading,
    error,
    startTracking,
    stopTracking,
    clearAlert,
    refetchDriverLocation,
  } = useLalamoveTracking(orderId || null, useSandbox);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = 'pk.eyJ1IjoibG92YWJsZWRldiIsImEiOiJjbHdzbWRlMnkwYjV0MnFudmt0eXJlbWU3In0.3RYzaGgpYbhG3BXWnzPQww';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-46.6333, -23.5505], // São Paulo default
      zoom: 12,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update map with order stops
  useEffect(() => {
    if (!map.current || !orderDetails?.stops) return;

    // Clear existing markers for stops
    const existingMarkers = document.querySelectorAll('.stop-marker');
    existingMarkers.forEach(m => m.remove());

    // Add markers for each stop
    orderDetails.stops.forEach((stop, index) => {
      const isOrigin = index === 0;
      const isDestination = index === orderDetails.stops.length - 1;
      
      const el = document.createElement('div');
      el.className = 'stop-marker';
      el.innerHTML = `
        <div style="
          width: 32px;
          height: 32px;
          background: ${isOrigin ? '#10B981' : isDestination ? '#EF4444' : '#6366F1'};
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 12px;
        ">${isOrigin ? 'O' : isDestination ? 'D' : index}</div>
      `;

      new mapboxgl.Marker(el)
        .setLngLat([stop.coordinates.lng, stop.coordinates.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`
          <strong>${isOrigin ? 'Coleta' : 'Entrega'}</strong><br/>
          ${stop.address}<br/>
          <small>${stop.name} - ${stop.phone}</small>
        `))
        .addTo(map.current!);
    });

    // Draw route line
    if (orderDetails.stops.length >= 2) {
      const routeCoordinates = orderDetails.stops.map(stop => [
        stop.coordinates.lng,
        stop.coordinates.lat,
      ]);

      if (routeSourceRef.current) {
        (map.current.getSource('route') as mapboxgl.GeoJSONSource)?.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: routeCoordinates,
          },
        });
      } else {
        map.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: routeCoordinates,
            },
          },
        });

        map.current.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          paint: {
            'line-color': '#8B5CF6',
            'line-width': 4,
            'line-dasharray': [2, 1],
          },
        });

        routeSourceRef.current = true;
      }

      // Fit map to show all stops
      const bounds = new mapboxgl.LngLatBounds();
      orderDetails.stops.forEach(stop => {
        bounds.extend([stop.coordinates.lng, stop.coordinates.lat]);
      });
      map.current.fitBounds(bounds, { padding: 80 });
    }
  }, [orderDetails]);

  // Update driver marker
  useEffect(() => {
    if (!map.current || !driverLocation) return;

    const { lat, lng } = driverLocation.coordinates;

    if (driverMarkerRef.current) {
      driverMarkerRef.current.setLngLat([lng, lat]);
    } else {
      const el = document.createElement('div');
      el.className = 'driver-marker';
      el.innerHTML = `
        <div style="
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
          border-radius: 50%;
          border: 4px solid white;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 2s infinite;
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5a2 2 0 0 0-2 2v8h1"/>
            <circle cx="7.5" cy="17.5" r="2.5"/>
            <circle cx="17.5" cy="17.5" r="2.5"/>
          </svg>
        </div>
      `;

      driverMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .addTo(map.current);
    }

    // Smooth pan to driver
    map.current.panTo([lng, lat], { duration: 1000 });
  }, [driverLocation]);

  // Draw location history trail
  useEffect(() => {
    if (!map.current || locationHistory.length < 2) return;

    const trailCoordinates = locationHistory.map(loc => [loc.lng, loc.lat]);

    if (map.current.getSource('trail')) {
      (map.current.getSource('trail') as mapboxgl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: trailCoordinates,
        },
      });
    } else {
      map.current.addSource('trail', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: trailCoordinates,
          },
        },
      });

      map.current.addLayer({
        id: 'trail-line',
        type: 'line',
        source: 'trail',
        paint: {
          'line-color': '#F59E0B',
          'line-width': 3,
          'line-opacity': 0.7,
        },
      });
    }
  }, [locationHistory]);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      'ASSIGNING_DRIVER': { label: 'Buscando Motorista', variant: 'secondary' },
      'ON_GOING': { label: 'Em Andamento', variant: 'default' },
      'PICKED_UP': { label: 'Coletado', variant: 'default' },
      'COMPLETED': { label: 'Entregue', variant: 'secondary' },
      'CANCELED': { label: 'Cancelado', variant: 'destructive' },
      'REJECTED': { label: 'Rejeitado', variant: 'destructive' },
      'EXPIRED': { label: 'Expirado', variant: 'outline' },
    };
    
    const config = statusMap[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            Rastreamento Lalamove
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="orderId">ID do Pedido Lalamove</Label>
              <Input
                id="orderId"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Ex: 107900701184"
                disabled={isTracking}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                id="sandbox"
                checked={useSandbox}
                onCheckedChange={setUseSandbox}
                disabled={isTracking}
              />
              <Label htmlFor="sandbox" className="text-sm">Sandbox</Label>
            </div>

            {!isTracking ? (
              <Button
                onClick={startTracking}
                disabled={!orderId || isLoading}
                className="gap-2"
              >
                <Play className="h-4 w-4" />
                Iniciar Rastreamento
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={refetchDriverLocation}
                  size="icon"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  onClick={stopTracking}
                  className="gap-2"
                >
                  <Square className="h-4 w-4" />
                  Parar
                </Button>
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map */}
        <Card className="lg:col-span-3">
          <CardContent className="p-0 relative">
            <div 
              ref={mapContainer} 
              className="w-full h-[500px] rounded-lg overflow-hidden"
            />
            
            {/* Map overlay with driver info */}
            {driverLocation && (
              <div className="absolute top-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-border">
                <div className="flex items-center gap-3">
                  {driverLocation.photo ? (
                    <img 
                      src={driverLocation.photo} 
                      alt={driverLocation.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-primary"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{driverLocation.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      {driverLocation.plateNumber}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tracking indicator */}
            {isTracking && (
              <div className="absolute bottom-4 right-4 bg-green-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 animate-pulse">
                <span className="w-2 h-2 bg-white rounded-full"></span>
                Rastreando em tempo real
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Order Info */}
          {orderDetails && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  Pedido {orderDetails.orderId}
                  {getStatusBadge(orderDetails.status)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div>
                  <span className="text-muted-foreground">Distância:</span>
                  <p className="font-medium">
                    {(parseInt(orderDetails.distance.value) / 1000).toFixed(1)} km
                  </p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  {orderDetails.stops.map((stop, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <MapPin className={cn(
                        "h-3 w-3 mt-0.5",
                        idx === 0 ? "text-green-500" : "text-red-500"
                      )} />
                      <div>
                        <p className="font-medium">{stop.name}</p>
                        <p className="text-muted-foreground text-[10px]">{stop.address}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {orderDetails.shareLink && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => window.open(orderDetails.shareLink, '_blank')}
                  >
                    Ver no Lalamove
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Driver Info */}
          {driverLocation && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Motorista</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{driverLocation.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{driverLocation.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4 text-muted-foreground" />
                  <span>{driverLocation.plateNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Atualizado: {new Date(driverLocation.coordinates.updatedAt).toLocaleTimeString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[10px]">
                    {driverLocation.coordinates.lat.toFixed(6)}, {driverLocation.coordinates.lng.toFixed(6)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alerts */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Alertas
                {alerts.length > 0 && (
                  <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                    {alerts.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px]">
                {alerts.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Nenhum alerta
                  </p>
                ) : (
                  <div className="space-y-2">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={cn(
                          "p-2 rounded-md text-xs flex items-start gap-2",
                          alert.severity === 'critical' && "bg-destructive/10 border border-destructive/20",
                          alert.severity === 'warning' && "bg-yellow-500/10 border border-yellow-500/20",
                          alert.severity === 'info' && "bg-muted"
                        )}
                      >
                        {getAlertIcon(alert.severity)}
                        <div className="flex-1">
                          <p>{alert.message}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {alert.timestamp.toLocaleTimeString('pt-BR')}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => clearAlert(alert.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default DriverTrackingMap;
