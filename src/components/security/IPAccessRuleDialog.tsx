import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface IPAccessRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newRule: { ip_pattern: string; description: string; rule_type: "whitelist" | "blacklist" };
  setNewRule: (fn: (prev: { ip_pattern: string; description: string; rule_type: "whitelist" | "blacklist" }) => { ip_pattern: string; description: string; rule_type: "whitelist" | "blacklist" }) => void;
  errors: Record<string, string>;
  currentIP: string | null;
  onAddCurrentIP: () => void;
  onAdd: () => void;
  onReset: () => void;
  isPending: boolean;
}

export function IPAccessRuleDialog({
  open, onOpenChange, newRule, setNewRule, errors,
  currentIP, onAddCurrentIP, onAdd, onReset, isPending,
}: IPAccessRuleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Regra de IP</DialogTitle>
          <DialogDescription>Configure um IP ou range para permitir ou bloquear acesso</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Endereço IP ou Range</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: 192.168.1.1 ou 192.168.0.0/24"
                value={newRule.ip_pattern}
                onChange={(e) => setNewRule(prev => ({ ...prev, ip_pattern: e.target.value }))}
                className="font-mono"
              />
              {currentIP && (
                <Button variant="outline" onClick={onAddCurrentIP} title="Usar meu IP atual">Meu IP</Button>
              )}
            </div>
            {errors.ip_pattern && <p className="text-sm text-destructive">{errors.ip_pattern}</p>}
          </div>

          <div className="space-y-2">
            <Label>Tipo de Regra</Label>
            <Select value={newRule.rule_type} onValueChange={(value: "whitelist" | "blacklist") => setNewRule(prev => ({ ...prev, rule_type: value }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="whitelist">
                  <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-success" />Permitir (Whitelist)</div>
                </SelectItem>
                <SelectItem value="blacklist">
                  <div className="flex items-center gap-2"><XCircle className="h-4 w-4 text-destructive" />Bloquear (Blacklist)</div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Input
              placeholder="Ex: Escritório principal"
              value={newRule.description}
              onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); onReset(); }}>Cancelar</Button>
          <Button onClick={onAdd} disabled={isPending}>
            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adicionando...</> : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
