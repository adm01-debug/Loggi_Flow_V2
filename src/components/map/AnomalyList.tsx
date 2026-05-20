import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Info, ArrowRight, ShieldAlert, X, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface Anomaly {
  id: string;
  level: 'info' | 'crit';
  cause: string;
  action: string;
  unit: string;
  time: string;
  telemetry?: { bpm: number }[];
}

interface AnomalyListProps {
  anomalies: Anomaly[];
  onClose: () => void;
  onAction: (id: string) => void;
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

export function AnomalyList({ anomalies, onClose, onAction }: AnomalyListProps) {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed top-0 right-0 h-full w-full md:w-[450px] bg-black/95 backdrop-blur-3xl border-l border-white/10 z-[100] shadow-[-20px_0_50px_rgba(0,0,0,0.5)] flex flex-col"
    >
      <div className="p-8 border-b border-white/5 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none mb-2">Nexus_Anomalies</h2>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Centro de Diagnóstico em Tempo Real</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="text-white/40 hover:text-white hover:bg-white/5 rounded-2xl">
          <X className="w-6 h-6" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="space-y-6">
          {anomalies.map((anomaly, idx) => (
            <motion.div
              key={anomaly.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-6 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all group relative overflow-hidden"
            >
              <div className={cn(
                "absolute top-0 left-0 w-1.5 h-full",
                anomaly.level === 'crit' ? "bg-red-500" : "bg-blue-500"
              )} />
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center border",
                    anomaly.level === 'crit' ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-blue-500/10 border-blue-500/20 text-blue-500"
                  )}>
                    {anomaly.level === 'crit' ? <ShieldAlert className="w-5 h-5 animate-pulse" /> : <Info className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{anomaly.time}</p>
                    <h3 className="text-sm font-black text-white uppercase italic tracking-tight">UNIT_{anomaly.unit} — DETECTED</h3>
                  </div>
                </div>
                <Badge variant="outline" className={cn(
                  "text-[8px] font-black uppercase tracking-widest",
                  anomaly.level === 'crit' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                )}>
                  {anomaly.level === 'crit' ? 'CRITICAL' : 'INFO'}
                </Badge>
              </div>

              {/* Bio_Sync Telemetry Sparkline */}
              <div className="h-16 w-full mb-6 bg-black/40 rounded-2xl p-2 border border-white/5 relative group/chart">
                <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                  <Activity className="w-3 h-3 text-rose-500" />
                  <span className="text-[7px] font-black text-white/30 uppercase tracking-widest">Bio_Sync: Heart_Rate_Telemetry</span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={anomaly.telemetry || [
                    { bpm: 72 }, { bpm: 75 }, { bpm: 82 }, { bpm: 95 }, { bpm: 108 }, { bpm: 115 }, { bpm: 110 }
                  ]}>
                    <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                    <Line 
                      type="monotone" 
                      dataKey="bpm" 
                      stroke={anomaly.level === 'crit' ? "#f43f5e" : "#06b6d4"} 
                      strokeWidth={2} 
                      dot={false}
                      isAnimationActive={true}
                      animationDuration={2000}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4">
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                  <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Causa Provável</p>
                  <p className="text-xs font-bold text-white/80 uppercase">{anomaly.cause}</p>
                </div>
                <div className="bg-cyan-500/5 p-4 rounded-2xl border border-cyan-500/10">
                  <p className="text-[8px] font-black text-cyan-500/50 uppercase tracking-widest mb-1">Ação Sugerida</p>
                  <p className="text-xs font-bold text-cyan-400 uppercase">{anomaly.action}</p>
                </div>
                <Button 
                  className="w-full bg-white/5 hover:bg-cyan-500 hover:text-black text-white font-black uppercase tracking-widest h-11 rounded-2xl border border-white/10 hover:border-cyan-500 transition-all group/btn"
                  onClick={() => onAction(anomaly.id)}
                >
                  Executar Protocolo
                  <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.div>
          ))}
          
          {anomalies.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4 border border-success/20">
                <ShieldAlert className="w-8 h-8 text-success" />
              </div>
              <p className="text-sm font-black text-white italic uppercase tracking-widest">Sistemas_Limpos</p>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-2">Nenhuma anomalia detectada no grid.</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
}
