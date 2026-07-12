import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RlsAuditRow {
  schema_name: string;
  table_name: string;
  rls_enabled: boolean;
  policy_count: number;
  has_select_policy: boolean;
  has_insert_policy: boolean;
  has_update_policy: boolean;
  has_delete_policy: boolean;
  severity: "critical" | "warning" | "ok";
  recommendation: string;
}

export function useRlsAudit() {
  return useQuery({
    queryKey: ["db-observability", "rls-audit"],
    queryFn: async (): Promise<RlsAuditRow[]> => {
      const { data, error } = await (
        supabase.rpc as unknown as (
          fn: string,
        ) => Promise<{ data: unknown; error: unknown }>
      )("get_rls_audit");
      if (error) throw error as Error;
      return (data ?? []) as RlsAuditRow[];
    },
    staleTime: 10 * 60_000,
  });
}
