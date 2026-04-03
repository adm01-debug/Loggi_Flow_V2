import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface SecurityEvent {
  id: string;
  user_id: string | null;
  event_type: string;
  severity: string;
  description: string;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface SecurityEventFilters {
  severity?: string;
  eventType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export function useSecurityEvents(filters?: SecurityEventFilters) {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ["security-events", filters],
    queryFn: async () => {
      let query = supabase
        .from("security_events")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.severity) {
        query = query.eq("severity", filters.severity);
      }

      if (filters?.eventType) {
        query = query.eq("event_type", filters.eventType);
      }

      if (filters?.startDate) {
        query = query.gte("created_at", filters.startDate.toISOString());
      }

      if (filters?.endDate) {
        query = query.lte("created_at", filters.endDate.toISOString());
      }

      query = query.limit(filters?.limit || 100);

      const { data, error } = await query;

      if (error) throw error;
      return data as SecurityEvent[];
    },
    enabled: isAdmin,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel("security-events-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "security_events",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["security-events"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, queryClient]);

  // Log a new security event via edge function
  const logEventMutation = useMutation({
    mutationFn: async (event: {
      event_type: string;
      description: string;
      severity?: string;
      metadata?: Record<string, unknown>;
    }) => {
      // Try edge function first for enriched logging (IP detection, etc.)
      const { data, error } = await supabase.functions.invoke('log-security-event', {
        body: {
          event_type: event.event_type,
          description: event.description,
          severity: event.severity || "info",
          metadata: event.metadata || {},
          user_agent: navigator.userAgent,
        },
      });

      if (error) {
        // Fallback to direct DB insert
        const { error: dbError } = await supabase
          .from("security_events")
          .insert([{
            event_type: event.event_type,
            description: event.description,
            severity: event.severity || "info",
            metadata: (event.metadata || {}) as unknown as Record<string, never>,
            ip_address: null,
            user_agent: navigator.userAgent,
          }]);
        if (dbError) throw dbError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["security-events"] });
    },
  });

  // Check rate limit status
  const checkRateLimit = useMutation({
    mutationFn: async (params: { action: string; identifier?: string }) => {
      const { data, error } = await supabase.functions.invoke('check-rate-limit', {
        body: params,
      });
      if (error) throw error;
      return data as { allowed: boolean; remaining: number; resetAt: string };
    },
  });

  // Get event statistics
  const { data: stats } = useQuery({
    queryKey: ["security-events-stats"],
    queryFn: async () => {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const { data: last24hData } = await supabase
        .from("security_events")
        .select("severity", { count: "exact" })
        .gte("created_at", last24h.toISOString());

      const { data: criticalData } = await supabase
        .from("security_events")
        .select("*", { count: "exact" })
        .eq("severity", "critical")
        .gte("created_at", last7d.toISOString());

      const { data: warningData } = await supabase
        .from("security_events")
        .select("*", { count: "exact" })
        .eq("severity", "warning")
        .gte("created_at", last7d.toISOString());

      return {
        last24hCount: last24hData?.length || 0,
        criticalLast7d: criticalData?.length || 0,
        warningsLast7d: warningData?.length || 0,
      };
    },
    enabled: isAdmin,
  });

  // Get unique event types for filtering
  const eventTypes = [...new Set(events.map((e) => e.event_type))];
  const severities = ["info", "warning", "critical"];

  return {
    events,
    isLoading,
    stats,
    eventTypes,
    severities,
    refetch,
    logEvent: logEventMutation.mutate,
    isLogging: logEventMutation.isPending,
    checkRateLimit: checkRateLimit.mutate,
    isCheckingRateLimit: checkRateLimit.isPending,
    rateLimitResult: checkRateLimit.data,
  };
}
