import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useBusinessRules, BusinessRule, RuleCondition } from "@/hooks/useBusinessRules";
import { Json } from "@/integrations/supabase/types";

/**
 * Business Rule Engine — evaluates rules against entity data and executes actions.
 * Used by operational hooks to auto-trigger notifications, status changes, alerts.
 */
export function useBusinessRuleEngine() {
  const { rules } = useBusinessRules();

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

  const executeActions = useCallback(async (rule: BusinessRule, entityId: string, entityData: Record<string, unknown>) => {
    const startTime = Date.now();

    for (const action of rule.actions) {
      try {
        switch (action.type) {
          case "send_notification": {
            const { data: userData } = await supabase.auth.getUser();
            if (userData?.user) {
              await supabase.from("notifications").insert({
                user_id: userData.user.id,
                title: `Regra: ${rule.name}`,
                message: action.config.message || `Regra "${rule.name}" acionada`,
                type: "info" as const,
                action_url: `/${rule.entity_type === "coleta" ? "coletas" : rule.entity_type === "entrega" ? "envios" : "ocorrencias"}`,
              });
            }
            break;
          }
          case "create_alert": {
            const { data: userData } = await supabase.auth.getUser();
            if (userData?.user) {
              await supabase.from("notifications").insert({
                user_id: userData.user.id,
                title: `⚠️ Alerta: ${rule.name}`,
                message: action.config.alert_message || `Alerta disparado pela regra "${rule.name}"`,
                type: "warning" as const,
              });
            }
            break;
          }
          case "change_status": {
            const table = rule.entity_type === "coleta" ? "coletas" : rule.entity_type === "entrega" ? "entregas" : "ocorrencias";
            if (action.config.new_status) {
              await supabase.from(table).update({ status: action.config.new_status }).eq("id", entityId);
            }
            break;
          }
        }
      } catch (err) {
        console.error(`Rule action failed: ${action.type}`, err);
      }
    }

    // Log execution
    const executionTime = Date.now() - startTime;
    await supabase.from("rule_execution_logs").insert({
      rule_id: rule.id,
      entity_id: entityId,
      entity_type: rule.entity_type,
      trigger_event: rule.trigger_event,
      conditions_met: true,
      actions_executed: JSON.parse(JSON.stringify(rule.actions)) as Json,
      execution_time_ms: executionTime,
    }).then(() => {}, () => {});
  }, []);

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
