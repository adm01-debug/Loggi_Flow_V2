import { ReactNode, useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, 
  MapPin, 
  Truck, 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  Activity,
  History,
  Building2,
  ExternalLink,
  Zap,
  Navigation,
  ArrowRight,
  Database,
  Search,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { UnifiedShipment } from "@/hooks/useUnifiedTracking";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface MissionDetailProps {
  shipment: UnifiedShipment;
  onOpenBitrix?: () => void;
}

function formatDate(date: string | null): string {
  if (!date) return '—';
  try {
    return format(parseISO(date), "dd 'de' MMM, HH:mm", { locale: ptBR });
  } catch {
    return date;
  }
}

export function MissionDetail({ shipment, onOpenBitrix }: MissionDetailProps) {
  const [bitrixData, setBitrixData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchBitrixInfo() {
      if (!shipment.id) return;
      setIsLoading(true);
      try {
        const { data, error } = await (supabase as any)
          .from('integracoes_bitrix')
          .select('*')
          .eq('entidade_id', shipment.id)
          .single();
        
        if (data) {
          setBitrixData(data);
        }
      } catch (err) {
        console.error('Error fetching bitrix data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBitrixInfo();
  }, [shipment.id]);
  // Mock timeline events based on status
  const mockTimeline = [
    { 
      status: 'Iniciado', 
      label: 'Ordem Criada', 
      date: shipment.events?.[0]?.timestamp || shipment.previsao, 
      icon: Zap, 
      active: true,
      description: 'Aguardando processamento logístico'
    },
    { 
      status: 'Processamento', 
      label: 'Em Preparação', 
      date: null, 
      icon: Package, 
      active: ['despachado', 'em_transito', 'saiu_entrega', 'entregue'].includes(shipment.status),
      description: 'Mercadoria em fase de separação e embalagem'
    },
    { 
      status: 'Transito', 
      label: 'Despachado', 
      date: shipment.dataEfetiva, 
      icon: Truck, 
      active: ['em_transito', 'saiu_entrega', 'entregue'].includes(shipment.status),
      description: 'Em rota para o destino final'
    },
    { 
      status: 'Finalizado', 
      label: 'Entregue', 
      date: shipment.dataEfetiva, 
      icon: CheckCircle2, 
      active: shipment.status === 'entregue',
      description: 'Missão concluída com sucesso'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Overview Card */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />
        
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
              {shipment.tipo === 'entrega' ? <Package className="w-8 h-8 text-primary" /> : <Truck className="w-8 h-8 text-primary" />}
            </div>
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Status de Operação</p>
              <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{shipment.statusLabel}</h3>
            </div>
          </div>
          <Badge className={cn(
            "h-8 px-4 font-black uppercase tracking-widest text-[10px]",
            shipment.atrasado ? "bg-destructive shadow-[0_0_20px_rgba(var(--destructive-rgb),0.4)]" : "bg-success shadow-[0_0_20px_rgba(var(--success-rgb),0.4)]"
          )}>
            {shipment.atrasado ? 'CRÍTICO' : 'NOMINAL'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Previsão</p>
            <p className="text-sm font-black text-white">{formatDate(shipment.previsao)}</p>
          </div>
          <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Cód. Rastreio</p>
            <p className="text-sm font-black text-primary truncate">{shipment.codigoRastreamento || 'AGUARDANDO'}</p>
          </div>
        </div>
      </div>

      {/* Route Info */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] flex items-center gap-2">
          <Navigation className="w-3 h-3 text-primary" /> Vetor de Destino
        </h4>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-3 h-3 text-primary" />
              <p className="text-[10px] font-bold text-white/60 uppercase">Destinatário</p>
            </div>
            <p className="text-sm font-black text-white truncate uppercase italic">{shipment.cliente || 'CLIENTE FINAL'}</p>
            <p className="text-xs text-white/40 truncate">{shipment.destino}</p>
          </div>
        </div>
      </div>

      {/* Bitrix Sync Indicator & Details */}
      <div className="bg-[#2fc6f6]/5 border border-[#2fc6f6]/20 rounded-2xl p-4 space-y-3 group/bitrix">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#2fc6f6]/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-[#2fc6f6]" />
            </div>
            <div>
              <p className="text-[10px] font-black text-[#2fc6f6] uppercase tracking-widest">Sincronismo Bitrix24</p>
              <p className="text-[9px] font-bold text-white/40 uppercase">SPA ID: {shipment.id.split('-')[0]} • Status: Ativo</p>
            </div>
          </div>
          <button 
            onClick={onOpenBitrix}
            className="p-2 rounded-full hover:bg-[#2fc6f6]/10 text-[#2fc6f6] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#2fc6f6]/10">
          <div>
            <p className="text-[8px] font-bold text-white/20 uppercase">Responsável</p>
            <p className="text-[10px] font-black text-white/80 uppercase">Agente Nexus Alpha</p>
          </div>
          <div>
            <p className="text-[8px] font-bold text-white/20 uppercase">Última Sinc.</p>
            <p className="text-[10px] font-black text-white/80 uppercase">Agora mesmo</p>
          </div>
        </div>
      </div>

      {/* Mission Timeline */}
      <div className="space-y-4 pt-2">
        <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] flex items-center gap-2">
          <History className="w-3 h-3 text-primary" /> Linha do Tempo da Missão
        </h4>
        <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/5">
          {mockTimeline.map((item, idx) => (
            <div key={idx} className={cn("relative", !item.active && "opacity-30")}>
              <div className={cn(
                "absolute -left-8 w-6 h-6 rounded-lg flex items-center justify-center z-10 border transition-all duration-500",
                item.active ? "bg-primary border-white/20 shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)]" : "bg-black border-white/10"
              )}>
                <item.icon className={cn("w-3 h-3", item.active ? "text-white" : "text-white/20")} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-white uppercase tracking-tighter italic">{item.label}</p>
                  {item.date && <span className="text-[9px] font-bold text-white/40 uppercase">{formatDate(item.date)}</span>}
                </div>
                <p className="text-[10px] text-white/60 font-medium leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
