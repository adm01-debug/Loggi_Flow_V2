import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  aggregateChannelHealth,
  type ChannelHealthReport,
  type ChannelName,
  type ChannelRecord,
} from "../../../supabase/functions/accuracy-meta-monitor/channelHealth";

interface Meta {
  source?: string;
  channels?: Partial<Record<ChannelName, string>>;
}

/**
 * Busca as últimas notificações do accuracy-meta-monitor do usuário
 * e agrega estatísticas por canal externo (email/whatsapp).
 */
export function useChannelHealth(limit = 200) {
  return useQuery({
    queryKey: ["accuracy-channel-health", limit],
    queryFn: async (): Promise<ChannelHealthReport> => {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) return aggregateChannelHealth([]);

      const { data, error } = await supabase
        .from("notifications")
        .select("id, created_at, metadata")
        .eq("user_id", uid)
        .contains("metadata", { source: "accuracy-meta-monitor" })
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;

      const records: ChannelRecord[] = (data ?? [])
        .map((n) => {
          const m = (n.metadata as Meta | null) ?? {};
          return {
            id: n.id,
            created_at: n.created_at,
            channels: m.channels ?? {},
          };
        })
        .filter((r) => Object.keys(r.channels).length > 0);

      return aggregateChannelHealth(records, { sampleLimit: 15 });
    },
    staleTime: 60_000,
  });
}
