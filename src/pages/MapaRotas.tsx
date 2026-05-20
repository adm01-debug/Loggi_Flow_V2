import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Map, Truck, Package, Clock, MapPin, RefreshCw, Route, Globe } from "lucide-react";
import { useDeliveryRoutes, ORIGIN_COORDINATES, getStatusColor, getStatusLabel } from "@/hooks";
import { MapboxMap, MapMarker } from "@/components/map";
import { FilterBar } from "@/components/common/FilterBar";
import { useFilters, FilterConfig } from "@/hooks";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MapIntelligenceOverlay } from "@/components/map/MapIntelligenceOverlay";

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

  // Convert filtered points to map markers
  const mapMarkers: MapMarker[] = useMemo(() =>
    filteredData
      .filter(p => p.lat && p.lng)
      .map(p => ({
        id: p.id,
        lat: p.lat!,
        lng: p.lng!,
        label: `#${p.order} — ${p.address}`,
        color: getStatusColor(p.status),
        popupHTML: `
          <div style="padding:6px;font-size:12px;color:#111;max-width:220px">
            <strong style="font-size:13px">#${p.order}</strong>
            <div style="margin:4px 0;color:#555">${p.address}</div>
            <span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;color:#fff;background:${getStatusColor(p.status)}">${getStatusLabel(p.status)}</span>
          </div>
        `,
      })),
    [filteredData]
  );

  const handleClearFilters = () => {
    clearFilters();
    setStatusFilter("all");
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between px-2">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white flex items-center gap-4 tracking-tighter uppercase italic">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black border border-white/10 shadow-2xl transition-transform hover:scale-110">
                  <Map className="w-8 h-8 sm:w-10 sm:h-10 text-cyan-500 animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="drop-shadow-2xl">Mapeamento Nexus</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                    <span className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em]">Geospatial_Intelligence</span>
                  </div>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">PRECISÃO GPS • OTIMIZAÇÃO DE ROTAS</span>
                </div>
              </div>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch id="route-lines" checked={showRouteLines} onCheckedChange={setShowRouteLines} />
              <Label htmlFor="route-lines" className="text-xs"><Route className="w-3 h-3 inline mr-1" />Linhas</Label>
            </div>
            <Button variant="outline" size="sm" onClick={() => deliveryRoutes?.refetchWithGeocoding?.()}>
              <RefreshCw className={cn("w-4 h-4 mr-1", isGeocoding && "animate-spin")} />
              {isGeocoding ? "Geocodificando..." : "Atualizar"}
            </Button>
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
              className={cn("p-6 rounded-[2rem] border border-white/5 bg-black/40 backdrop-blur-xl shadow-2xl group hover:border-white/10 transition-all", stat.bg)}
            >
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
                <Badge className="bg-black/90 backdrop-blur-2xl text-cyan-400 border-cyan-500/30 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-t border-white/5">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4] animate-pulse" />
                  Satellite_Sync: Active
                </Badge>
                <Badge className="bg-black/90 backdrop-blur-2xl text-white/80 border-white/10 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-t border-white/5">
                  <Globe className="w-3.5 h-3.5 text-cyan-500" />
                  Nexus_Grid_View
                </Badge>
              </div>

                <MapIntelligenceOverlay />
                <MapboxMap
                markers={mapMarkers}
                originMarker={{ ...ORIGIN_COORDINATES, label: "🏭 CD Central — SP" }}
                showRoute={showRouteLines}
                className="h-[650px] w-full"
              />

              <div className="absolute bottom-6 left-6 right-6 z-10 pointer-events-none">
                <div className="flex justify-between items-end">
                  <div className="bg-black/80 backdrop-blur-2xl p-5 rounded-[2rem] border border-white/10 flex items-center gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto">
                    <div className="flex -space-x-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-black bg-cyan-500/20 flex items-center justify-center backdrop-blur-md">
                          <Truck className="w-5 h-5 text-cyan-400" />
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.2em] mb-0.5">Fleet_Health_Protocol</p>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        <p className="text-sm font-black text-white italic">OPERANDO EM CAPACIDADE MÁXIMA</p>
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
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black text-white shrink-0 italic border-t border-white/10 shadow-2xl group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: `${getStatusColor(p.status)}33`, color: getStatusColor(p.status), border: `1px solid ${getStatusColor(p.status)}22` }}
                    >
                      {String(p.order).padStart(2, '0')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-black text-white/90 truncate uppercase tracking-tight">{p.address || "ENDEREÇO_NÃO_INFORMADO"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                          {p.lat && p.lng ? `GPS: ${p.lat.toFixed(4)} / ${p.lng.toFixed(4)}` : 'COORDENADAS_AUSENTES'}
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
