import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navigation, Truck, MapPin, Clock, Phone, RefreshCw, Loader2, Radio, Info } from "lucide-react";
import { useLalamoveTracking } from "@/hooks";
import { useRealtime } from "@/hooks";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = "pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbHdidzFhNmEwMG5qMmtxZ2ZidXlybHlyIn0.XN3N_uX8p6T9G0Q_5vO9XQ";

export default function RastreamentoMotorista() {
  const [selectedOrder, setSelectedOrder] = useState<string>("");
  const { 
    driverLocation, 
    orderDetails, 
    isLoading, 
    isTracking,
    startTracking, 
    stopTracking,
    refetchDriverLocation 
  } = useLalamoveTracking(selectedOrder || null);
  const [isLive, setIsLive] = useState(false);

  // Fetch orders from coletas table
  interface ColetaWithFornecedor {
    id: string;
    numero_coleta: string;
    codigo_rastreamento: string | null;
    fornecedor: { razao_social: string } | null;
  }
  
  const { data: orders = [], refetch: refetchOrders } = useQuery({
    queryKey: ["lalamove-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coletas")
        .select("id, numero_coleta, codigo_rastreamento, fornecedor:fornecedores(razao_social)")
        .eq("tipo_coleta", "lalamove")
        .not("codigo_rastreamento", "is", null)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data as unknown as ColetaWithFornecedor[])?.map(c => ({
        id: c.codigo_rastreamento || c.id,
        cliente: c.fornecedor?.razao_social || c.numero_coleta
      })) || [];
    }
  });

  useRealtime({ table: "coletas", onUpdate: () => refetchOrders() });

  useEffect(() => {
    if (isLive && selectedOrder) { 
      const interval = setInterval(() => refetchDriverLocation?.(), 10000); 
      return () => clearInterval(interval); 
    }
  }, [isLive, selectedOrder]);

  useEffect(() => {
    if (selectedOrder && !isTracking) {
      startTracking();
    }
  }, [selectedOrder]);

  const driver = driverLocation || { name: "", phone: "", plateNumber: "", coordinates: { lat: 0, lng: 0 } };
  const location = driverLocation?.coordinates || { lat: 0, lng: 0 };
  const status = orderDetails?.status || "unknown";

  const statusColors: Record<string, string> = { "em_rota": "bg-primary", "coletando": "bg-warning", "entregando": "bg-success", "aguardando": "bg-muted" };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><h1 className="text-display flex items-center gap-3"><div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-info/20 to-info/5"><Navigation className="w-6 h-6 text-info" /></div>Rastreamento Motorista</h1><p className="text-muted-foreground mt-1">Acompanhe entregas em tempo real via Lalamove</p></div>
          <div className="flex gap-2">
            <Select value={selectedOrder} onValueChange={setSelectedOrder}><SelectTrigger className="w-56"><SelectValue placeholder="Selecione pedido" /></SelectTrigger><SelectContent>{(orders || []).map((o) => <SelectItem key={o.id} value={o.id}>#{o.id.slice(0, 8)} - {o.cliente}</SelectItem>)}</SelectContent></Select>
            <Button variant={isLive ? "destructive" : "default"} onClick={() => setIsLive(!isLive)}><Radio className={cn("w-4 h-4 mr-2", isLive && "animate-pulse")} />{isLive ? "Parar" : "Ao Vivo"}</Button>
            <Button variant="outline" onClick={() => refetchDriverLocation?.()}><RefreshCw className="w-4 h-4" /></Button>
          </div>
        </div>
        {selectedOrder ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card-base p-0 min-h-[500px] overflow-hidden relative border-none bg-black">
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/20 backdrop-blur-sm z-10">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
              ) : location.lat !== 0 ? (
                <Map
                  initialViewState={{
                    latitude: location.lat,
                    longitude: location.lng,
                    zoom: 14
                  }}
                  style={{ width: '100%', height: '100%' }}
                  mapStyle="mapbox://styles/mapbox/dark-v11"
                  mapboxAccessToken={MAPBOX_TOKEN}
                >
                  <Marker latitude={location.lat} longitude={location.lng} anchor="bottom">
                    <div className="relative">
                      <div className="absolute -inset-4 bg-primary/20 rounded-full animate-ping" />
                      <div className="relative p-2 rounded-full bg-primary border-2 border-white shadow-lg">
                        <Truck className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </Marker>
                  <NavigationControl position="top-right" />
                  
                  {/* Overlay Informativo */}
                  <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-xl border border-white/10 p-3 rounded-xl z-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                        <Radio className="w-4 h-4 text-primary animate-pulse" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">Sinal de Telemetria Ativo</p>
                        <p className="text-xs font-bold text-white uppercase truncate max-w-[150px] md:max-w-none">
                          Lat: {location.lat.toFixed(5)} • Lng: {location.lng.toFixed(5)}
                        </p>
                      </div>
                    </div>
                    {isLive && (
                      <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 animate-pulse uppercase text-[10px] font-black">
                        LIVE
                      </Badge>
                    )}
                  </div>
                </Map>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
                  <Navigation className="w-16 h-16 opacity-20" />
                  <div className="text-center">
                    <p className="font-bold uppercase tracking-widest text-sm">Aguardando coordenadas...</p>
                    <p className="text-xs opacity-50">Integração Lalamove API 2.0</p>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div className="card-base p-4">
                <div className="flex items-center gap-3 mb-4"><div className={cn("w-3 h-3 rounded-full animate-pulse", statusColors[status] || "bg-gray-500")} /><span className="font-semibold">Status: {status}</span></div>
                {driver.name ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3"><div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"><Truck className="w-6 h-6 text-primary" /></div><div><p className="font-semibold">{driver.name}</p><p className="text-sm text-muted-foreground">Motorista</p></div></div>
                    {driver.phone && <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-muted-foreground" /><span>{driver.phone}</span></div>}
                    {driver.plateNumber && <div className="flex items-center gap-2 text-sm"><Truck className="w-4 h-4 text-muted-foreground" /><span>Placa: {driver.plateNumber}</span></div>}
                  </div>
                ) : <p className="text-sm text-muted-foreground">Aguardando motorista...</p>}
              </div>
              <div className="card-base p-4">
                <h3 className="font-semibold mb-3">Timeline</h3>
                <div className="space-y-3">{(orderDetails?.stops || []).map((stop, i: number) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center"><div className={cn("w-3 h-3 rounded-full", i === 0 ? "bg-primary" : "bg-muted")} />{i < (orderDetails?.stops?.length || 0) - 1 && <div className="w-0.5 h-full bg-muted" />}</div>
                    <div><p className="text-sm font-medium">{stop.name || `Parada ${i + 1}`}</p><p className="text-xs text-muted-foreground">{stop.address}</p></div>
                  </div>
                ))}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card-base p-12 text-center"><Navigation className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" /><p className="text-lg font-semibold">Selecione um pedido</p><p className="text-muted-foreground">Escolha um pedido Lalamove para rastrear</p></div>
        )}
      </div>
    </MainLayout>
  );
}