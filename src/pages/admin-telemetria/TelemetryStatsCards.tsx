import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Zap, Database } from "lucide-react";

interface TelemetryStatsCardsProps {
  verySlow: number;
  slow: number;
  errors: number;
  avgDuration: number;
}

function formatDuration(ms: number) {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

export function TelemetryStatsCards({ verySlow, slow, errors, avgDuration }: TelemetryStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="p-6 rounded-[2.5rem] bg-gradient-to-br from-rose-500/10 to-rose-500/5 border border-rose-500/20 shadow-xl backdrop-blur-xl group hover:scale-[1.02] transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-2xl bg-rose-500/20"><AlertTriangle className="h-6 w-6 text-rose-500 animate-pulse" /></div>
          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-rose-500 border-rose-500/20 italic">Crítico</Badge>
        </div>
        <p className="text-4xl font-black tracking-tighter italic text-white">{verySlow}</p>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500/80">Muito Lentas (&gt;8s)</p>
      </div>

      <div className="p-6 rounded-[2.5rem] bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 shadow-xl backdrop-blur-xl group hover:scale-[1.02] transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-2xl bg-amber-500/20"><Clock className="h-6 w-6 text-amber-500" /></div>
          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-amber-500 border-amber-500/20 italic">Atenção</Badge>
        </div>
        <p className="text-4xl font-black tracking-tighter italic text-white">{slow}</p>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500/80">Lentas (&gt;3s)</p>
      </div>

      <div className="p-6 rounded-[2.5rem] bg-gradient-to-br from-rose-500/10 to-rose-500/5 border border-rose-500/20 shadow-xl backdrop-blur-xl group hover:scale-[1.02] transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-2xl bg-rose-500/20"><Zap className="h-6 w-6 text-rose-500" /></div>
          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-rose-500 border-rose-500/20 italic">Falhas</Badge>
        </div>
        <p className="text-4xl font-black tracking-tighter italic text-white">{errors}</p>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-500/80">Queries com Erro</p>
      </div>

      <div className="p-6 rounded-[2.5rem] bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 shadow-xl backdrop-blur-xl group hover:scale-[1.02] transition-all">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-2xl bg-primary/20"><Database className="h-6 w-6 text-primary" /></div>
          <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-primary border-primary/20 italic">Latência</Badge>
        </div>
        <p className="text-4xl font-black tracking-tighter italic text-white">{formatDuration(avgDuration)}</p>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/80">Média de Resposta</p>
      </div>
    </div>
  );
}

export { formatDuration };
