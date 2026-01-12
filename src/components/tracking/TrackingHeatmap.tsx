import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Flame, MapPin, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
  type: 'stop' | 'delay' | 'alert';
}

const TrackingHeatmap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([]);
  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [mapToken, setMapToken] = useState<string | null>(null);
  const [stats, setStats] = useState({ stops: 0, alerts: 0, hotspots: 0 });

  // Fetch Mapbox token from edge function or use environment
  useEffect(() => {
    const fetchToken = async () => {
      try {
        // Try to get from Supabase secrets via edge function
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (!error && data?.token) {
          setMapToken(data.token);
        } else {
          // Fallback to environment variable
          setMapToken(import.meta.env.VITE_MAPBOX_TOKEN || '');
        }
      } catch {
        setMapToken(import.meta.env.VITE_MAPBOX_TOKEN || '');
      }
    };
    fetchToken();
  }, []);

  // Fetch heatmap data
  const fetchHeatmapData = async () => {
    setIsLoading(true);
    try {
      // Fetch tracking history
      const { data: trackingData, error: trackingError } = await supabase
        .from('rastreamento_historico')
        .select('*')
        .gte('recorded_at', dateFrom.toISOString())
        .lte('recorded_at', dateTo.toISOString())
        .order('recorded_at', { ascending: true });

      if (trackingError) throw trackingError;

      // Fetch alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('rastreamento_alertas')
        .select('*')
        .gte('created_at', dateFrom.toISOString())
        .lte('created_at', dateTo.toISOString());

      if (alertsError) throw alertsError;

      // Process tracking data to identify stops
      const points: HeatmapPoint[] = [];
      const STOP_THRESHOLD_METERS = 50;

      if (trackingData && trackingData.length > 0) {
        // Group by order
        const groupedByOrder: Record<string, typeof trackingData> = {};
        trackingData.forEach((point) => {
          if (!groupedByOrder[point.lalamove_order_id]) {
            groupedByOrder[point.lalamove_order_id] = [];
          }
          groupedByOrder[point.lalamove_order_id].push(point);
        });

        // Identify stops within each order
        Object.values(groupedByOrder).forEach((orderPoints) => {
          for (let i = 1; i < orderPoints.length; i++) {
            const prev = orderPoints[i - 1];
            const curr = orderPoints[i];
            
            const distance = calculateDistance(
              prev.latitude,
              prev.longitude,
              curr.latitude,
              curr.longitude
            );

            const timeDiff = (new Date(curr.recorded_at).getTime() - new Date(prev.recorded_at).getTime()) / 1000;

            // If barely moved but time passed (stopped)
            if (distance * 1000 < STOP_THRESHOLD_METERS && timeDiff > 120) {
              points.push({
                lat: curr.latitude,
                lng: curr.longitude,
                weight: Math.min(timeDiff / 60, 30), // Weight by stop duration (max 30 min)
                type: 'stop',
              });
            }
          }
        });
      }

      // Add alert locations
      if (alertsData) {
        alertsData.forEach((alert) => {
          if (alert.latitude && alert.longitude) {
            points.push({
              lat: alert.latitude,
              lng: alert.longitude,
              weight: alert.severity === 'critical' ? 20 : 10,
              type: 'alert',
            });
          }
        });
      }

      // Calculate stats
      const stopCount = points.filter(p => p.type === 'stop').length;
      const alertCount = points.filter(p => p.type === 'alert').length;
      
      // Identify hotspots (clusters of points)
      const hotspots = identifyHotspots(points);

      setStats({ stops: stopCount, alerts: alertCount, hotspots });
      setHeatmapData(points);
    } catch {
      // Silent fail - heatmap data is non-critical
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHeatmapData();
  }, [dateFrom, dateTo]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapToken || heatmapData.length === 0) return;

    mapboxgl.accessToken = mapToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-46.6333, -23.5505], // São Paulo default
      zoom: 10,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      if (!map.current) return;

      // Convert points to GeoJSON
      const geojsonData: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: heatmapData.map((point) => ({
          type: 'Feature',
          properties: {
            weight: point.weight,
            type: point.type,
          },
          geometry: {
            type: 'Point',
            coordinates: [point.lng, point.lat],
          },
        })),
      };

      // Add source
      map.current.addSource('heatmap-data', {
        type: 'geojson',
        data: geojsonData,
      });

      // Add heatmap layer
      map.current.addLayer({
        id: 'heatmap-layer',
        type: 'heatmap',
        source: 'heatmap-data',
        paint: {
          'heatmap-weight': ['get', 'weight'],
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,
            15, 3,
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(33,102,172,0)',
            0.2, 'rgb(103,169,207)',
            0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)',
            0.8, 'rgb(239,138,98)',
            1, 'rgb(178,24,43)',
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 2,
            15, 30,
          ],
          'heatmap-opacity': 0.8,
        },
      });

      // Fit bounds to data
      if (heatmapData.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        heatmapData.forEach((point) => {
          bounds.extend([point.lng, point.lat]);
        });
        map.current.fitBounds(bounds, { padding: 50 });
      }
    });

    return () => {
      map.current?.remove();
    };
  }, [mapToken, heatmapData]);

  if (!mapToken) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
          <p className="text-muted-foreground">
            Token do Mapbox não configurado. Configure o MAPBOX_PUBLIC_TOKEN nos secrets.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Mapa de Calor - Paradas e Atrasos
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">De:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateFrom, "dd/MM/yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={(d) => d && setDateFrom(d)} locale={ptBR} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Até:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[160px] justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateTo, "dd/MM/yyyy", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={(d) => d && setDateTo(d)} locale={ptBR} />
                </PopoverContent>
              </Popover>
            </div>
            <Button variant="outline" size="icon" onClick={fetchHeatmapData} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>

          <div className="flex gap-3">
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {stats.stops} paradas
            </Badge>
            <Badge variant="destructive" className="gap-1.5 px-3 py-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              {stats.alerts} alertas
            </Badge>
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5 border-orange-500 text-orange-500">
              <Flame className="h-3.5 w-3.5" />
              {stats.hotspots} hotspots
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardContent className="p-0 overflow-hidden rounded-lg">
          {isLoading ? (
            <Skeleton className="w-full h-[500px]" />
          ) : heatmapData.length === 0 ? (
            <div className="h-[500px] flex flex-col items-center justify-center text-muted-foreground">
              <MapPin className="h-16 w-16 mb-4 opacity-30" />
              <p className="text-lg">Nenhum dado de rastreamento encontrado</p>
              <p className="text-sm">Selecione um período diferente ou aguarde novos dados</p>
            </div>
          ) : (
            <div ref={mapContainer} className="w-full h-[500px]" />
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-400" />
              <span className="text-sm text-muted-foreground">Baixa concentração</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-400" />
              <span className="text-sm text-muted-foreground">Média concentração</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500" />
              <span className="text-sm text-muted-foreground">Alta concentração</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-600" />
              <span className="text-sm text-muted-foreground">Hotspot crítico</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper: Calculate distance between two points (Haversine)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // km
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper: Identify hotspots (clusters)
function identifyHotspots(points: HeatmapPoint[]): number {
  if (points.length === 0) return 0;
  
  const CLUSTER_RADIUS_KM = 0.5;
  const visited = new Set<number>();
  let hotspots = 0;

  points.forEach((point, i) => {
    if (visited.has(i)) return;
    
    let clusterSize = 0;
    points.forEach((other, j) => {
      if (i === j || visited.has(j)) return;
      const dist = calculateDistance(point.lat, point.lng, other.lat, other.lng);
      if (dist < CLUSTER_RADIUS_KM) {
        clusterSize++;
        visited.add(j);
      }
    });

    if (clusterSize >= 3) {
      hotspots++;
    }
    visited.add(i);
  });

  return hotspots;
}

export default TrackingHeatmap;
