import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/auth/useAuth";
import { toast } from "sonner";
import { QUERY_STALE_TIME } from "@/lib/queryConfig";
import { Decimal } from "decimal.js";

export interface TabelaFrete {
  id: string;
  transportadora_id: string;
  regiao_destino: string;
  estado_destino: string;
  peso_min_kg: number;
  peso_max_kg: number;
  preco_por_kg: number;
  taxa_fixa: number;
  prazo_dias: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  transportadora?: {
    id: string;
    nome_fantasia: string;
    score_performance: number;
    homologada: boolean;
  };
}

export interface QuotationRequest {
  estado_destino: string;
  peso_kg: number;
}

export interface QuotationResult {
  transportadora_id: string;
  transportadora_nome: string;
  score_performance: number;
  valor_total: number;
  preco_por_kg: number;
  taxa_fixa: number;
  prazo_dias: number;
  regiao_destino: string;
  melhor_preco: boolean;
  melhor_prazo: boolean;
  melhor_custo_beneficio: boolean;
}

export const useFreightQuotation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch all freight tables
  const {
    data: tabelasFrete,
    isLoading: isLoadingTabelas,
    isError: isErrorTabelas,
  } = useQuery({
    queryKey: ["tabelas-frete"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tabelas_frete")
        .select(
          `
          *,
          transportadora:transportadoras(id, nome_fantasia, score_performance, homologada)
        `,
        )
        .eq("ativo", true)
        .order("estado_destino");

      if (error) throw error;
      return data as TabelaFrete[];
    },
    staleTime: QUERY_STALE_TIME.SEMI_STATIC,
    gcTime: 30 * 60 * 1000,
    enabled: !!user?.id,
  });

  // Fetch transportadoras for dropdown
  const { data: transportadoras } = useQuery({
    queryKey: ["transportadoras-cotacao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transportadoras")
        .select("id, nome_fantasia, score_performance, homologada")
        .eq("homologada", true)
        .order("nome_fantasia");

      if (error) throw error;
      return data;
    },
    staleTime: QUERY_STALE_TIME.STATIC,
    enabled: !!user?.id,
  });

  // Calculate quotations
  const calculateQuotations = async (
    request: QuotationRequest & { event_type?: string },
  ): Promise<QuotationResult[]> => {
    if (!tabelasFrete || tabelasFrete.length === 0) return [];

    // Fetch selection rules for specific event type if provided
    const { data: selectionRules } = await (
      supabase as unknown as {
        from: (t: string) => {
          select: (c: string) => {
            eq: (
              k: string,
              v: string,
            ) => {
              eq: (
                k: string,
                v: boolean,
              ) => {
                maybeSingle: () => Promise<{
                  data: {
                    price_weight?: string;
                    time_weight?: string;
                    max_sla_days?: number;
                  } | null;
                }>;
              };
            };
          };
        };
      }
    )
      .from("freight_selection_rules")
      .select("*")
      .eq("event_type", request.event_type || "Normal")
      .eq("is_active", true)
      .maybeSingle();

    const priceWeight = selectionRules?.price_weight
      ? parseFloat(selectionRules.price_weight) / 100
      : 0.6;
    const timeWeight = selectionRules?.time_weight
      ? parseFloat(selectionRules.time_weight) / 100
      : 0.4;
    const maxSla = selectionRules?.max_sla_days || 30;

    const matchingTables = tabelasFrete.filter(
      (t) =>
        t.estado_destino === request.estado_destino &&
        request.peso_kg >= t.peso_min_kg &&
        request.peso_kg < t.peso_max_kg &&
        t.transportadora?.homologada &&
        t.prazo_dias <= maxSla,
    );

    if (matchingTables.length === 0) return [];

    const quotations: QuotationResult[] = matchingTables.map((t) => {
      const precoPorKg = new Decimal(t.preco_por_kg);
      const pesoKg = new Decimal(request.peso_kg);
      const taxaFixa = new Decimal(t.taxa_fixa);
      const valorTotal = taxaFixa.plus(precoPorKg.times(pesoKg)).toNumber();

      return {
        transportadora_id: t.transportadora_id,
        transportadora_nome: t.transportadora?.nome_fantasia || "N/A",
        score_performance: t.transportadora?.score_performance || 0,
        valor_total: valorTotal,
        preco_por_kg: t.preco_por_kg,
        taxa_fixa: t.taxa_fixa,
        prazo_dias: t.prazo_dias,
        regiao_destino: t.regiao_destino,
        melhor_preco: false,
        melhor_prazo: false,
        melhor_custo_beneficio: false,
      };
    });

    // Mark best options
    if (quotations.length > 0) {
      const minPrice = Math.min(...quotations.map((q) => q.valor_total));
      quotations.forEach((q) => {
        if (q.valor_total === minPrice) q.melhor_preco = true;
      });

      const minPrazo = Math.min(...quotations.map((q) => q.prazo_dias));
      quotations.forEach((q) => {
        if (q.prazo_dias === minPrazo) q.melhor_prazo = true;
      });

      const maxScore = Math.max(
        ...quotations.map((q) => q.score_performance),
        1,
      );
      const maxPrice = Math.max(...quotations.map((q) => q.valor_total), 1);
      const maxTime = Math.max(...quotations.map((q) => q.prazo_dias), 1);

      let bestCompositeScore = -Infinity;
      let bestCompositeIndex = 0;

      quotations.forEach((q, index) => {
        // Normalize price (lower is better, so 1 - norm)
        const normalizedPrice = 1 - q.valor_total / maxPrice;
        // Normalize time (lower is better, so 1 - norm)
        const normalizedTime = 1 - q.prazo_dias / maxTime;
        // Performance score (higher is better)
        const normalizedScore = q.score_performance / maxScore;

        // Composite score using weights from DB or defaults
        // Logic: (Price * Wp) + (Time * Wt) + (Performance * 0.1)
        const compositeScore =
          normalizedPrice * priceWeight +
          normalizedTime * timeWeight +
          normalizedScore * 0.1;

        if (compositeScore > bestCompositeScore) {
          bestCompositeScore = compositeScore;
          bestCompositeIndex = index;
        }
      });

      quotations[bestCompositeIndex].melhor_custo_beneficio = true;
    }

    return quotations.sort((a, b) => a.valor_total - b.valor_total);
  };

  // Add freight table entry
  const addTabelaFrete = useMutation({
    mutationFn: async (
      data: Omit<
        TabelaFrete,
        "id" | "created_at" | "updated_at" | "transportadora"
      >,
    ) => {
      const { data: result, error } = await supabase
        .from("tabelas_frete")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tabelas-frete"] });
      toast.success("Tabela de frete adicionada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao adicionar tabela de frete: " + error.message);
    },
  });

  // Update freight table entry
  const updateTabelaFrete = useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Omit<Partial<TabelaFrete>, "transportadora"> & { id: string }) => {
      const { data: result, error } = await supabase
        .from("tabelas_frete")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tabelas-frete"] });
      toast.success("Tabela de frete atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar tabela de frete: " + error.message);
    },
  });

  // Delete freight table entry
  const deleteTabelaFrete = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("tabelas_frete")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tabelas-frete"] });
      toast.success("Tabela de frete removida com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao remover tabela de frete: " + error.message);
    },
  });

  // Get available states from existing tables
  const availableStates = Array.from(
    new Set(tabelasFrete?.map((t) => t.estado_destino) || []),
  ).sort();

  return {
    tabelasFrete,
    transportadoras,
    isLoadingTabelas,
    isErrorTabelas,
    availableStates,
    calculateQuotations,
    addTabelaFrete,
    updateTabelaFrete,
    deleteTabelaFrete,
  };
};
