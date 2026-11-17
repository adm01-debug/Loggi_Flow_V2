import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Zap,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useMapIntelligence } from "@/hooks/logistics/useMapIntelligence";

function rotuloConexao(isLoading: boolean, isError: boolean) {
  if (isLoading) return "SYNC...";
  if (isError) return "OFFLINE";
  return "LIVE";
}

function rotuloSla(slaPercent: number | null) {
  if (slaPercent === null)
    return { texto: "SEM_BASE", classe: "text-white/40" };
  if (slaPercent >= 95) return { texto: "OK", classe: "text-success" };
  if (slaPercent >= 85) return { texto: "ATENCAO", classe: "text-amber-500" };
  return { texto: "CRITICO", classe: "text-rose-500" };
}

export function MapIntelligenceOverlay() {
  const { data, isLoading, isError } = useMapIntelligence();

  const sla = data?.slaPercent ?? null;
  const slaTexto = sla === null ? "--" : sla.toFixed(1);
  const status = rotuloSla(sla);
  const tendencia = data?.tendencia ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-4 right-4 z-10 w-72 space-y-3 pointer-events-none"
    >
      <Card className="bg-black/90 backdrop-blur-3xl border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.8)] pointer-events-auto overflow-hidden rounded-[2rem]">
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 animate-pulse" />

        <CardHeader className="p-5 pb-2">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500 flex items-center justify-between">
            <span className="flex items-center gap-2 italic">
              <Brain className="w-4 h-4 animate-pulse" />
              Nexus_Core_AI
            </span>
            <Badge className="bg-cyan-500/10 text-cyan-400 text-[8px] font-black border-cyan-500/20">
              {rotuloConexao(isLoading, isError)}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-5 pt-0 space-y-5">
          {/* SLA real das entregas finalizadas nos ultimos 30 dias */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest block mb-1">
                  SLA_30d
                </span>
                <span className="text-2xl font-black text-white italic leading-none tracking-tighter">
                  {slaTexto}
                  <span className="text-cyan-500/50">%</span>
                </span>
              </div>
              <div className="h-8 w-24">
                {tendencia.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tendencia}>
                      <Line
                        type="monotone"
                        dataKey="val"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${sla ?? 0}%` }}
                className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
              />
            </div>
            <p className="text-[7px] font-bold text-white/20 uppercase tracking-widest">
              {data
                ? `${data.finalizadasComPrazo} entregas com prazo apurado`
                : "carregando base"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 p-4 rounded-[1.5rem] border border-white/5 hover:bg-white/10 transition-all group/stat">
              <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-2 flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-cyan-500" /> Latência
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white italic tracking-tight">
                  {data ? `${data.latenciaMs}ms` : "--"}
                </span>
                <div className="flex gap-0.5 items-end h-3">
                  <div className="w-0.5 h-full bg-cyan-500/50 rounded-full animate-pulse" />
                  <div className="w-0.5 h-2/3 bg-cyan-500/30 rounded-full" />
                  <div className="w-0.5 h-full bg-cyan-500 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
            <div className="bg-white/5 p-4 rounded-[1.5rem] border border-white/5 hover:bg-white/10 transition-all group/stat">
              <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Activity className="w-3 h-3 text-rose-500" /> Em rota
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white italic tracking-tight">
                  {data ? data.emRota : "--"}
                </span>
                {!!data?.emRota && (
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              {data?.rotaAtencao ? (
                <>
                  <div className="flex items-center gap-2 text-amber-500">
                    <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                    <span className="text-[8px] font-black uppercase tracking-widest">
                      Atraso na entrega {data.rotaAtencao.numero}
                    </span>
                  </div>
                  <span className="text-[8px] font-bold text-white/20 tracking-tighter">
                    {data.rotaAtencao.atrasoHoras}h
                  </span>
                </>
              ) : (
                <div className="flex items-center gap-2 text-success">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="text-[8px] font-black uppercase tracking-widest">
                    {data ? "Nenhuma rota em atraso" : "Apurando rotas"}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[7px] font-black text-white/20 uppercase tracking-widest">
                <span>Ocorrências abertas</span>
                <span
                  className={
                    data?.ocorrencias ? "text-amber-500" : "text-success"
                  }
                >
                  {data ? data.ocorrencias : "--"}
                </span>
              </div>
              <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  animate={{
                    x: ["-100%", "100%"],
                    backgroundColor: ["#22c55e", "#06b6d4", "#22c55e"],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="h-full w-1/3"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-cyan-500">
              <Zap className="w-3.5 h-3.5" />
              <span className="text-[8px] font-black uppercase tracking-widest">
                {data
                  ? `${data.atrasadas} entregas fora do prazo`
                  : "Lendo base"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-black/90 backdrop-blur-3xl border-white/10 shadow-2xl pointer-events-auto rounded-2xl overflow-hidden group/sla">
        <CardContent className="p-4 relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-success opacity-20 group-hover/sla:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center border border-success/20">
                <ShieldCheck className="w-5 h-5 text-success animate-pulse" />
              </div>
              <div>
                <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-0.5">
                  SLA_Integrity
                </p>
                <p
                  className={`text-sm font-black italic tracking-tight ${status.classe}`}
                >
                  {status.texto}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className={`bg-success/5 border-success/20 text-[9px] font-black italic tracking-widest px-3 ${status.classe}`}
            >
              {sla === null ? "--" : `${slaTexto}%`}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
