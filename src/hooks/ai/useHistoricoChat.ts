import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/** Últimos turnos que voltam do banco ao abrir o painel (índice por user_id + created_at). */
export const HISTORICO_MAXIMO = 50;

export interface TurnoChat {
  role: "user" | "assistant";
  content: string;
}

/**
 * Persistência do chat de IA em `ai_chat_messages`.
 * A RLS da tabela só libera SELECT/INSERT/DELETE das próprias linhas (`auth.uid() = user_id`);
 * sem sessão, nenhuma operação é disparada.
 */
export function useHistoricoChat(userId: string | null) {
  const avisouFalha = useRef(false);

  const avisarFalha = useCallback(() => {
    if (avisouFalha.current) return;
    avisouFalha.current = true;
    toast.error("Histórico da conversa não pôde ser gravado.");
  }, []);

  const carregarTurnos = useCallback(async (): Promise<TurnoChat[]> => {
    if (!userId) return [];

    const { data, error } = await supabase
      .from("ai_chat_messages")
      .select("role, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(HISTORICO_MAXIMO);

    if (error) {
      avisarFalha();
      return [];
    }

    return (data ?? [])
      .reverse()
      .filter((linha) => linha.role === "user" || linha.role === "assistant")
      .map((linha) => ({
        role: linha.role as TurnoChat["role"],
        content: linha.content,
      }));
  }, [userId, avisarFalha]);

  const gravarTurno = useCallback(
    async (role: TurnoChat["role"], content: string) => {
      if (!userId || !content.trim()) return;

      const { error } = await supabase
        .from("ai_chat_messages")
        .insert({ user_id: userId, role, content });

      if (error) avisarFalha();
    },
    [userId, avisarFalha],
  );

  const limparHistorico = useCallback(async () => {
    if (!userId) return;

    const { error } = await supabase
      .from("ai_chat_messages")
      .delete()
      .eq("user_id", userId);

    if (error) avisarFalha();
  }, [userId, avisarFalha]);

  return { carregarTurnos, gravarTurno, limparHistorico };
}
