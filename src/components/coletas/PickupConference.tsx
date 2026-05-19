import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Package, AlertTriangle, CheckCircle2, Loader2, Weight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks";
import { useAudioFeedback } from "@/hooks";
import { Coleta as Pickup, ColetaStatus } from "./types";


interface PickupConferenceProps {
  pickup: Pickup;
  onSuccess: () => void;
}

export function PickupConference({ pickup, onSuccess }: PickupConferenceProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [qtdRecebida, setQtdRecebida] = useState(pickup.qtd_recebida || pickup.qtd_volumes || 0);
  const [pesoEfetivo, setPesoEfetivo] = useState(pickup.peso_efetivo || pickup.peso_estimado_kg || 0);
  const [divergencia, setDivergencia] = useState<{ volumes: boolean; peso: boolean } | null>(null);
  const { playSuccess, playError } = useAudioFeedback();

  const checkDivergences = () => {
    const volDiv = Number(qtdRecebida) !== Number(pickup.qtd_volumes);
    // Variação de peso superior a 5% ou absoluta > 2kg
    const pesoEsperado = Number(pickup.peso_estimado_kg);
    const pesoVariacao = Math.abs(Number(pesoEfetivo) - pesoEsperado);
    const pesoDiv = pesoVariacao > (pesoEsperado * 0.05) || (pesoEsperado > 0 && pesoVariacao > 2);
    
    const result = { volumes: volDiv, peso: pesoDiv };
    setDivergencia(result);
    return result.volumes || result.peso;
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const hasDivergence = checkDivergences();
      const status = hasDivergence ? 'divergencia' : 'conferencia_ok';
      
      const { error } = await supabase
        .from("coletas")
        .update({
          qtd_recebida: Number(qtdRecebida),
          peso_efetivo: Number(pesoEfetivo),
          status: status as ColetaStatus,
          data_recebimento: new Date().toISOString(),
          divergencia_percentual: pickup.peso_estimado_kg ? (Math.abs(Number(pesoEfetivo) - pickup.peso_estimado_kg) / pickup.peso_estimado_kg) * 100 : 0
        })
        .eq("id", pickup.id);

      if (error) throw error;

      toast({
        title: hasDivergence ? "Conferência com Divergências" : "Conferência Finalizada",
        description: hasDivergence 
          ? "Detectamos discrepâncias. Verifique o alerta abaixo." 
          : "Volumes e pesos conferidos com sucesso.",
        variant: hasDivergence ? "destructive" : "default"
      });
      
      if (hasDivergence) {
        playError();
      } else {
        playSuccess();
      }
      
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast({ title: "Erro na conferência", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="grid grid-cols-2 gap-6 bg-sidebar-accent/30 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
        <div className="space-y-3">
          <Label htmlFor="qtd_recebida" className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Volumes Recebidos</Label>
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/10 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary pointer-events-none" />
            <Input 
              id="qtd_recebida" 
              type="number" 
              value={qtdRecebida} 
              onChange={(e) => setQtdRecebida(Number(e.target.value))}
              className="pl-12 h-14 rounded-2xl bg-black/40 border-white/10 font-black text-xl italic tracking-tighter"
            />
          </div>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Esperado_NODE: {pickup.qtd_volumes}</p>
        </div>
        <div className="space-y-3">
          <Label htmlFor="peso_efetivo" className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Peso Real (KG)</Label>
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/10 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <Weight className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary pointer-events-none" />
            <Input 
              id="peso_efetivo" 
              type="number" 
              step="0.01" 
              value={pesoEfetivo} 
              onChange={(e) => setPesoEfetivo(Number(e.target.value))}
              className="pl-12 h-14 rounded-2xl bg-black/40 border-white/10 font-black text-xl italic tracking-tighter"
            />
          </div>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Estimado_NODE: {pickup.peso_estimado_kg} KG</p>
        </div>
      </div>

      {divergencia && (divergencia.volumes || divergencia.peso) && (
        <Alert variant="destructive" className="bg-destructive/10 border-destructive/30 rounded-3xl p-6 shadow-xl shadow-destructive/5 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-destructive/20">
              <AlertTriangle className="h-8 w-8 text-destructive animate-pulse" />
            </div>
            <div>
              <AlertTitle className="font-black text-xl italic tracking-tighter uppercase text-destructive mb-1">Divergência_Delta Detectada</AlertTitle>
              <AlertDescription className="text-[10px] font-bold uppercase tracking-widest text-destructive/70">
                {divergencia.volumes && <p>• Quantidade de volumes diverge da solicitação original.</p>}
                {divergencia.peso && <p>• Variação de peso superior a 5% da métrica base.</p>}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      {!divergencia && (
        <div className="bg-primary/5 p-6 rounded-3xl border border-primary/20 flex items-start gap-4 shadow-inner group/hint">
          <div className="p-3 rounded-2xl bg-primary/10 transition-transform group-hover/hint:rotate-12 duration-500">
            <InfoIcon className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="font-black text-base italic tracking-tighter uppercase text-primary">Protocolo de Conferência</p>
            <p className="text-xs text-white/50 font-medium leading-relaxed">Valide a integridade estrutural das embalagens. O sistema Nexus exige conformidade total entre o manifesto e a recepção física.</p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button 
          className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs bg-success text-white hover:scale-[1.02] transition-all shadow-2xl shadow-success/20 group/submit" 
          onClick={handleFinish} 
          disabled={loading}
        >
          {loading ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <CheckCircle2 className="w-5 h-5 mr-3 group-hover/submit:scale-110 transition-transform" />}
          AUTORIZAR_RECEPÇÃO_FINAL
        </Button>
      </div>
    </div>
  );
}

function InfoIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
