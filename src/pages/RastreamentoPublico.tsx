import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Package, Truck, CheckCircle2, Clock, Search, Loader2, 
  AlertTriangle, Phone, Share2, MessageCircle, LucideIcon, Copy,
  MapPin, Calendar, FileText, User, Navigation, Send, Eye
} from "lucide-react";
import { Timeline } from "@/components/common/Timeline";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface PublicTracking {
  numero_entrega: string;
  status: string;
  codigo_rastreamento: string | null;
  nf_remessa: string | null;
  previsao_entrega: string | null;
  data_despacho: string | null;
  data_entrega_efetiva: string | null;
  recebedor: string | null;
  created_at: string;
  updated_at: string;
  endereco_entrega: string;
  comprovante_entrega_url: string | null;
  cliente_razao_social: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: LucideIcon; description: string }> = {
  aguardando_producao: { label: "Em Preparação", color: "text-muted-foreground", icon: Clock, description: "Seu pedido está sendo preparado para o envio." },
  pronto_despacho: { label: "Pronto para Envio", color: "text-blue-500", icon: Package, description: "O pedido já está embalado e aguarda a transportadora." },
  cotacao_frete: { label: "Cotando Frete", color: "text-blue-500", icon: Package, description: "Estamos definindo a melhor rota para sua entrega." },
  nf_emitida: { label: "NF Emitida", color: "text-primary", icon: FileText, description: "A Nota Fiscal foi emitida e o despacho é iminente." },
  despachado: { label: "Despachado", color: "text-indigo-500", icon: Send, description: "O pedido saiu do nosso centro de distribuição." },
  em_transito: { label: "Em Trânsito", color: "text-warning", icon: Truck, description: "Sua encomenda está a caminho do destino." },
  saiu_entrega: { label: "Saiu para Entrega", color: "text-warning", icon: Navigation, description: "O motorista já está na sua região!" },
  entregue: { label: "Entregue", color: "text-success", icon: CheckCircle2, description: "Pedido entregue com sucesso." },
  ocorrencia: { label: "Ocorrência", color: "text-destructive", icon: AlertTriangle, description: "Houve um imprevisto na entrega. Entre em contato." },
  finalizado: { label: "Finalizado", color: "text-success", icon: CheckCircle2, description: "Processo de entrega concluído." },
};

const statusOrder = ["aguardando_producao", "pronto_despacho", "nf_emitida", "despachado", "em_transito", "saiu_entrega", "entregue"];

