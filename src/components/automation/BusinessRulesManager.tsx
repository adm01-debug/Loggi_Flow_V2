import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronUp,
  Bell,
  RefreshCw,
  Mail,
  AlertTriangle,
  Zap,
  Settings,
  Play,
  Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
import { cn } from "@/lib/utils";

const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Bell,
  RefreshCw,
  Mail,
  AlertTriangle,
};

interface RuleEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editRule?: BusinessRule;
}

function RuleEditor({ open, onOpenChange, editRule }: RuleEditorProps) {
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
    setConditions([
      ...conditions,
      { id: crypto.randomUUID(), field: "", operator: "equals", value: "", logicalOperator: "AND" },
    ]);
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter((c) => c.id !== id));
  };

  const updateCondition = (id: string, updates: Partial<RuleCondition>) => {
    setConditions(conditions.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const addAction = () => {
    setActions([
      ...actions,
      { id: crypto.randomUUID(), type: "send_notification", config: { message: "" } },
    ]);
  };

  const removeAction = (id: string) => {
    setActions(actions.filter((a) => a.id !== id));
  };

  const updateAction = (id: string, updates: Partial<RuleAction>) => {
    setActions(actions.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const handleSave = async () => {
    const ruleData: CreateRuleInput = {
      name,
      description,
      entity_type: entityType,
      trigger_event: triggerEvent,
      conditions,
      actions,
    };

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
          {/* Info básica */}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Nome da Regra</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Notificar atraso de entrega"
              />
            </div>
            <div className="grid gap-2">
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva o que esta regra faz..."
                rows={2}
              />
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRIGGER_EVENTS.map((e) => (
                      <SelectItem key={e.value} value={e.value}>
                        {e.label}
                      </SelectItem>
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
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
            <div className="space-y-3">
              {conditions.map((condition, index) => (
                <div key={condition.id} className="flex items-center gap-2">
                  {index > 0 && (
                    <Select
                      value={condition.logicalOperator || "AND"}
                      onValueChange={(v) => updateCondition(condition.id, { logicalOperator: v as "AND" | "OR" })}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AND">E</SelectItem>
                        <SelectItem value="OR">OU</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <Select
                    value={condition.field}
                    onValueChange={(v) => updateCondition(condition.id, { field: v })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Campo" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFields.map((f) => (
                        <SelectItem key={f.field} value={f.field}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={condition.operator}
                    onValueChange={(v) => updateCondition(condition.id, { operator: v as ConditionOperator })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITION_OPERATORS.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!["is_empty", "is_not_empty"].includes(condition.operator) && (
                    <Input
                      value={condition.value as string}
                      onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                      placeholder="Valor"
                      className="flex-1"
                    />
                  )}
                  {conditions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCondition(condition.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 rounded-lg bg-green-500/10 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Badge variant="outline" className="bg-green-500/20">ENTÃO</Badge>
                <span className="text-muted-foreground">Ações</span>
              </div>
              <Button variant="ghost" size="sm" onClick={addAction}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>
            <div className="space-y-3">
              {actions.map((action) => {
                const actionType = ACTION_TYPES.find((a) => a.value === action.type);
                const IconComponent = actionType ? actionIcons[actionType.icon] : Bell;
                return (
                  <div key={action.id} className="p-3 rounded-md border bg-background space-y-3">
                    <div className="flex items-center gap-2">
                      <Select
                        value={action.type}
                        onValueChange={(v) => updateAction(action.id, { type: v as ActionType, config: {} })}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACTION_TYPES.map((a) => (
                            <SelectItem key={a.value} value={a.value}>
                              {a.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {actions.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAction(action.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    {action.type === "send_notification" && (
                      <Input
                        value={action.config.message || ""}
                        onChange={(e) =>
                          updateAction(action.id, { config: { ...action.config, message: e.target.value } })
                        }
                        placeholder="Mensagem da notificação..."
                      />
                    )}
                    {action.type === "change_status" && (
                      <Input
                        value={action.config.new_status || ""}
                        onChange={(e) =>
                          updateAction(action.id, { config: { ...action.config, new_status: e.target.value } })
                        }
                        placeholder="Novo status..."
                      />
                    )}
                    {action.type === "send_email" && (
                      <div className="space-y-2">
                        <Input
                          value={action.config.to || ""}
                          onChange={(e) =>
                            updateAction(action.id, { config: { ...action.config, to: e.target.value } })
                          }
                          placeholder="Email destinatário..."
                        />
                        <Input
                          value={action.config.subject || ""}
                          onChange={(e) =>
                            updateAction(action.id, { config: { ...action.config, subject: e.target.value } })
                          }
                          placeholder="Assunto..."
                        />
                      </div>
                    )}
                    {action.type === "create_alert" && (
                      <Input
                        value={action.config.alert_message || ""}
                        onChange={(e) =>
                          updateAction(action.id, { config: { ...action.config, alert_message: e.target.value } })
                        }
                        placeholder="Mensagem do alerta..."
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!name || conditions.length === 0 || actions.length === 0}>
            {editRule ? "Salvar Alterações" : "Criar Regra"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function BusinessRulesManager() {
  const { rules, isLoading, deleteRule, toggleRule } = useBusinessRules();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BusinessRule | null>(null);

  const handleEdit = (rule: BusinessRule) => {
    setEditingRule(rule);
    setEditorOpen(true);
  };

  const handleCreate = () => {
    setEditingRule(null);
    setEditorOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Regras de Automação
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure ações automáticas baseadas em eventos
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Regra
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando regras...</div>
      ) : rules.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Zap className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Nenhuma regra configurada</p>
            <Button onClick={handleCreate}>Criar primeira regra</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {rules.map((rule) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
              >
                <Card className={cn(!rule.is_active && "opacity-60")}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                        />
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {rule.name}
                            <Badge variant="secondary" className="text-xs">
                              {rule.entity_type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {rule.description || `${rule.conditions.length} condição(ões), ${rule.actions.length} ação(ões)`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(rule)}>
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRule.mutate(rule.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <RuleEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editRule={editingRule}
      />
    </div>
  );
}
