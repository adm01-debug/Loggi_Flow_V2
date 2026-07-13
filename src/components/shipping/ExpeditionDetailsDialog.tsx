import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Truck,
  Package,
  MapPin,
  Clock,
  History,
  Info,
  Zap,
  FileText,
  Loader2,
  User,
  Camera,
} from "lucide-react";
import { DeliveryReceiptUpload } from "./DeliveryReceiptUpload";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAudioFeedback } from "@/hooks/notifications/useAudioFeedback";
import { useAuth } from "@/hooks/auth/useAuth";
import { Database } from "@/integrations/supabase/types";

type EntregaStatus = Database["public"]["Enums"]["entrega_status"];

interface TimelineEvent {
  id: string;
  delivery_id: string;
  from_status: string | null;
  to_status: string;
  notes: string | null;
  created_at: string;
  action_by?: string;
  action_by_user?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface ExpeditionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delivery: any | null;
  statusConfig: Record<
    string,
    {
      label: string;
      color: string;
      icon: React.ComponentType<{ className?: string }>;
    }
  >;
  onStatusUpdate: () => void;
}

export function ExpeditionDetailsDialog({
  open,
  onOpenChange,
  delivery,
  statusConfig,
  onStatusUpdate,
}: ExpeditionDetailsDialogProps) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [activeTab, setActiveTab] = useState("detalhes");
  const { user } = useAuth();
  const { playSuccess, playWhoosh } = useAudioFeedback();

  const fetchTimeline = useCallback(async () => {
    if (!delivery) return;
    setLoadingTimeline(true);
    const { data } = await supabase
      .from("kanban_history")
      .select(
        `
        *,
        action_by_user:profiles(display_name, avatar_url)
      `,
      )
      .eq("delivery_id", delivery.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (data) setTimeline(data as unknown as TimelineEvent[]);
    setLoadingTimeline(false);
  }, [delivery]);

  useEffect(() => {
    if (open && delivery) {
      setActiveTab("detalhes");
      fetchTimeline();
    }
  }, [open, delivery, fetchTimeline]);

  if (!delivery) return null;

  const updateStatus = async (newStatus: EntregaStatus) => {
    if (!delivery) return;

    const updates: { status: EntregaStatus; updated_at: string; data_despacho?: string } = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === "despachado") {
      updates.data_despacho = new Date().toISOString();
    }

    const { error } = await supabase
      .from("entregas")
      .update(updates)
      .eq("id", delivery.id);

    if (!error) {
      // Record history
      await supabase.from("kanban_history").insert({
        delivery_id: delivery.id,
        from_status: delivery.status,
        to_status: newStatus,
        action_by: user?.id,
        notes: `Transição via modal: ${delivery.status} -> ${newStatus}`,
      });

      playSuccess();
      toast.success(
        `Status atualizado para ${statusConfig[newStatus]?.label || newStatus}`,
      );
      onStatusUpdate();
      fetchTimeline();
    } else {
      toast.error("Erro ao atualizar status: " + error.message);
    }
  };

  const handleTabChange = (value: string) => {
    playWhoosh();
    setActiveTab(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col p-0 bg-black/95 border-white/10 backdrop-blur-xl rounded-[2.5rem]">
        <DialogHeader className="p-8 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-inner group-hover:rotate-6 transition-transform duration-500">
                <Package className="w-8 h-8 text-primary animate-pulse" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase text-white">
                  {delivery.numero_entrega}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">
                    EXPEDITION_HUB_ACTIVE
                  </p>
                </div>
              </div>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "px-5 py-2 font-black uppercase tracking-widest text-[10px] rounded-full border-2 shadow-lg",
                statusConfig[delivery.status]?.color,
              )}
            >
              {statusConfig[delivery.status]?.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="px-8 flex-1 overflow-y-auto scrollbar-none">
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 h-auto p-1.5 bg-sidebar-accent/50 rounded-2xl border border-white/5 mb-8">
              <TabsTrigger
                value="detalhes"
                className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all"
              >
                Detalhes
              </TabsTrigger>
              <TabsTrigger
                value="historico"
                className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all"
              >
                Histórico_Logs
              </TabsTrigger>
              <TabsTrigger
                value="comprovante"
                className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all"
              >
                Comprovante
              </TabsTrigger>
            </TabsList>

            <TabsContent value="detalhes" className="space-y-6 pb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-card to-card/95 border-none shadow-lg">
                  <CardContent className="p-5 space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2 mb-3">
                      <Info className="w-4 h-4" /> Destinatário / Cliente
                    </h3>
                    <div>
                      <p className="font-black text-base tracking-tighter uppercase italic text-white truncate">
                        {delivery.cliente || "Consumidor Final"}
                      </p>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-tight flex items-center gap-2 mt-1">
                        <MapPin className="w-3 h-3 text-primary" />{" "}
                        {delivery.destino}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-card to-card/95 border-none shadow-lg">
                  <CardContent className="p-5 space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2 mb-3">
                      <Truck className="w-4 h-4" /> Logística
                    </h3>
                    <div>
                      <p className="font-black text-base tracking-tighter uppercase italic text-white truncate">
                        {delivery.transportadora || "A definir"}
                      </p>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-tight flex items-center gap-2 mt-1">
                        {delivery.box_alocado
                          ? `BOX: ${delivery.box_alocado}`
                          : "BOX não alocado"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-sidebar-accent/30 p-5 rounded-3xl border border-white/5 backdrop-blur-sm">
                <div className="space-y-2">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em]">
                    Identificador NF
                  </p>
                  <p className="text-sm font-black italic tracking-tighter uppercase text-white flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-background shadow-sm">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                    </div>
                    {delivery.nf_remessa || "Pendente de Emissão"}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em]">
                    Criado em
                  </p>
                  <p className="text-sm font-black italic tracking-tighter uppercase text-white flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-background shadow-sm">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                    </div>
                    {format(
                      new Date(delivery.created_at),
                      "dd MMM yyyy HH:mm",
                      { locale: ptBR },
                    )}
                  </p>
                </div>
              </div>

              <div className="pt-8 border-t border-white/5 space-y-5">
                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3">
                  <Zap className="w-5 h-5 animate-pulse" /> Executar
                  Protocolo_Fluxo
                </h3>
                <div className="flex flex-wrap gap-3">
                  {delivery.status === "pronto_despacho" && (
                    <Button
                      onClick={() => updateStatus("cotacao_frete")}
                      className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[11px] bg-primary text-white hover:scale-[1.03] transition-all shadow-xl shadow-primary/20"
                    >
                      <Zap className="w-4.5 h-4.5 mr-2" /> Iniciar Cotação
                    </Button>
                  )}
                  {delivery.status === "cotacao_frete" && (
                    <Button
                      onClick={() => updateStatus("nf_emitida")}
                      className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[11px] bg-warning text-warning-foreground hover:scale-[1.03] transition-all shadow-xl shadow-warning/20"
                    >
                      <FileText className="w-4.5 h-4.5 mr-2" /> Registrar NF
                    </Button>
                  )}
                  {delivery.status === "nf_emitida" && (
                    <Button
                      onClick={() => updateStatus("despachado")}
                      className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[11px] bg-success text-white hover:scale-[1.03] transition-all shadow-xl shadow-success/20"
                    >
                      <Truck className="w-4.5 h-4.5 mr-2" /> Autorizar Despacho
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    className="h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] text-white/40 hover:text-primary transition-colors"
                    onClick={() =>
                      toast.info("Funcionalidade tática em desenvolvimento")
                    }
                  >
                    <History className="w-4 h-4 mr-2" /> Log Detalhado
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="historico" className="pb-8">
              <div className="space-y-4">
                {loadingTimeline && (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                )}

                {!loadingTimeline && timeline.length > 0 && (
                  <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/5">
                    {timeline.map((event) => (
                      <div key={event.id} className="relative group/log">
                        <div className="absolute -left-8 top-1 w-6 h-6 rounded-full bg-black border-2 border-primary flex items-center justify-center z-10 group-hover/log:scale-110 transition-transform">
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all">
                          <p className="text-sm font-black uppercase tracking-widest text-white italic">
                            {event.from_status
                              ? `${statusConfig[event.from_status]?.label || event.from_status} → ${statusConfig[event.to_status]?.label || event.to_status}`
                              : `Início: ${statusConfig[event.to_status]?.label || event.to_status}`}
                          </p>
                          <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-2 space-y-1">
                            {event.notes && (
                              <p className="text-primary/70">{event.notes}</p>
                            )}
                            <div className="flex items-center gap-3 pt-2 border-t border-white/5 mt-2">
                              <span className="flex items-center gap-1.5">
                                <History className="w-3 h-3" />{" "}
                                {format(
                                  new Date(event.created_at),
                                  "dd/MM/yyyy HH:mm",
                                  { locale: ptBR },
                                )}
                              </span>
                              {event.action_by_user?.display_name && (
                                <span className="flex items-center gap-1.5 text-primary">
                                  <User className="w-3 h-3" />{" "}
                                  {event.action_by_user.display_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!loadingTimeline && timeline.length === 0 && (
                  <div className="text-center py-20 bg-white/5 rounded-[2.5rem] border-2 border-dashed border-white/10">
                    <History className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/40 font-black uppercase tracking-widest text-xs">
                      Nenhum rastro binário localizado.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="comprovante" className="pb-8">
              <div className="space-y-6">
                <div className="p-6 rounded-[2.5rem] bg-sidebar-accent/30 border border-white/5 backdrop-blur-sm">
                  <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3 mb-6">
                    <Camera className="w-5 h-5" /> Digitalização de Comprovante
                  </h3>
                  <DeliveryReceiptUpload
                    entregaId={delivery.id}
                    currentUrl={delivery.comprovante_entrega_url}
                    onUploadSuccess={() => {
                      onStatusUpdate();
                    }}
                  />
                  <div className="mt-6 p-4 rounded-2xl bg-black/40 border border-white/5">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">
                      O upload do comprovante vincula automaticamente o arquivo
                      à entrega e atualiza o status para{" "}
                      <span className="text-success">ENTREGUE</span> no sistema
                      Nexus.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
