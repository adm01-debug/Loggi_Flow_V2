import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/auth/useAuth";
import { toast } from "sonner";

interface RateLimitLog {
  id: string;
  ip_address: string;
  endpoint: string;
  user_id: string | null;
  request_count: number;
  blocked: boolean;
  created_at: string;
  window_start: string;
}

interface RateLimitStats {
  totalRequests: number;
  blockedRequests: number;
  uniqueIPs: number;
  topEndpoints: { endpoint: string; count: number }[];
  topBlockedIPs: { ip: string; count: number }[];
}

export function useRateLimitLogs() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Fetch rate limit logs
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["rate-limit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rate_limit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      return data as RateLimitLog[];
    },
    enabled: isAdmin,
    refetchInterval: 15000, // Poll every 15s (table removed from Realtime publication for security)
  });

  // Calculate statistics
  const stats: RateLimitStats = {
    totalRequests: logs.length,
    blockedRequests: logs.filter((l) => l.blocked).length,
    uniqueIPs: new Set(logs.map((l) => l.ip_address)).size,
    topEndpoints: Object.entries(
      logs.reduce((acc, log) => {
        acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    )
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    topBlockedIPs: Object.entries(
      logs
        .filter((l) => l.blocked)
        .reduce((acc, log) => {
          acc[log.ip_address] = (acc[log.ip_address] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
    )
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  };

  // Clear old logs
  const clearOldLogsMutation = useMutation({
    mutationFn: async (olderThanDays: number = 7) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const { error } = await supabase
        .from("rate_limit_logs")
        .delete()
        .lt("created_at", cutoffDate.toISOString());

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rate-limit-logs"] });
      toast.success("Logs antigos removidos com sucesso");
    },
    onError: () => {
      toast.error("Erro ao limpar logs");
    },
  });

  // Block IP based on rate limiting
  const blockIPMutation = useMutation({
    mutationFn: async (ipAddress: string) => {
      const { error } = await supabase.from("ip_access_rules").insert({
        ip_pattern: ipAddress,
        rule_type: "blacklist",
        description: "Bloqueado automaticamente por rate limiting",
        is_active: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ip-access-rules"] });
      toast.success("IP adicionado à blacklist");
    },
    onError: () => {
      toast.error("Erro ao bloquear IP");
    },
  });

  return {
    logs,
    isLoading,
    stats,
    clearOldLogs: clearOldLogsMutation.mutate,
    isClearing: clearOldLogsMutation.isPending,
    blockIP: blockIPMutation.mutate,
    isBlocking: blockIPMutation.isPending,
  };
}
