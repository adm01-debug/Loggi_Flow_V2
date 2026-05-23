import { useState, useEffect, useCallback } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { ColetaStatus } from "./types";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Truck, Package, MapPin, Calendar, Clock, CheckCircle2, 
  History, Info, Zap, MessageSquare, Phone, FileText, 
  ExternalLink, CreditCard, DollarSign, Navigation, Plus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAudioFeedback } from "@/hooks/notifications/useAudioFeedback";
import { Database } from "@/integrations/supabase/types";
import { Coleta as Pickup } from "./types";
import { PickupConference } from "./PickupConference";
import { motion, AnimatePresence } from "framer-motion";

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
  const { playSuccess, playWhoosh, playAction } = useAudioFeedback();

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
      toast.success(`Status atualizado para: ${statusConfig[newStatus]?.label}`);
    }
  };

  const handleTabChange = (value: string) => {
    playWhoosh();
    setActiveTab(value);
  };

  const contactProvider = (method: 'whatsapp' | 'email') => {
    playAction();
    const message = `Olá, gostaria de tratar sobre a coleta ${pickup.numero_coleta}.`;
    if (method === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      window.location.href = `mailto:?subject=Coleta ${pickup.numero_coleta}&body=${encodeURIComponent(message)}`;
    }
  };

  const generateManifestoPDF = () => {
    playSuccess();
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(31, 41, 55);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("MANIFESTO DE COLETA NEXUS", 20, 25);
    doc.setFontSize(10);
    doc.text(`ID DO PROTOCOLO: ${pickup.numero_coleta}`, 20, 33);
    
    // Body
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text("DADOS DA OPERAÇÃO", 20, 55);
    
    autoTable(doc, {
      startY: 60,
      head: [['Campo', 'Informação']],
      body: [
        ['Fornecedor', pickup.fornecedores?.nome_fantasia || pickup.fornecedores?.razao_social || 'N/A'],
        ['Endereço', pickup.endereco_coleta],
        ['Data Prevista', pickup.data_prevista_coleta ? format(new Date(pickup.data_prevista_coleta), "dd/MM/yyyy") : 'N/A'],
        ['Volumes', pickup.qtd_volumes?.toString() || '0'],
        ['Peso Estimado', `${pickup.peso_estimado_kg} KG`],
        ['Transporte', pickup.tipo_coleta === 'lalamove' ? 'Lalamove' : (pickup.transportadoras?.nome_fantasia || 'Frota Terceirizada')],
        ['Status Atual', statusConfig[pickup.status]?.label || pickup.status],
      ],
      theme: 'striped',
      headStyles: { fillColor: [31, 41, 55] }
    });
    
    doc.setFontSize(14);
    doc.text("NOTAS E OBSERVAÇÕES", 20, (doc as any).lastAutoTable.finalY + 20);
    doc.setFontSize(10);
    doc.text(pickup.observacoes || "Nenhuma observação registrada.", 20, (doc as any).lastAutoTable.finalY + 30, { maxWidth: 170 });
    
    // Footer
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 20, 280);
    doc.text("Protocolo Digital Nexus Logistics - Autenticação por Hash", 120, 280);

    doc.save(`Manifesto_${pickup.numero_coleta}.pdf`);
    toast.success("Manifesto de Coleta gerado com sucesso!");
  };

  // Simulação de custos (Etapa 7)
  const estimatedCost = (pickup.peso_estimado_kg || 0) * 1.5 + (pickup.tipo_coleta === 'lalamove' ? 25 : 15);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[95vh] overflow-hidden flex flex-col p-0 bg-black/95 border-white/10 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl">
        <DialogHeader className="p-8 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <motion.div 
                whileHover={{ rotate: 5, scale: 1.05 }}
                className="p-4 rounded-[1.5rem] bg-primary/10 border border-primary/20 shadow-inner"
              >
                <Package className="w-10 h-10 text-primary animate-pulse" />
              </motion.div>
              <div>
                <DialogTitle className="text-3xl font-black italic tracking-tighter uppercase text-white flex items-center gap-3">
                  {pickup.numero_coleta}
                  {pickup.tipo_coleta === 'lalamove' && <Badge className="bg-[#f38230] text-white text-[9px]">LALAMOVE_ACTIVE</Badge>}
                </DialogTitle>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">SYNC_NODE_ACTIVE</p>
                  </div>
                  {pickup.status === 'em_transito' && (
                    <Badge variant="outline" className="h-5 px-2 border-primary/30 text-primary bg-primary/5 text-[9px] animate-pulse">
                      <Navigation className="w-3 h-3 mr-1" /> TRACKING_LIVE
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="outline" className={cn("px-6 py-2.5 font-black uppercase tracking-widest text-[11px] rounded-full border-2 shadow-xl", statusConfig[pickup.status]?.color)}>
                {statusConfig[pickup.status]?.label}
              </Badge>
              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Hash_ID: {pickup.id.substring(0,8)}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-8 flex-1 overflow-y-auto scrollbar-none pb-8">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-auto p-1.5 bg-sidebar-accent/50 rounded-2xl border border-white/5 mb-8">
              <TabsTrigger value="detalhes" className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all">Detalhes</TabsTrigger>
              <TabsTrigger value="conferencia" className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all">Conferência</TabsTrigger>
              <TabsTrigger value="custos" className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all">Custos_Fin</TabsTrigger>
              <TabsTrigger value="historico" className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all">Timeline</TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent value="detalhes" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10 shadow-2xl">
                    <CardContent className="p-6">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2 mb-4">
                        <Info className="w-4 h-4" /> Origem_Node
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <p className="font-black text-xl tracking-tighter uppercase italic text-white truncate">
                            {pickup.fornecedores?.nome_fantasia || pickup.fornecedores?.razao_social || 'Não informado'}
                          </p>
                          <p className="text-[11px] font-bold text-white/50 uppercase tracking-tight flex items-start gap-2 mt-2 leading-relaxed">
                            <MapPin className="w-4 h-4 text-primary shrink-0" /> {pickup.endereco_coleta}
                          </p>
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button size="sm" variant="secondary" className="h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest gap-2 bg-success/20 text-success hover:bg-success/30 border-none" onClick={() => contactProvider('whatsapp')}>
                            <Phone className="w-3.5 h-3.5" /> WhatsApp
                          </Button>
                          <Button size="sm" variant="secondary" className="h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest gap-2 bg-primary/20 text-primary hover:bg-primary/30 border-none" onClick={() => contactProvider('email')}>
                            <MessageSquare className="w-3.5 h-3.5" /> Email
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white/5 to-white/[0.02] border-white/10 shadow-2xl">
                    <CardContent className="p-6">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2 mb-4">
                        <Truck className="w-4 h-4" /> Transporte_Grid
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <p className="font-black text-xl tracking-tighter uppercase italic text-white truncate">
                            {pickup.tipo_coleta === 'lalamove' 
                              ? 'Lalamove Protocol' 
                              : (pickup.transportadoras?.nome_fantasia || 'Frota Terceirizada')}
                          </p>
                          <div className="flex items-center gap-3 mt-3">
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[9px] font-black uppercase tracking-widest px-3">
                              {pickup.tipo_coleta}
                            </Badge>
                            {pickup.codigo_rastreamento && (
                              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1">
                                <Zap className="w-3 h-3 text-warning" /> {pickup.codigo_rastreamento}
                              </p>
                            )}
                          </div>
                        </div>
                        {pickup.status === 'em_transito' && (
                          <div className="bg-primary/10 rounded-2xl p-4 border border-primary/20 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Navigation className="w-5 h-5 text-primary animate-pulse" />
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black text-primary uppercase tracking-widest">Localização Atual</span>
                                <span className="text-[11px] text-white/70 font-bold italic">Em deslocamento_Rua A...</span>
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-white/20" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white/[0.02] p-6 rounded-[2rem] border border-white/5 backdrop-blur-sm">
                  <div className="space-y-2">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em]">Janela de Coleta</p>
                    <p className="text-sm font-black italic tracking-tighter uppercase text-white flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-black/40 shadow-inner border border-white/5"><Calendar className="w-4 h-4 text-primary" /></div>
                      {pickup.data_prevista_coleta ? format(new Date(pickup.data_prevista_coleta), "dd MMM yyyy", { locale: ptBR }) : '-'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em]">Volumes Totais</p>
                    <p className="text-sm font-black italic tracking-tighter uppercase text-white flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-black/40 shadow-inner border border-white/5"><Package className="w-4 h-4 text-primary" /></div>
                      {pickup.qtd_volumes} <span className="text-[10px] text-white/30 ml-1">UNIDADES</span>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em]">Métrica de Peso</p>
                    <p className="text-sm font-black italic tracking-tighter uppercase text-white flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-black/40 shadow-inner border border-white/5"><Truck className="w-4 h-4 text-primary" /></div>
                      {pickup.peso_estimado_kg} <span className="text-[10px] text-white/30 ml-1">KILOGRAMAS</span>
                    </p>
                  </div>
                </div>
                
                <div className="bg-white/[0.01] p-6 rounded-[2rem] border border-white/5 backdrop-blur-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
                      <FileText className="w-4 h-4" /> GED_Nexus Documentos
                    </h3>
                    <Button variant="ghost" size="sm" className="h-7 px-3 rounded-lg text-[8px] font-black uppercase tracking-widest text-primary hover:bg-primary/10">
                      <Plus className="w-3 h-3 mr-1" /> Anexar_Doc
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 hover:border-primary/30 transition-all cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary"><FileText className="w-3.5 h-3.5" /></div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Nota_Fiscal.pdf</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-white/20 group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 hover:border-warning/30 transition-all cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-warning/10 text-warning"><Package className="w-3.5 h-3.5" /></div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Romaneio_Grid.xlsx</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-white/20 group-hover:text-warning transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary flex items-center gap-3">
                      <Zap className="w-5 h-5 animate-pulse" /> Ações de Protocolo
                    </h3>
                    <Button variant="ghost" className="h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-primary" onClick={generateManifestoPDF}>
                      <FileText className="w-3.5 h-3.5 mr-2" /> Gerar Manifesto_PDF
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {pickup.status === 'aguardando_liberacao' && (
                      <Button onClick={() => updateStatus('solicitada')} className="h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-[11px] bg-primary text-white hover:scale-[1.03] transition-all shadow-xl shadow-primary/20">
                        <Calendar className="w-4.5 h-4.5 mr-2" /> Agendar_Fluxo
                      </Button>
                    )}
                    {pickup.status === 'solicitada' && (
                      <Button onClick={() => updateStatus('em_transito')} className="h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-[11px] bg-warning text-warning-foreground hover:scale-[1.03] transition-all shadow-xl shadow-warning/20">
                        <Truck className="w-4.5 h-4.5 mr-2" /> Iniciar Trânsito
                      </Button>
                    )}
                    {pickup.status === 'em_transito' && (
                      <Button onClick={() => updateStatus('chegou_expedicao')} variant="outline" className="h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-[11px] border-2 border-primary/30 text-primary hover:bg-primary/5">
                        <History className="w-4.5 h-4.5 mr-2" /> Registrar Chegada
                      </Button>
                    )}
                    {(pickup.status === 'chegou_expedicao' || pickup.status === 'divergencia') && (
                      <Button onClick={() => handleTabChange('conferencia')} className="h-12 px-8 rounded-2xl font-black uppercase tracking-widest text-[11px] bg-success text-white hover:scale-[1.03] transition-all shadow-xl shadow-success/20">
                        <CheckCircle2 className="w-4.5 h-4.5 mr-2" /> Abrir Conferência Blindada
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="conferencia" className="pb-4">
                <PickupConference 
                  pickup={pickup} 
                  onSuccess={() => {
                    onStatusUpdate();
                    handleTabChange('detalhes');
                  }} 
                />
              </TabsContent>

              <TabsContent value="custos" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="group relative overflow-hidden rounded-[2rem] bg-black/40 border-white/5 backdrop-blur-xl p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 rounded-2xl bg-success/10 text-success">
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Custo Estimado Coleta</p>
                        <p className="text-3xl font-black italic tracking-tighter text-white">R$ {estimatedCost.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-white/40 border-b border-white/5 pb-2">
                        <span>Taxa Base</span>
                        <span className="text-white">R$ {pickup.tipo_coleta === 'lalamove' ? '25,00' : '15,00'}</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-white/40 border-b border-white/5 pb-2">
                        <span>Peso Variável</span>
                        <span className="text-white">R$ {((pickup.peso_estimado_kg || 0) * 1.5).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em] pt-2 text-primary">
                        <span>TOTAL_PREDICT</span>
                        <span>R$ {estimatedCost.toFixed(2)}</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="group relative overflow-hidden rounded-[2rem] bg-black/40 border-white/5 backdrop-blur-xl p-8 flex flex-col justify-center items-center text-center gap-4">
                    <div className="p-4 rounded-full bg-primary/10">
                      <CreditCard className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                      <p className="font-black text-lg italic tracking-tighter uppercase text-white">Gestão Financeira_Node</p>
                      <p className="text-xs text-white/40 font-medium max-w-[200px] mt-1">Este custo será provisionado automaticamente no módulo de auditoria de fretes.</p>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="historico" className="pb-6">
                <div className="space-y-4">
                  {loadingTimeline && (
                    <div className="flex justify-center py-12">
                      <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    </div>
                  )}
                  
                  {!loadingTimeline && timeline.length > 0 && (
                    <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-1 before:bg-gradient-to-b before:from-primary/40 before:to-transparent">
                      {timeline.map((event, idx) => (
                        <motion.div 
                          key={event.id} 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="relative"
                        >
                          <div className="absolute -left-8 top-1.5 w-6 h-6 rounded-full bg-black border-2 border-primary flex items-center justify-center shadow-lg shadow-primary/20">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          </div>
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                            <p className="text-[11px] font-black uppercase tracking-widest text-white/80">
                              {event.action === 'UPDATE' ? 'Atualização de Sistema' : 'Injeção de Rede'}
                            </p>
                            <div className="text-[10px] font-bold text-white/40 mt-2 space-y-1.5 uppercase tracking-tighter">
                              {event.new_data?.status && (
                                <p className="flex items-center gap-2">
                                  Status Alterado: <Badge className="bg-primary/20 text-primary text-[9px] h-4">{statusConfig[event.new_data.status]?.label || event.new_data.status}</Badge>
                                </p>
                              )}
                              {event.new_data?.qtd_recebida !== undefined && (
                                <p>Volumes Conferidos: <span className="text-success">{event.new_data.qtd_recebida} UNIDADES</span></p>
                              )}
                              {event.new_data?.peso_efetivo !== undefined && (
                                <p>Peso Aferido: <span className="text-success">{event.new_data.peso_efetivo} KG</span></p>
                              )}
                              <p className="flex items-center gap-1.5 pt-1 text-[9px] text-white/20">
                                <Clock className="w-3 h-3" /> {format(new Date(event.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                  
                  {!loadingTimeline && timeline.length === 0 && (
                    <div className="text-center py-16 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
                      <Clock className="w-12 h-12 text-white/10 mx-auto mb-4" />
                      <p className="text-white/30 font-black uppercase tracking-widest text-[10px]">Sequência de histórico não encontrada_NODE</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}