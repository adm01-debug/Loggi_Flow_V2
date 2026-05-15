import { useState } from "react";
import { Plus, Trash2, Bell, RefreshCw, Mail, AlertTriangle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  useBusinessRules,
  EntityType,
  TriggerEvent,
  RuleCondition,
  RuleAction,
  ActionType,
  ConditionOperator,
  ENTITY_FIELDS,
  TRIGGER_EVENTS,
  CONDITION_OPERATORS,
  ACTION_TYPES,
  CreateRuleInput,
  BusinessRule,
} from "@/hooks/useBusinessRules";

const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Bell, RefreshCw, Mail, AlertTriangle,
};

interface RuleEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editRule?: BusinessRule;
}

export function RuleEditor({ open, onOpenChange, editRule }: RuleEditorProps) {
  const { createRule, updateRule } = useBusinessRules();
  const [name, setName] = useState(editRule?.name || "");
  const [description, setDescription] = useState(editRule?.description || "");
  const [entityType, setEntityType] = useState<EntityType>(editRule?.entity_type || "entrega");
  const [triggerEvent, setTriggerEvent] = useState<TriggerEvent>(editRule?.trigger_event || "on_status_change");
  const [conditions, setConditions] = useState<RuleCondition[]>(
    editRule?.conditions || [{ id: crypto.randomUUID(), field: "", operator: "equals", value: "" }]
  );
  const [actions, setActions] = useState<RuleAction[]>(
    editRule?.actions || [{ id: crypto.randomUUID(), type: "send_notification", config: { message: "" } }]
  );

  const availableFields = ENTITY_FIELDS[entityType] || [];

  const addCondition = () => {
    setConditions([...conditions, { id: crypto.randomUUID(), field: "", operator: "equals", value: "", logicalOperator: "AND" }]);
  };
  const removeCondition = (id: string) => setConditions(conditions.filter((c) => c.id !== id));
  const updateCondition = (id: string, updates: Partial<RuleCondition>) => {
    setConditions(conditions.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };
  const addAction = () => {
    setActions([...actions, { id: crypto.randomUUID(), type: "send_notification", config: { message: "" } }]);
  };
  const removeAction = (id: string) => setActions(actions.filter((a) => a.id !== id));
  const updateAction = (id: string, updates: Partial<RuleAction>) => {
    setActions(actions.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const handleSave = async () => {
    const ruleData: CreateRuleInput = { name, description, entity_type: entityType, trigger_event: triggerEvent, conditions, actions };
    if (editRule) {
      await updateRule.mutateAsync({ id: editRule.id, ...ruleData });
    } else {
      await createRule.mutateAsync(ruleData);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            {editRule ? "Editar Regra" : "Nova Regra de Automação"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Nome da Regra</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Notificar atraso de entrega" />
            </div>
            <div className="grid gap-2">
              <Label>Descrição (opcional)</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva o que esta regra faz..." rows={2} />
            </div>
          </div>

          {/* Trigger */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Badge variant="outline">QUANDO</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Entidade</Label>
                <Select value={entityType} onValueChange={(v) => setEntityType(v as EntityType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coleta">Coleta</SelectItem>
                    <SelectItem value="entrega">Entrega</SelectItem>
                    <SelectItem value="ocorrencia">Ocorrência</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Evento</Label>
                <Select value={triggerEvent} onValueChange={(v) => setTriggerEvent(v as TriggerEvent)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRIGGER_EVENTS.map((e) => (
                      <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div className="p-4 rounded-lg bg-info/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Badge variant="outline" className="bg-info/20">SE</Badge>
                <span className="text-muted-foreground">Condições</span>
              </div>
              <Button variant="ghost" size="sm" onClick={addCondition}>
                <Plus className="h-4 w-4 mr-1" />Adicionar
              </Button>
            </div>
            <div className="space-y-3">
              {conditions.map((condition, index) => (
                <div key={condition.id} className="flex items-center gap-2">
                  {index > 0 && (
                    <Select value={condition.logicalOperator || "AND"} onValueChange={(v) => updateCondition(condition.id, { logicalOperator: v as "AND" | "OR" })}>
                      <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">E</SelectItem>
                        <SelectItem value="OR">OU</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <Select value={condition.field} onValueChange={(v) => updateCondition(condition.id, { field: v })}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Campo" /></SelectTrigger>
                    <SelectContent>
                      {availableFields.map((f) => (
                        <SelectItem key={f.field} value={f.field}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={condition.operator} onValueChange={(v) => updateCondition(condition.id, { operator: v as ConditionOperator })}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONDITION_OPERATORS.map((op) => (
                        <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!["is_empty", "is_not_empty"].includes(condition.operator) && (
                    <Input value={condition.value as string} onChange={(e) => updateCondition(condition.id, { value: e.target.value })} placeholder="Valor" className="flex-1" />
                  )}
                  {conditions.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeCondition(condition.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 rounded-lg bg-success/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Badge variant="outline" className="bg-success/20">ENTÃO</Badge>
                <span className="text-muted-foreground">Ações</span>
              </div>
              <Button variant="ghost" size="sm" onClick={addAction}>
                <Plus className="h-4 w-4 mr-1" />Adicionar
              </Button>
            </div>
            <div className="space-y-3">
              {actions.map((action) => (
                  <div key={action.id} className="p-3 rounded-md border bg-background space-y-3">
                    <div className="flex items-center gap-2">
                      <Select value={action.type} onValueChange={(v) => updateAction(action.id, { type: v as ActionType, config: {} })}>
                        <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ACTION_TYPES.map((a) => (
                            <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {actions.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeAction(action.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    {action.type === "send_notification" && (
                      <Input value={action.config.message || ""} onChange={(e) => updateAction(action.id, { config: { ...action.config, message: e.target.value } })} placeholder="Mensagem da notificação..." />
                    )}
                    {action.type === "change_status" && (
                      <Input value={action.config.new_status || ""} onChange={(e) => updateAction(action.id, { config: { ...action.config, new_status: e.target.value } })} placeholder="Novo status..." />
                    )}
                    {action.type === "send_email" && (
                      <div className="space-y-2">
                        <Input value={action.config.to || ""} onChange={(e) => updateAction(action.id, { config: { ...action.config, to: e.target.value } })} placeholder="Email destinatário..." />
                        <Input value={action.config.subject || ""} onChange={(e) => updateAction(action.id, { config: { ...action.config, subject: e.target.value } })} placeholder="Assunto..." />
                      </div>
                    )}
                    {action.type === "create_alert" && (
                      <Input value={action.config.alert_message || ""} onChange={(e) => updateAction(action.id, { config: { ...action.config, alert_message: e.target.value } })} placeholder="Mensagem do alerta..." />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={!name || conditions.length === 0 || actions.length === 0}>
            {editRule ? "Salvar Alterações" : "Criar Regra"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
