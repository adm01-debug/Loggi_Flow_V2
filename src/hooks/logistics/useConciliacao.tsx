/* eslint-disable max-lines */
import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TablesUpdate } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/auth/useAuth";
import { toast } from "sonner";
import { parseImportRows, readSheetRows } from "@/lib/conciliacaoImport";

export interface Conciliacao {
  id: string;
  tipo: "faturas_entregas" | "custos_previstos_realizados" | "pagamentos_notas";
  nome: string;
  descricao: string | null;
  periodo_inicio: string | null;
  periodo_fim: string | null;
  status: "rascunho" | "em_andamento" | "concluida" | "arquivada";
  total_itens_importados: number;
  total_itens_conciliados: number;
  total_divergencias: number;
  valor_total_importado: number;
  valor_total_sistema: number;
  diferenca_total: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItemImportado {
  id: string;
  conciliacao_id: string;
  linha_arquivo: number | null;
  referencia_externa: string | null;
  descricao: string | null;
  data_documento: string | null;
  valor: number;
  transportadora_nome: string | null;
  dados_originais: Record<string, unknown> | null;
  status: "pendente" | "conciliado" | "divergencia" | "ignorado";
  item_sistema_id: string | null;
  diferenca_valor: number | null;
  observacoes: string | null;
  conciliado_em: string | null;
  conciliado_por: string | null;
  created_at: string;
}

export interface ItemSistema {
  id: string;
  numero: string;
  data: string;
  valor: number;
  transportadora: string;
  descricao: string;
}

export function useConciliacao() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedConciliacao, setSelectedConciliacao] =
    useState<Conciliacao | null>(null);

  // Fetch all conciliacoes
  const {
    data: conciliacoes = [],
    isLoading: isLoadingConciliacoes,
    isError: isErrorConciliacoes,
    error: errorConciliacoes,
  } = useQuery({
    queryKey: ["conciliacoes", user?.id],
    queryFn: async (): Promise<Conciliacao[]> => {
      const { data, error } = await supabase
        .from("conciliacoes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Conciliacao[];
    },
    enabled: !!user?.id,
  });

  // Fetch items for selected conciliacao
  const {
    data: itensImportados = [],
    isLoading: isLoadingItens,
    isError: isErrorItens,
    error: errorItens,
    refetch: refetchItens,
  } = useQuery({
    queryKey: ["conciliacao_itens", selectedConciliacao?.id],
    queryFn: async (): Promise<ItemImportado[]> => {
      if (!selectedConciliacao) return [];
      const { data, error } = await supabase
        .from("conciliacao_itens_importados")
        .select("*")
        .eq("conciliacao_id", selectedConciliacao.id)
        .order("linha_arquivo", { ascending: true });
      if (error) throw error;
      return data as ItemImportado[];
    },
    enabled: !!selectedConciliacao,
  });

  // Fetch entregas for matching (sistema)
  const { data: entregasSistema = [] } = useQuery({
    queryKey: [
      "entregas_para_conciliacao",
      selectedConciliacao?.periodo_inicio,
      selectedConciliacao?.periodo_fim,
    ],
    queryFn: async (): Promise<ItemSistema[]> => {
      if (!selectedConciliacao) return [];

      interface EntregaRaw {
        id: string;
        numero_entrega: string;
        created_at: string;
        valor_frete: number | null;
        transportadora: { nome_fantasia: string } | null;
      }

      let query = supabase
        .from("entregas")
        .select(
          "id, numero_entrega, created_at, valor_frete, transportadora:transportadoras(nome_fantasia)",
        )
        .is("deleted_at", null)
        .not("valor_frete", "is", null);

      if (selectedConciliacao.periodo_inicio) {
        query = query.gte("created_at", selectedConciliacao.periodo_inicio);
      }
      if (selectedConciliacao.periodo_fim) {
        query = query.lte("created_at", selectedConciliacao.periodo_fim);
      }

      const { data, error } = await query
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;

      return (data || []).map((e: EntregaRaw) => ({
        id: e.id,
        numero: e.numero_entrega,
        data: e.created_at,
        valor: e.valor_frete || 0,
        transportadora: e.transportadora?.nome_fantasia || "N/A",
        descricao: `Entrega ${e.numero_entrega}`,
      }));
    },
    enabled: !!selectedConciliacao,
  });

  // Create conciliacao
  const createConciliacao = useMutation({
    mutationFn: async (data: {
      tipo: Conciliacao["tipo"];
      nome: string;
      descricao?: string;
      periodo_inicio?: string;
      periodo_fim?: string;
    }) => {
      const { data: newConciliacao, error } = await supabase
        .from("conciliacoes")
        .insert({
          tipo: data.tipo,
          nome: data.nome,
          descricao: data.descricao || null,
          periodo_inicio: data.periodo_inicio || null,
          periodo_fim: data.periodo_fim || null,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return newConciliacao;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["conciliacoes"] });
      setSelectedConciliacao(data as Conciliacao);
      toast.success("Conciliação criada!");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });

  // Import file
  const importFile = useCallback(
    async (file: File, conciliacaoId: string) => {
      try {
        const rows = await readSheetRows(file);
        if (rows.length === 0) {
          toast.error("Arquivo vazio ou formato inválido");
          throw new Error("Arquivo vazio");
        }

        // Map rows to items (localized money/date parsing handled in the helper)
        const items = parseImportRows(rows, conciliacaoId);

        const { error: insertError } = await supabase
          .from("conciliacao_itens_importados")
          .insert(items as never[]);
        if (insertError) throw insertError;

        const totalImportado = items.reduce((sum, item) => sum + item.valor, 0);
        await supabase
          .from("conciliacoes")
          .update({
            total_itens_importados: items.length,
            valor_total_importado: totalImportado,
            status: "em_andamento",
          })
          .eq("id", conciliacaoId);

        queryClient.invalidateQueries({ queryKey: ["conciliacoes"] });
        queryClient.invalidateQueries({
          queryKey: ["conciliacao_itens", conciliacaoId],
        });
        toast.success(`${items.length} itens importados!`);
      } catch (error) {
        toast.error("Erro ao importar: " + (error as Error).message);
        throw error;
      }
    },
    [queryClient],
  );

  // Auto-match items
  const autoMatch = useMutation({
    mutationFn: async (conciliacaoId: string) => {
      const { data: items } = await supabase
        .from("conciliacao_itens_importados")
        .select("*")
        .eq("conciliacao_id", conciliacaoId)
        .eq("status", "pendente");

      if (!items || items.length === 0) {
        throw new Error("Nenhum item pendente para conciliar");
      }

      let matched = 0;
      let divergencias = 0;
      const now = new Date().toISOString();

      // Compute all matches in memory first, then batch-upsert — avoids N sequential DB calls
      const updates: {
        id: string;
        status: string;
        item_sistema_id: string;
        diferenca_valor: number;
        conciliado_em: string;
        conciliado_por: string | undefined;
      }[] = [];

      for (const item of items) {
        const matchingEntrega = entregasSistema.find((e) => {
          const refMatch =
            item.referencia_externa &&
            e.numero
              .toLowerCase()
              .includes(item.referencia_externa.toLowerCase());
          const valorMatch = Math.abs(e.valor - item.valor) < 0.01;
          return refMatch || valorMatch;
        });

        if (matchingEntrega) {
          const diferenca = item.valor - matchingEntrega.valor;
          const status =
            Math.abs(diferenca) < 0.01 ? "conciliado" : "divergencia";
          updates.push({
            id: item.id,
            status,
            item_sistema_id: matchingEntrega.id,
            diferenca_valor: diferenca,
            conciliado_em: now,
            conciliado_por: user?.id,
          });
          if (status === "conciliado") matched++;
          else divergencias++;
        }
      }

      if (updates.length > 0) {
        await supabase
          .from("conciliacao_itens_importados")
          .upsert(updates as never[]);
      }

      // Update conciliacao totals
      const { data: updatedItems } = await supabase
        .from("conciliacao_itens_importados")
        .select("status, diferenca_valor")
        .eq("conciliacao_id", conciliacaoId);

      const totalConciliados =
        updatedItems?.filter((i) => i.status === "conciliado").length || 0;
      const totalDivergencias =
        updatedItems?.filter((i) => i.status === "divergencia").length || 0;
      const diferencaTotal =
        updatedItems?.reduce((sum, i) => sum + (i.diferenca_valor || 0), 0) ||
        0;

      await supabase
        .from("conciliacoes")
        .update({
          total_itens_conciliados: totalConciliados,
          total_divergencias: totalDivergencias,
          diferenca_total: diferencaTotal,
        })
        .eq("id", conciliacaoId);

      return { matched, divergencias };
    },
    onSuccess: ({ matched, divergencias }) => {
      queryClient.invalidateQueries({ queryKey: ["conciliacoes"] });
      queryClient.invalidateQueries({ queryKey: ["conciliacao_itens"] });
      toast.success(
        `Matching: ${matched} conciliados, ${divergencias} divergências`,
      );
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });

  // Manual match
  const manualMatch = useMutation({
    mutationFn: async ({
      itemId,
      sistemaId,
      status,
      observacoes,
    }: {
      itemId: string;
      sistemaId?: string;
      status: "conciliado" | "divergencia" | "ignorado";
      observacoes?: string;
    }) => {
      const updates: TablesUpdate<"conciliacao_itens_importados"> = {
        status,
        conciliado_em: new Date().toISOString(),
        conciliado_por: user?.id,
        observacoes: observacoes || null,
      };

      if (sistemaId) {
        const entrega = entregasSistema.find((e) => e.id === sistemaId);
        if (entrega) {
          const item = itensImportados.find((i) => i.id === itemId);
          if (item) {
            updates.item_sistema_id = sistemaId;
            updates.diferenca_valor = item.valor - entrega.valor;
          }
        }
      }

      const { error } = await supabase
        .from("conciliacao_itens_importados")
        .update(updates)
        .eq("id", itemId);

      if (error) throw error;

      // Update conciliacao summary
      if (selectedConciliacao) {
        const { data: updatedItems } = await supabase
          .from("conciliacao_itens_importados")
          .select("status, diferenca_valor")
          .eq("conciliacao_id", selectedConciliacao.id);

        const totalConciliados =
          updatedItems?.filter((i) => i.status === "conciliado").length || 0;
        const totalDivergencias =
          updatedItems?.filter((i) => i.status === "divergencia").length || 0;
        const diferencaTotal =
          updatedItems?.reduce((sum, i) => sum + (i.diferenca_valor || 0), 0) ||
          0;

        await supabase
          .from("conciliacoes")
          .update({
            total_itens_conciliados: totalConciliados,
            total_divergencias: totalDivergencias,
            diferenca_total: diferencaTotal,
          })
          .eq("id", selectedConciliacao.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conciliacao_itens"] });
      queryClient.invalidateQueries({ queryKey: ["conciliacoes"] });
      toast.success("Item atualizado!");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });

  // Finalize conciliacao
  const finalizeConciliacao = useMutation({
    mutationFn: async (conciliacaoId: string) => {
      const { error } = await supabase
        .from("conciliacoes")
        .update({ status: "concluida" })
        .eq("id", conciliacaoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conciliacoes"] });
      toast.success("Conciliação finalizada!");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });

  // Delete conciliacao
  const deleteConciliacao = useMutation({
    mutationFn: async (conciliacaoId: string) => {
      const { error } = await supabase
        .from("conciliacoes")
        .delete()
        .eq("id", conciliacaoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conciliacoes"] });
      setSelectedConciliacao(null);
      toast.success("Conciliação excluída!");
    },
    onError: (e: Error) => toast.error("Erro: " + e.message),
  });

  return {
    conciliacoes,
    isLoadingConciliacoes,
    isErrorConciliacoes,
    errorConciliacoes,
    selectedConciliacao,
    setSelectedConciliacao,
    itensImportados,
    isLoadingItens,
    isErrorItens,
    errorItens,
    refetchItens,
    entregasSistema,
    createConciliacao,
    importFile,
    autoMatch,
    manualMatch,
    finalizeConciliacao,
    deleteConciliacao,
  };
}

export default useConciliacao;
