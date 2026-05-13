import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFeatureFlag(key: string) {
  const { data, isLoading } = useQuery({
    queryKey: ["feature-flags", key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_flags")
        .select("is_enabled")
        .eq("key", key)
        .maybeSingle();

      if (error) throw error;
      return data?.is_enabled ?? false;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return { isEnabled: !!data, isLoading };
}

export function useFeatureFlags() {
  const { data, isLoading } = useQuery({
    queryKey: ["feature-flags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_flags")
        .select("*");

      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60 * 5,
  });

  return { flags: data ?? [], isLoading };
}
