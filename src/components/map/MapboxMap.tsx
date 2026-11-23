/* eslint-disable max-lines */
import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { resolveMapStyle } from "@/lib/mapStyles";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CENTRO_DISTRIBUICAO } from "@/lib/centroDistribuicao";

/** Escapa caracteres especiais HTML para evitar XSS em conteúdo interpolado. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Valida cor hexadecimal; retorna fallback se não casar (#3b82f6). */
function safeColor(value: string | undefined | null, fallback = "#3b82f6"): string {
  return /^#[0-9a-f]{3,8}$/i.test(value ?? "") ? (value as string) : fallback;
}

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  color?: string;
  popupHTML?: string;
  type?: "truck" | "delivery" | "pickup" | "origin";
  status?: string;
  heading?: number;
  isAnomaly?: boolean;
}

interface MapboxMapProps {
  markers?: MapMarker[];
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  showRoute?: boolean;
  showRouteLines?: boolean;

  originMarker?: { lat: number; lng: number; label?: string };
  className?: string;
  onMarkerClick?: (id: string) => void;
  showTraffic?: boolean;
  showWeather?: boolean;
  isDroneView?: boolean;
  mapStyle?: "dark" | "satellite";
  pitch?: number;
  riskZones?: {
    id: string;
    center: [number, number];
    radius: number;
    severity: "low" | "medium" | "high";
  }[];
}

