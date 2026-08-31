import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ShieldAlert,
  Zap,
  Clock,
  Save,
  RefreshCw,
} from "lucide-react";

export function BioSyncConfig() {
  const queryClient = useQueryClient();
  const [bpmWarning, setBpmWarning] = useState(100);
  const [bpmCritical, setBpmCritical] = useState(120);
  const [cooldown, setCooldown] = useState(5);

  const { data: config, isLoading } = useQuery({
    queryKey: ["bio-sync-alert-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bio_sync_alert_rules")
        .select("*")
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setBpmWarning(data.bpm_warning_threshold || 100);
        setBpmCritical(data.bpm_critical_threshold || 120);
        setCooldown(data.cooldown_minutes || 5);
      }
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("bio_sync_alert_rules").upsert({
        id: config?.id || "00000000-0000-0000-0000-000000000000",
        bpm_warning_threshold: bpmWarning,
        bpm_critical_threshold: bpmCritical,
        cooldown_minutes: cooldown,
        is_active: true,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bio-sync-alert-rules"] });
      toast.success("REGRAS BIO_SYNC ATUALIZADAS", {
        description:
          "As novas faixas de vital e cooldown foram aplicadas imediatamente.",
      });
    },
    onError: (error) => {
      toast.error("ERRO AO SALVAR CONFIGURAÇÕES", {
        description: error.message,
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
      <Card className="border-none bg-black/40 backdrop-blur-xl border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 border-b border-white/5">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
              <Activity className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black italic tracking-tighter uppercase">
                Limiares de Vital
              </CardTitle>
              <CardDescription className="text-[10px] uppercase tracking-widest font-bold text-white/40">
                Configuração de Frequência Cardíaca
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-black uppercase tracking-[0.2em] text-amber-500 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Alerta (BPM)
              </Label>
              <Badge
                variant="outline"
                className="h-8 px-4 text-xl font-black italic border-amber-500/20 bg-amber-500/10 text-amber-500"
              >
                {bpmWarning}
              </Badge>
            </div>
            <Slider
              value={[bpmWarning]}
              onValueChange={(v) => setBpmWarning(v[0])}
              max={200}
              min={40}
              step={1}
              className="py-4"
            />
            <p className="text-[10px] text-white/40 italic">
              O sistema dispara um alerta visual se o BPM exceder este valor.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-black uppercase tracking-[0.2em] text-rose-500 flex items-center gap-2">
                <Zap className="w-4 h-4 animate-pulse" /> Crítico (BPM)
              </Label>
              <Badge
                variant="outline"
                className="h-8 px-4 text-xl font-black italic border-rose-500/20 bg-rose-500/10 text-rose-500"
              >
                {bpmCritical}
              </Badge>
            </div>
            <Slider
              value={[bpmCritical]}
              onValueChange={(v) => setBpmCritical(v[0])}
              max={220}
              min={bpmWarning + 1}
              step={1}
              className="py-4"
            />
            <p className="text-[10px] text-white/40 italic">
              Eventos críticos acionam o protocolo de emergência e Bitrix24.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="border-none bg-black/40 backdrop-blur-xl border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 border-b border-white/5">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                <Clock className="w-6 h-6 text-cyan-500" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black italic tracking-tighter uppercase">
                  Tempo de Cooldown
                </CardTitle>
                <CardDescription className="text-[10px] uppercase tracking-widest font-bold text-white/40">
                  Intervalo entre Notificações
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-black uppercase tracking-[0.2em] text-cyan-500">
                Minutos de Espera
              </Label>
              <Badge
                variant="outline"
                className="h-8 px-4 text-xl font-black italic border-cyan-500/20 bg-cyan-500/10 text-cyan-500"
              >
                {cooldown}m
              </Badge>
            </div>
            <Slider
              value={[cooldown]}
              onValueChange={(v) => setCooldown(v[0])}
              max={60}
              min={1}
              step={1}
              className="py-4"
            />
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-[11px] leading-relaxed text-white/60">
                O cooldown evita spam de notificações para o mesmo
                veículo/motorista em curtos períodos de tempo, garantindo que o
                CCO foque em novos incidentes.
              </p>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="w-full h-20 rounded-[2rem] bg-primary hover:bg-primary/80 text-black font-black uppercase tracking-[0.3em] text-sm gap-4 shadow-2xl shadow-primary/20 transition-all hover:scale-[0.98] active:scale-95"
        >
          {mutation.isPending ? (
            <RefreshCw className="w-6 h-6 animate-spin" />
          ) : (
            <Save className="w-6 h-6" />
          )}
          Aplicar Configurações Agora
        </Button>
      </div>
    </div>
  );
}
