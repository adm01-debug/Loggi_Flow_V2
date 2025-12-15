import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useDeliveryRoutes, ORIGIN_COORDINATES, getStatusColor, getStatusLabel, DeliveryRoute } from '@/hooks/useDeliveryRoutes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Route, Layers, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

type ViewMode = 'points' | 'routes' | 'clusters';

const DeliveryMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('points');
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryRoute | null>(null);
  
  const { 
    data: deliveries, 
    isLoading, 
    isRefetching,
    isGeocoding,
    geocodingProgress,
    refetchWithGeocoding
  } = useDeliveryRoutes();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    mapboxgl.accessToken = 'pk.eyJ1IjoibG92YWJsZWRldiIsImEiOiJjbHdzbWRlMnkwYjV0MnFudmt0eXJlbWU3In0.3RYzaGgpYbhG3BXWnzPQww';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-55, -15], // Centro do Brasil
      zoom: 4,
      pitch: 30,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add origin marker (empresa)
    const originEl = document.createElement('div');
    originEl.className = 'origin-marker';
    originEl.innerHTML = `
      <div style="
        width: 24px;
        height: 24px;
        background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%);
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(139, 92, 246, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
      </div>
    `;
    
    new mapboxgl.Marker(originEl)
      .setLngLat([ORIGIN_COORDINATES.lng, ORIGIN_COORDINATES.lat])
      .setPopup(new mapboxgl.Popup().setHTML('<strong>Promo Brindes</strong><br/>São Paulo, SP'))
      .addTo(map.current);

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update markers when deliveries change
  useEffect(() => {
    if (!map.current || !deliveries) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Clear existing sources and layers for routes
    if (map.current.getLayer('route-lines')) {
      map.current.removeLayer('route-lines');
    }
    if (map.current.getSource('routes')) {
      map.current.removeSource('routes');
    }

    const deliveriesWithCoords = deliveries.filter(d => d.coordinates);

    if (viewMode === 'points' || viewMode === 'routes') {
      // Add markers for each delivery
      deliveriesWithCoords.forEach(delivery => {
        if (!delivery.coordinates) return;

        const color = getStatusColor(delivery.status);
        
        const el = document.createElement('div');
        el.className = 'delivery-marker';
        el.innerHTML = `
          <div style="
            width: 16px;
            height: 16px;
            background: ${color};
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: transform 0.2s ease;
          " onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'"></div>
        `;
        
        el.addEventListener('click', () => {
          setSelectedDelivery(delivery);
        });

        const marker = new mapboxgl.Marker(el)
          .setLngLat([delivery.coordinates.lng, delivery.coordinates.lat])
          .addTo(map.current!);

        markersRef.current.push(marker);
      });
    }

    if (viewMode === 'routes') {
      // Add route lines
      const routeFeatures = deliveriesWithCoords.map(delivery => ({
        type: 'Feature' as const,
        properties: {
          status: delivery.status,
          color: getStatusColor(delivery.status),
        },
        geometry: {
          type: 'LineString' as const,
          coordinates: [
            [ORIGIN_COORDINATES.lng, ORIGIN_COORDINATES.lat],
            [delivery.coordinates!.lng, delivery.coordinates!.lat],
          ],
        },
      }));

      if (routeFeatures.length > 0) {
        map.current.addSource('routes', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: routeFeatures,
          },
        });

        map.current.addLayer({
          id: 'route-lines',
          type: 'line',
          source: 'routes',
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 2,
            'line-opacity': 0.7,
            'line-dasharray': [2, 2],
          },
        });
      }
    }

    if (viewMode === 'clusters') {
      // Group deliveries by estado
      const clusters: Record<string, DeliveryRoute[]> = {};
      deliveriesWithCoords.forEach(delivery => {
        const estado = delivery.cliente?.estado || 'Outros';
        if (!clusters[estado]) clusters[estado] = [];
        clusters[estado].push(delivery);
      });

      Object.entries(clusters).forEach(([estado, clusterDeliveries]) => {
        if (clusterDeliveries.length === 0) return;
        
        // Use first delivery's coordinates as cluster center
        const coords = clusterDeliveries[0].coordinates;
        if (!coords) return;

        // Determine predominant status
        const statusCounts: Record<string, number> = {};
        clusterDeliveries.forEach(d => {
          statusCounts[d.status] = (statusCounts[d.status] || 0) + 1;
        });
        const predominantStatus = Object.entries(statusCounts).sort((a, b) => b[1] - a[1])[0][0];
        const color = getStatusColor(predominantStatus);

        const el = document.createElement('div');
        el.className = 'cluster-marker';
        el.innerHTML = `
          <div style="
            min-width: 40px;
            height: 40px;
            background: ${color};
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 3px 10px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
            cursor: pointer;
          ">${clusterDeliveries.length}</div>
        `;

        el.addEventListener('click', () => {
          if (map.current && coords) {
            map.current.flyTo({
              center: [coords.lng, coords.lat],
              zoom: 6,
            });
          }
        });

        const marker = new mapboxgl.Marker(el)
          .setLngLat([coords.lng, coords.lat])
          .addTo(map.current!);

        markersRef.current.push(marker);
      });
    }
  }, [deliveries, viewMode]);

  // Status legend
  const statusLegend = [
    { status: 'aguardando_producao', label: 'Aguardando Produção' },
    { status: 'pronto_despacho', label: 'Pronto p/ Despacho' },
    { status: 'despachado', label: 'Despachado' },
    { status: 'em_transito', label: 'Em Trânsito' },
    { status: 'saiu_entrega', label: 'Saiu p/ Entrega' },
    { status: 'ocorrencia', label: 'Ocorrência' },
  ];

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Mapa de Rotas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-[500px] rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'points' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('points')}
              >
                <MapPin className="h-4 w-4 mr-1" />
                Pontos
              </Button>
              <Button
                variant={viewMode === 'routes' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('routes')}
              >
                <Route className="h-4 w-4 mr-1" />
                Rotas
              </Button>
              <Button
                variant={viewMode === 'clusters' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('clusters')}
              >
                <Layers className="h-4 w-4 mr-1" />
                Clusters
              </Button>
            </div>
            
            <div className="flex items-center gap-4">
              {isGeocoding && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Geocodificando... {geocodingProgress.current}/{geocodingProgress.total}</span>
                </div>
              )}
              {!isGeocoding && deliveries && deliveries.some(d => d.geocoded) && (
                <div className="flex items-center gap-1 text-xs text-green-500">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Geocodificado</span>
                </div>
              )}
              <div className="text-sm text-muted-foreground">
                {deliveries?.filter(d => d.coordinates).length || 0} entregas ativas
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetchWithGeocoding()}
                disabled={isRefetching || isGeocoding}
              >
                <RefreshCw className={`h-4 w-4 ${isRefetching || isGeocoding ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map */}
        <Card className="lg:col-span-3">
          <CardContent className="p-0">
            <div 
              ref={mapContainer} 
              className="w-full h-[500px] rounded-lg overflow-hidden"
            />
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Legend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Legenda de Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {statusLegend.map(({ status, label }) => (
                <div key={status} className="flex items-center gap-2 text-xs">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: getStatusColor(status) }}
                  />
                  <span className="text-muted-foreground">{label}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Selected Delivery Details */}
          {selectedDelivery && (
            <Card className="animate-in slide-in-from-right-5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  {selectedDelivery.numero_entrega}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedDelivery(null)}
                    className="h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div>
                  <Badge 
                    variant="outline"
                    style={{ 
                      borderColor: getStatusColor(selectedDelivery.status),
                      color: getStatusColor(selectedDelivery.status),
                    }}
                  >
                    {getStatusLabel(selectedDelivery.status)}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Cliente:</span>
                  <p className="font-medium">
                    {selectedDelivery.cliente?.nome_fantasia || selectedDelivery.cliente?.razao_social || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Destino:</span>
                  <p>{selectedDelivery.cliente?.cidade}, {selectedDelivery.cliente?.estado}</p>
                </div>
                {selectedDelivery.transportadora && (
                  <div>
                    <span className="text-muted-foreground">Transportadora:</span>
                    <p>{selectedDelivery.transportadora.nome_fantasia}</p>
                  </div>
                )}
                {selectedDelivery.previsao_entrega && (
                  <div>
                    <span className="text-muted-foreground">Previsão:</span>
                    <p>{new Date(selectedDelivery.previsao_entrega).toLocaleDateString('pt-BR')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryMap;
