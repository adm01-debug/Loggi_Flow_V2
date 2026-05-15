import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Package, AlertTriangle, CheckCircle2, Loader2, Weight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAudioFeedback } from "@/hooks/useAudioFeedback";

interface Pickup {
  id: string;
  qtd_recebida: number;
  qtd_volumes: number;
  peso_efetivo: number;
  peso_estimado_kg: number;
}

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
          status: status as any,
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
    } catch (error: any) {
      toast({ title: "Erro na conferência", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="qtd_recebida">Qtd. Volumes Recebidos</Label>
          <div className="relative">
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              id="qtd_recebida" 
              type="number" 
              value={qtdRecebida} 
              onChange={(e) => setQtdRecebida(Number(e.target.value))}
              className="pl-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">Esperado: {pickup.qtd_volumes}</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="peso_efetivo">Peso Efetivo (kg)</Label>
          <div className="relative">
            <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              id="peso_efetivo" 
              type="number" 
              step="0.01" 
              value={pesoEfetivo} 
              onChange={(e) => setPesoEfetivo(Number(e.target.value))}
              className="pl-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">Estimado: {pickup.peso_estimado_kg} kg</p>
        </div>
      </div>

      {divergencia && (divergencia.volumes || divergencia.peso) && (
        <Alert variant="destructive" className="bg-destructive/10">
          <AlertTriangle className="h-4 h-4" />
          <AlertTitle>Divergência Detectada</AlertTitle>
          <AlertDescription>
            {divergencia.volumes && <p>• Quantidade de volumes difere do solicitado.</p>}
            {divergencia.peso && <p>• Variação de peso superior a 5% da estimativa.</p>}
          </AlertDescription>
        </Alert>
      )}

      {!divergencia && (
        <div className="bg-muted/30 p-4 rounded-lg flex items-start gap-3">
          <InfoIcon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Instruções de Conferência</p>
            <p className="text-muted-foreground">Verifique a integridade das embalagens e confirme se a quantidade e peso batem com o manifesto de coleta.</p>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button 
          className="flex-1 bg-success hover:bg-success/90" 
          onClick={handleFinish} 
          disabled={loading}
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
          Finalizar Conferência
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
