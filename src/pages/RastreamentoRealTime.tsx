/* eslint-disable max-lines */
import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Truck,
  Package,
  MapPin,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  User,
  History,
  Navigation,
  ChevronRight,
  Share2,
  Copy,
  Zap,
  ShieldCheck,
  Map as MapIcon,
  Globe,
  Info,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useUnifiedTracking } from "@/hooks/logistics/useUnifiedTracking";
import { useRecordHistory } from "@/hooks/security/useAuditLogs";
import { useGeocoding } from "@/hooks/integrations/useGeocoding";
import { useDelayPrediction } from "@/hooks/logistics/useDelayPrediction";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { MapboxMap, MapMarker } from "@/components/map/MapboxMap";
import { TrackingPredictiveInsights } from "@/components/logistics/TrackingPredictiveInsights";

function formatDate(date: string | null): string {
  if (!date) return "—";
  try {
    return format(parseISO(date), "dd/MM/yy HH:mm", { locale: ptBR });
  } catch {
    return date;
  }
}

export default function RastreamentoRealTime() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    allShipments,
    isLoading: isLoadingTracking,
    refetch,
  } = useUnifiedTracking();
  const { geocodeAddress } = useGeocoding();
  const {
    analyzeDelays,
    predictions,
    isLoading: isLoadingPredictions,
  } = useDelayPrediction();

  const [originCoords, setOriginCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [destCoords, setDestCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("mapa");

  const shipment = useMemo(
    () => allShipments.find((s) => s.id === id || s.numero === id),
    [allShipments, id],
  );

  const { data: history, isLoading: loadingHistory } = useRecordHistory(
    shipment?.id || "",
    shipment?.tipo === "entrega" ? "entregas" : "coletas",
  );

  const prediction = useMemo(
    () =>
      predictions.find(
        (p) => p.id === shipment?.id || p.numero === shipment?.numero,
      ),
    [predictions, shipment],
  );

  // Geocoding on load
  useEffect(() => {
    if (shipment) {
      const fetchCoords = async () => {
        if (shipment.origem) {
          const res = await geocodeAddress(shipment.origem);
          if (res.coordinates) setOriginCoords(res.coordinates);
        }
        if (shipment.destino) {
          const res = await geocodeAddress(shipment.destino);
          if (res.coordinates) setDestCoords(res.coordinates);
        }
      };
      fetchCoords();
      analyzeDelays();
    }
  }, [shipment, geocodeAddress, analyzeDelays]);

  const mapMarkers: MapMarker[] = useMemo(() => {
    const markers: MapMarker[] = [];

    // Add destination
    if (destCoords) {
      markers.push({
        id: "dest",
        lat: destCoords.lat,
        lng: destCoords.lng,
        label: "Destino Final",
        type: "delivery",
        color: shipment?.statusColor || "#3b82f6",
        popupHTML: `
          <div class="p-3 bg-black/90 border border-white/10 rounded-xl backdrop-blur-md min-w-[200px]">
            <div class="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Destino Protocolado</div>
            <div class="text-xs font-bold text-white mb-2">${shipment?.destino}</div>
            <div class="flex items-center justify-between pt-2 border-t border-white/5">
              <span class="text-[8px] font-medium text-white/40 uppercase">Status</span>
              <span class="text-[9px] font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary">${shipment?.statusLabel}</span>
            </div>
          </div>
        `,
      });
    }

    // Marker do veículo só quando há coordenada GPS real (lat/lng do despacho).
    // Sem telemetria, não se inventa posição, velocidade ou sinal GPS.
    if (
      (shipment?.status === "em_transito" ||
        shipment?.status === "saiu_entrega") &&
      shipment.coordinates
    ) {
      const gps = shipment.coordinates;
      markers.push({
        id: "truck",
        lat: gps.lat,
        lng: gps.lng,
        label: "Última posição GPS",
        type: "truck",
        color: "#06b6d4",
        heading: 45,
        popupHTML: `
          <div class="p-4 bg-black/95 border-2 border-primary/20 rounded-[1.5rem] shadow-2xl min-w-[240px]">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" stroke-width="2.5"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-5l-4-4h-3v10a1 1 0 0 0 1 1Z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
              </div>
              <div>
                <div class="text-[10px] font-black text-primary uppercase tracking-widest">Veículo_${shipment.numero}</div>
                <div class="text-sm font-black text-white italic">ÚLTIMA POSIÇÃO GPS</div>
              </div>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between text-[9px] font-bold text-white/30 uppercase">
                <span>Status</span>
                <span class="text-primary font-black">${shipment?.statusLabel}</span>
              </div>
              <div class="flex justify-between text-[9px] font-bold text-white/30 uppercase">
                <span>Previsão</span>
                <span class="text-white">${formatDate(shipment?.previsao)}</span>
              </div>
              <div class="flex justify-between text-[9px] font-bold text-white/30 uppercase pt-2 border-t border-white/5">
                <span>Telemetria GPS</span>
                <span class="text-white/60">Somente posição de despacho</span>
              </div>
            </div>
          </div>
        `,
      });
    }

    return markers;
  }, [destCoords, shipment]);

  if (isLoadingTracking) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <Zap className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 text-primary animate-pulse" />
          </div>
          <p className="text-primary font-black uppercase tracking-[0.3em] mt-6 animate-pulse">
            Sincronizando Rede Nexus...
          </p>
        </div>
      </MainLayout>
    );
  }

  if (!shipment) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
          <div className="p-8 rounded-[3rem] bg-destructive/10 border-2 border-dashed border-destructive/30">
            <AlertTriangle className="w-20 h-20 text-destructive mx-auto mb-4 animate-bounce" />
            <h2 className="text-3xl font-black italic tracking-tighter uppercase text-destructive">
              Protocolo Não Encontrado
            </h2>
            <p className="text-muted-foreground max-w-sm mx-auto mt-2 font-medium">
              O hash ou código informado não corresponde a nenhum frete ativo na
              malha unificada.
            </p>
          </div>
          <Button
            size="lg"
            onClick={() => navigate("/central-rastreamento")}
            className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs gap-3"
          >
            <ArrowLeft className="w-5 h-5" /> Voltar para Central_Node
          </Button>
        </div>
      </MainLayout>
    );
  }

  const statusProgressMap: Record<string, number> = {
    entregue: 100,
    saiu_entrega: 85,
    em_transito: 50,
  };
  const progressPercent = statusProgressMap[shipment.status ?? ""] ?? 15;

  return (
    <MainLayout>
      <div className="space-y-8 pb-10">
        {/* Header Elite */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-12 w-12 rounded-2xl border-2 hover:bg-primary/5"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase italic text-foreground">
                  {shipment.numero}
                </h1>
                <Badge
                  style={{
                    backgroundColor: shipment.statusColor + "20",
                    color: shipment.statusColor,
                    borderColor: shipment.statusColor + "40",
                  }}
                  className="px-4 py-1.5 rounded-full font-black uppercase tracking-widest text-[10px] border-2 shadow-lg"
                >
                  <Zap className="w-3 h-3 mr-2 animate-pulse" />
                  {shipment.statusLabel}
                </Badge>
              </div>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2 mt-1">
                {shipment.tipo === "entrega" ? (
                  <Package className="w-4 h-4 text-primary" />
                ) : (
                  <Truck className="w-4 h-4 text-primary" />
                )}
                {shipment.tipo === "entrega"
                  ? "Protocolo de Entrega"
                  : "Protocolo de Coleta"}{" "}
                • {shipment.transportadora}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-6 rounded-xl border-2 font-black uppercase tracking-widest text-[10px] gap-2 hover:bg-primary/5 transition-all"
                >
                  <Share2 className="w-4 h-4" />{" "}
                  <span className="hidden sm:inline">Partilha Segura</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-black/95 border-white/10 backdrop-blur-2xl rounded-[2.5rem] p-8">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase text-white flex items-center gap-3">
                    <Share2 className="w-6 h-6 text-primary" />
                    Compartilhar_Grid
                  </DialogTitle>
                  <DialogDescription className="text-white/40 font-medium uppercase text-[10px] tracking-widest">
                    Injetar acesso ao tracking para terceiros.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center gap-8 py-6">
                  <div className="p-6 bg-white rounded-[2rem] shadow-2xl border-4 border-primary/20 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <QRCodeSVG
                      value={`${window.location.origin}/rastrear?id=${shipment.numero}`}
                      size={200}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <div className="w-full space-y-4">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-primary/10 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative flex items-center gap-2 bg-muted/30 p-4 rounded-2xl border border-white/5">
                        <Globe className="w-4 h-4 text-primary shrink-0" />
                        <span className="flex-1 font-mono text-[10px] text-white/50 truncate">
                          {window.location.origin}/rastrear?id={shipment.numero}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 hover:bg-primary/20"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${window.location.origin}/rastrear?id=${shipment.numero}`,
                            );
                            toast.success("Link Nexus copiado!");
                          }}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="default"
              size="lg"
              onClick={refetch}
              className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 bg-primary shadow-xl shadow-primary/20 hover:scale-[1.03] transition-all"
            >
              <RefreshCw
                className={cn("w-4 h-4", isLoadingTracking && "animate-spin")}
              />{" "}
              Re-Sync
            </Button>
          </div>
        </div>

        {/* Status Visual Dinâmico */}
        <Card className="bg-black/40 border-white/5 backdrop-blur-xl rounded-[2rem] overflow-hidden p-8">
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">
                  Fluxo de Movimentação
                </p>
                <p className="text-2xl font-black italic tracking-tighter text-white uppercase">
                  {progressPercent}% COMPLETO
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">
                  Previsão_SLA
                </p>
                <p className="text-lg font-black text-white italic">
                  {formatDate(shipment.previsao)}
                </p>
              </div>
            </div>
            <div className="relative h-4 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[2px]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="relative h-full rounded-full bg-gradient-to-r from-primary/40 via-primary to-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.5)] flex items-center justify-end pr-2 overflow-hidden"
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[pulse_2s_linear_infinite]" />
                {progressPercent > 5 && (
                  <Zap className="w-2.5 h-2.5 text-white animate-pulse relative z-10" />
                )}
              </motion.div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[
                "Coletado",
                "Em Transferência",
                "Saiu para Entrega",
                "Entregue",
              ].map((step, i) => (
                <div key={step} className="text-center space-y-2">
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full mx-auto border-2 transition-all duration-700",
                      (i + 1) * 25 <= progressPercent
                        ? "bg-primary border-primary shadow-[0_0_10px_rgba(var(--primary),0.8)]"
                        : "bg-white/5 border-white/10",
                    )}
                  />
                  <p
                    className={cn(
                      "text-[8px] font-black uppercase tracking-widest",
                      (i + 1) * 25 <= progressPercent
                        ? "text-primary"
                        : "text-white/20",
                    )}
                  >
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal: Mapa e Timeline */}
          <div className="lg:col-span-2 space-y-8">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3">
                  <Globe className="w-5 h-5 animate-pulse" /> Monitoramento
                  Geográfico
                </h3>
                <TabsList className="bg-sidebar-accent/50 p-1 rounded-xl border border-white/5">
                  <TabsTrigger
                    value="mapa"
                    className="rounded-lg px-4 font-black uppercase tracking-widest text-[9px] gap-2"
                  >
                    <MapIcon className="w-3.5 h-3.5" /> Mapa_Live
                  </TabsTrigger>
                  <TabsTrigger
                    value="historico"
                    className="rounded-lg px-4 font-black uppercase tracking-widest text-[9px] gap-2"
                  >
                    <History className="w-3.5 h-3.5" /> Logs Detalhados
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="mapa" className="mt-0">
                <Card className="overflow-hidden rounded-[2.5rem] border-white/10 bg-black/40 shadow-2xl relative group">
                  <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                    <Badge className="bg-black/60 backdrop-blur-md text-white border-white/10 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-success animate-ping" />
                      GPS_SIGNAL_HIGH
                    </Badge>
                  </div>
                  <MapboxMap
                    className="h-[500px] w-full"
                    markers={mapMarkers}
                    originMarker={
                      originCoords
                        ? {
                            lat: originCoords.lat,
                            lng: originCoords.lng,
                            label: "Centro de Distribuição_CD",
                          }
                        : undefined
                    }
                    showRoute={true}
                    zoom={12}
                  />
                  <div className="absolute bottom-6 left-6 right-6 z-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-black/80 backdrop-blur-xl p-5 rounded-[1.5rem] border border-white/10 flex items-center gap-4 group/item hover:bg-black transition-all">
                      <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover/item:rotate-12 transition-transform">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">
                          Origem Protocolada
                        </p>
                        <p className="text-xs font-bold text-white truncate uppercase italic">
                          {shipment.origem}
                        </p>
                      </div>
                    </div>
                    <div className="bg-black/80 backdrop-blur-xl p-5 rounded-[1.5rem] border border-white/10 flex items-center gap-4 group/item hover:bg-black transition-all">
                      <div className="p-3 rounded-2xl bg-success/10 text-success group-hover/item:rotate-12 transition-transform">
                        <Navigation className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">
                          Destino do Protocolo
                        </p>
                        <p className="text-xs font-bold text-white truncate uppercase italic">
                          {shipment.destino}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="historico" className="mt-0">
                <Card className="bg-black/40 border-white/5 backdrop-blur-xl rounded-[2rem] p-8">
                  <AnimatePresence mode="wait">
                    {(() => {
                      if (loadingHistory) {
                        return (
                          <div className="flex justify-center py-20">
                            <RefreshCw className="w-10 h-10 animate-spin text-primary" />
                          </div>
                        );
                      }
                      if (!history || history.length === 0) {
                        return (
                          <div className="text-center py-20 opacity-30">
                            <History className="w-16 h-16 mx-auto mb-4" />
                            <p className="font-black uppercase tracking-widest text-[10px]">
                              Nenhum log de micro-evento encontrado_NODE
                            </p>
                          </div>
                        );
                      }
                      return (
                        <div className="space-y-8 relative pl-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-1 before:bg-gradient-to-b before:from-primary/40 before:to-transparent">
                          {history.map((log, idx) => (
                            <motion.div
                              key={log.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="relative"
                            >
                              <div className="absolute -left-8 top-1.5 w-6 h-6 rounded-full bg-black border-2 border-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                <div
                                  className={cn(
                                    "w-2 h-2 rounded-full",
                                    idx === 0
                                      ? "bg-primary animate-pulse"
                                      : "bg-primary/40",
                                  )}
                                />
                              </div>
                              <div className="bg-white/5 p-5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-[11px] font-black uppercase tracking-widest text-primary italic">
                                    {log.action === "INSERT"
                                      ? "Protocolo Gerado"
                                      : "Transação de Sistema"}
                                  </span>
                                  <span className="text-[9px] text-white/30 font-bold uppercase">
                                    {formatDate(log.created_at)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-black/40 text-[9px] font-black uppercase tracking-widest border border-white/5 text-white/60">
                                    <User className="w-3 h-3 text-primary" />
                                    {log.user_name ||
                                      log.user_email ||
                                      "Nexus Core"}
                                  </div>
                                  {log.ip_address && (
                                    <span className="text-[8px] font-mono opacity-20 group-hover:opacity-40 transition-opacity">
                                      NODE_IP: {log.ip_address}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      );
                    })()}
                  </AnimatePresence>
                </Card>
              </TabsContent>
            </Tabs>

            <Card className="bg-black/40 border-white/5 backdrop-blur-xl rounded-[2rem] p-8">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-sm font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
                  <Info className="w-5 h-5" /> Informações do Protocolo
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0 grid grid-cols-1 sm:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">
                    NF Remessa_Grid
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                      <FileText className="w-4 h-4" />
                    </div>
                    <p className="font-black text-lg italic tracking-tighter text-white uppercase">
                      {shipment.nfRemessa || "—"}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">
                    Valor do Frete_Finance
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-success/10 text-success">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <p className="font-black text-lg italic tracking-tighter text-success uppercase">
                      {shipment.valorFrete
                        ? `R$ ${shipment.valorFrete.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">
                    Código de Tracking Ext
                  </p>
                  <div
                    className="flex items-center gap-3 group cursor-pointer"
                    onClick={() => {
                      if (shipment.codigoRastreamento) {
                        navigator.clipboard.writeText(
                          shipment.codigoRastreamento,
                        );
                        toast.success("Código copiado!");
                      }
                    }}
                  >
                    <div className="p-2.5 rounded-xl bg-warning/10 text-warning group-hover:scale-110 transition-transform">
                      <Zap className="w-4 h-4" />
                    </div>
                    <p className="font-mono text-[11px] text-white/60 truncate bg-white/5 px-3 py-1 rounded-lg border border-white/5 group-hover:text-warning transition-colors">
                      {shipment.codigoRastreamento || "AGUARDANDO_API"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Elite: IA & Equipe */}
          <div className="space-y-8">
            <TrackingPredictiveInsights
              prediction={prediction || null}
              isLoading={isLoadingPredictions}
            />

            <Card className="bg-black/40 border-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden p-8 relative">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <ShieldCheck className="w-20 h-20 text-primary" />
              </div>

              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xs font-black uppercase tracking-[0.3em] text-primary flex items-center gap-3">
                  <User className="w-5 h-5" /> Equipe Responsável
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 space-y-6">
                <div className="flex items-center gap-4 group cursor-pointer">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:scale-110 transition-transform">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-success border-2 border-black animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-white uppercase tracking-wider">
                      Gestor Logístico
                    </p>
                    <p className="text-[10px] text-white/40 font-bold uppercase italic">
                      Promobrindes SP - Matriz
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>

                <div className="flex items-center gap-4 group cursor-pointer">
                  <div className="w-12 h-12 rounded-2xl bg-warning/10 flex items-center justify-center border border-warning/20 group-hover:scale-110 transition-transform">
                    <Truck className="w-6 h-6 text-warning" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-white uppercase tracking-wider">
                      {shipment.transportadora}
                    </p>
                    <p className="text-[10px] text-white/40 font-bold uppercase italic">
                      Transportador Homologado Nexus
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-warning group-hover:translate-x-1 transition-all" />
                </div>

                <Separator className="bg-white/5" />

                <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 text-center space-y-3">
                  <p className="text-[9px] font-black text-primary/60 uppercase tracking-[0.2em]">
                    Protocolo de Suporte
                  </p>
                  <Button
                    variant="outline"
                    className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[9px] border-2 border-primary/30 text-primary hover:bg-primary/10 shadow-lg shadow-primary/5"
                  >
                    Acionar Nexus Support_API
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="bg-gradient-to-br from-primary/10 to-transparent p-6 rounded-[2rem] border border-primary/10 flex items-center gap-4 group">
              <div className="p-3 rounded-2xl bg-primary/20 text-primary animate-pulse">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">
                  Carga Protegida
                </p>
                <p className="text-[11px] text-white/60 font-medium italic">
                  Monitoramento 24/7 via satélite Nexus Protocol.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function FileText(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M9 15h6" />
      <path d="M9 11h6" />
    </svg>
  );
}

function DollarSign(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
