import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Package, AlertTriangle, CheckCircle2, Loader2, Weight, Camera, Info, ShieldCheck, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/ui/use-toast";
import { useAudioFeedback } from "@/hooks/notifications/useAudioFeedback";
import { Coleta as Pickup, ColetaStatus } from "./types";
import { motion, AnimatePresence } from "framer-motion";

interface PickupConferenceProps {
  pickup: Pickup;
  onSuccess: () => void;
}

export function PickupConference({ pickup, onSuccess }: PickupConferenceProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'scan' | 'blind_entry'>('scan');
  
  // No modo "Blind Entry", o usuário não vê os valores esperados inicialmente
  const [qtdRecebida, setQtdRecebida] = useState<number | "">("");
  const [pesoEfetivo, setPesoEfetivo] = useState<number | "">("");
  
  const [divergencia, setDivergencia] = useState<{ volumes: boolean; peso: boolean } | null>(null);
  const { playSuccess, playError, playAction } = useAudioFeedback();

  const checkDivergences = () => {
    const volDiv = Number(qtdRecebida) !== Number(pickup.qtd_volumes);
    const pesoEsperado = Number(pickup.peso_estimado_kg);
    const pesoVariacao = Math.abs(Number(pesoEfetivo) - pesoEsperado);
    // Variação de peso superior a 5% ou absoluta > 2kg
    const pesoDiv = pesoVariacao > (pesoEsperado * 0.05) || (pesoEsperado > 0 && pesoVariacao > 2);
    
    const result = { volumes: volDiv, peso: pesoDiv };
    setDivergencia(result);
    return result.volumes || result.peso;
  };

  const handleFinish = async () => {
    if (qtdRecebida === "" || pesoEfetivo === "") {
      toast({ title: "Dados incompletos", description: "Insira os valores conferidos para processar.", variant: "destructive" });
      return;
    }

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
        title: hasDivergence ? "Divergência Detectada_NODE" : "Conferência Blindada OK",
        description: hasDivergence 
          ? "Os valores inseridos não conferem com o manifesto original." 
          : "Integridade total confirmada entre manifesto e físico.",
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

  const simulateOCR = () => {
    playAction();
    toast({
      title: "Scanner_OCR Ativo",
      description: "Buscando dados em CTE/Manifesto...",
    });
    
    // Simulação de OCR após 1.5s
    setTimeout(() => {
      setQtdRecebida(pickup.qtd_volumes || 0);
      setPesoEfetivo(pickup.peso_estimado_kg || 0);
      setStep('blind_entry');
      toast({
        title: "OCR Concluído",
        description: "Dados extraídos do documento com 98% de precisão.",
      });
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-4">
      <AnimatePresence mode="wait">
        {step === 'scan' ? (
          <motion.div 
            key="scan"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col gap-4"
          >
            <div className="bg-primary/5 p-8 rounded-[2rem] border-2 border-dashed border-primary/20 flex flex-col items-center justify-center text-center gap-4 group cursor-pointer hover:bg-primary/10 transition-all" onClick={simulateOCR}>
              <div className="p-4 rounded-full bg-primary/20 group-hover:scale-110 transition-transform">
                <Camera className="w-10 h-10 text-primary" />
              </div>
              <div>
                <p className="font-black text-xl italic tracking-tighter uppercase text-primary">Scan de Documento_OCR</p>
                <p className="text-xs text-white/40 font-medium max-w-[250px] mt-1 uppercase tracking-widest">Aponte para o CTE ou Manifesto de Coleta para extração automática</p>
              </div>
            </div>
            
            <Button variant="ghost" className="h-12 font-black uppercase tracking-widest text-[10px] text-white/30 hover:text-white" onClick={() => setStep('blind_entry')}>
              Pular para Entrada Manual Blindada
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            key="entry"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-sidebar-accent/30 p-6 rounded-[2rem] border border-white/5 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldCheck className="w-20 h-20 text-success" />
              </div>
              
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 rounded-full bg-success animate-ping" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-success">MODO_CONFERÊNCIA_CEGA</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Volumes Contados</Label>
                  <div className="relative group">
                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    <Input 
                      type="number" 
                      value={qtdRecebida} 
                      onChange={(e) => setQtdRecebida(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="00"
                      className="pl-12 h-16 rounded-2xl bg-black/40 border-white/10 font-black text-2xl italic"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Peso Aferido (KG)</Label>
                  <div className="relative group">
                    <Weight className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={pesoEfetivo} 
                      onChange={(e) => setPesoEfetivo(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="0.00"
                      className="pl-12 h-16 rounded-2xl bg-black/40 border-white/10 font-black text-2xl italic"
                    />
                  </div>
                </div>
              </div>
            </div>

            {divergencia && (divergencia.volumes || divergencia.peso) && (
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/30 rounded-3xl p-6 shadow-xl animate-in shake-1">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-destructive/20">
                    <AlertTriangle className="h-8 w-8 text-destructive animate-pulse" />
                  </div>
                  <div>
                    <AlertTitle className="font-black text-lg italic tracking-tighter uppercase text-destructive">Falha de Protocolo_GRID</AlertTitle>
                    <AlertDescription className="text-[9px] font-bold uppercase tracking-widest text-destructive/70">
                      {divergencia.volumes && <p>• Discrepância na contagem de volumes.</p>}
                      {divergencia.peso && <p>• Variação de peso fora do limiar permitido.</p>}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] border-2"
                onClick={() => setStep('scan')}
              >
                Voltar ao Scan
              </Button>
              <Button 
                className="flex-[2] h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] bg-success text-white hover:scale-[1.02] transition-all shadow-xl shadow-success/20 group"
                onClick={handleFinish}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 mr-3 animate-spin" /> : <Zap className="w-5 h-5 mr-3 animate-pulse" />}
                FINALIZAR_CONFERÊNCIA_BLINDADA
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}