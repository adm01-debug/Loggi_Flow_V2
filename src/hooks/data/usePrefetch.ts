import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { QUERY_STALE_TIME } from "@/lib/queryConfig";

/**
 * Route-to-query mapping for sidebar prefetch.
 * Maps route paths to their primary query keys and fetch functions.
 */
const ROUTE_PREFETCH_MAP: Record<string, {
  queryKey: string[];
  queryFn: () => Promise<unknown>;
  staleTime: number;
}> = {
  "/": {
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      const { data } = await supabase.from("entregas").select("status", { count: "exact" });
      return data;
    },
    staleTime: QUERY_STALE_TIME.DASHBOARD,
  },
  "/envios": {
    queryKey: ["entregas"],
    queryFn: async () => {
      const { data } = await supabase.from("entregas")
        .select("id, numero_entrega, status, endereco_entrega, created_at")
        .order("created_at", { ascending: false }).limit(50);
      return data;
    },
    staleTime: QUERY_STALE_TIME.DYNAMIC,
  },
  "/coletas": {
    queryKey: ["coletas"],
    queryFn: async () => {
      const { data } = await supabase.from("coletas")
        .select("id, numero_coleta, status, endereco_coleta, created_at")
        .order("created_at", { ascending: false }).limit(50);
      return data;
    },
    staleTime: QUERY_STALE_TIME.DYNAMIC,
  },
  "/transportadoras": {
    queryKey: ["transportadoras"],
    queryFn: async () => {
      const { data } = await supabase.from("transportadoras")
        .select("id, nome_fantasia, cnpj, homologada").order("nome_fantasia");
      return data;
    },
    staleTime: QUERY_STALE_TIME.STATIC,
  },
  "/clientes": {
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data } = await supabase.from("clientes")
        .select("id, razao_social, cnpj, cidade").order("razao_social");
      return data;
    },
    staleTime: QUERY_STALE_TIME.STATIC,
  },
  "/analytics": {
    queryKey: ["analytics-summary"],
    queryFn: async () => {
      const { data } = await supabase.from("entregas").select("status, created_at").limit(200);
      return data;
    },
    staleTime: QUERY_STALE_TIME.DASHBOARD,
  },
};

/**
 * Returns a hover handler that prefetches data for the given route.
 */
export function usePrefetch() {
  const queryClient = useQueryClient();

  const prefetch = useCallback(
    (route: string) => {
      const config = ROUTE_PREFETCH_MAP[route];
      if (!config) return;

      // Only prefetch if data is stale
      const existing = queryClient.getQueryData(config.queryKey);
      if (existing) return;

      queryClient.prefetchQuery({
        queryKey: config.queryKey,
        queryFn: config.queryFn,
        staleTime: config.staleTime,
      });
    },
    [queryClient]
  );

  return { prefetch };
}
