import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Map, Navigation, Truck, Package, Clock, MapPin, Loader2, RefreshCw, Route } from "lucide-react";
import { useDeliveryRoutes } from "@/hooks/useDeliveryRoutes";
import { useGeocoding } from "@/hooks/useGeocoding";
import { useRealtime } from "@/hooks/useRealtime";
import { FilterBar } from "@/components/common/FilterBar";
import { useFilters, FilterConfig } from "@/hooks/useFilters";
import { cn } from "@/lib/utils";

interface DeliveryPoint { id: string; address: string; status: string; lat?: number; lng?: number; order: number; }

const filterConfig: FilterConfig<DeliveryPoint>[] = [
  { key: "search", type: "search", fields: ["address"] },
  { key: "status", type: "select", field: "status", options: [{ value: "pendente", label: "Pendente" }, { value: "em_rota", label: "Em Rota" }, { value: "entregue", label: "Entregue" }] }
];

export default function MapaRotas() {
  const [selectedDriver, setSelectedDriver] = useState<string>("");
  const { routes, drivers, isLoading, refetch, optimizeRoute } = useDeliveryRoutes({ driverId: selectedDriver });
  const { geocode, isGeocoding } = useGeocoding();

  useRealtime({ table: "entregas", onUpdate: () => refetch?.() });

  const points: DeliveryPoint[] = (routes || []).map((r: any, i: number) => ({ id: r.id, address: r.address || r.endereco, status: r.status, lat: r.lat, lng: r.lng, order: i + 1 }));
  const { filteredData, filters, setFilter, clearFilters, hasActiveFilters } = useFilters(points, filterConfig);

  const stats = { total: points.length, pendentes: points.filter(p => p.status === "pendente").length, emRota: points.filter(p => p.status === "em_rota").length, entregues: points.filter(p => p.status === "entregue").length };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><h1 className="text-display flex items-center gap-3"><div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400/20 to-cyan-600/10"><Map className="w-6 h-6 text-cyan-500" /></div>Mapa de Rotas</h1><p className="text-muted-foreground mt-1">Visualize e otimize rotas de entrega</p></div>
          <div className="flex gap-2">
            <Select value={selectedDriver} onValueChange={setSelectedDriver}><SelectTrigger className="w-48"><SelectValue placeholder="Motorista" /></SelectTrigger><SelectContent>{(drivers || []).map((d: any) => <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>)}</SelectContent></Select>
            <Button variant="outline" onClick={() => optimizeRoute?.()}><Route className="w-4 h-4 mr-2" />Otimizar</Button>
            <Button variant="outline" onClick={() => refetch?.()}><RefreshCw className="w-4 h-4" /></Button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="stat-card text-center"><MapPin className="w-5 h-5 text-cyan-500 mx-auto mb-2" /><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-muted-foreground">Pontos</p></div>
          <div className="stat-card text-center"><Clock className="w-5 h-5 text-amber-500 mx-auto mb-2" /><p className="text-2xl font-bold">{stats.pendentes}</p><p className="text-xs text-muted-foreground">Pendentes</p></div>
          <div className="stat-card text-center"><Truck className="w-5 h-5 text-blue-500 mx-auto mb-2" /><p className="text-2xl font-bold">{stats.emRota}</p><p className="text-xs text-muted-foreground">Em Rota</p></div>
          <div className="stat-card text-center"><Package className="w-5 h-5 text-green-500 mx-auto mb-2" /><p className="text-2xl font-bold">{stats.entregues}</p><p className="text-xs text-muted-foreground">Entregues</p></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card-base p-4 min-h-[400px] flex items-center justify-center bg-muted/50">
            {isLoading || isGeocoding ? <Loader2 className="w-8 h-8 animate-spin" /> : <div className="text-center text-muted-foreground"><Map className="w-16 h-16 mx-auto mb-4 opacity-30" /><p>Mapa será exibido aqui</p><p className="text-sm">Integração com Mapbox/Google Maps</p></div>}
          </div>
          <div className="space-y-4">
            <FilterBar searchValue={filters.search as string || ""} onSearchChange={(v) => setFilter("search", v)} searchPlaceholder="Buscar endereço..." filters={[{ key: "status", label: "Status", type: "select", value: filters.status as string || "", options: [{ value: "", label: "Todos" }, { value: "pendente", label: "Pendente" }, { value: "em_rota", label: "Em Rota" }, { value: "entregue", label: "Entregue" }], onChange: (v) => setFilter("status", v || undefined) }]} onClearFilters={clearFilters} hasActiveFilters={hasActiveFilters} totalCount={filteredData.length} filteredCount={filteredData.length} />
            <div className="space-y-2 max-h-[350px] overflow-y-auto">{filteredData.map((p, i) => (
              <div key={p.id} className="card-interactive flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold", p.status === "entregue" ? "bg-green-100 text-green-700" : p.status === "em_rota" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700")}>{p.order}</div>
                <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{p.address}</p></div>
                <Badge variant={p.status === "entregue" ? "default" : p.status === "em_rota" ? "secondary" : "outline"}>{p.status}</Badge>
              </div>
            ))}</div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