export default function RastreamentoPublico() {
  const { trackingCode } = useParams();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(trackingCode || searchParams.get("code") || "");
  const [searchCode, setSearchCode] = useState(code);

  const { data: tracking, isLoading, error } = useQuery({
    queryKey: ["tracking-public", searchCode],
    queryFn: async () => {
      if (!searchCode) return null;
      // We use the same RPC but cast to our more detailed interface
      const { data, error } = await supabase
        .rpc("get_public_tracking", { p_code: searchCode })
        .maybeSingle();
      if (error) throw error;
      return (data as PublicTracking | null) ?? null;
    },
    enabled: !!searchCode,
  });

  const handleSearch = () => {
    if (code.trim()) {
      setSearchCode(code.trim());
      window.history.replaceState(null, "", `/rastrear?code=${encodeURIComponent(code.trim())}`);
    }
  };

  const trackingUrl = tracking
    ? `${window.location.origin}/rastrear?code=${encodeURIComponent(tracking.codigo_rastreamento || tracking.nf_remessa || "")}`
    : "";

  const shareWhatsApp = () => {
    const statusLabel = statusConfig[tracking?.status || ""]?.label || tracking?.status;
    const previsaoLine = tracking?.previsao_entrega
      ? `Previsão: ${format(new Date(tracking.previsao_entrega), "dd/MM/yyyy")}`
      : "";
    const msg = `📦 *Rastreamento da sua entrega*\n\nStatus: *${statusLabel}*\nCódigo: \`${tracking?.codigo_rastreamento || tracking?.nf_remessa}\`\n${previsaoLine}\n\nAcompanhe em tempo real: ${trackingUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(trackingUrl);
    toast.success("Link de rastreamento copiado!");
  };

  const currentStatus = tracking?.status || "pendente";
  const statusInfo = statusConfig[currentStatus] || { label: currentStatus, color: "text-muted-foreground", icon: Clock, description: "" };
  const StatusIcon = statusInfo.icon;
  const currentStepIndex = statusOrder.indexOf(currentStatus);

  const timelineEvents = tracking
    ? [
        { id: "1", title: "Pedido Registrado", description: "Recebemos sua solicitação e estamos processando.", timestamp: tracking.created_at, status: "completed" as const },
        ...(tracking.data_despacho ? [{ id: "2", title: "Despachado", description: "O pedido saiu para transporte.", timestamp: tracking.data_despacho, status: "completed" as const }] : []),
        ...(tracking.data_entrega_efetiva ? [{ id: "3", title: "Entregue", description: `Recebido por: ${tracking.recebedor || "Destinatário"}`, timestamp: tracking.data_entrega_efetiva, status: "completed" as const }] : []),
      ]
    : [];

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-primary/10">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-20 h-20 rounded-3xl bg-white shadow-xl shadow-primary/10 flex items-center justify-center mx-auto mb-6 border border-primary/5">
            <Package className="w-10 h-10 text-primary animate-pulse" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Rastrear Entrega</h1>
          <p className="text-slate-500 mt-2 font-medium">LogiFlow 10/10 — Transparência em cada quilômetro.</p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-10 group animate-in fade-in slide-in-from-top-6 duration-700 delay-100">
          <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity rounded-full" />
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input 
                value={code} 
                onChange={(e) => setCode(e.target.value)} 
                placeholder="Código de rastreio ou número da NF" 
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="h-14 pl-12 pr-4 bg-white border-none shadow-lg shadow-slate-200/50 text-base font-medium focus-visible:ring-primary rounded-2xl"
              />
            </div>
            <Button onClick={handleSearch} size="lg" className="h-14 px-8 rounded-2xl shadow-lg shadow-primary/20 font-bold">
              BUSCAR
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sincronizando...</p>
          </div>
        )}

        {tracking && !isLoading && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Main Status Card */}
            <Card className="border-none shadow-2xl shadow-slate-200/50 overflow-hidden rounded-[2rem] bg-white">
              <div className={cn("h-2 w-full", statusInfo.color.replace('text-', 'bg-'))} />
              <CardContent className="pt-8 pb-10">
                <div className="flex items-start justify-between mb-10">
                  <div className="flex gap-5">
                    <div className={cn("p-4 rounded-[1.5rem] shadow-inner", statusInfo.color.replace('text-', 'bg-') + '/10')}>
                      <StatusIcon className={cn("w-8 h-8", statusInfo.color)} />
                    </div>
                    <div>
                      <Badge variant="outline" className={cn("mb-2 px-3 py-1 font-bold rounded-full border-none", statusInfo.color.replace('text-', 'bg-') + '/10', statusInfo.color)}>
                        {statusInfo.label}
                      </Badge>
                      <h2 className="text-xl font-black text-slate-900 leading-tight">
                        {statusInfo.description}
                      </h2>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="icon" onClick={copyLink} className="rounded-xl hover:bg-slate-100"><Copy className="w-4 h-4" /></Button>
                    <Button variant="secondary" size="icon" onClick={shareWhatsApp} className="rounded-xl text-green-600 hover:bg-green-50"><MessageCircle className="w-4 h-4" /></Button>
                  </div>
                </div>

                {/* Tracking Progress */}
                <div className="px-2 mb-10">
                  <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 rounded-full" />
                    <div 
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full transition-all duration-1000" 
                      style={{ width: `${(currentStepIndex / (statusOrder.length - 1)) * 100}%` }}
                    />
                    {statusOrder.map((step, i) => {
                      const isCompleted = i <= currentStepIndex;
                      const isCurrent = i === currentStepIndex;
                      return (
                        <div key={step} className="relative z-10">
                          <div className={cn(
                            "w-4 h-4 rounded-full border-4 border-white transition-all duration-500",
                            isCompleted ? "bg-primary scale-125" : "bg-slate-200",
                            isCurrent && "ring-4 ring-primary/20"
                          )} />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Início</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Destino</span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-8 py-8 border-t border-slate-50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Previsão</span>
                    </div>
                    <p className="text-lg font-black text-slate-900">
                      {tracking.previsao_entrega ? format(new Date(tracking.previsao_entrega), "dd 'de' MMMM", { locale: ptBR }) : "Calculando..."}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Destino</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {tracking.cliente_razao_social || "Em trânsito"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Receipt Section if delivered */}
            {tracking.comprovante_entrega_url && (
              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] bg-emerald-50/50 border border-emerald-100 overflow-hidden">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex gap-4">
                    <div className="p-3 rounded-2xl bg-emerald-100">
                      <FileText className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-emerald-900">Comprovante de Entrega</p>
                      <p className="text-xs text-emerald-700">Disponível para visualização</p>
                    </div>
                  </div>
                  <Button asChild variant="outline" className="rounded-xl border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50">
                    <a href={tracking.comprovante_entrega_url} target="_blank" rel="noreferrer">
                      <Eye className="w-4 h-4 mr-2" /> VER
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Timeline & Support */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] bg-white">
                <CardContent className="p-6">
                  <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-tight">
                    <Clock className="w-4 h-4 text-primary" /> Histórico
                  </h3>
                  <Timeline events={timelineEvents} />
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] bg-primary text-primary-foreground">
                  <CardContent className="p-6">
                    <h3 className="text-sm font-black mb-4 flex items-center gap-2 uppercase tracking-tight">
                      <User className="w-4 h-4" /> Suporte LogiFlow
                    </h3>
                    <p className="text-xs font-medium opacity-80 mb-6">Precisa de ajuda com sua entrega? Nossos especialistas estão prontos.</p>
                    <div className="flex gap-2">
                      <Button className="flex-1 bg-white text-primary hover:bg-slate-50 font-bold rounded-xl h-12">
                        <Phone className="w-4 h-4 mr-2" /> CENTRAL
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Button onClick={shareWhatsApp} variant="outline" className="w-full h-16 rounded-[1.5rem] border-2 border-slate-100 hover:border-primary/20 hover:bg-primary/5 transition-all group">
                  <Share2 className="w-5 h-5 mr-3 text-slate-400 group-hover:text-primary transition-colors" />
                  <span className="font-bold text-slate-600 group-hover:text-primary">Compartilhar com alguém</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {!tracking && !isLoading && searchCode && (
          <div className="text-center py-20 animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-slate-300" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Código não encontrado</h2>
            <p className="text-slate-500 mt-2 max-w-xs mx-auto">Verifique o número da NF ou código de rastreio e tente novamente.</p>
            <Button variant="link" onClick={() => { setCode(""); setSearchCode(""); }} className="mt-4 font-bold">LIMPAR BUSCA</Button>
          </div>
        )}
      </div>
    </div>
  );
}
