import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface UserSession {
  id: string;
  user_id: string;
  device_name: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  ip_address: string | null;
  location: string | null;
  is_current: boolean;
  last_active_at: string;
  created_at: string;
  expires_at: string | null;
}

function parseUserAgent(userAgent: string) {
  // Browser detection
  let browser = "Unknown";
  if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) browser = "Chrome";
  else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) browser = "Safari";
  else if (userAgent.includes("Edg")) browser = "Edge";
  else if (userAgent.includes("Opera") || userAgent.includes("OPR")) browser = "Opera";

  // OS detection
  let os = "Unknown";
  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac OS")) os = "macOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iOS") || userAgent.includes("iPhone")) os = "iOS";

  // Device type
  let deviceType = "Desktop";
  if (userAgent.includes("Mobile") || userAgent.includes("Android")) deviceType = "Mobile";
  else if (userAgent.includes("Tablet") || userAgent.includes("iPad")) deviceType = "Tablet";

  return { browser, os, deviceType };
}

export function useDeviceSessions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user sessions
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["user-sessions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("last_active_at", { ascending: false });

      if (error) throw error;
      return data as UserSession[];
    },
    enabled: !!user?.id,
  });

  // Register current session
  const registerSessionMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const userAgent = navigator.userAgent;
      const { browser, os, deviceType } = parseUserAgent(userAgent);

      // Get IP from external service
      let ipAddress = null;
      try {
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        ipAddress = data.ip;
      } catch {
        // Silent fail on IP fetch - non-critical
      }

      // Check if session already exists for this device
      const { data: existingSession } = await supabase
        .from("user_sessions")
        .select("id")
        .eq("user_id", user.id)
        .eq("browser", browser)
        .eq("os", os)
        .eq("ip_address", ipAddress)
        .single();

      if (existingSession) {
        // Update existing session
        const { error } = await supabase
          .from("user_sessions")
          .update({
            last_active_at: new Date().toISOString(),
            is_current: true,
          })
          .eq("id", existingSession.id);

        if (error) throw error;
      } else {
        // Create new session
        const { error } = await supabase.from("user_sessions").insert({
          user_id: user.id,
          device_name: `${browser} on ${os}`,
          device_type: deviceType,
          browser,
          os,
          ip_address: ipAddress,
          is_current: true,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-sessions"] });
    },
  });

  // Revoke a session
  const revokeSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from("user_sessions")
        .delete()
        .eq("id", sessionId)
        .eq("user_id", user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-sessions"] });
      toast.success("Sessão encerrada com sucesso");
    },
    onError: () => {
      toast.error("Erro ao encerrar sessão");
    },
  });

  // Revoke all other sessions
  const revokeAllOtherSessionsMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("user_sessions")
        .delete()
        .eq("user_id", user.id)
        .eq("is_current", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-sessions"] });
      toast.success("Todas as outras sessões foram encerradas");
    },
    onError: () => {
      toast.error("Erro ao encerrar sessões");
    },
  });

  const currentSession = sessions.find((s) => s.is_current);
  const otherSessions = sessions.filter((s) => !s.is_current);

  return {
    sessions,
    currentSession,
    otherSessions,
    isLoading,
    registerSession: registerSessionMutation.mutate,
    revokeSession: revokeSessionMutation.mutate,
    revokeAllOtherSessions: revokeAllOtherSessionsMutation.mutate,
    isRevoking: revokeSessionMutation.isPending,
    isRevokingAll: revokeAllOtherSessionsMutation.isPending,
  };
}
