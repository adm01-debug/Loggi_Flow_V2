import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Map, Truck, Package, Clock, MapPin, RefreshCw, Route } from "lucide-react";
import { useDeliveryRoutes, ORIGIN_COORDINATES, getStatusColor, getStatusLabel } from "@/hooks";
import { MapboxMap, MapMarker } from "@/components/map";
import { FilterBar } from "@/components/common/FilterBar";
import { useFilters, FilterConfig } from "@/hooks";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card text-center"><MapPin className="w-5 h-5 text-cyan-500 mx-auto mb-2" /><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Pontos</p></div>
          <div className="stat-card text-center"><Clock className="w-5 h-5 text-amber-500 mx-auto mb-2" /><p className="text-2xl font-bold">{stats.pendentes}</p><p className="text-xs text-muted-foreground">Pendentes</p></div>
          <div className="stat-card text-center"><Truck className="w-5 h-5 text-blue-500 mx-auto mb-2" /><p className="text-2xl font-bold">{stats.emRota}</p><p className="text-xs text-muted-foreground">Em Rota</p></div>
          <div className="stat-card text-center"><Package className="w-5 h-5 text-green-500 mx-auto mb-2" /><p className="text-2xl font-bold">{stats.entregues}</p><p className="text-xs text-muted-foreground">Entregues</p></div>
        </div>

        {/* Map + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="relative group overflow-hidden rounded-[2.5rem] border-2 border-white/5 bg-black shadow-2xl transition-all hover:border-cyan-500/30">
              <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2">
                <Badge className="bg-black/80 backdrop-blur-xl text-cyan-400 border-cyan-500/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                  Mapeamento_Otimizado
                </Badge>
                <Badge className="bg-black/80 backdrop-blur-xl text-white/70 border-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl">
                  <Globe className="w-3 h-3 text-cyan-500" />
                  Visualização_Live
                </Badge>
              </div>

              <MapboxMap
                markers={mapMarkers}
                originMarker={{ ...ORIGIN_COORDINATES, label: "🏭 CD Central — SP" }}
                showRoute={showRouteLines}
                className="h-[600px] w-full"
              />

              <div className="absolute bottom-6 left-6 right-6 z-10 pointer-events-none">
                <div className="flex justify-between items-end">
                  <div className="bg-black/80 backdrop-blur-2xl p-4 rounded-2xl border border-white/10 flex items-center gap-4 shadow-2xl pointer-events-auto">
                    <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-500">
                      <Route className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Rotas Processadas</p>
                      <p className="text-sm font-black text-white italic">{stats.total} Pontos Ativos</p>
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
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {filteredData.map((p) => (
                <div key={p.id} className="card-interactive flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ backgroundColor: getStatusColor(p.status) }}
                  >
                    {p.order}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.address || "Sem endereço"}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {p.lat && p.lng ? `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}` : 'Sem coordenadas'}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[10px] shrink-0"
                    style={{ borderColor: getStatusColor(p.status), color: getStatusColor(p.status) }}
                  >
                    {getStatusLabel(p.status)}
                  </Badge>
                </div>
              ))}
              {filteredData.length === 0 && (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  Nenhuma entrega encontrada
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
