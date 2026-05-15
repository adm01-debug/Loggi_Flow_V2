import { useState, useEffect, useCallback } from "react";
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
import { useAudioFeedback } from "@/hooks/useAudioFeedback";
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

  const updateStatus = async (newStatus: string) => {
    if (!pickup) return;
    
    const { error } = await supabase
      .from("coletas")
      .update({ 
        status: newStatus as any,
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
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              {pickup.numero_coleta}
            </DialogTitle>
            <Badge className={cn("px-3 py-1", statusConfig[pickup.status]?.color)}>
              {statusConfig[pickup.status]?.label}
            </Badge>
          </div>
        </DialogHeader>

        <div className="px-6 flex-1 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
              <TabsTrigger value="conferencia">Conferência</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="detalhes" className="space-y-4 pb-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground">
                      <Info className="w-4 h-4" /> Origem / Fornecedor
                    </h3>
                    <div>
                      <p className="font-bold">
                        {pickup.fornecedores?.nome_fantasia || pickup.fornecedores?.razao_social || 'Não informado'}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" /> {pickup.endereco_coleta}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold text-sm flex items-center gap-2 text-muted-foreground">
                      <Truck className="w-4 h-4" /> Transporte
                    </h3>
                    <div>
                      <p className="font-bold capitalize">
                        {pickup.tipo_coleta === 'lalamove' 
                          ? 'Lalamove' 
                          : (pickup.transportadoras?.nome_fantasia || 'Transportadora Tradicional')}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Status: {statusConfig[pickup.status]?.label}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Prevista</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-primary" /> 
                    {pickup.data_prevista_coleta ? format(new Date(pickup.data_prevista_coleta), "dd/MM/yyyy") : '-'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Volumes</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Package className="w-4 h-4 text-primary" /> {pickup.qtd_volumes}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Peso Est.</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Truck className="w-4 h-4 text-primary" /> {pickup.peso_estimado_kg} kg
                  </p>
                </div>
              </div>

              {pickup.observacoes && (
                <div className="bg-muted/50 p-3 rounded-lg border border-dashed border-muted-foreground/20">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Observações</p>
                  <p className="text-sm">{pickup.observacoes}</p>
                </div>
              )}

              <div className="pt-4 border-t space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" /> Ações do Fluxo
                </h3>
                <div className="flex flex-wrap gap-2">
                  {pickup.status === 'aguardando_liberacao' && (
                    <Button onClick={() => updateStatus('solicitada')} className="bg-primary hover:bg-primary/90 shadow-sm">
                      <Calendar className="w-4 h-4 mr-2" /> Agendar Coleta
                    </Button>
                  )}
                  {pickup.status === 'solicitada' && (
                    <Button onClick={() => updateStatus('em_transito')} className="bg-warning hover:bg-warning/90 text-warning-foreground shadow-sm">
                      <Truck className="w-4 h-4 mr-2" /> Confirmar Saída
                    </Button>
                  )}
                  {pickup.status === 'em_transito' && (
                    <Button onClick={() => updateStatus('chegou_expedicao')} variant="outline" className="border-primary/20 hover:bg-primary/5">
                      <Building2Icon className="w-4 h-4 mr-2 text-primary" /> Receber na Expedição
                    </Button>
                  )}
                  {(pickup.status === 'chegou_expedicao' || pickup.status === 'divergencia') && (
                    <Button onClick={() => handleTabChange('conferencia')} className="bg-success hover:bg-success/90 shadow-sm shadow-success/10">
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Iniciar Conferência Real
                    </Button>
                  )}
                  {pickup.tipo_coleta === 'transportadora' && (
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary" onClick={() => toast.info("Consultando API Rodonaves...")}>
                      <History className="w-4 h-4 mr-1" /> Log API
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="conferencia" className="pb-6">
              <PickupConference 
                pickup={pickup as any} 
                onSuccess={() => {
                  onStatusUpdate();
                  handleTabChange('detalhes');
                }} 
              />
            </TabsContent>

            <TabsContent value="historico" className="pb-6">
              <div className="space-y-4">
                {loadingTimeline ? (
                  <div className="flex justify-center py-8"><Clock className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : timeline.length > 0 ? (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-muted">
                    {timeline.map((event, idx) => (
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
                ) : (
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

function Building2Icon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  );
}
