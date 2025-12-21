import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, CheckCircle2, Clock, MapPin, Search, Loader2, AlertTriangle, Phone, Calendar } from "lucide-react";
import { Timeline } from "@/components/common/Timeline";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  coletado: { label: "Coletado", color: "text-blue-500", icon: Package },
  em_transito: { label: "Em Trânsito", color: "text-amber-500", icon: Truck },
  saiu_entrega: { label: "Saiu para Entrega", color: "text-purple-500", icon: Truck },
  entregue: { label: "Entregue", color: "text-green-500", icon: CheckCircle2 },
  problema: { label: "Problema", color: "text-red-500", icon: AlertTriangle },
};

export default function RastreamentoPublico() {
  const { trackingCode } = useParams();
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState(trackingCode || searchParams.get("code") || "");
  const [searchCode, setSearchCode] = useState(code);

  const { data: tracking, isLoading, error, refetch } = useQuery({
    queryKey: ["tracking-public", searchCode],
    queryFn: async () => {
      if (!searchCode) return null;
      const { data, error } = await supabase.from("entregas").select("*, timeline:activity_logs(*)").or(`codigo_rastreamento.eq.${searchCode},numero_nf.eq.${searchCode}`).single();
      if (error) throw error;
      return data;
    },
    enabled: !!searchCode,
  });

  const handleSearch = () => { if (code.trim()) setSearchCode(code.trim()); };

  const timelineEvents = (tracking?.timeline || []).map((t: any) => ({ id: t.id, title: t.action || t.tipo, description: t.description || t.descricao, timestamp: t.created_at, status: t.status || "completed" }));
  const currentStatus = tracking?.status || "pendente";
  const StatusIcon = statusConfig[currentStatus]?.icon || Clock;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8"><div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"><Package className="w-8 h-8 text-primary" /></div><h1 className="text-2xl font-bold">Rastreamento de Entrega</h1><p className="text-muted-foreground">Digite o código para acompanhar</p></div>
        <div className="flex gap-2 mb-8"><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Código de rastreamento ou NF" onKeyDown={(e) => e.key === "Enter" && handleSearch()} /><Button onClick={handleSearch}><Search className="w-4 h-4" /></Button></div>
        {isLoading && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}
        {error && <div className="card-base p-8 text-center"><AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" /><p className="font-semibold">Código não encontrado</p><p className="text-sm text-muted-foreground">Verifique o código e tente novamente</p></div>}
        {tracking && !isLoading && (
          <div className="space-y-6">
            <div className="card-base p-6">
              <div className="flex items-center gap-4 mb-4"><div className={cn("p-3 rounded-xl", statusConfig[currentStatus]?.color.replace("text-", "bg-").replace("500", "100"))}><StatusIcon className={cn("w-6 h-6", statusConfig[currentStatus]?.color)} /></div><div><Badge className={cn(statusConfig[currentStatus]?.color.replace("text-", "bg-").replace("500", "500"), "text-white")}>{statusConfig[currentStatus]?.label || currentStatus}</Badge><p className="text-sm text-muted-foreground mt-1">Última atualização: {format(new Date(tracking.updated_at || tracking.created_at), "dd/MM HH:mm", { locale: ptBR })}</p></div></div>
              <div className="grid grid-cols-2 gap-4 text-sm"><div><p className="text-muted-foreground">Código</p><p className="font-mono font-semibold">{tracking.codigo_rastreamento || tracking.numero_nf}</p></div><div><p className="text-muted-foreground">Previsão</p><p className="font-semibold">{tracking.previsao_entrega ? format(new Date(tracking.previsao_entrega), "dd/MM/yyyy") : "A definir"}</p></div></div>
            </div>
            <div className="card-base p-6"><div className="flex items-center gap-2 mb-4"><MapPin className="w-5 h-5 text-muted-foreground" /><span className="font-semibold">Destino</span></div><p className="text-sm">{tracking.endereco_destino || "Endereço não informado"}</p></div>
            {timelineEvents.length > 0 && <div className="card-base p-6"><h3 className="font-semibold mb-4 flex items-center gap-2"><Clock className="w-5 h-5" />Histórico</h3><Timeline events={timelineEvents} /></div>}
            <div className="card-base p-4 text-center text-sm text-muted-foreground"><p>Dúvidas? Entre em contato</p><div className="flex items-center justify-center gap-2 mt-2"><Phone className="w-4 h-4" /><span>(11) 99999-9999</span></div></div>
          </div>
        )}
        {!tracking && !isLoading && !error && searchCode && <div className="card-base p-8 text-center"><Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" /><p className="text-muted-foreground">Digite um código para buscar</p></div>}
      </div>
    </div>
  );
}
