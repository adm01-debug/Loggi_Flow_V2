import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/auth/useAuth";
import { toast } from "sonner";
import { Json, TablesUpdate } from "@/integrations/supabase/types";

export type EntityType = "coleta" | "entrega" | "ocorrencia" | "frete";
export type TriggerEvent =
  | "on_create"
  | "on_update"
  | "on_status_change"
  | "low_performance"
  | "high_cost";
export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "greater_than"
  | "less_than"
  | "is_empty"
  | "is_not_empty"
  | "below_threshold";
export type ActionType =
  | "send_notification"
  | "change_status"
  | "send_email"
  | "add_tag"
  | "assign_user"
  | "create_alert"
  | "block_carrier";

export interface RuleCondition {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: string | number | boolean;
  logicalOperator?: "AND" | "OR";
}

export interface RuleAction {
  id: string;
  type: ActionType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- action config is dynamic; validated at execution time
  config: Record<string, any>;
}

export interface BusinessRule {
  id: string;
  name: string;
  description: string | null;
  entity_type: EntityType;
  trigger_event: TriggerEvent;
  conditions: RuleCondition[];
  actions: RuleAction[];
  is_active: boolean;
  priority: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRuleInput {
  name: string;
  description?: string;
  entity_type: EntityType;
  trigger_event: TriggerEvent;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority?: number;
}

// Configurações de campos disponíveis por entidade
export const ENTITY_FIELDS: Record<
  EntityType,
  { field: string; label: string; type: string }[]
> = {
  coleta: [
    { field: "status", label: "Status", type: "select" },
    { field: "tipo_coleta", label: "Tipo de Coleta", type: "select" },
    { field: "peso_estimado_kg", label: "Peso (kg)", type: "number" },
    { field: "qtd_volumes", label: "Quantidade de Volumes", type: "number" },
    { field: "endereco_coleta", label: "Endereço", type: "text" },
    { field: "observacoes", label: "Observações", type: "text" },
  ],
  entrega: [
    { field: "status", label: "Status", type: "select" },
    { field: "tipo_frete", label: "Tipo de Frete", type: "select" },
    { field: "valor_frete", label: "Valor do Frete", type: "number" },
    { field: "endereco_entrega", label: "Endereço", type: "text" },
    { field: "observacoes", label: "Observações", type: "text" },
  ],
  ocorrencia: [
    { field: "tipo_ocorrencia", label: "Tipo", type: "text" },
    { field: "resolvida", label: "Resolvida", type: "boolean" },
    { field: "descricao", label: "Descrição", type: "text" },
  ],
  frete: [
    { field: "valor_cotado", label: "Valor Cotado", type: "number" },
    { field: "prazo_dias", label: "Prazo (Dias)", type: "number" },
    { field: "status", label: "Status Cotação", type: "select" },
  ],
};

export const TRIGGER_EVENTS: { value: TriggerEvent; label: string }[] = [
  { value: "on_create", label: "Quando criado" },
  { value: "on_update", label: "Quando atualizado" },
  { value: "on_status_change", label: "Quando status mudar" },
  { value: "low_performance", label: "Baixa Performance (Nexus Score)" },
  { value: "high_cost", label: "Custo Acima da Média" },
];

export const CONDITION_OPERATORS: {
  value: ConditionOperator;
  label: string;
}[] = [
  { value: "equals", label: "é igual a" },
  { value: "not_equals", label: "é diferente de" },
  { value: "contains", label: "contém" },
  { value: "greater_than", label: "é maior que" },
  { value: "less_than", label: "é menor que" },
  { value: "is_empty", label: "está vazio" },
  { value: "is_not_empty", label: "não está vazio" },
];

export const ACTION_TYPES: {
  value: ActionType;
  label: string;
  icon: string;
}[] = [
  { value: "send_notification", label: "Enviar Notificação", icon: "Bell" },
  { value: "change_status", label: "Alterar Status", icon: "RefreshCw" },
  { value: "send_email", label: "Enviar Email", icon: "Mail" },
  { value: "create_alert", label: "Criar Alerta", icon: "AlertTriangle" },
  { value: "block_carrier", label: "Bloquear Transportadora", icon: "Shield" },
];

export function useBusinessRules() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const {
    data: rules = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["business-rules", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_rules")
        .select("*")
        .order("priority", { ascending: false });

      if (error) throw error;
      return (data || []).map((rule) => ({
        ...rule,
        conditions: rule.conditions as unknown as RuleCondition[],
        actions: rule.actions as unknown as RuleAction[],
        entity_type: rule.entity_type as EntityType,
        trigger_event: rule.trigger_event as TriggerEvent,
      })) as BusinessRule[];
    },
    enabled: !!user?.id,
  });

  const createRule = useMutation({
    mutationFn: async (input: CreateRuleInput) => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("business_rules")
        .insert([
          {
            name: input.name,
            description: input.description,
            entity_type: input.entity_type,
            trigger_event: input.trigger_event,
            conditions: JSON.parse(JSON.stringify(input.conditions)) as Json,
            actions: JSON.parse(JSON.stringify(input.actions)) as Json,
            priority: input.priority || 0,
            created_by: user?.user?.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-rules"] });
      toast.success("Regra criada com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao criar regra: ${error.message}`);
    },
  });

  const updateRule = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<BusinessRule> & { id: string }) => {
      const updateData: TablesUpdate<"business_rules"> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined)
        updateData.description = updates.description;
      if (updates.entity_type !== undefined)
        updateData.entity_type = updates.entity_type;
      if (updates.trigger_event !== undefined)
        updateData.trigger_event = updates.trigger_event;
      if (updates.conditions !== undefined)
        updateData.conditions = JSON.parse(JSON.stringify(updates.conditions));
      if (updates.actions !== undefined)
        updateData.actions = JSON.parse(JSON.stringify(updates.actions));
      if (updates.is_active !== undefined)
        updateData.is_active = updates.is_active;
      if (updates.priority !== undefined)
        updateData.priority = updates.priority;

      const { data, error } = await supabase
        .from("business_rules")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-rules"] });
      toast.success("Regra atualizada!");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar regra: ${error.message}`);
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("business_rules")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-rules"] });
      toast.success("Regra excluída!");
    },
    onError: (error) => {
      toast.error(`Erro ao excluir regra: ${error.message}`);
    },
  });

  const toggleRule = useCallback(
    async (id: string, isActive: boolean) => {
      await updateRule.mutateAsync({ id, is_active: isActive });
    },
    [updateRule],
  );

  return {
    rules,
    isLoading,
    error,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
  };
}
