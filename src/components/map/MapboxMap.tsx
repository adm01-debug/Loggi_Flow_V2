import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  color?: string;
  popupHTML?: string;
}

interface MapboxMapProps {
  markers?: MapMarker[];
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  showRoute?: boolean;
  originMarker?: { lat: number; lng: number; label?: string };
  className?: string;
  onMarkerClick?: (id: string) => void;
}

export function MapboxMap({
  markers = [],
  center = [-46.6333, -23.5505], // São Paulo default
  zoom = 5,
  showRoute = false,
  originMarker,
  className = '',
  onMarkerClick,
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch Mapbox token from edge function
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('get-mapbox-token');
        if (fnError || !data?.token) {
          setError('Token Mapbox não configurado');
          setLoading(false);
          return;
        }
        setToken(data.token);
      } catch {
        setError('Erro ao obter token Mapbox');
        setLoading(false);
      }
    };
    fetchToken();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!token || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center,
      zoom,
      attributionControl: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');

    map.current.on('load', () => setLoading(false));

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [token, center, zoom]);

  // Update markers
  useEffect(() => {
    if (!map.current || loading) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add origin marker
    if (originMarker) {
      const el = document.createElement('div');
      el.className = 'mapbox-origin-marker';
      el.style.cssText = 'width:20px;height:20px;border-radius:50%;background:#22c55e;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4);';

      const m = new mapboxgl.Marker({ element: el })
        .setLngLat([originMarker.lng, originMarker.lat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<div style="padding:4px;font-size:13px;font-weight:600;color:#111">${originMarker.label || 'Origem'}</div>`
        ))
        .addTo(map.current);
      markersRef.current.push(m);
    }

    // Add delivery markers
    markers.forEach(mk => {
      const el = document.createElement('div');
      const color = mk.color || '#3b82f6';
      el.style.cssText = `width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,.35);cursor:pointer;transition:transform .15s;`;
      el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.4)'; });
      el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; });

      const popup = new mapboxgl.Popup({ offset: 20, closeButton: false }).setHTML(
        mk.popupHTML || `<div style="padding:4px;font-size:12px;color:#111"><strong>${mk.label || mk.id}</strong></div>`
      );

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([mk.lng, mk.lat])
        .setPopup(popup)
        .addTo(map.current!);

      if (onMarkerClick) {
        el.addEventListener('click', () => onMarkerClick(mk.id));
      }

      markersRef.current.push(marker);
    });

    // Fit bounds if we have markers
    if (markers.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      if (originMarker) bounds.extend([originMarker.lng, originMarker.lat]);
      markers.forEach(mk => bounds.extend([mk.lng, mk.lat]));
      map.current.fitBounds(bounds, { padding: 60, maxZoom: 12 });
    }
  }, [markers, originMarker, loading, onMarkerClick]);

  // Draw route lines from origin to each marker
  useEffect(() => {
    if (!map.current || !showRoute || !originMarker || markers.length === 0 || loading) return;

    const sourceId = 'route-lines';
    
    const addRouteLayer = () => {
      if (map.current!.getSource(sourceId)) {
        map.current!.removeLayer('route-layer');
        map.current!.removeSource(sourceId);
      }

      const features = markers.map(mk => ({
        type: 'Feature' as const,
        properties: { color: mk.color || '#3b82f6' },
        geometry: {
          type: 'LineString' as const,
          coordinates: [
            [originMarker.lng, originMarker.lat],
            [mk.lng, mk.lat],
          ],
        },
      }));

      map.current!.addSource(sourceId, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features },
      });

      map.current!.addLayer({
        id: 'route-layer',
        type: 'line',
        source: sourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 1.5,
          'line-opacity': 0.4,
          'line-dasharray': [2, 4],
        },
      });
    };

    if (map.current.isStyleLoaded()) {
      addRouteLayer();
    } else {
      map.current.on('style.load', addRouteLayer);
    }
  }, [markers, originMarker, showRoute, loading]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-muted/50 rounded-lg ${className}`}>
        <div className="text-center text-muted-foreground p-8">
          <p className="text-sm font-medium">{error}</p>
          <p className="text-xs mt-1">Verifique a configuração do Mapbox</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative rounded-lg overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full min-h-[400px]" />
    </div>
  );
}
