import * as React from "react";
import Map, { Marker, NavigationControl, FullscreenControl, ScaleControl, GeolocateControl, Source, Layer } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, Truck, Package, Activity, Navigation2, Satellite, Filter, 
  Search, AlertTriangle, CheckCircle2, Layout, Layers, Box, Info, X, Zap, ArrowRight, Building2, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUnifiedTracking, UnifiedShipment } from "@/hooks/useUnifiedTracking";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MissionDetail } from "./MissionDetail";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";

const MAPBOX_TOKEN = "pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbHdidzFhNmEwMG5qMmtxZ2ZidXlybHlyIn0.XN3N_uX8p6T9G0Q_5vO9XQ";

export function LogisticsMapWidget() {
  const { allShipments: shipments, isLoading } = useUnifiedTracking();
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [selectedShipment, setSelectedShipment] = React.useState<UnifiedShipment | null>(null);
  const [showLayers, setShowLayers] = React.useState(false);
  const [typeFilter, setTypeFilter] = React.useState<"all" | "entrega" | "coleta">("all");
  const [showMission, setShowMission] = React.useState(false);
  
  const [viewState, setViewState] = React.useState({
    latitude: -23.5505,
    longitude: -46.6333,
    zoom: 4
  });

  const [mapStyle, setMapStyle] = React.useState<string>("mapbox://styles/mapbox/dark-v11");

  const filteredShipments = React.useMemo(() => {
    return shipments.filter(s => {
      const matchesSearch = s.numero.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           s.cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            s.transportadora.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || 
                           (statusFilter === "in_transit" && ["em_transito", "despachado", "saiu_entrega", "em_rota"].includes(s.status)) ||
                           (statusFilter === "delayed" && s.atrasado) ||
                           (statusFilter === "completed" && ["entregue", "finalizado", "recebido"].includes(s.status)) ||
                           (statusFilter === "pending" && ["aguardando_producao", "pronto_despacho", "pendente"].includes(s.status)) ||
                           (statusFilter === "problems" && ["ocorrencia", "divergencia"].includes(s.status));

      const matchesType = typeFilter === "all" || s.tipo === typeFilter;

      return s.coordinates && matchesSearch && matchesStatus && matchesType;
    });
  }, [shipments, searchTerm, statusFilter, typeFilter]);

  const activeShipments = shipments.filter(s => 
    ["em_transito", "despachado", "saiu_entrega", "em_rota"].includes(s.status)
  );

  // Focus on selected shipment
  React.useEffect(() => {
    if (selectedShipment?.coordinates) {
      setViewState({
        latitude: selectedShipment.coordinates.lat,
        longitude: selectedShipment.coordinates.lng,
        zoom: 12
      });
    }
  }, [selectedShipment]);

  if (isLoading) {
    return (
      <Card className="h-[600px] rounded-[2rem] overflow-hidden border-none bg-black/40 backdrop-blur-xl p-1">
        <Skeleton className="w-full h-full rounded-[1.9rem] bg-white/5" />
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden group border-none bg-transparent p-[2px] rounded-[2rem] shadow-2xl h-[700px] animate-in fade-in duration-700">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-white/5 to-primary/10 rounded-[2rem]" />
      <div className="relative h-full bg-black/90 backdrop-blur-3xl rounded-[1.9rem] flex flex-col">
        <CardHeader className="p-6 pb-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-inner group-hover:rotate-12 transition-transform duration-500">
                <Navigation2 className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <div>
                <CardTitle className="text-2xl md:text-3xl font-black italic tracking-tighter bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent uppercase leading-none">
                  Nexus Tracking Core
                </CardTitle>
                <CardDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 mt-2 flex items-center gap-2">
                  <Activity className="w-3 h-3" /> Monitoramento Global em Tempo Real
                </CardDescription>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-white/5 p-1 rounded-full border border-white/10">
                {[
                  { id: 'all', label: 'TODOS', icon: Activity },
                  { id: 'in_transit', label: 'TRÂNSITO', icon: Truck },
                  { id: 'delayed', label: 'ATRASADOS', icon: AlertTriangle },
                  { id: 'completed', label: 'OK', icon: CheckCircle2 }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                      statusFilter === f.id ? "bg-primary text-white shadow-lg" : "text-white/40 hover:text-white/70"
                    )}
                  >
                    <f.icon className="w-3 h-3" />
                    <span className="hidden sm:inline">{f.label}</span>
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                <Input 
                  placeholder="BUSCAR REMESSA..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 w-40 md:w-48 bg-white/5 border-white/10 rounded-full pl-9 text-[10px] font-black tracking-widest uppercase placeholder:text-white/20 focus:ring-primary/50"
                />
              </div>

               <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setMapStyle(prev => prev.includes("dark") ? "mapbox://styles/mapbox/satellite-v9" : "mapbox://styles/mapbox/dark-v11")}
                className="h-9 rounded-full bg-white/5 border-white/10 text-white hover:bg-white/10 gap-2 font-black text-[10px] uppercase tracking-widest px-4 border-2"
              >
                {mapStyle.includes("dark") ? <Satellite className="w-3 h-3 text-primary" /> : <Activity className="w-3 h-3 text-primary" />}
                {mapStyle.includes("dark") ? "Satélite" : "Tático"}
              </Button>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowLayers(!showLayers)}
                className={cn(
                  "h-9 rounded-full border-white/10 text-white gap-2 font-black text-[10px] uppercase tracking-widest px-4 border-2 transition-all",
                  showLayers ? "bg-primary border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)]" : "bg-white/5"
                )}
              >
                <Layers className="w-3 h-3" />
                Camadas
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 flex-1 flex flex-col md:flex-row gap-4 relative overflow-hidden">
          <AnimatePresence>
            {showLayers && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute top-20 right-6 z-50 w-64 bg-black/90 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Nexus Layer Engine</h4>
                  <button onClick={() => setShowLayers(false)} className="text-white/40 hover:text-white"><X className="w-4 h-4" /></button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Tipo de Fluxo</p>
                    <div className="grid grid-cols-3 gap-2">
                      {['all', 'entrega', 'coleta'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setTypeFilter(type as any)}
                          className={cn(
                            "h-8 rounded-xl border text-[8px] font-black uppercase transition-all",
                            typeFilter === type ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/5 text-white/40 hover:text-white/60"
                          )}
                        >
                          {type === 'all' ? 'Tudo' : type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Filtros Táticos</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'all', label: 'Global', icon: Activity },
                        { id: 'in_transit', label: 'Transito', icon: Truck },
                        { id: 'pending', label: 'Pendente', icon: Clock },
                        { id: 'completed', label: 'Sucesso', icon: CheckCircle2 },
                        { id: 'delayed', label: 'Atraso', icon: AlertTriangle },
                        { id: 'problems', label: 'Crítico', icon: AlertTriangle },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setStatusFilter(f.id)}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-xl border text-[8px] font-black uppercase transition-all",
                            statusFilter === f.id ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/5 text-white/40 hover:text-white/60"
                          )}
                        >
                          <f.icon className="w-3 h-3" />
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sidebar Info */}
          <div className="w-full md:w-72 flex flex-col gap-3 z-10">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
              <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-3 flex items-center gap-2">
                <Truck className="w-3 h-3" /> Status da Frota
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                  <p className="text-[8px] font-bold text-white/40 uppercase tracking-tighter">Ativos</p>
                  <p className="text-xl font-black text-white italic">{activeShipments.length}</p>
                </div>
                <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                  <p className="text-[8px] font-bold text-white/40 uppercase tracking-tighter">Filtrados</p>
                  <p className="text-xl font-black text-primary italic">{filteredShipments.length}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[400px] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {filteredShipments.slice(0, 10).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedShipment(s)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border transition-all duration-300 group/item",
                    selectedShipment?.id === s.id 
                      ? "bg-primary/20 border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]" 
                      : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20"
                  )}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-black text-white uppercase tracking-tighter">{s.numero}</span>
                    <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", s.atrasado ? "bg-destructive" : "bg-success")} />
                  </div>
                  <p className="text-[9px] font-medium text-white/60 truncate uppercase">{s.cliente || s.transportadora}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge className={cn("text-[7px] font-black uppercase tracking-tighter h-4", 
                      s.atrasado ? "bg-destructive" : "bg-primary")}>
                      {s.statusLabel}
                    </Badge>
                    <span className="text-[8px] font-bold text-white/40 italic">{s.tipo === 'entrega' ? 'ENT' : 'COL'}</span>
                  </div>
                </button>
              ))}
              {filteredShipments.length === 0 && (
                <div className="text-center py-8 opacity-40">
                  <Package className="w-8 h-8 mx-auto mb-2 text-white" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-white">Nenhuma remessa encontrada</p>
                </div>
              )}
            </div>
          </div>

          {/* Map Area */}
          <div className="flex-1 rounded-[1.5rem] overflow-hidden border border-white/10 relative shadow-inner group/map">
            <Map
              {...viewState}
              onMove={evt => setViewState(evt.viewState)}
              mapStyle={mapStyle}
              mapboxAccessToken={MAPBOX_TOKEN}
              style={{ width: "100%", height: "100%" }}
              terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
            >
              <Source id="mapbox-dem" type="raster-dem" url="mapbox://mapbox.mapbox-terrain-dem-v1" tileSize={512} maxzoom={14} />
              
              <GeolocateControl position="top-right" />
              <NavigationControl position="top-right" />
              <FullscreenControl position="top-right" />
              <ScaleControl position="bottom-right" />

              {filteredShipments.map((s) => (
                <Marker
                  key={s.id}
                  latitude={s.coordinates!.lat}
                  longitude={s.coordinates!.lng}
                  anchor="bottom"
                  onClick={e => {
                    e.originalEvent.stopPropagation();
                    setSelectedShipment(s);
                  }}
                >
                  <div className="group/marker cursor-pointer relative">
                    <div className={cn(
                      "absolute -inset-4 rounded-full animate-ping opacity-20",
                      ["em_transito", "despachado", "saiu_entrega"].includes(s.status) ? "bg-primary" : 
                      ["entregue", "finalizado", "recebido"].includes(s.status) ? "bg-success" : "bg-destructive"
                    )} />
                    
                    <div className={cn(
                      "relative p-2 rounded-xl border-2 shadow-2xl transition-all duration-500 group-hover/marker:scale-125 group-hover/marker:-translate-y-2",
                      selectedShipment?.id === s.id ? "scale-125 -translate-y-2 border-white ring-4 ring-primary/30" : "border-primary/50",
                      ["em_transito", "despachado", "saiu_entrega"].includes(s.status) ? "bg-black border-primary text-primary" : 
                      ["entregue", "finalizado", "recebido"].includes(s.status) ? "bg-black border-success text-success" : "bg-black border-destructive text-destructive"
                    )}>
                      {s.tipo === 'entrega' ? <Truck className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                    </div>

                    {/* Simple Tooltip on Hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 opacity-0 group-hover/marker:opacity-100 transition-opacity pointer-events-none z-50">
                      <div className="bg-black/90 border-2 border-primary/30 backdrop-blur-xl p-4 rounded-2xl shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] min-w-[220px]">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-[10px] font-black uppercase text-primary tracking-widest">{s.numero}</p>
                          {s.atrasado && <Badge className="bg-destructive text-[8px] font-black px-1 h-4 animate-bounce">ATRASADO</Badge>}
                        </div>
                        <p className="text-sm font-black text-white mb-1 uppercase tracking-tighter italic">{s.cliente || 'CLIENTE NÃO INFORMADO'}</p>
                        <p className="text-[9px] font-bold text-white/50 mb-3 uppercase tracking-widest">{s.transportadora}</p>
                        
                        <div className="h-px bg-white/10 mb-3" />
                        
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <Activity className="w-3 h-3 text-primary" />
                            <span className="text-[8px] font-black text-white uppercase">{s.statusLabel}</span>
                          </div>
                          <span className="text-[7px] font-bold text-white/30 uppercase tracking-widest">Live Pos</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Marker>
              ))}

              {/* Rota Visualization if selected */}
              {selectedShipment?.coordinates && (
                <Source 
                  id="route" 
                  type="geojson" 
                  data={{
                    type: 'Feature',
                    properties: {},
                    geometry: {
                      type: 'LineString',
                      coordinates: [
                        [-46.6333, -23.5505], // Mock origin (SP Central)
                        [selectedShipment.coordinates.lng, selectedShipment.coordinates.lat]
                      ]
                    }
                  }}
                >
                  <Layer
                    id="route-line"
                    type="line"
                    source="route"
                    layout={{ 'line-join': 'round', 'line-cap': 'round' }}
                    paint={{
                      'line-color': '#9b87f5',
                      'line-width': 4,
                      'line-dasharray': [2, 2],
                      'line-opacity': 0.6
                    }}
                  />
                </Source>
              )}
            </Map>

            {/* Float Info Overlay */}
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between z-10 pointer-events-none">
              <div className="bg-black/60 backdrop-blur-xl border-2 border-white/10 p-5 rounded-[2rem] shadow-2xl pointer-events-auto">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
                  <span className="text-[10px] font-black uppercase text-white/70 tracking-[0.3em]">Nexus Intelligence Grid</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white italic tracking-tighter">{activeShipments.length}</span>
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Fluxos em Trânsito</span>
                </div>
              </div>
              
              {selectedShipment && (
                <div className="bg-primary/10 backdrop-blur-xl border-2 border-primary/30 p-4 rounded-3xl shadow-2xl pointer-events-auto max-w-xs animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-primary/20 text-primary">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Tracking Selecionado</p>
                      <p className="text-xs font-black text-white tracking-tighter">{selectedShipment.numero}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => setSelectedShipment(null)}
                    className="w-full h-8 bg-primary hover:bg-primary/80 text-[10px] font-black uppercase tracking-widest rounded-xl"
                  >
                    Limpar Foco
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}


