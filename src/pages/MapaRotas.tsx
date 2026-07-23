/* eslint-disable max-lines */
import { useState, useMemo, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Zap,
  Download,
  FileText,
  Clock,
  History,
  ChevronRight,
} from "lucide-react";
import {
  useDeliveryRoutes,
  ORIGIN_COORDINATES,
  getStatusColor,
} from "@/hooks/logistics/useDeliveryRoutes";
import { MapboxMap, MapMarker } from "@/components/map";
import { useFilters, FilterConfig } from "@/hooks/common/useFilters";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";
import { CinematicHUD } from "@/components/map/CinematicHUD";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DeliveryPoint {
  id: string;
  address: string;
  status: string;
  lat?: number;
  lng?: number;
  order: number;
}

const filterConfig: FilterConfig<DeliveryPoint> = {
  search: { fields: ["address"], placeholder: "Buscar endereço..." },
};

export default function MapaRotas() {
  const deliveryRoutes = useDeliveryRoutes();
  const routes = useMemo(() => deliveryRoutes?.data || [], [deliveryRoutes?.data]);

  const [showRouteLines] = useState(true);
  const [mapStyle] = useState<"dark" | "satellite">("dark");
  const [mapPitch] = useState(0);
  const [timeTravelValue, setTimeTravelValue] = useState(100);
  const [riskZones] = useState<
    {
      id: string;
      center: [number, number];
      radius: number;
      severity: "low" | "medium" | "high";
    }[]
  >([
    { id: "1", center: [-46.6333, -23.5505], radius: 1000, severity: "high" },
    { id: "2", center: [-46.8, -23.6], radius: 1000, severity: "medium" },
  ]);
  const [lastSync, setLastSync] = useState(new Date());
  const [isLiveData, setIsLiveData] = useState(true);
  const [, setBioData] = useState<{
    heart_rate: number;
    fatigue_index: string;
  } | null>(null);
  const [logs, setLogs] = useState<
    {
      id: string;
      time: string;
      msg: string;
      type: "info" | "warn" | "crit";
      vehicle?: string | null;
      event_time: string;
    }[]
  >([]);
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedLogTime, setSelectedLogTime] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    let query = supabase
      .from("nexus_tactical_logs")
      .select("*")
      .order("event_time", { ascending: false });

    if (timeTravelValue < 95) {
      const historyDate = new Date();
      historyDate.setMinutes(
        historyDate.getMinutes() - (100 - timeTravelValue),
      );
      const hourAgo = new Date(historyDate);
      hourAgo.setMinutes(hourAgo.getMinutes() - 30);
      query = query
        .lte("event_time", historyDate.toISOString())
        .gte("event_time", hourAgo.toISOString());
    } else {
      query = query.limit(50);
    }

    const { data } = await query;

    if (data) {
      setLogs(
        data.map((l) => ({
          id: l.id,
          time: new Date(l.event_time).toLocaleTimeString([], {
            hour12: false,
          }),
          event_time: l.event_time,
          msg: l.message,
          type: l.type as "info" | "warn" | "crit",
          vehicle: l.target_vehicle,
        })),
      );
    }
  }, [timeTravelValue]);

  useEffect(() => {
    fetchLogs();
    const channel = supabase
      .channel("tactical-logs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "nexus_tactical_logs" },
        () => {
          if (timeTravelValue >= 95) fetchLogs();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLogs, timeTravelValue]);

  const bioAlertRules = async () => {
    const { data } = await supabase
      .from("bio_sync_alert_rules")
      .select("*")
      .limit(1)
      .maybeSingle();
    return data || { bpm_warning_threshold: 95, bpm_critical_threshold: 110 };
  };

  useEffect(() => {
    const fetchBio = async () => {
      const { data } = await supabase
        .from("bio_sync_telemetry")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setBioData({
          heart_rate: data.heart_rate,
          fatigue_index: data.fatigue_index,
        });
        const rules = await bioAlertRules();

        if (rules && data.heart_rate > (rules.bpm_critical_threshold || 110)) {
          toast.error("BIOSYNC_CRITICAL: Limite excedido!", {
            description: `BPM: ${data.heart_rate} (Limite: ${rules.bpm_critical_threshold})`,
            className: "bg-red-500/90 border-red-500 text-white font-black",
            duration: 8000,
          });
        }
      }
    };
    fetchBio();
    const interval = setInterval(fetchBio, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsLiveData(timeTravelValue >= 95);
    if (timeTravelValue >= 95) {
      setLastSync(new Date());
    } else {
      const historyDate = new Date();
      historyDate.setMinutes(
        historyDate.getMinutes() - (100 - timeTravelValue),
      );
      setLastSync(historyDate);
    }
  }, [timeTravelValue]);

  const points: DeliveryPoint[] = useMemo(
    () =>
      (routes || []).map((r, i) => ({
        id: r.id,
        address: r.endereco_entrega || "",
        status: r.status,
        lat: r.coordinates?.lat ?? r.latitude ?? undefined,
        lng: r.coordinates?.lng ?? r.longitude ?? undefined,
        order: i + 1,
      })),
    [routes],
  );

  const { filteredData } = useFilters(points, filterConfig);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (vehicleFilter !== "all" && log.vehicle !== vehicleFilter)
        return false;
      if (typeFilter !== "all" && log.type !== typeFilter) return false;
      return true;
    });
  }, [logs, vehicleFilter, typeFilter]);

  const jumpToTime = (isoString: string) => {
    const eventDate = new Date(isoString);
    const now = new Date();
    const diffMin = Math.round((now.getTime() - eventDate.getTime()) / 60000);
    const newVal = Math.max(0, Math.min(100, 100 - diffMin));
    setTimeTravelValue(newVal);
    setSelectedLogTime(isoString);
    toast.info("TIME_TRAVEL: Sincronizando mapa", {
      description: `Saltando para ${new Date(isoString).toLocaleTimeString()}`,
    });
  };

  const handleExportCSV = () => {
    const dataToExport = filteredLogs.map((l) => ({
      Timestamp: l.time,
      Unidade: l.vehicle || "N/A",
      Tipo: l.type.toUpperCase(),
      Mensagem: l.msg,
    }));
    exportToCSV(
      dataToExport,
      `nexus_tactical_log_${vehicleFilter}_${new Date().toISOString()}`,
    );
    toast.success("LOG EXPORTADO", {
      description: "Filtros aplicados via Time-Travel e Veículo.",
    });
  };

  const handleExportPDF = () => {
    const dataToExport = filteredLogs.map((l) => ({
      time: l.time,
      vehicle: l.vehicle || "N/A",
      type: l.type.toUpperCase(),
      msg: l.msg,
    }));
    exportToPDF(
      dataToExport,
      ["time", "vehicle", "type", "msg"],
      `nexus_tactical_log_${new Date().toISOString()}`,
    );
    toast.success("LOG PDF GERADO", {
      description: "Relatório tático consolidado.",
    });
  };

  const mapMarkers: MapMarker[] = useMemo(() => {
    const isHistorical = timeTravelValue < 95;
    return filteredData
      .filter((p) => p.lat && p.lng)
      .map((p) => {
        let lat = p.lat!;
        let lng = p.lng!;
        if (
          isHistorical &&
          (p.status === "em_transito" || p.status === "despachado")
        ) {
          const factor = (100 - timeTravelValue) / 100;
          lat =
            ORIGIN_COORDINATES.lat +
            (lat - ORIGIN_COORDINATES.lat) * (1 - factor);
          lng =
            ORIGIN_COORDINATES.lng +
            (lng - ORIGIN_COORDINATES.lng) * (1 - factor);
        }
        return {
          id: p.id,
          lat,
          lng,
          isAnomaly: p.order % 5 === 0,
          label: `#${p.order} — ${p.address}`,
          color: p.order % 5 === 0 ? "#ef4444" : getStatusColor(p.status),
          popupHTML: `<div>UNIT_${p.order}</div>`,
        };
      });
  }, [filteredData, timeTravelValue]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between px-4 py-6 bg-black/40 backdrop-blur-3xl rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden group">
          <div className="space-y-4 relative z-10">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white flex flex-col gap-1 tracking-tighter uppercase italic leading-none">
              <span className="text-cyan-500">Nexus</span>
              <span className="flex items-center gap-4">Tactical_Grid</span>
            </h1>
            <p className="text-white/40 text-xs font-bold uppercase tracking-[0.4em] flex items-center gap-3">
              <Globe className="w-3.5 h-3.5 text-cyan-500" /> SOBERANIA
              GEOESPACIAL 10/10
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="h-14 px-6 rounded-2xl border-white/10 bg-black/40 font-black uppercase tracking-widest text-[10px] gap-2 hover:bg-cyan-500/10 transition-all hover:scale-105"
              onClick={() => setTimeTravelValue(100)}
            >
              <Zap
                className={cn(
                  "h-4 w-4",
                  isLiveData ? "text-cyan-500 animate-pulse" : "text-white/20",
                )}
              />{" "}
              {isLiveData ? "LIVE_GRID_ACTIVE" : "RESTORE_LIVE_SYNC"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[70vh]">
          <div className="lg:col-span-3 relative rounded-[2.5rem] overflow-hidden border border-white/10 bg-black shadow-2xl group">
            <MapboxMap
              markers={mapMarkers}
              showRouteLines={showRouteLines}
              riskZones={riskZones}
              mapStyle={mapStyle}
              pitch={mapPitch}
            />
            <CinematicHUD isLiveData={isLiveData} lastSync={lastSync} />
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[85%] z-50">
              <div className="px-10 py-8 bg-black/80 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-2xl space-y-6 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                      <Clock className="w-4 h-4 text-cyan-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">
                        Temporal_Shift
                      </p>
                      <p className="text-xs text-white/40 font-bold uppercase">
                        {isLiveData
                          ? "Tempo Real (Nexus_Prime)"
                          : "Restore_Point: " + lastSync.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-cyan-500/10 text-cyan-500 border-cyan-500/20 font-black px-4 h-8 tracking-widest text-[10px]">
                    {timeTravelValue}%_SYNC
                  </Badge>
                </div>
                <Slider
                  value={[timeTravelValue]}
                  onValueChange={(v) => setTimeTravelValue(v[0])}
                  max={100}
                  step={1}
                  className="[&_[role=slider]]:h-8 [&_[role=slider]]:w-8 [&_[role=slider]]:border-4 [&_[role=slider]]:border-cyan-500 [&_[role=slider]]:bg-black"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6 flex flex-col">
            <Card className="flex-1 bg-black/60 backdrop-blur-xl border-white/10 rounded-[2rem] overflow-hidden flex flex-col">
              <CardHeader className="border-b border-white/5 bg-white/[0.02] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <History className="w-5 h-5 text-cyan-500" />
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-white">
                      Event_Timeline
                    </CardTitle>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[9px] font-black border-white/10 uppercase"
                  >
                    {filteredLogs.length} LOGS
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-8 bg-black/40 border-white/10 text-[9px] font-black uppercase tracking-widest">
                      <SelectValue placeholder="TIPO" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10">
                      <SelectItem value="all">TODOS</SelectItem>
                      <SelectItem value="info">INFO</SelectItem>
                      <SelectItem value="warn">AVISO</SelectItem>
                      <SelectItem value="crit">CRÍTICO</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={vehicleFilter}
                    onValueChange={setVehicleFilter}
                  >
                    <SelectTrigger className="h-8 bg-black/40 border-white/10 text-[9px] font-black uppercase tracking-widest">
                      <SelectValue placeholder="VEÍCULO" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-white/10">
                      <SelectItem value="all">FROTA_TOTAL</SelectItem>
                      {Array.from(
                        new Set(logs.map((l) => l.vehicle).filter(Boolean)),
                      ).map((v) => (
                        <SelectItem key={v} value={v!}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-y-auto">
                <div className="divide-y divide-white/5">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className={cn(
                        "p-4 hover:bg-white/5 transition-colors cursor-pointer group relative",
                        selectedLogTime === log.event_time &&
                          "bg-cyan-500/10 border-l-2 border-l-cyan-500",
                      )}
                      onClick={() => jumpToTime(log.event_time)}
                    >
                      <div className="flex gap-4">
                        <div
                          className={cn(
                            "w-1 h-full absolute left-0 top-0",
                            (log.type === "crit" && "bg-rose-500") ||
                              (log.type === "warn" && "bg-amber-500") ||
                              "bg-cyan-500/20",

                          )}
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-tighter">
                              {log.time}
                            </span>
                            {log.type === "crit" && (
                              <div className="flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_#f43f5e]" />
                                <span className="text-[8px] font-black text-rose-500 uppercase">
                                  Critical
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-white/80 font-bold leading-tight line-clamp-2 uppercase group-hover:text-white transition-colors tracking-tight">
                            {log.msg}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="text-[8px] font-black py-0 px-2 bg-white/5 border-white/10"
                            >
                              {log.vehicle || "GLOBAL"}
                            </Badge>
                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                              <ChevronRight className="w-3 h-3 text-cyan-500" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-20 rounded-2xl border-white/5 bg-black/40 flex-col gap-2 hover:bg-white/5"
                onClick={handleExportCSV}
              >
                <Download className="w-4 h-4 text-cyan-500" />{" "}
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/60">
                  Export_CSV
                </span>
              </Button>
              <Button
                variant="outline"
                className="h-20 rounded-2xl border-white/5 bg-black/40 flex-col gap-2 hover:bg-white/5"
                onClick={handleExportPDF}
              >
                <FileText className="w-4 h-4 text-cyan-500" />{" "}
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/60">
                  Export_PDF
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