export function MapboxMap({
  markers = [],
  center = [CENTRO_DISTRIBUICAO.lng, CENTRO_DISTRIBUICAO.lat],
  zoom = 5,
  showRoute = false,
  showRouteLines = false,

  originMarker,
  className = "",
  onMarkerClick,
  showTraffic = false,
  showWeather = false,
  isDroneView = false,
  mapStyle = "dark",
  pitch = 0,
  riskZones = [],
}: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: resolveMapStyle(mapStyle === "satellite" ? "satellite" : "dark"),
        center,
        zoom,
        pitch,
        attributionControl: false,
        canvasContextAttributes: { antialias: true },
      });
    } catch {
      queueMicrotask(() => {
        setError("Falha ao inicializar o mapa");
        setLoading(false);
      });
      return;
    }

    map.current.addControl(
      new maplibregl.NavigationControl({ showCompass: true }),
      "top-right",
    );
    map.current.addControl(new maplibregl.FullscreenControl(), "top-right");
    map.current.addControl(new maplibregl.ScaleControl(), "bottom-right");
    map.current.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-left",
    );

    map.current.on("load", () => {
      setLoading(false);

      if (map.current) {
        // Add custom pulsing dot for animations using a closure for context
        const size = 150;
        let ctx: CanvasRenderingContext2D | null = null;

        const pulsingDot = {
          width: size,
          height: size,
          data: new Uint8Array(size * size * 4),
          onAdd: function () {
            const canvas = document.createElement("canvas");
            canvas.width = this.width;
            canvas.height = this.height;
            ctx = canvas.getContext("2d", { willReadFrequently: true });
          },
          render: function () {
            if (!ctx) return false;
            const duration = 1500;
            const t = (performance.now() % duration) / duration;
            const radius = (size / 2) * 0.3;
            const outerRadius = (size / 2) * 0.7 * t + radius;

            ctx.clearRect(0, 0, this.width, this.height);
            ctx.beginPath();
            ctx.arc(
              this.width / 2,
              this.height / 2,
              outerRadius,
              0,
              Math.PI * 2,
            );
            ctx.fillStyle = `rgba(6, 182, 212, ${1 - t})`;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(6, 182, 212, 1)";
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2 + 4 * (1 - t);
            ctx.fill();
            ctx.stroke();

            // Fix: Cast the clamped array to Uint8Array for Mapbox compatibility
            const imageData = ctx.getImageData(
              0,
              0,
              this.width,
              this.height,
            ).data;
            this.data = new Uint8Array(imageData.buffer as ArrayBuffer);

            map.current?.triggerRepaint();
            return true;
          },
        };

        map.current.addImage("pulsing-dot", pulsingDot as unknown as ImageData, {
          pixelRatio: 2,
        });

        // Equivalente ao antigo setFog do Mapbox: horizonte escuro com neblina sutil.
        map.current.setSky({
          "sky-color": "#000000",
          "horizon-color": "#000000",
          "fog-color": "#000000",
          "fog-ground-blend": 0.5,
          "horizon-fog-blend": 0.1,
          "sky-horizon-blend": 0.8,
          "atmosphere-blend": 0.8,
        });
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center, zoom, riskZones]); // Re-init if core props change significantly

  // Handle Style, Pitch and Traffic changes
  useEffect(() => {
    if (!map.current) return;

    const newStyle = resolveMapStyle(
      mapStyle === "satellite" ? "satellite" : "dark",
    );

    // Smooth transition between styles
    map.current.setStyle(newStyle, { diff: true } as Parameters<typeof map.current.setStyle>[1]);

    // Continual animation for pitch/bearing
    map.current.easeTo({
      pitch: pitch,
      bearing: mapStyle === "satellite" || isDroneView ? 15 : 0,
      zoom: isDroneView ? 16 : map.current.getZoom(),
      duration: 2500,
      easing: (t) =>
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2, // easeInOutCubic for cinematic flow
      essential: true,
    });

    let rotateRafId: number;
    let rotateTimeoutId: ReturnType<typeof setTimeout>;

    if (isDroneView && markers.length > 0) {
      const target = markers[0];
      map.current.flyTo({
        center: [target.lng, target.lat],
        zoom: 16,
        pitch: 60,
        bearing: 0,
        duration: 2000,
      });

      let bearing = 0;
      const rotateCamera = () => {
        if (!isDroneView || !map.current) return;
        bearing += 0.05;
        map.current.setBearing(bearing % 360);

        if (markers.length > 0) {
          map.current.setCenter([markers[0].lng, markers[0].lat]);
        }

        rotateRafId = requestAnimationFrame(rotateCamera);
      };
      rotateTimeoutId = setTimeout(() => {
        rotateRafId = requestAnimationFrame(rotateCamera);
      }, 2000);
    }

    const updateTraffic = () => {
      if (!map.current) return;
      try {
        const layers = map.current.getStyle()?.layers;
        if (layers) {
          layers.forEach((layer) => {
            if (layer.id.includes("traffic")) {
              map.current?.setLayoutProperty(
                layer.id,
                "visibility",
                showTraffic ? "visible" : "none",
              );
            }
          });
        }
      } catch (e) {
        console.warn("Traffic layer error:", e);
      }
    };

    // Weather Layer Logic
    const updateWeather = () => {
      if (!map.current) return;
      const weatherSourceId = "nexus-weather";

      if (showWeather) {
        if (!map.current.getSource(weatherSourceId)) {
          map.current.addSource(weatherSourceId, {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  properties: {},
                  geometry: {
                    type: "Polygon",
                    coordinates: [
                      [
                        [-48, -24],
                        [-45, -24],
                        [-45, -22],
                        [-48, -22],
                        [-48, -24],
                      ],
                    ],
                  },
                },
              ],
            },
          });

          map.current.addLayer({
            id: "weather-layer",
            type: "fill",
            source: weatherSourceId,
            paint: {
              "fill-color": "#3b82f6",
              "fill-opacity": 0.15,
              "fill-outline-color": "#60a5fa",
            },
          });

          // Pulse effect for weather
          let opacity = 0.15;
          let direction = 1;
          const animateWeather = () => {
            if (!map.current?.getLayer("weather-layer")) return;
            opacity += 0.005 * direction;
            if (opacity > 0.3 || opacity < 0.1) direction *= -1;
            map.current.setPaintProperty(
              "weather-layer",
              "fill-opacity",
              opacity,
            );
            requestAnimationFrame(animateWeather);
          };
          requestAnimationFrame(animateWeather);
        }
      } else {
        if (map.current.getLayer("weather-layer")) {
          map.current.removeLayer("weather-layer");
          map.current.removeSource(weatherSourceId);
        }
      }
    };

    if (map.current.isStyleLoaded()) {
      updateTraffic();
      updateWeather();
    } else {
      map.current.once("style.load", () => {
        updateTraffic();
        updateWeather();
      });
    }

    return () => {
      clearTimeout(rotateTimeoutId);
      cancelAnimationFrame(rotateRafId);
    };
  }, [mapStyle, pitch, showTraffic, showWeather, isDroneView, markers]);

  // Risk Zones Visualization
  useEffect(() => {
    if (!map.current || loading) return;

    const sourceId = "risk-zones";
    const updateRiskZones = () => {
      if (!map.current) return;

      if (map.current.getSource(sourceId)) {
        map.current.removeLayer("risk-zones-layer");
        map.current.removeLayer("risk-zones-label");
        map.current.removeSource(sourceId);
      }

      if (riskZones.length === 0) return;

      const severityColor = (s: string) => {
        if (s === "high") return "#ef4444";
        if (s === "medium") return "#f59e0b";
        return "#3b82f6";
      };
      const features = riskZones.map((zone) => ({
        type: "Feature" as const,
        properties: {
          severity: zone.severity,
          color: severityColor(zone.severity),
          label: zone.severity.toUpperCase() + " RISK ZONE",
        },
        geometry: {
          type: "Point" as const,
          coordinates: zone.center,
        },
      }));

      map.current.addSource(sourceId, {
        type: "geojson",
        data: { type: "FeatureCollection", features },
      });

      map.current.addLayer({
        id: "risk-zones-layer",
        type: "circle",
        source: sourceId,
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            5,
            20,
            15,
            100,
          ],
          "circle-color": ["get", "color"],
          "circle-opacity": 0.15,
          "circle-stroke-width": 2,
          "circle-stroke-color": ["get", "color"],
          "circle-stroke-opacity": 0.5,
        },
      });

      map.current.addLayer({
        id: "risk-zones-label",
        type: "symbol",
        source: sourceId,
        layout: {
          "text-field": ["get", "label"],
          "text-font": ["DIN Offc Pro Bold", "Arial Unicode MS Bold"],
          "text-size": 10,
          "text-offset": [0, 1.5],
        },
        paint: {
          "text-color": ["get", "color"],
          "text-halo-color": "rgba(0,0,0,0.8)",
          "text-halo-width": 1,
        },
      });
    };

    if (map.current.isStyleLoaded()) {
      updateRiskZones();
    } else {
      map.current.once("style.load", updateRiskZones);
    }
  }, [riskZones, loading]);

  // Update markers
  useEffect(() => {
    if (!map.current || loading) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add origin marker
    if (originMarker) {
      const el = document.createElement("div");
      el.className = "mapbox-origin-marker";
      el.style.cssText =
        "width:24px;height:24px;border-radius:8px;background:#06b6d4;display:flex;align-items:center;justify-content:center;box-shadow:0 0 15px #06b6d4;border:2px solid #fff;";
      el.innerHTML =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>';

      const m = new maplibregl.Marker({ element: el })
        .setLngLat([originMarker.lng, originMarker.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(
            `<div style="padding:8px;font-size:12px;font-weight:900;color:#111;text-transform:uppercase;letter-spacing:1px">${escapeHtml(originMarker.label || "Nexus CD Central")}</div>`,
          ),
        )
        .addTo(map.current);
      markersRef.current.push(m);
    }

    // Add delivery markers
    markers.forEach((mk) => {
      const el = document.createElement("div");
      const color = mk.color || "#3b82f6";

      if (mk.type === "truck") {
        el.className = cn(
          "mapbox-truck-marker",
          mk.isAnomaly && "nexus-anomaly-glitch",
        );
        const markerColor = safeColor(mk.isAnomaly ? "#ef4444" : color);
        el.style.cssText = `width:30px;height:30px;background:white;border-radius:50%;display:flex;align-items:center;justify-center;box-shadow:0 0 15px ${markerColor};border:2px solid ${markerColor};cursor:pointer;transition:all 0.3s cubic-bezier(0.4, 0, 0.2, 1);z-index:10;`;
        if (mk.isAnomaly) {
          el.style.boxShadow = `0 0 30px #ef4444, inset 0 0 10px #ef4444`;
          el.style.borderColor = "#ef4444";
        }
        // SVG literal sem interpolação (etapa 291); stroke e transform aplicados por setAttribute
        el.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-3v10a1 1 0 0 0 1 1Z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>';
        const svgEl = el.querySelector("svg");
        if (svgEl) {
          svgEl.setAttribute("stroke", markerColor);
          svgEl.style.transform = `rotate(${Number(mk.heading) || 0}deg)`;
        }
      } else {
        el.className = mk.isAnomaly ? "nexus-anomaly-pulse" : "";
        el.style.cssText = `width:16px;height:16px;border-radius:50%;background:${mk.isAnomaly ? "#ef4444" : color};border:2px solid #fff;box-shadow:0 0 10px ${mk.isAnomaly ? "#ef4444" : color}66;cursor:pointer;transition:all 0.2s cubic-bezier(0.4, 0, 0.2, 1);`;
      }

      el.addEventListener("mouseenter", () => {
        el.style.transform = "scale(1.25)";
        el.style.zIndex = "50";
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "scale(1)";
        el.style.zIndex = mk.type === "truck" ? "10" : "1";
      });

      // Validação de cor para evitar XSS via atributo de estilo (etapa 292)
      const safePopupColor = safeColor(color);
      const popup = new maplibregl.Popup({
        offset: mk.type === "truck" ? 35 : 20,
        closeButton: false,
        className: "nexus-map-popup",
      }).setHTML(
        mk.popupHTML ||
          `
          <div style="padding:16px;background:#000;border-radius:24px;border:1px solid rgba(255,255,255,0.1);box-shadow:0 20px 40px rgba(0,0,0,0.8);max-width:240px;overflow:hidden;position:relative;">
            <div style="position:absolute;top:0;left:0;width:100%;height:4px;background:${safePopupColor}"></div>
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
              <div style="width:32px;height:32px;border-radius:8px;background:${safePopupColor}22;display:flex;align-items:center;justify-content:center;border:1px solid ${safePopupColor}44">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${safePopupColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
              <strong style="font-size:14px;color:#fff;font-family:system-ui, -apple-system, sans-serif;font-weight:900;letter-spacing:-0.5px">DESTINO_UNIT</strong>
            </div>
            <p style="font-size:11px;color:rgba(255,255,255,0.6);font-weight:700;line-height:1.4;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:0.5px">${escapeHtml(mk.label || mk.id)}</p>
            <div style="display:inline-flex;padding:4px 12px;border-radius:999px;font-size:9px;font-weight:900;color:${safePopupColor};background:${safePopupColor}15;border:1px solid ${safePopupColor}33;text-transform:uppercase;letter-spacing:1px">
              LIVE_STATUS: NOMINAL
            </div>
          </div>
        `,
      );

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([mk.lng, mk.lat])
        .setPopup(popup)
        .addTo(map.current!);

      if (onMarkerClick) {
        el.addEventListener("click", () => onMarkerClick(mk.id));
      }

      markersRef.current.push(marker);
    });

    // Fit bounds if we have markers
    if (markers.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      if (originMarker) bounds.extend([originMarker.lng, originMarker.lat]);
      markers.forEach((mk) => bounds.extend([mk.lng, mk.lat]));
      map.current.fitBounds(bounds, { padding: 60, maxZoom: 12 });
    }
  }, [markers, originMarker, loading, onMarkerClick]);

  // Draw route lines from origin to each marker (Smarter curved paths with flow animation)
  useEffect(() => {
    if (
      !map.current ||
      (!showRoute && !showRouteLines) ||
      !originMarker ||
      markers.length === 0 ||
      loading
    )
      return;

    const sourceId = "route-lines";
    const arrowLayerId = "route-arrows";

    const addRouteLayer = () => {
      if (map.current!.getSource(sourceId)) {
        map.current!.removeLayer("route-layer-glow");
        map.current!.removeLayer("route-layer");
        if (map.current!.getLayer(arrowLayerId))
          map.current!.removeLayer(arrowLayerId);
        map.current!.removeSource(sourceId);
      }

      const features = markers.map((mk) => {
        const lngDiff = mk.lng - originMarker.lng;
        const latDiff = mk.lat - originMarker.lat;
        const dist = Math.sqrt(lngDiff * lngDiff + latDiff * latDiff);

        // Arc calculation for visual excellence
        const midLng = originMarker.lng + lngDiff / 2;
        const midLat = originMarker.lat + latDiff / 2 + dist * 0.15;

        // Check for intersection with risk zones to trigger "rerouting"
        const affectingRiskZone = riskZones.find((zone) => {
          const dLng = zone.center[0] - midLng;
          const dLat = zone.center[1] - midLat;
          return Math.sqrt(dLng * dLng + dLat * dLat) < 0.5; // Simple proximity check
        });

        const hasRisk = !!affectingRiskZone;
        const routePoints = [
          [originMarker.lng, originMarker.lat],
          hasRisk
            ? [
                midLng + (affectingRiskZone.severity === "high" ? 0.8 : 0.4),
                midLat + 0.3,
              ]
            : [midLng, midLat],
          [mk.lng, mk.lat],
        ];

        return {
          type: "Feature" as const,
          properties: {
            color: hasRisk ? "#F59E0B" : mk.color || "#06b6d4",
            isRerouted: hasRisk,
          },
          geometry: {
            type: "LineString" as const,
            coordinates: routePoints,
          },
        };
      });

      map.current!.addSource(sourceId, {
        type: "geojson",
        data: { type: "FeatureCollection", features },
      });

      // Neon Glow Layer
      map.current!.addLayer({
        id: "route-layer-glow",
        type: "line",
        source: sourceId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": ["get", "color"],
          "line-width": 6,
          "line-opacity": 0.1,
          "line-blur": 5,
        },
      });

      // Main Route Line
      map.current!.addLayer({
        id: "route-layer",
        type: "line",
        source: sourceId,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": ["get", "color"],
          "line-width": ["case", ["get", "isRerouted"], 3.5, 2.5],
          "line-opacity": 0.9,
          "line-dasharray": [
            "case",
            ["get", "isRerouted"],
            ["literal", [2, 1]],
            ["literal", [3, 2]],
          ],
        },
      });

      // Recalculated Route Labels
      map.current!.addLayer({
        id: "route-labels",
        type: "symbol",
        source: sourceId,
        filter: ["get", "isRerouted"],
        layout: {
          "symbol-placement": "line",
          "text-field": "REROUTED_BY_NEXUS_AI",
          "text-font": ["DIN Offc Pro Bold", "Arial Unicode MS Bold"],
          "text-size": 8,
          "text-letter-spacing": 0.2,
          "text-offset": [0, 1],
          "symbol-spacing": 250,
          "text-transform": "uppercase",
        },
        paint: {
          "text-color": "#F59E0B",
          "text-halo-color": "rgba(0,0,0,0.8)",
          "text-halo-width": 1,
        },
      });

      // City-to-City Connection Points
      map.current!.addLayer({
        id: "route-points",
        type: "circle",
        source: sourceId,
        paint: {
          "circle-radius": 4,
          "circle-color": ["get", "color"],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
          "circle-opacity": 0.8,
        },
      });

      // Directional Flow Animation (using symbols)
      if (!map.current!.getLayer(arrowLayerId)) {
        map.current!.addLayer({
          id: arrowLayerId,
          type: "symbol",
          source: sourceId,
          layout: {
            "symbol-placement": "line",
            "symbol-spacing": 50,
            "icon-image": "pulsing-dot", // Assuming we add this image or use standard
            "icon-size": 0.5,
            "icon-rotate": 90,
            visibility: "visible",
          },
        });
      }
    };

    if (map.current.isStyleLoaded()) {
      addRouteLayer();
    } else {
      map.current.on("style.load", addRouteLayer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, originMarker, showRoute, loading, riskZones]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-muted/50 rounded-lg ${className}`}
      >
        <div className="text-center text-muted-foreground p-8">
          <p className="text-sm font-medium">{error}</p>
          <p className="text-xs mt-1">Verifique sua conexão com a internet</p>
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
