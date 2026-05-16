import * as React from "react";
import Map, { Marker, NavigationControl, FullscreenControl, ScaleControl, GeolocateControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Truck, Package, Activity, Navigation2, Satellite } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Note: In a production app, the token should be in environment variables
// For demonstration/setup, we'll use a placeholder or handle the empty token state
const MAPBOX_TOKEN = "pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbHdidzFhNmEwMG5qMmtxZ2ZidXlybHlyIn0.XN3N_uX8p6T9G0Q_5vO9XQ"; // Standard public token for dev

interface DeliveryLocation {
  id: string;
  lat: number;
  lng: number;
  status: "em_transito" | "entregue" | "problema";
  driver: string;
  vehicle: string;
}

const mockLocations: DeliveryLocation[] = [
  { id: "1", lat: -23.5505, lng: -46.6333, status: "em_transito", driver: "Carlos Silva", vehicle: "Scania R450" },
  { id: "2", lat: -22.9068, lng: -43.1729, status: "entregue", driver: "Ana Paula", vehicle: "Volvo FH" },
  { id: "3", lat: -19.9167, lng: -43.9345, status: "problema", driver: "João Pedro", vehicle: "MB Actros" },
];

export function LogisticsMapWidget() {
  const [viewState, setViewState] = React.useState({
    latitude: -23.5505,
    longitude: -46.6333,
    zoom: 5
  });

  const [mapStyle, setMapStyle] = React.useState<string>("mapbox://styles/mapbox/dark-v11");

  return (
    <Card className="relative overflow-hidden group border-none bg-transparent p-[2px] rounded-[2rem] shadow-2xl h-[600px]">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-white/5 to-primary/10 rounded-[2rem]" />
      <div className="relative h-full bg-black/90 backdrop-blur-3xl rounded-[1.9rem] flex flex-col">
        <CardHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-inner">
                <Navigation2 className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black italic tracking-tighter bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent uppercase leading-none">
                  Nexus Global Tracking
                </CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mt-2">
                  Geolocalização em Tempo Real
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
               <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setMapStyle(prev => prev.includes("dark") ? "mapbox://styles/mapbox/satellite-v9" : "mapbox://styles/mapbox/dark-v11")}
                className="h-9 rounded-full bg-white/5 border-white/10 text-white hover:bg-white/10 gap-2 font-black text-[10px] uppercase tracking-widest px-4"
              >
                {mapStyle.includes("dark") ? <Satellite className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                {mapStyle.includes("dark") ? "Satélite" : "Tático"}
              </Button>
              <Badge variant="outline" className="font-black uppercase tracking-widest px-4 py-1.5 rounded-full border-2 text-success border-success/30 bg-success/5">
                Live Feed
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 flex-1 relative overflow-hidden">
          <div className="w-full h-full rounded-[1.5rem] overflow-hidden border border-white/10 relative shadow-inner">
            <Map
              {...viewState}
              onMove={evt => setViewState(evt.viewState)}
              mapStyle={mapStyle}
              mapboxAccessToken={MAPBOX_TOKEN}
              style={{ width: "100%", height: "100%" }}
            >
              <GeolocateControl position="top-left" />
              <NavigationControl position="top-left" />
              <FullscreenControl position="top-left" />
              <ScaleControl position="bottom-left" />

              {mockLocations.map((loc) => (
                <Marker
                  key={loc.id}
                  latitude={loc.lat}
                  longitude={loc.lng}
                  anchor="bottom"
                >
                  <div className="group/marker cursor-pointer relative">
                    {/* Ripple effect */}
                    <div className={cn(
                      "absolute -inset-4 rounded-full animate-ping opacity-20",
                      loc.status === "em_transito" ? "bg-primary" : 
                      loc.status === "entregue" ? "bg-success" : "bg-destructive"
                    )} />
                    
                    <div className={cn(
                      "relative p-2 rounded-xl border-2 shadow-2xl transition-all group-hover/marker:scale-125 group-hover/marker:-translate-y-2",
                      loc.status === "em_transito" ? "bg-black border-primary text-primary" : 
                      loc.status === "entregue" ? "bg-black border-success text-success" : "bg-black border-destructive text-destructive"
                    )}>
                      {loc.status === "em_transito" ? <Truck className="w-5 h-5" /> : 
                       loc.status === "entregue" ? <Package className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                    </div>

                    {/* Infobox on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 opacity-0 group-hover/marker:opacity-100 transition-opacity pointer-events-none z-50">
                      <div className="bg-black/90 border border-white/20 backdrop-blur-xl p-3 rounded-2xl shadow-2xl min-w-[200px]">
                        <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">{loc.vehicle}</p>
                        <p className="text-sm font-bold text-white mb-2">{loc.driver}</p>
                        <div className="flex items-center gap-2">
                          <Badge className={cn(
                            "text-[8px] font-black uppercase tracking-tighter",
                            loc.status === "em_transito" ? "bg-primary" : 
                            loc.status === "entregue" ? "bg-success" : "bg-destructive"
                          )}>
                            {loc.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </Marker>
              ))}
            </Map>

            {/* Floating Stats Overlay */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
              <div className="bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-black uppercase text-white/70 tracking-[0.2em]">Frota Ativa</span>
                </div>
                <div className="text-3xl font-black text-white italic tracking-tighter">
                  128 <span className="text-xs text-primary/60 not-italic uppercase tracking-widest">Veículos</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
