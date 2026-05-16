import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Activity, ShieldCheck, Zap, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
      score -= (errorCount || 0) * 5; // -5 points per error
      score -= (slowQueries) * 2;    // -2 points per slow query
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
      <Card className="animate-pulse h-[200px]">
        <CardContent className="h-full bg-muted/20" />
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'concerning': return 'text-amber-500';
      default: return 'text-red-500';
    }
  };

  return (
    <Card className="relative overflow-hidden group border-none bg-transparent p-[1px] rounded-[2rem] shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-white/5 to-white/10 rounded-[2rem]" />
      <div className="relative h-full bg-black/90 backdrop-blur-3xl rounded-[1.9rem] p-6">
        {/* Decorative Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
        
        <CardHeader className="p-0 mb-8 relative z-10">
          <CardTitle className="text-xs font-black flex items-center justify-between uppercase tracking-[0.3em] italic">
            <div className="flex items-center gap-2 bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
              <Activity className="h-4 w-4 text-primary animate-pulse" />
              NEXUS CORE HEALTH
            </div>
            <div className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-[9px] text-primary not-italic">
              LIVE MONITOR
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0 relative z-10">
          <div className="flex flex-col items-center justify-center space-y-8">
            <div className="relative flex items-center justify-center group/score">
              {/* Radial Glow */}
              <div className={cn(
                "absolute inset-0 rounded-full blur-[40px] opacity-30 transition-all duration-1000",
                healthData?.status === 'optimal' ? 'bg-green-500' : 
                healthData?.status === 'good' ? 'bg-blue-500' : 'bg-amber-500'
              )} />
              
              <svg className="w-32 h-32 transform -rotate-90 relative z-10 drop-shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-white/5"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="58"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={364.4}
                  strokeDashoffset={364.4 - (364.4 * (healthData?.score || 0)) / 100}
                  strokeLinecap="round"
                  className={cn(
                    "transition-all duration-1000",
                    getStatusColor(healthData?.status || '')
                  )}
                />
                {/* Internal Decorative Ring */}
                <circle
                  cx="64"
                  cy="64"
                  r="48"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="1"
                  fill="transparent"
                  strokeDasharray="4 4"
                />
              </svg>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <div className="relative">
                  <span className="text-4xl font-black italic text-white tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                    {healthData?.score}
                  </span>
                  <span className="absolute -right-4 top-0 text-[10px] font-black text-primary">%</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", 
                    healthData?.status === 'optimal' ? 'bg-green-500' : 
                    healthData?.status === 'good' ? 'bg-blue-500' : 'bg-amber-500'
                  )} />
                  <span className="text-[10px] uppercase font-black tracking-[0.2em] text-white/40">OPERATIONAL</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="group/metric flex flex-col gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20 group-hover/metric:scale-110 transition-transform">
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="text-[10px] font-black text-green-500 bg-green-500/10 px-1.5 rounded uppercase">SAFE</div>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 uppercase font-black tracking-widest block mb-0.5">Telemetry Errors</span>
                  <span className="text-xl font-black text-white italic tabular-nums">{healthData?.errors}</span>
                </div>
              </div>

              <div className="group/metric flex flex-col gap-2 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover/metric:scale-110 transition-transform">
                    <Zap className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="text-[10px] font-black text-blue-500 bg-blue-500/10 px-1.5 rounded uppercase">FAST</div>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 uppercase font-black tracking-widest block mb-0.5">Avg Latency</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-white italic tabular-nums">{healthData?.avgLatency}</span>
                    <span className="text-[10px] font-black text-white/40">ms</span>
                  </div>
                </div>
              </div>
            </div>

            {(healthData?.errors ?? 0) > 0 && (
              <div className="w-full flex items-center gap-3 text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary p-4 rounded-2xl border border-primary/30 animate-pulse relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <span className="relative z-10">CRITICAL ANOMALIES DETECTED IN THE OPERATIONAL CORE</span>
              </div>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
