import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Package, Truck, CheckCircle2, Clock, Search, Loader2, AlertTriangle, Phone, Share2, MessageCircle, LucideIcon, Copy } from "lucide-react";
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
}

const statusConfig: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  aguardando_producao: { label: "Em Preparação", color: "text-muted-foreground", icon: Clock },
  pronto_despacho: { label: "Pronto para Envio", color: "text-blue-500", icon: Package },
  cotacao_frete: { label: "Cotando Frete", color: "text-purple-500", icon: Package },
  nf_emitida: { label: "NF Emitida", color: "text-indigo-500", icon: Package },
  despachado: { label: "Despachado", color: "text-cyan-500", icon: Truck },
  em_transito: { label: "Em Trânsito", color: "text-amber-500", icon: Truck },
  saiu_entrega: { label: "Saiu para Entrega", color: "text-orange-500", icon: Truck },
  entregue: { label: "Entregue", color: "text-green-500", icon: CheckCircle2 },
  ocorrencia: { label: "Ocorrência", color: "text-red-500", icon: AlertTriangle },
  finalizado: { label: "Finalizado", color: "text-green-600", icon: CheckCircle2 },
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
      const { data, error } = await supabase
        .rpc("get_public_tracking", { p_code: searchCode })
        .maybeSingle();
      if (error) throw error;
      return (data as PublicTracking | null) ?? null;
    },
    enabled: !!searchCode,
  });

  const handleSearch = () => {
    if (code.trim()) setSearchCode(code.trim());
  };

  const trackingUrl = tracking
    ? `${window.location.origin}/rastrear?code=${encodeURIComponent(tracking.codigo_rastreamento || tracking.nf_remessa || "")}`
    : "";

  const shareWhatsApp = () => {
    const statusLabel = statusConfig[tracking?.status || ""]?.label || tracking?.status;
    const msg = `📦 Rastreamento da sua entrega\n\nStatus: ${statusLabel}\nCódigo: ${tracking?.codigo_rastreamento || tracking?.nf_remessa}\n${tracking?.previsao_entrega ? `Previsão: ${format(new Date(tracking.previsao_entrega), "dd/MM/yyyy")}` : ""}\n\nAcompanhe: ${trackingUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(trackingUrl);
    toast.success("Link copiado!");
  };

  const currentStatus = tracking?.status || "pendente";
  const StatusIcon = statusConfig[currentStatus]?.icon || Clock;
  const currentStepIndex = statusOrder.indexOf(currentStatus);

  const timelineEvents = tracking
    ? [
        { id: "1", title: "Pedido criado", description: "Entrega registrada no sistema", timestamp: tracking.created_at, status: "completed" as const },
        ...(tracking.data_despacho ? [{ id: "2", title: "Despachado", description: "Enviado para transportadora", timestamp: tracking.data_despacho, status: "completed" as const }] : []),
        ...(tracking.data_entrega_efetiva ? [{ id: "3", title: "Entregue", description: `Recebido por ${tracking.recebedor || "destinatário"}`, timestamp: tracking.data_entrega_efetiva, status: "completed" as const }] : []),
      ]
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Rastreamento de Entrega</h1>
          <p className="text-muted-foreground">Digite o código para acompanhar sua entrega</p>
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-8">
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Código de rastreamento ou NF" onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="text-base" />
          <Button onClick={handleSearch} size="lg"><Search className="w-4 h-4" /></Button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        )}

        {error && (
          <Card className="text-center"><CardContent className="py-8">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="font-semibold">Código não encontrado</p>
            <p className="text-sm text-muted-foreground">Verifique o código e tente novamente</p>
          </CardContent></Card>
        )}

        {tracking && !isLoading && (
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={cn("p-3 rounded-xl bg-primary/10")}>
                      <StatusIcon className={cn("w-6 h-6", statusConfig[currentStatus]?.color)} />
                    </div>
                    <div>
                      <Badge variant="secondary">{statusConfig[currentStatus]?.label || currentStatus}</Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        Atualizado: {format(new Date(tracking.updated_at || tracking.created_at), "dd/MM HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyLink}><Copy className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" onClick={shareWhatsApp} className="text-green-600 hover:text-green-700">
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-6">
                  {statusOrder.map((step, i) => {
                    const isCompleted = i <= currentStepIndex;
                    const isCurrent = i === currentStepIndex;
                    return (
                      <div key={step} className="flex items-center flex-1">
                        <div className={cn(
                          "w-3 h-3 rounded-full flex-shrink-0 transition-all",
                          isCompleted ? "bg-primary" : "bg-muted",
                          isCurrent && "ring-4 ring-primary/20 w-4 h-4"
                        )} />
                        {i < statusOrder.length - 1 && (
                          <div className={cn("h-0.5 flex-1 mx-1", i < currentStepIndex ? "bg-primary" : "bg-muted")} />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Código</p>
                    <p className="font-mono font-semibold">{tracking.codigo_rastreamento || tracking.nf_remessa}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Previsão</p>
                    <p className="font-semibold">
                      {tracking.previsao_entrega ? format(new Date(tracking.previsao_entrega), "dd/MM/yyyy") : "A definir"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            {timelineEvents.length > 0 && (
              <Card><CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Clock className="w-5 h-5" />Histórico</h3>
                <Timeline events={timelineEvents} />
              </CardContent></Card>
            )}

            {/* Share Banner */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Share2 className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">Compartilhar rastreamento</p>
                    <p className="text-xs text-muted-foreground">Envie o link para o destinatário via WhatsApp</p>
                  </div>
                </div>
                <Button size="sm" onClick={shareWhatsApp} className="bg-green-600 hover:bg-green-700">
                  <MessageCircle className="w-4 h-4 mr-2" />WhatsApp
                </Button>
              </CardContent>
            </Card>

            <Card><CardContent className="py-4 text-center text-sm text-muted-foreground">
              <p>Dúvidas? Entre em contato</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Phone className="w-4 h-4" /><span>(11) 99999-9999</span>
              </div>
            </CardContent></Card>
          </div>
        )}

        {!tracking && !isLoading && !error && searchCode && (
          <Card className="text-center"><CardContent className="py-8">
            <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Código não encontrado</p>
          </CardContent></Card>
        )}
      </div>
    </div>
  );
}
