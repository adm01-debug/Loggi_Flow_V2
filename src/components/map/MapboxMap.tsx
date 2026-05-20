import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Info, Navigation, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  color?: string;
  popupHTML?: string;
  type?: 'truck' | 'delivery' | 'pickup' | 'origin';
  status?: string;
  heading?: number;
}

interface MapboxMapProps {
  markers?: MapMarker[];
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  showRoute?: boolean;
  originMarker?: { lat: number; lng: number; label?: string };
  className?: string;
  onMarkerClick?: (id: string) => void;
  showTraffic?: boolean;
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
      antialias: true
    });

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-right');
    map.current.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');

    map.current.on('load', () => {
      setLoading(false);
      // Add a soft glow effect to the style
      if (map.current) {
        map.current.setFog({
          'range': [0.5, 10],
          'color': '#000',
          'horizon-blend': 0.1,
          'star-intensity': 0.15
        });
      }
    });

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
      el.style.cssText = 'width:24px;height:24px;border-radius:8px;background:#06b6d4;display:flex;align-items:center;justify-content:center;box-shadow:0 0 15px #06b6d4;border:2px solid #fff;';
      el.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>';

      const m = new mapboxgl.Marker({ element: el })
        .setLngLat([originMarker.lng, originMarker.lat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<div style="padding:8px;font-size:12px;font-weight:900;color:#111;text-transform:uppercase;letter-spacing:1px">${originMarker.label || 'Nexus CD Central'}</div>`
        ))
        .addTo(map.current);
      markersRef.current.push(m);
    }

    // Add delivery markers
    markers.forEach(mk => {
      const el = document.createElement('div');
      const color = mk.color || '#3b82f6';
      
      if (mk.type === 'truck') {
        el.className = 'mapbox-truck-marker';
        el.style.cssText = `width:30px;height:30px;background:white;border-radius:50%;display:flex;align-items:center;justify-center;box-shadow:0 0 15px ${color};border:2px solid ${color};cursor:pointer;transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1);z-index:10;`;
        el.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(${mk.heading || 0}deg)"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-3v10a1 1 0 0 0 1 1Z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>`;
      } else {
        el.style.cssText = `width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 0 10px ${color}66;cursor:pointer;transition:all 0.2s cubic-bezier(0.4, 0, 0.2, 1);`;
      }

      el.addEventListener('mouseenter', () => { 
        el.style.transform = 'scale(1.25)';
        el.style.zIndex = '50';
      });
      el.addEventListener('mouseleave', () => { 
        el.style.transform = 'scale(1)';
        el.style.zIndex = mk.type === 'truck' ? '10' : '1';
      });

      const popup = new mapboxgl.Popup({ 
        offset: mk.type === 'truck' ? 35 : 20, 
        closeButton: false,
        className: 'nexus-map-popup'
      }).setHTML(
        mk.popupHTML || `
          <div style="padding:16px;background:#000;border-radius:24px;border:1px solid rgba(255,255,255,0.1);box-shadow:0 20px 40px rgba(0,0,0,0.8);max-width:240px;overflow:hidden;position:relative;">
            <div style="position:absolute;top:0;left:0;width:100%;height:4px;background:${color}"></div>
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
              <div style="width:32px;height:32px;border-radius:8px;background:${color}22;display:flex;align-items:center;justify-content:center;border:1px solid ${color}44">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
              <strong style="font-size:14px;color:#fff;font-family:system-ui, -apple-system, sans-serif;font-weight:900;letter-spacing:-0.5px">DESTINO_UNIT</strong>
            </div>
            <p style="font-size:11px;color:rgba(255,255,255,0.6);font-weight:700;line-height:1.4;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:0.5px">${mk.label || mk.id}</p>
            <div style="display:inline-flex;padding:4px 12px;border-radius:999px;font-size:9px;font-weight:900;color:${color};background:${color}15;border:1px solid ${color}33;text-transform:uppercase;letter-spacing:1px">
              LIVE_STATUS: NOMINAL
            </div>
          </div>
        `
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

  // Draw route lines from origin to each marker (Smarter curved paths)
  useEffect(() => {
    if (!map.current || !showRoute || !originMarker || markers.length === 0 || loading) return;

    const sourceId = 'route-lines';
    
    const addRouteLayer = () => {
      if (map.current!.getSource(sourceId)) {
        map.current!.removeLayer('route-layer-glow');
        map.current!.removeLayer('route-layer');
        map.current!.removeSource(sourceId);
      }

      const features = markers.map(mk => {
        // Simple arc calculation for visual excellence
        const lngDiff = mk.lng - originMarker.lng;
        const latDiff = mk.lat - originMarker.lat;
        const midLng = originMarker.lng + lngDiff / 2;
        const midLat = originMarker.lat + latDiff / 2 + (Math.abs(lngDiff) * 0.1); // add curve

        return {
          type: 'Feature' as const,
          properties: { color: mk.color || '#3b82f6' },
          geometry: {
            type: 'LineString' as const,
            coordinates: [
              [originMarker.lng, originMarker.lat],
              [midLng, midLat],
              [mk.lng, mk.lat],
            ],
          },
        };
      });

      map.current!.addSource(sourceId, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features },
      });

      // Glow Layer
      map.current!.addLayer({
        id: 'route-layer-glow',
        type: 'line',
        source: sourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 4,
          'line-opacity': 0.15,
          'line-blur': 3,
        },
      });

      map.current!.addLayer({
        id: 'route-layer',
        type: 'line',
        source: sourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2,
          'line-opacity': 0.6,
          'line-dasharray': [1, 2],
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
