import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ExtensionAudit {
  extension_name: string;
  installed_version: string;
  default_version: string | null;
  schema_name: string;
  is_relocatable: boolean;
  update_available: boolean;
  severity: "warning" | "ok";
  recommendation: string;
}

export function useExtensionsAudit() {
  return useQuery({
    queryKey: ["db-observability", "extensions-audit"],
    queryFn: async (): Promise<ExtensionAudit[]> => {
      const { data, error } = await (
        supabase.rpc as unknown as (
          fn: string,
        ) => Promise<{ data: unknown; error: unknown }>
      )("get_extensions_audit");
      if (error) throw error as Error;
      return (data ?? []) as ExtensionAudit[];
    },
    staleTime: 30 * 60_000,
  });
}
