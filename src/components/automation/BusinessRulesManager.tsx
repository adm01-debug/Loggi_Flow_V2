import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useBusinessRules, BusinessRule } from "@/hooks";
import { cn } from "@/lib/utils";
import { RuleEditor } from "./RuleEditor";

export function BusinessRulesManager() {
  const { rules, isLoading, deleteRule, toggleRule } = useBusinessRules();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BusinessRule | null>(null);

  const handleEdit = (rule: BusinessRule) => { setEditingRule(rule); setEditorOpen(true); };
  const handleCreate = () => { setEditingRule(null); setEditorOpen(true); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2"><Zap className="h-5 w-5 text-primary" />Regras de Automação</h2>
          <p className="text-sm text-muted-foreground">Configure ações automáticas baseadas em eventos</p>
        </div>
        <Button onClick={handleCreate}><Plus className="h-4 w-4 mr-2" />Nova Regra</Button>
      </div>

      {isLoading && <div className="text-center py-8 text-muted-foreground">Carregando regras...</div>}
      
      {!isLoading && rules.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <Zap className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">Nenhuma regra configurada</p>
            <Button onClick={handleCreate}>Criar primeira regra</Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && rules.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence>
            {rules.map((rule) => (
              <motion.div key={rule.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }}>
                <Card className={cn(!rule.is_active && "opacity-60")}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Switch checked={rule.is_active} onCheckedChange={(checked) => toggleRule(rule.id, checked)} />
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {rule.name}
                            <Badge variant="secondary" className="text-xs">{rule.entity_type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {rule.description || `${rule.conditions.length} condição(ões), ${rule.actions.length} ação(ões)`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(rule)}>Editar</Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteRule.mutate(rule.id)}>
                          <Trash2 className="h-4 w-4" />
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

      <RuleEditor open={editorOpen} onOpenChange={setEditorOpen} editRule={editingRule || undefined} />
    </div>
  );
}
