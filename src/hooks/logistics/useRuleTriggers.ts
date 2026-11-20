import { useCallback } from "react";
import { useBusinessRuleEngine } from "@/hooks/logistics/useBusinessRuleEngine";

/**
 * Bridge entre os fluxos operacionais (coletas/entregas) e o motor de regras de automacao.
 *
 * `onStatusChange` deve ser chamado sempre que um registro mudar de status (apos o update
 * confirmado no banco). As regras ativas que casam com entityType + "on_status_change"
 * sao avaliadas com os dados atuais do registro e as acoes disparam automaticamente.
 */
export function useRuleTriggers() {
  const { evaluateRules } = useBusinessRuleEngine();

  const onStatusChange = useCallback(
    async (
      entityType: "coleta" | "entrega",
      entityId: string,
      entityData: Record<string, unknown>,
    ) => {
      try {
        await evaluateRules(
          entityType,
          "on_status_change",
          entityId,
          entityData,
        );
      } catch {
        // Fallback silencioso: falha de automacao nao pode quebrar o fluxo operacional.
      }
    },
    [evaluateRules],
  );

  return { onStatusChange };
}
