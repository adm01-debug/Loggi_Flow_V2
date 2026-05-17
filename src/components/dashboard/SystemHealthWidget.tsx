import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Activity, ShieldCheck, Zap, AlertTriangle, Cpu, Radio, Fingerprint, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function SystemHealthWidget() {
  const { data: healthData, isLoading } = useQuery({
    queryKey: ["system-health"],
    queryFn: async () => {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      // 1. Check for errors in telemetry
      const { count: errorCount } = await supabase
        .from("telemetry_logs")
        .select("*", { count: 'exact', head: true })
        .gte("created_at", last24h)
        .in("severity", ["error", "critical"]);

      // 2. Check query performance
      const { data: performanceData } = await supabase
        .from("query_telemetry")
        .select("duration_ms, severity")
        .gte("created_at", last24h);

      const avgDuration = performanceData && performanceData.length > 0
        ? performanceData.reduce((sum, d) => sum + d.duration_ms, 0) / performanceData.length
        : 150;

      const slowQueries = performanceData?.filter(d => d.severity === 'very_slow').length || 0;

      // 3. Simple health calculation
      let score = 100;
      score -= (errorCount || 0) * 5; 
      score -= (slowQueries) * 2;    
      if (avgDuration > 500) score -= 10;
      
      let status = 'optimal';
      if (score <= 70) {
        status = 'concerning';
      } else if (score <= 90) {
        status = 'good';
      }

      return {
        score: Math.max(0, score),
        errors: errorCount || 0,
        avgLatency: Math.round(avgDuration),
        status: status as 'optimal' | 'good' | 'concerning'
      };
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <Card className="h-[400px] rounded-[2.5rem] bg-black/40 border-white/10 animate-pulse overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-white/5 to-transparent" />
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'text-success';
      case 'good': return 'text-primary';
      case 'concerning': return 'text-warning';
      default: return 'text-destructive';
    }
  };

  const getStatusGlow = (status: string) => {
    switch (status) {
      case 'optimal': return 'bg-success shadow-[0_0_30px_rgba(34,197,94,0.4)]';
      case 'good': return 'bg-primary shadow-[0_0_30px_rgba(234,56,76,0.4)]';
      case 'concerning': return 'bg-warning shadow-[0_0_30px_rgba(234,179,8,0.4)]';
      default: return 'bg-destructive shadow-[0_0_30px_rgba(239,68,68,0.4)]';
    }
  };

  return (
    <Card className="relative overflow-hidden group border-none bg-transparent p-[2px] rounded-[2.5rem] shadow-2xl h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-white/5 to-primary/10 rounded-[2.5rem]" />
      <div className="relative h-full bg-black/95 backdrop-blur-[50px] rounded-[2.4rem] p-8 border border-white/5 flex flex-col">
        
        {/* Scanning Line Effect */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-scan" />

        <CardHeader className="p-0 mb-10 relative z-10">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <Cpu className="h-5 w-5 text-primary animate-pulse" />
              </div>
              <div className="flex flex-col">
                 <span className="text-white font-black italic tracking-tighter text-xl uppercase italic leading-none">Nexus Health</span>
                 <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] mt-1 flex items-center gap-1.5"><Radio className="w-2 h-2 text-success animate-ping" /> Real-time Core Diagnostic</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
               <div className={cn("px-4 py-1.5 rounded-full border-2 text-[10px] font-black uppercase tracking-widest bg-black shadow-inner", getStatusColor(healthData?.status || ''))}>
                 {healthData?.status}
               </div>
               <span className="text-[8px] font-black text-white/20 uppercase mt-2 tracking-widest">Protocol: 0.1.Elite</span>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0 relative z-10 flex-1 flex flex-col">
          <div className="flex flex-col items-center justify-center space-y-12 flex-1">
            <div className="relative flex items-center justify-center group/score">
              {/* Complex Rotating Rings */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 w-48 h-48 border-2 border-dashed border-white/5 rounded-full" 
              />
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 w-[200px] h-[200px] border border-white/10 rounded-full" 
              />
              
              {/* Radial Glow */}
              <div className={cn(
                "absolute inset-0 rounded-full blur-[60px] opacity-20 transition-all duration-1000",
                healthData?.status === 'optimal' ? 'bg-success' : 
                healthData?.status === 'good' ? 'bg-primary' : 'bg-warning'
              )} />
              
              <div className="relative p-2 rounded-full border-4 border-white/5 shadow-2xl">
                <svg className="w-40 h-40 transform -rotate-90 relative z-10">
                  <circle
                    cx="80"
                    cy="80"
                    r="72"
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="transparent"
                    className="text-white/5"
                  />
                  <motion.circle
                    initial={{ strokeDashoffset: 452.4 }}
                    animate={{ strokeDashoffset: 452.4 - (452.4 * (healthData?.score || 0)) / 100 }}
                    transition={{ duration: 2, ease: "circOut" }}
                    cx="80"
                    cy="80"
                    r="72"
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={452.4}
                    strokeLinecap="round"
                    className={cn(
                      "transition-all duration-1000 filter drop-shadow-[0_0_12px_currentColor]",
                      getStatusColor(healthData?.status || '')
                    )}
                  />
                </svg>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                  <div className="relative flex items-baseline">
                    <span className="text-6xl font-black italic text-white tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] tabular-nums">
                      {healthData?.score}
                    </span>
                    <span className="text-xl font-black text-primary italic ml-1">%</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2 px-4 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md">
                    <div className={cn("w-2 h-2 rounded-full", getStatusGlow(healthData?.status || ''))} />
                    <span className="text-[10px] uppercase font-black tracking-[0.2em] text-white/60">Operação Ativa</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 w-full">
              <div className="group/metric relative p-6 rounded-3xl border-2 transition-all duration-500 overflow-hidden bg-gradient-to-br from-white/5 to-transparent border-white/5 hover:border-success/40">
                <div className="absolute inset-0 bg-success/5 opacity-0 group-hover/metric:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-black border border-success/40 flex items-center justify-center shadow-lg group-hover/metric:scale-110 transition-transform">
                    <Database className="h-6 w-6 text-success" />
                  </div>
                  <Badge variant="outline" className="text-[8px] font-black text-success border-success/40 bg-success/5">STABLE_CORE</Badge>
                </div>
                <div className="relative z-10">
                  <span className="text-[10px] text-white/40 uppercase font-black tracking-[0.3em] block mb-1">Telemetry Erros</span>
                  <div className="flex items-baseline gap-2">
                     <span className="text-3xl font-black text-white italic tabular-nums leading-none">{healthData?.errors}</span>
                     <span className="text-[9px] font-bold text-white/20 uppercase">Units</span>
                  </div>
                </div>
              </div>

              <div className="group/metric relative p-6 rounded-3xl border-2 transition-all duration-500 overflow-hidden bg-gradient-to-br from-white/5 to-transparent border-white/5 hover:border-primary/40">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover/metric:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-black border border-primary/40 flex items-center justify-center shadow-lg group-hover/metric:scale-110 transition-transform">
                    <Activity className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant="outline" className="text-[8px] font-black text-primary border-primary/40 bg-primary/5">ULTRA_LOW</Badge>
                </div>
                <div className="relative z-10">
                  <span className="text-[10px] text-white/40 uppercase font-black tracking-[0.3em] block mb-1">Méd Latência</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white italic tabular-nums leading-none">{healthData?.avgLatency}</span>
                    <span className="text-[9px] font-bold text-white/20 uppercase italic">ms</span>
                  </div>
                </div>
              </div>
            </div>

            {(healthData?.errors ?? 0) > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] bg-destructive/10 text-destructive p-5 rounded-[2rem] border-2 border-destructive/30 animate-pulse relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(239,68,68,0.1)_25%,transparent_25%,transparent_50%,rgba(239,68,68,0.1)_50%,rgba(239,68,68,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px]" />
                <AlertTriangle className="h-6 w-6 shrink-0 filter drop-shadow-[0_0_10px_currentColor]" />
                <span className="relative z-10 italic">Ativar Protocolo de Contenção: Anomalias Detectadas no Core Operacional</span>
              </motion.div>
            )}
          </div>
        </CardContent>

        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between opacity-30 group-hover:opacity-100 transition-opacity duration-700">
           <div className="flex items-center gap-3">
              <Fingerprint className="w-4 h-4 text-white" />
              <span className="text-[9px] font-black text-white uppercase tracking-[0.4em]">Audit_Sec_Verify</span>
           </div>
           <div className="flex gap-1">
              {[1,2,3,4,5].map(i => <div key={i} className="w-1 h-3 bg-primary/40 rounded-full" />)}
           </div>
        </div>
      </div>
    </Card>
  );
}
