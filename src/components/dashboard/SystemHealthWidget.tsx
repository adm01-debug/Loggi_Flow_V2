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

      // 3. Simple health calculation (placeholder logic)
      let score = 100;
      score -= (errorCount || 0) * 5; // -5 points per error
      score -= (slowQueries) * 2;    // -2 points per slow query
      if (avgDuration > 500) score -= 10;
      
      return {
        score: Math.max(0, score),
        errors: errorCount || 0,
        avgLatency: Math.round(avgDuration),
        status: score > 90 ? 'optimal' : score > 70 ? 'good' : 'concerning'
      };
    },
    refetchInterval: 60000, // Refresh every minute
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
    <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-background to-muted/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Saúde do Sistema
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center space-y-4 py-2">
          <div className="relative flex items-center justify-center">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-muted/20"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * (healthData?.score || 0)) / 100}
                strokeLinecap="round"
                className={cn("transition-all duration-1000", getStatusColor(healthData?.status || ''))}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{healthData?.score}</span>
              <span className="text-[10px] uppercase font-semibold text-muted-foreground">Score</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase">Erros 24h</span>
                <span className="text-sm font-bold">{healthData?.errors}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border">
              <Zap className="h-4 w-4 text-blue-500" />
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase">Latência</span>
                <span className="text-sm font-bold">{healthData?.avgLatency}ms</span>
              </div>
            </div>
          </div>

          {(healthData?.errors ?? 0) > 0 && (
            <div className="w-full flex items-center gap-2 text-[10px] bg-amber-50 text-amber-700 p-2 rounded border border-amber-200">
              <AlertTriangle className="h-3 w-3" />
              <span>Foram detectados erros nas últimas 24h. Verifique o painel de telemetria.</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
