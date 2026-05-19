import { useState, useEffect, useCallback } from "react";
import { ColetaStatus } from "./types";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, Package, MapPin, Calendar, Clock, CheckCircle2, History, Info, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAudioFeedback } from "@/hooks";
import { Database } from "@/integrations/supabase/types";
import { Coleta as Pickup } from "./types";
import { PickupConference } from "./PickupConference";


interface TimelineEvent {
  id: string;
  action: string;
  created_at: string;
  new_data?: {
    status?: string;
    qtd_recebida?: number;
    peso_efetivo?: number;
  };
}

interface PickupDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pickup: Pickup | null;
  statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }>;
  onStatusUpdate: () => void;
}

export function PickupDetailsDialog({ open, onOpenChange, pickup, statusConfig, onStatusUpdate }: PickupDetailsDialogProps) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [activeTab, setActiveTab] = useState("detalhes");
  const { playSuccess, playWhoosh } = useAudioFeedback();

  const fetchTimeline = useCallback(async () => {
    if (!pickup) return;
    setLoadingTimeline(true);
    const { data } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("record_id", pickup.id)
      .eq("table_name", "coletas")
      .order("created_at", { ascending: false });
    
    if (data) setTimeline(data as TimelineEvent[]);
    setLoadingTimeline(false);
  }, [pickup]);

  useEffect(() => {
    if (open && pickup) {
      fetchTimeline();
    }
  }, [open, pickup, fetchTimeline]);

  if (!pickup) return null;

  const updateStatus = async (newStatus: ColetaStatus) => {
    if (!pickup) return;
    
    const { error } = await supabase
      .from("coletas")
      .update({ 
        status: newStatus as Database["public"]["Enums"]["coleta_status"],
        data_efetiva_coleta: newStatus === 'em_transito' ? new Date().toISOString() : pickup.data_efetiva_coleta
      })
      .eq("id", pickup.id);
    
    if (!error) {
      playSuccess();
      onStatusUpdate();
      fetchTimeline();
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
                  {pickup.numero_coleta}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">SYNC_NODE_ACTIVE</p>
                </div>
              </div>
            </div>
            <Badge variant="outline" className={cn("px-5 py-2 font-black uppercase tracking-widest text-[10px] rounded-full border-2 shadow-lg", statusConfig[pickup.status]?.color)}>
              {statusConfig[pickup.status]?.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="px-8 flex-1 overflow-y-auto scrollbar-none">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto p-1.5 bg-sidebar-accent/50 rounded-2xl border border-white/5 mb-8">
              <TabsTrigger value="detalhes" className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all">Detalhes</TabsTrigger>
              <TabsTrigger value="conferencia" className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all">Conferência</TabsTrigger>
              <TabsTrigger value="historico" className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="detalhes" className="space-y-4 pb-6">
              <div className="grid grid-cols-2 gap-4">
                <Card className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-card to-card/95 border-none shadow-lg">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2 mb-3">
                      <Info className="w-4 h-4" /> Origem / Fornecedor
                    </h3>
                    <div>
                      <p className="font-black text-base tracking-tighter uppercase italic text-white truncate">
                        {pickup.fornecedores?.nome_fantasia || pickup.fornecedores?.razao_social || 'Não informado'}
                      </p>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-tight flex items-center gap-2 mt-1">
                        <MapPin className="w-3 h-3" /> {pickup.endereco_coleta}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-card to-card/95 border-none shadow-lg">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2 mb-3">
                      <Truck className="w-4 h-4" /> Transporte
                    </h3>
                    <div>
                      <p className="font-black text-base tracking-tighter uppercase italic text-white truncate">
                        {pickup.tipo_coleta === 'lalamove' 
                          ? 'Lalamove' 
                          : (pickup.transportadoras?.nome_fantasia || 'Transportadora Tradicional')}
                      </p>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-tight flex items-center gap-2 mt-1">
                        Status: {statusConfig[pickup.status]?.label}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-sidebar-accent/30 p-5 rounded-3xl border border-white/5 backdrop-blur-sm">
                <div className="space-y-2">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em]">Previsão de Coleta</p>
                  <p className="text-sm font-black italic tracking-tighter uppercase text-white flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-background shadow-sm"><Calendar className="w-3.5 h-3.5 text-primary" /></div>
                    {pickup.data_prevista_coleta ? format(new Date(pickup.data_prevista_coleta), "dd MMM yyyy", { locale: ptBR }) : '-'}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em]">Volumes Totais</p>
                  <p className="text-sm font-black italic tracking-tighter uppercase text-white flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-background shadow-sm"><Package className="w-3.5 h-3.5 text-primary" /></div>
                    {pickup.qtd_volumes} UND
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em]">Peso Estimado</p>
                  <p className="text-sm font-black italic tracking-tighter uppercase text-white flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-background shadow-sm"><Truck className="w-3.5 h-3.5 text-primary" /></div>
                    {pickup.peso_estimado_kg} KG
                  </p>
                </div>
              </div>

              {pickup.observacoes && (
                <div className="bg-black/40 p-5 rounded-2xl border border-white/5 border-dashed">
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em] mb-2">Logs e Observações</p>
                  <p className="text-sm text-white/70 font-medium italic">{pickup.observacoes}</p>
                </div>
              )}

              <div className="pt-8 border-t border-white/5 space-y-5">
                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3">
                  <Zap className="w-5 h-5 animate-pulse" /> Executar Protocolo_Fluxo
                </h3>
                <div className="flex flex-wrap gap-3">
                  {pickup.status === 'aguardando_liberacao' && (
                    <Button onClick={() => updateStatus('solicitada')} className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[11px] bg-primary text-white hover:scale-[1.03] transition-all shadow-xl shadow-primary/20">
                      <Calendar className="w-4.5 h-4.5 mr-2" /> Agendar Coleta
                    </Button>
                  )}
                  {pickup.status === 'solicitada' && (
                    <Button onClick={() => updateStatus('em_transito')} className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[11px] bg-warning text-warning-foreground hover:scale-[1.03] transition-all shadow-xl shadow-warning/20">
                      <Truck className="w-4.5 h-4.5 mr-2" /> Confirmar Saída
                    </Button>
                  )}
                  {pickup.status === 'em_transito' && (
                    <Button onClick={() => updateStatus('chegou_expedicao')} variant="outline" className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[11px] border-2 border-primary/30 text-primary hover:bg-primary/5">
                      <History className="w-4.5 h-4.5 mr-2" /> Receber na Expedição
                    </Button>
                  )}
                  {(pickup.status === 'chegou_expedicao' || pickup.status === 'divergencia') && (
                    <Button onClick={() => handleTabChange('conferencia')} className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[11px] bg-success text-white hover:scale-[1.03] transition-all shadow-xl shadow-success/20">
                      <CheckCircle2 className="w-4.5 h-4.5 mr-2" /> Iniciar Conferência
                    </Button>
                  )}
                  {pickup.tipo_coleta === 'transportadora' && (
                    <Button variant="ghost" className="h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] text-white/40 hover:text-primary transition-colors" onClick={() => toast.info("Consultando API Rodonaves...")}>
                      <History className="w-4 h-4 mr-2" /> Log API
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="conferencia" className="pb-6">
              <PickupConference 
                pickup={pickup} 
                onSuccess={() => {
                  onStatusUpdate();
                  handleTabChange('detalhes');
                }} 
              />
            </TabsContent>

            <TabsContent value="historico" className="pb-6">
              <div className="space-y-4">
                {loadingTimeline && (
                  <div className="flex justify-center py-8">
                    <Clock className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                
                {!loadingTimeline && timeline.length > 0 && (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-muted">
                    {timeline.map((event) => (
                      <div key={event.id} className="relative">
                        <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {event.action === 'UPDATE' ? 'Atualização de Status' : 'Criação da Coleta'}
                          </p>
                          <div className="text-xs text-muted-foreground mt-1 space-y-1">
                            {event.new_data?.status && (
                              <p>Novo status: <span className="font-semibold text-primary">{statusConfig[event.new_data.status]?.label || event.new_data.status}</span></p>
                            )}
                            {event.new_data?.qtd_recebida !== undefined && (
                              <p>Volumes conferidos: <span className="font-semibold">{event.new_data.qtd_recebida}</span></p>
                            )}
                            {event.new_data?.peso_efetivo !== undefined && (
                              <p>Peso aferido: <span className="font-semibold">{event.new_data.peso_efetivo} kg</span></p>
                            )}
                            <p className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {format(new Date(event.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {!loadingTimeline && timeline.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">Nenhum histórico encontrado.</div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

