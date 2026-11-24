import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessRules, BusinessRule, RuleCondition } from "@/hooks/logistics/useBusinessRules";
import { Database, Json } from "@/integrations/supabase/types";
import { useTelemetry } from "@/hooks/analytics/useTelemetry";

/**
 * Business Rule Engine — evaluates rules against entity data and executes actions.
 * Used by operational hooks to auto-trigger notifications, status changes, alerts.
 */
export function useBusinessRuleEngine() {
  const { rules } = useBusinessRules();
  const { logTelemetry } = useTelemetry();
  const executionBatchRef = useRef<Array<{ conditions_met: boolean; entity_id: string; entity_type: string; trigger_event: string; rule_id?: string | null; actions_executed?: Json; error_message?: string | null; execution_time_ms?: number | null }>>([]);
  const batchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced Batch Logging for high-frequency rule execution
  const flushLogs = useCallback(async () => {
    if (executionBatchRef.current.length === 0) return;
    
    const logs = [...executionBatchRef.current];
    executionBatchRef.current = [];
    
    try {
      await supabase.from("rule_execution_logs").insert(logs);
    } catch (err) {
      console.error('Failed to flush rule logs:', err);
    }
  }, []);

  const addToBatch = useCallback((log: { conditions_met: boolean; entity_id: string; entity_type: string; trigger_event: string; rule_id?: string | null; actions_executed?: Json; error_message?: string | null; execution_time_ms?: number | null }) => {
    executionBatchRef.current.push(log);
    if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
    batchTimerRef.current = setTimeout(flushLogs, 2000);
  }, [flushLogs]);

  const evaluateCondition = useCallback((condition: RuleCondition, data: Record<string, unknown>): boolean => {
    const fieldValue = data[condition.field];
    const targetValue = condition.value;

    switch (condition.operator) {
      case "equals":
        return String(fieldValue) === String(targetValue);
      case "not_equals":
        return String(fieldValue) !== String(targetValue);
      case "contains":
        return String(fieldValue || "").toLowerCase().includes(String(targetValue).toLowerCase());
      case "greater_than":
        return Number(fieldValue) > Number(targetValue);
      case "less_than":
        return Number(fieldValue) < Number(targetValue);
      case "is_empty":
        return fieldValue === null || fieldValue === undefined || fieldValue === "";
      case "is_not_empty":
        return fieldValue !== null && fieldValue !== undefined && fieldValue !== "";
      default:
        return false;
    }
  }, []);

  const evaluateConditions = useCallback((conditions: RuleCondition[], data: Record<string, unknown>): boolean => {
    if (conditions.length === 0) return true;

    let result = evaluateCondition(conditions[0], data);

    for (let i = 1; i < conditions.length; i++) {
      const cond = conditions[i];
      const condResult = evaluateCondition(cond, data);
      if (cond.logicalOperator === "OR") {
        result = result || condResult;
      } else {
        result = result && condResult;
      }
    }

    return result;
  }, [evaluateCondition]);

  const resolveActionUrl = useCallback((entityType: string) => {
    if (entityType === "coleta") return "/coletas";
    if (entityType === "entrega") return "/envios";
    return "/ocorrencias";
  }, []);

  const resolveEntityTable = useCallback((entityType: string) => {
    if (entityType === "coleta") return "coletas" as const;
    if (entityType === "entrega") return "entregas" as const;
    return "ocorrencias" as const;
  }, []);

  const runAction = useCallback(async (
    action: BusinessRule["actions"][number],
    rule: BusinessRule,
    entityId: string,
  ) => {
    if (action.type === "send_notification" || action.type === "create_alert") {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) return;
      const isAlert = action.type === "create_alert";
      await supabase.from("notifications").insert({
        user_id: userData.user.id,
        title: isAlert ? `⚠️ Alerta: ${rule.name}` : `Regra: ${rule.name}`,
        message:
          (isAlert ? action.config.alert_message : action.config.message) ||
          (isAlert
            ? `Alerta disparado pela regra "${rule.name}"`
            : `Regra "${rule.name}" acionada`),
        type: isAlert ? ("warning" as const) : ("info" as const),
        ...(isAlert ? {} : { action_url: resolveActionUrl(rule.entity_type) }),
      });
      return;
    }
    if (action.type === "change_status" && action.config.new_status) {
      const table = resolveEntityTable(rule.entity_type);
      const novoStatus = action.config.new_status;
      if (table === "coletas") {
        const { error } = await supabase
          .from("coletas")
          .update({ status: novoStatus as Database["public"]["Enums"]["coleta_status"] })
          .eq("id", entityId);
        if (error) console.warn("regra change_status (coleta):", error.message);
      } else if (table === "entregas") {
        const { error } = await supabase
          .from("entregas")
          .update({ status: novoStatus as Database["public"]["Enums"]["entrega_status"] })
          .eq("id", entityId);
        if (error) console.warn("regra change_status (entrega):", error.message);
      } else {
        // ocorrencias nao tem coluna status: o estado e o booleano resolvida.
        const resolvida = ["resolvida", "resolvido", "concluida", "concluido", "fechada", "fechado"].includes(
          novoStatus.toLowerCase(),
        );
        await supabase
          .from("ocorrencias")
          .update({ resolvida, data_resolucao: resolvida ? new Date().toISOString() : null })
          .eq("id", entityId);
      }
    }
  }, [resolveActionUrl, resolveEntityTable]);

  const executeActions = useCallback(async (rule: BusinessRule, entityId: string, _entityData: Record<string, unknown>) => {
    const startTime = Date.now();

    for (const action of rule.actions) {
      try {
        await runAction(action, rule, entityId);
      } catch {
        // Rule action failed — silent fail for background processing
      }
    }

    const executionTime = Date.now() - startTime;
    addToBatch({
      rule_id: rule.id,
      entity_id: entityId,
      entity_type: rule.entity_type,
      trigger_event: rule.trigger_event,
      conditions_met: true,
      actions_executed: JSON.parse(JSON.stringify(rule.actions)) as Json,
      execution_time_ms: executionTime,
    });

    if (executionTime > 500) {
      logTelemetry({
        severity: 'warning',
        category: 'rule_engine_performance',
        message: `Regra "${rule.name}" demorou ${executionTime}ms para executar`,
        metadata: { rule_id: rule.id, entity_type: rule.entity_type }
      });
    }
  }, [runAction, addToBatch, logTelemetry]);


  const evaluateRules = useCallback(async (
    entityType: string,
    triggerEvent: string,
    entityId: string,
    entityData: Record<string, unknown>
  ) => {
    const matchingRules = rules
      .filter(r => r.is_active && r.entity_type === entityType && r.trigger_event === triggerEvent)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of matchingRules) {
      const conditionsMet = evaluateConditions(rule.conditions, entityData);
      if (conditionsMet) {
        await executeActions(rule, entityId, entityData);
      }
    }
  }, [rules, evaluateConditions, executeActions]);

  return { evaluateRules };
}
