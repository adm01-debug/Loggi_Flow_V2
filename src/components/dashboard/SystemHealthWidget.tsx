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
    <Card className="relative overflow-hidden group border-none bg-transparent p-[1px] rounded-[1.5rem] shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-white/5 to-white/10 rounded-[1.5rem]" />
      <div className="relative h-full bg-black/90 backdrop-blur-3xl rounded-[1.4rem] p-5">
        <CardHeader className="p-0 mb-6">
          <CardTitle className="text-sm font-black flex items-center gap-2 uppercase tracking-[0.2em] italic bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
            <Activity className="h-4 w-4 text-primary animate-pulse" />
            NEXUS CORE HEALTH
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative flex items-center justify-center group/score">
              {/* Pulse effect */}
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
              
              <svg className="w-28 h-28 transform -rotate-90 relative z-10">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  className="text-white/5"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={301.6}
                  strokeDashoffset={301.6 - (301.6 * (healthData?.score || 0)) / 100}
                  strokeLinecap="round"
                  className={cn("transition-all duration-1000 drop-shadow-[0_0_8px_rgba(234,56,76,0.5)]", getStatusColor(healthData?.status || ''))}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <span className="text-3xl font-black italic text-white drop-shadow-lg">{healthData?.score}</span>
                <span className="text-[9px] uppercase font-black tracking-widest text-primary">SCORE</span>
              </div>
            </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-primary/30 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20">
                <ShieldCheck className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-white/50 uppercase font-black tracking-tighter">Erros 24h</span>
                <span className="text-sm font-black text-white italic">{healthData?.errors}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-primary/30 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <Zap className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-white/50 uppercase font-black tracking-tighter">Latência</span>
                <span className="text-sm font-black text-white italic">{healthData?.avgLatency}ms</span>
              </div>
            </div>
          </div>

          {(healthData?.errors ?? 0) > 0 && (
            <div className="w-full flex items-center gap-3 text-[9px] font-black uppercase tracking-tighter bg-primary/10 text-primary p-3 rounded-xl border border-primary/20 animate-pulse">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Anomalias detectadas no núcleo operacional.</span>
            </div>
          )}
        </div>
      </CardContent>
    </div>
  </Card>
  );
}
