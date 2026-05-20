import { useState, useMemo, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Map, Truck, Package, Clock, MapPin, RefreshCw, Route, Globe, Layers, Satellite, Zap, AlertTriangle, Play, ShieldCheck, CloudRain, Activity } from "lucide-react";
import { useDeliveryRoutes, ORIGIN_COORDINATES, getStatusColor, getStatusLabel } from "@/hooks";
import { MapboxMap, MapMarker } from "@/components/map";
import { FilterBar } from "@/components/common/FilterBar";
import { useFilters, FilterConfig } from "@/hooks";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MapIntelligenceOverlay } from "@/components/map/MapIntelligenceOverlay";
import { motion, AnimatePresence } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";

interface DeliveryPoint { id: string; address: string; status: string; lat?: number; lng?: number; order: number; }

const filterConfig: FilterConfig<DeliveryPoint> = {
  search: { fields: ["address"], placeholder: "Buscar endereço..." }
};

export default function MapaRotas() {
  const deliveryRoutes = useDeliveryRoutes();
  const routes = deliveryRoutes?.data || [];
  const isLoading = deliveryRoutes?.isLoading || false;
  const isGeocoding = deliveryRoutes?.isGeocoding || false;

  const [statusFilter, setStatusFilter] = useState("all");
  const [showRouteLines, setShowRouteLines] = useState(true);
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite'>('dark');
  const [mapPitch, setMapPitch] = useState(0);
  const [timeTravelValue, setTimeTravelValue] = useState(100);
  const [activeLayers, setActiveLayers] = useState({ fleet: true, deliveries: true, nexus: false, risks: true, weather: false, bio: false });
  const [riskZones, setRiskZones] = useState<{ id: string; center: [number, number]; radius: number; severity: 'low' | 'medium' | 'high' }[]>([
    { id: '1', center: [-46.6333, -23.5505], radius: 1000, severity: 'high' }, // SP Center
    { id: '2', center: [-46.8, -23.6], radius: 1000, severity: 'medium' }
  ]);
  const [isDroneView, setIsDroneView] = useState(false);
  const [lastSync, setLastSync] = useState(new Date());
  const [isLiveData, setIsLiveData] = useState(true);
  const [logs, setLogs] = useState<{ id: string; time: string; msg: string; type: 'info' | 'warn' | 'crit' }[]>([]);
  const [bioData, setBioData] = useState<{ heart_rate: number; fatigue_index: string } | null>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [selectedAnomaly, setSelectedAnomaly] = useState<{ id: string; level: 'info' | 'crit'; cause: string; action: string } | null>(null);

  // Load tactical logs from DB
  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('nexus_tactical_logs')
        .select('*')
        .order('event_time', { ascending: false })
        .limit(15);
      
      if (data) {
        setLogs(data.map(l => ({
          id: l.id,
          time: new Date(l.event_time).toLocaleTimeString([], { hour12: false }),
          msg: l.message,
          type: l.type as any
        })));
      }
    };
    fetchLogs();

    const channel = supabase
      .channel('tactical-logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'nexus_tactical_logs' }, payload => {
        const newLog = payload.new;
        setLogs(prev => [{
          id: newLog.id,
          time: new Date(newLog.event_time).toLocaleTimeString([], { hour12: false }),
          msg: newLog.message,
          type: newLog.type as any
        }, ...prev].slice(0, 15));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Fetch real BioSync data
  useEffect(() => {
    const fetchBio = async () => {
      const { data } = await supabase
        .from('bio_sync_telemetry')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();
      
      if (data) setBioData({ heart_rate: data.heart_rate, fatigue_index: data.fatigue_index });
    };
    fetchBio();

    const interval = setInterval(async () => {
      // For demo, we still trigger the ingest function to get "live" feel, 
      // but the data is persisted and retrieved from DB.
      await supabase.functions.invoke('ingest-biosync', {
        body: { driver_id: 'DRV-001', vehicle_id: 'VH-452' }
      });
      fetchBio();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Fetch real Weather data
  useEffect(() => {
    if (!activeLayers.weather) return;

    const fetchWeather = async () => {
      try {
        const { data } = await supabase.functions.invoke('get-weather-data', {
          method: 'GET',
          query: { lat: String(ORIGIN_COORDINATES.lat), lon: String(ORIGIN_COORDINATES.lng) }
        });
        if (data) {
          setWeatherData(data);
          // Update risk zones based on weather
          if (data.weather[0].main === 'Rain' || data.weather[0].main === 'Storm') {
            setRiskZones(prev => [
              ...prev,
              { id: 'weather-risk', center: [ORIGIN_COORDINATES.lng + 0.1, ORIGIN_COORDINATES.lat + 0.1], radius: 2000, severity: 'medium' }
            ]);
          }
        }
      } catch (err) {
        console.error("Weather fetch failed:", err);
      }
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 300000); // 5 min
    return () => clearInterval(interval);
  }, [activeLayers.weather]);

  // Sync state with simulator
  useEffect(() => {
    // If slider is at 100, we are in "Real Time"
    setIsLiveData(timeTravelValue >= 95);
    if (timeTravelValue >= 95) {
      setLastSync(new Date());
    } else {
      // Simulate historical sync based on time travel
      const historyDate = new Date();
      historyDate.setMinutes(historyDate.getMinutes() - (100 - timeTravelValue));
      setLastSync(historyDate);
    }
  }, [timeTravelValue]);

  const points: DeliveryPoint[] = useMemo(() => (routes || []).map((r, i) => ({
    id: r.id,
    address: r.endereco_entrega || "",
    status: r.status,
    lat: r.coordinates?.lat ?? r.latitude ?? undefined,
    lng: r.coordinates?.lng ?? r.longitude ?? undefined,
    order: i + 1
  })), [routes]);

  const statusFiltered = useMemo(() => {
    if (statusFilter === "all") return points;
    return points.filter(p => p.status === statusFilter);
  }, [points, statusFilter]);

  const { filteredData, filters, setSearch, clearFilters, hasActiveFilters } = useFilters(statusFiltered, filterConfig);

  const stats = {
    total: points.length,
    pendentes: points.filter(p => p.status === "aguardando_producao" || p.status === "pronto_despacho").length,
    emRota: points.filter(p => p.status === "em_transito" || p.status === "despachado").length,
    entregues: points.filter(p => p.status === "entregue" || p.status === "finalizado").length
  };

  // Convert filtered points to map markers with time travel simulation
  const mapMarkers: MapMarker[] = useMemo(() => {
    const isHistorical = timeTravelValue < 95;
    
    return filteredData
      .filter(p => p.lat && p.lng)
      .map(p => {
        let lat = p.lat!;
        let lng = p.lng!;
        
        // Simular posição histórica para caminhões/entregas em trânsito
        if (isHistorical && (p.status === 'em_transito' || p.status === 'despachado')) {
          const factor = (100 - timeTravelValue) / 100;
          lat = ORIGIN_COORDINATES.lat + (lat - ORIGIN_COORDINATES.lat) * (1 - factor);
          lng = ORIGIN_COORDINATES.lng + (lng - ORIGIN_COORDINATES.lng) * (1 - factor);
        }

        const bioMetrics = activeLayers.bio ? `
          <div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.1);display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div style="display:flex;flex-direction:column;gap:2px">
              <span style="font-size:8px;color:rgba(255,255,255,0.4);font-weight:900;text-transform:uppercase">Heart_Rate</span>
              <span style="font-size:12px;color:#f43f5e;font-weight:900;font-family:monospace">${bioData?.heart_rate || '--'} BPM</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:2px">
              <span style="font-size:8px;color:rgba(255,255,255,0.4);font-weight:900;text-transform:uppercase">Fatigue_Index</span>
              <span style="font-size:12px;color:#fbbf24;font-weight:900;font-family:monospace">${bioData?.fatigue_index || 'FETCHING'}</span>
            </div>
          </div>
        ` : '';

        const isAnomaly = p.order % 5 === 0; // Simulate anomaly for every 5th unit
        
        // Dynamic time stamp based on time travel
        const syncTime = new Date(lastSync);
        const isRecent = isLiveData;
        const syncLabel = syncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        return {
          id: p.id,
          lat,
          lng,
          isAnomaly,
          label: `#${p.order} — ${p.address}`,
          color: isAnomaly ? '#ef4444' : getStatusColor(p.status),
          popupHTML: `
            <div style="padding:16px;background:#000;border-radius:24px;border:1px solid rgba(255,255,255,0.1);box-shadow:0 20px 40px rgba(0,0,0,0.8);max-width:260px;overflow:hidden;position:relative;backdrop-filter:blur(20px);">
              <div style="position:absolute;top:0;left:0;width:100%;height:4px;background:${isAnomaly ? '#ef4444' : getStatusColor(p.status)}"></div>
              
              <div style="display:flex;justify-between;align-items:start;margin-bottom:12px;">
                <div style="display:flex;align-items:center;gap:12px;">
                  <div style="width:36px;height:36px;border-radius:10px;background:${isAnomaly ? '#ef4444' : getStatusColor(p.status)}22;display:flex;align-items:center;justify-center;border:1px solid ${isAnomaly ? '#ef4444' : getStatusColor(p.status)}44">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${isAnomaly ? '#ef4444' : getStatusColor(p.status)}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  </div>
                  <div>
                    <strong style="font-size:14px;color:#fff;font-family:system-ui;font-weight:900;letter-spacing:-0.5px;display:block">UNIT_${p.order}</strong>
                    <div style="display:flex;align-items:center;gap:4px;">
                      <div style="width:6px;height:6px;border-radius:50%;background:${isRecent ? '#22c55e' : 'rgba(255,255,255,0.2)'};${isRecent ? 'box-shadow:0 0 8px #22c55e;' : ''} ${isRecent ? 'animation:pulse 2s infinite;' : ''}"></div>
                      <span style="font-size:8px;color:rgba(255,255,255,0.4);font-weight:900;text-transform:uppercase">SYNC: ${syncLabel}</span>
                    </div>
                  </div>
                </div>
              </div>

              <p style="font-size:11px;color:rgba(255,255,255,0.6);font-weight:700;line-height:1.4;margin:0 0 12px 0;text-transform:uppercase;letter-spacing:0.5px">${p.address}</p>
              
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <div style="padding:4px 12px;border-radius:999px;font-size:9px;font-weight:900;color:${isAnomaly ? '#ef4444' : getStatusColor(p.status)};background:${isAnomaly ? '#ef4444' : getStatusColor(p.status)}15;border:1px solid ${isAnomaly ? '#ef4444' : getStatusColor(p.status)}33;text-transform:uppercase;letter-spacing:1px">
                  ${isAnomaly ? 'CRITICAL_DELAY' : getStatusLabel(p.status).toUpperCase()}
                </div>
                ${isAnomaly ? '<div style="padding:4px 12px;border-radius:999px;font-size:9px;font-weight:900;color:#ef4444;background:#ef444415;border:1px solid #ef444433;text-transform:uppercase;letter-spacing:1px">RISK_DETECTOR</div>' : ''}
              </div>

              ${bioMetrics}
              ${isHistorical ? '<div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.05);font-size:9px;color:rgba(255,255,255,0.4);font-weight:900;text-transform:uppercase;letter-spacing:1px;display:flex;align-items:center;gap:4px;"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> HISTORICAL_RESTORE</div>' : ''}
            </div>
            <style>
              @keyframes pulse {
                0% { opacity: 0.4; }
                50% { opacity: 1; }
                100% { opacity: 0.4; }
              }
            </style>
          `,
        };
      });
  }, [filteredData, timeTravelValue, activeLayers.bio, bioData, lastSync, isLiveData]);

  const handleClearFilters = () => {
    clearFilters();
    setStatusFilter("all");
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Premium Header */}
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between px-4 py-6 bg-black/40 backdrop-blur-3xl rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          
          <div className="space-y-4 relative z-10">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white flex flex-col gap-1 tracking-tighter uppercase italic leading-none">
              <span className="text-cyan-500 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">Nexus</span>
              <span className="flex items-center gap-4">
                Routing_Grid
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] not-italic tracking-[0.3em] text-cyan-500">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_#06b6d4]" />
                  LIVE_SYNC
                </div>
              </span>
            </h1>
            <p className="text-white/40 text-xs font-bold uppercase tracking-[0.4em] flex items-center gap-3">
              <Globe className="w-3.5 h-3.5 text-cyan-500" />
              Soberania em Inteligência Geoespacial & Logística Preditiva
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 relative z-10">
            <div className="flex items-center gap-6 p-4 bg-white/5 rounded-3xl border border-white/5 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <Switch id="route-lines" checked={showRouteLines} onCheckedChange={setShowRouteLines} className="data-[state=checked]:bg-cyan-500" />
                <Label htmlFor="route-lines" className="text-[10px] font-black uppercase tracking-widest text-white/60">Arc_Routes</Label>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => deliveryRoutes?.refetchWithGeocoding?.()}
                className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-2xl px-6 h-10 transition-all active:scale-95"
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", isGeocoding && "animate-spin")} />
                <span className="text-[10px] font-black uppercase tracking-widest">Recalcular_Grid</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Nexus KPI Cluster */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { label: "PONTOS_ATIVOS", value: stats.total, icon: MapPin, color: "text-cyan-500", bg: "bg-cyan-500/5" },
            { label: "BACKLOG_PENDENTE", value: stats.pendentes, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/5" },
            { label: "FLUXO_TRANSITO", value: stats.emRota, icon: Truck, color: "text-blue-500", bg: "bg-blue-500/5" },
            { label: "SLA_ENTREGUE", value: stats.entregues, icon: Package, color: "text-green-500", bg: "bg-green-500/5" }
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn("p-6 rounded-[2rem] border border-white/5 bg-black/40 backdrop-blur-xl shadow-2xl group hover:border-white/10 hover:bg-black/60 transition-all duration-500 relative overflow-hidden", stat.bg)}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-3xl group-hover:bg-cyan-500/10 transition-colors" />
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-2xl bg-black/50 border border-white/5 group-hover:scale-110 transition-transform", stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="h-1 w-12 bg-white/5 rounded-full overflow-hidden">
                  <div className={cn("h-full w-2/3 rounded-full", stat.color.replace('text', 'bg'))} />
                </div>
              </div>
              <p className="text-3xl font-black text-white italic tracking-tighter mb-1">{stat.value}</p>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Map + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="relative group overflow-hidden rounded-[2.5rem] border-2 border-white/5 bg-black shadow-2xl transition-all hover:border-cyan-500/30">
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => {
                      setMapStyle(mapStyle === 'dark' ? 'satellite' : 'dark');
                      setMapPitch(mapStyle === 'dark' ? 45 : 0);
                    }}
                    className="bg-black/90 backdrop-blur-2xl text-cyan-400 border-cyan-500/30 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-cyan-500/20 transition-all border shadow-2xl"
                  >
                    {mapStyle === 'dark' ? <Satellite className="w-3.5 h-3.5" /> : <Map className="w-3.5 h-3.5" />}
                    {mapStyle === 'dark' ? 'Satellite_Fusion' : 'Tactical_Grid'}
                  </Button>

                  <Button 
                    size="sm" 
                    onClick={() => setIsDroneView(!isDroneView)}
                    className={cn("bg-black/90 backdrop-blur-2xl px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border shadow-2xl", isDroneView ? "text-amber-400 border-amber-500/30 bg-amber-500/10" : "text-white/40 border-white/5")}
                  >
                    <Globe className={cn("w-3.5 h-3.5", isDroneView && "animate-spin")} />
                    {isDroneView ? 'Drone_Follow: ON' : 'Drone_View'}
                  </Button>
                  
                  <Badge className="bg-black/90 backdrop-blur-2xl text-cyan-400 border-cyan-500/30 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-t border-white/5">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4] animate-pulse" />
                    Live_Telemetry: Active
                  </Badge>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveLayers(prev => ({ ...prev, fleet: !prev.fleet }))}
                    className={cn("bg-black/80 backdrop-blur-xl border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest px-3 h-8 hover:bg-white/5 transition-all", activeLayers.fleet ? "text-cyan-400 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]" : "text-white/40")}
                  >
                    <Truck className="w-3 h-3 mr-1.5" />
                    Fleet
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveLayers(prev => ({ ...prev, deliveries: !prev.deliveries }))}
                    className={cn("bg-black/80 backdrop-blur-xl border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest px-3 h-8 hover:bg-white/5 transition-all", activeLayers.deliveries ? "text-cyan-400 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]" : "text-white/40")}
                  >
                    <Package className="w-3 h-3 mr-1.5" />
                    Deliveries
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveLayers(prev => ({ ...prev, nexus: !prev.nexus }))}
                    className={cn("bg-black/80 backdrop-blur-xl border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest px-3 h-8 hover:bg-white/5 transition-all", activeLayers.nexus ? "text-cyan-400 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]" : "text-white/40")}
                  >
                    <Layers className="w-3 h-3 mr-1.5" />
                    Nexus_Grid
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveLayers(prev => ({ ...prev, risks: !prev.risks }))}
                    className={cn("bg-black/80 backdrop-blur-xl border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest px-3 h-8 hover:bg-white/5 transition-all", activeLayers.risks ? "text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]" : "text-white/40")}
                  >
                    <AlertTriangle className="w-3 h-3 mr-1.5" />
                    Risks
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveLayers(prev => ({ ...prev, weather: !prev.weather }))}
                    className={cn("bg-black/80 backdrop-blur-xl border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest px-3 h-8 hover:bg-white/5 transition-all", activeLayers.weather ? "text-blue-400 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]" : "text-white/40")}
                  >
                    <CloudRain className="w-3 h-3 mr-1.5" />
                    Weather
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveLayers(prev => ({ ...prev, bio: !prev.bio }))}
                    className={cn("bg-black/80 backdrop-blur-xl border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest px-3 h-8 hover:bg-white/5 transition-all", activeLayers.bio ? "text-rose-400 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]" : "text-white/40")}
                  >
                    <Activity className="w-3 h-3 mr-1.5" />
                    Bio_Sync
                  </Button>
                    </div>
                  </div>
                  
                  {/* Nexus Tactical Log */}
                  <div className="bg-black/90 backdrop-blur-2xl p-5 rounded-[2rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] pointer-events-auto min-w-[280px] hidden xl:block">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest italic">Nexus_Tactical_Log</span>
                    </div>
                    <div className="space-y-2 max-h-[120px] overflow-hidden">
                      <AnimatePresence mode="popLayout">
                        {logs.map((log) => (
                          <motion.div 
                            key={log.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="flex items-start gap-3"
                          >
                            <span className="text-[8px] font-black text-white/20 font-monospace">{log.time}</span>
                            <span className="text-[8px] font-black text-cyan-500/80 uppercase tracking-tighter truncate">{log.msg}</span>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>

              <MapIntelligenceOverlay />
              <MapboxMap
                markers={activeLayers.deliveries ? mapMarkers : []}
                originMarker={{ ...ORIGIN_COORDINATES, label: "🏭 CD Central — SP" }}
                showRoute={showRouteLines}
                mapStyle={mapStyle}
                pitch={mapPitch}
                showTraffic={activeLayers.nexus}
                showWeather={activeLayers.weather}
                 isDroneView={isDroneView}
                 riskZones={activeLayers.risks ? riskZones : []}
                 className="h-[650px] w-full"
                 onMarkerClick={(id) => {
                   const point = points.find(p => p.id === id);
                   if (point && point.order % 5 === 0) {
                     setSelectedAnomaly({
                       id: point.id,
                       level: 'crit',
                       cause: 'FALHA_CONEXÃO_TELEMETRIA',
                       action: 'REINICIAR_GATEWAY_OBDII'
                     });
                   }
                 }}
               />

              {/* predictive risk alerts overlay */}
              <AnimatePresence>
                {activeLayers.risks && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="absolute top-24 right-4 z-20 flex flex-col gap-3 max-w-[300px]"
                  >
                    <div className="bg-amber-500/10 backdrop-blur-3xl border border-amber-500/20 p-5 rounded-3xl shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Alerta_Preditivo_Nexus</span>
                        </div>
                        <Badge variant="outline" className="text-[8px] font-black bg-amber-500/10 text-amber-500 border-amber-500/30">RISCO_ALTO</Badge>
                      </div>
                      <p className="text-[11px] font-bold text-white/80 leading-relaxed uppercase tracking-tight mb-3">Bloqueio total na BR-116 (Km 245). Obstrução por acidente grave.</p>
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/5">
                        <Route className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">Recalculando_Via_Alternativa_SP-070</span>
                      </div>
                    </div>
                    
                    <div className="bg-red-500/10 backdrop-blur-3xl border border-red-500/20 p-5 rounded-3xl shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <ShieldCheck className="w-4 h-4 text-red-500" />
                          <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Zona_De_Risco_Segurança</span>
                        </div>
                        <Badge variant="outline" className="text-[8px] font-black bg-red-500/10 text-red-500 border-red-500/30">CRÍTICO</Badge>
                      </div>
                      <p className="text-[11px] font-bold text-white/80 leading-relaxed uppercase tracking-tight">Área de alta periculosidade detectada (Satelite_Fusion AI). Protocolo Nexus_Shield ativo.</p>
                    </div>
                  </motion.div>
                )}

                {activeLayers.bio && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-4 left-1/2 -translate-x-1/2 z-20"
                  >
                    <div className="bg-rose-500/10 backdrop-blur-3xl border border-rose-500/20 px-6 py-2 rounded-full flex items-center gap-4 shadow-2xl">
                      <Activity className="w-4 h-4 text-rose-500 animate-bounce" />
                      <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em]">Nexus_BioSync: Scanning_Vitals...</span>
                    </div>
                  </motion.div>
                )}
                {selectedAnomaly && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 min-w-[320px]"
                  >
                    <div className="bg-black/95 backdrop-blur-3xl border-2 border-red-500/30 p-8 rounded-[2.5rem] shadow-[0_40px_100px_rgba(239,68,68,0.3)]">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-white italic tracking-tighter">ANOMALY_DETAIL</h3>
                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">CRITICAL_LEVEL</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedAnomaly(null)} className="text-white/20 hover:text-white">×</Button>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                          <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">Causa Provável</p>
                          <p className="text-sm font-bold text-white uppercase">{selectedAnomaly.cause}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                          <p className="text-[9px] font-black text-cyan-500 uppercase tracking-widest mb-1">Ação Sugerida</p>
                          <p className="text-sm font-bold text-cyan-400 uppercase">{selectedAnomaly.action}</p>
                        </div>
                        <Button className="w-full bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest h-12 rounded-2xl" onClick={() => setSelectedAnomaly(null)}>
                          EXECUTAR_PROTOCOLO_RESGATE
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="absolute bottom-6 left-6 right-6 z-10 pointer-events-none">
                <div className="flex justify-between items-end">
                  <div className="bg-black/80 backdrop-blur-2xl p-5 rounded-[2rem] border border-white/10 flex items-center gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto group/fleet">
                    <div className="flex -space-x-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-cyan-500/20 flex items-center justify-center backdrop-blur-md relative group/truck">
                          <Truck className="w-5 h-5 text-cyan-400 group-hover/truck:scale-110 transition-transform" />
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full border-2 border-black animate-pulse" />
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.2em]">Nexus_Fleet_Dynamics</p>
                        <div className={cn(
                          "flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-colors",
                          isLiveData ? "bg-cyan-500/10 border-cyan-500/20" : "bg-white/5 border-white/10"
                        )}>
                          <Zap className={cn("w-2.5 h-2.5", isLiveData ? "text-cyan-400 animate-pulse" : "text-white/40")} />
                          <span className={cn("text-[8px] font-black uppercase tracking-widest", isLiveData ? "text-cyan-400" : "text-white/40")}>
                            {isLiveData ? "LIVE_" : "LOG_"}
                            {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                        <p className="text-sm font-black text-white italic tracking-tight group-hover/fleet:text-cyan-400 transition-colors uppercase">OPERANDO_EM_CAPACIDADE_NOMINAL</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-black/90 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/10 flex flex-col gap-4 shadow-[0_25px_60px_rgba(0,0,0,0.9)] pointer-events-auto min-w-[320px] group/simulator">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest italic">Time_Travel_Simulator</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-black text-cyan-500 border-cyan-500/30 bg-cyan-500/5">
                        T-{100 - timeTravelValue}m
                      </Badge>
                    </div>
                    <div className="py-2">
                      <Slider
                        defaultValue={[100]}
                        max={100}
                        step={1}
                        value={[timeTravelValue]}
                        onValueChange={(vals) => setTimeTravelValue(vals[0])}
                        className="cursor-pointer"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4 text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">
                        <span className="group-hover/simulator:text-cyan-500/50 transition-colors cursor-pointer" onClick={() => {
                          const blob = new Blob([JSON.stringify(logs)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `nexus_logs_${new Date().toISOString()}.json`;
                          a.click();
                        }}>Export_Logs</span>
                        <span className="group-hover/simulator:text-cyan-500/50 transition-colors">Nexus_Forecast</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {weatherData && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                            <CloudRain className="w-2.5 h-2.5 text-blue-400" />
                            <span className="text-[8px] font-black text-white/60 uppercase">{weatherData.main.temp}°C {weatherData.weather[0].main}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-black/80 backdrop-blur-2xl p-4 rounded-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto hidden md:block">
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-0.5">ETA_Global_Média</p>
                        <p className="text-xl font-black text-cyan-400 italic">~42.8 MIN</p>
                      </div>
                      <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-cyan-500 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {isGeocoding && deliveryRoutes?.geocodingProgress && (
              <div className="p-4 bg-cyan-500/5 border border-cyan-500/10 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 text-cyan-500 animate-spin" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Geocodificando Endereços Nexus...</span>
                </div>
                <div className="text-[10px] font-black text-cyan-500 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                  {deliveryRoutes.geocodingProgress.current} / {deliveryRoutes.geocodingProgress.total}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <FilterBar
              search={filters.search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar endereço..."
              status={statusFilter}
              onStatusChange={setStatusFilter}
              statusOptions={[
                { value: "aguardando_producao", label: "Aguardando" },
                { value: "pronto_despacho", label: "Pronto" },
                { value: "em_transito", label: "Em Trânsito" },
                { value: "despachado", label: "Despachado" },
                { value: "saiu_entrega", label: "Saiu p/ Entrega" },
              ]}
              statusLabel="Status"
              onClearFilters={handleClearFilters}
              hasActiveFilters={hasActiveFilters || statusFilter !== "all"}
              totalFiltered={filteredData.length}
              totalOriginal={points.length}
            />
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredData.map((p, i) => (
                <motion.div 
                  key={p.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative bg-black/40 backdrop-blur-xl border border-white/5 p-4 rounded-3xl hover:border-cyan-500/30 transition-all cursor-pointer overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex flex-col items-center justify-center text-sm font-black text-white shrink-0 italic border-t border-white/10 shadow-2xl group-hover:scale-110 transition-transform relative"
                      style={{ backgroundColor: `${getStatusColor(p.status)}33`, color: getStatusColor(p.status), border: `1px solid ${getStatusColor(p.status)}22` }}
                    >
                      <span className="text-xs">{String(p.order).padStart(2, '0')}</span>
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-success rounded-full border-2 border-black animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-black text-white/90 truncate uppercase tracking-tight">{p.address || "ENDEREÇO_NÃO_INFORMADO"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                          {p.lat && p.lng ? `GPS: ${p.lat.toFixed(4)} / ${p.lng.toFixed(4)}` : 'COORDENADAS_AUSENTES'}
                          <span className="ml-2 text-cyan-500 animate-pulse">● LIVE_SYNC</span>
                        </p>
                      </div>
                    </div>
                    <Badge
                      className="text-[9px] font-black uppercase tracking-tighter shrink-0 rounded-full px-3 py-1 border-none shadow-lg"
                      style={{ backgroundColor: `${getStatusColor(p.status)}22`, color: getStatusColor(p.status) }}
                    >
                      {getStatusLabel(p.status)}
                    </Badge>
                  </div>
                </motion.div>
              ))}
              {filteredData.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-white/20" />
                  </div>
                  <p className="text-xs font-black text-white/20 uppercase tracking-[0.3em]">Nenhum registro no radar</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}