import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  Globe, 
  Plus, 
  Trash2, 
  Loader2,
  Shield,
  ShieldBan,
  CheckCircle,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { z } from "zod";

interface IPAccessRule {
  id: string;
  ip_pattern: string;
  rule_type: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

const ipSchema = z.object({
  ip_pattern: z.string()
    .min(1, "IP é obrigatório")
    .regex(/^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$|^\*$/, "IP inválido (ex: 192.168.1.1 ou 192.168.1.0/24)"),
  description: z.string().max(200, "Descrição muito longa").optional(),
  rule_type: z.enum(["whitelist", "blacklist"]),
});

export function IPAccessControl() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteRuleId, setDeleteRuleId] = useState<string | null>(null);
  const [newRule, setNewRule] = useState({
    ip_pattern: "",
    description: "",
    rule_type: "whitelist" as "whitelist" | "blacklist",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentIP, setCurrentIP] = useState<string | null>(null);

  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Fetch current IP
  useState(() => {
    fetch("https://api.ipify.org?format=json")
      .then(res => res.json())
      .then(data => setCurrentIP(data.ip))
      .catch(() => setCurrentIP(null));
  });

  // Fetch IP rules
  const { data: rules, isLoading } = useQuery({
    queryKey: ["ip-access-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ip_access_rules")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as IPAccessRule[];
    },
    enabled: isAdmin,
  });

  // Add rule mutation
  const addRuleMutation = useMutation({
    mutationFn: async (rule: typeof newRule) => {
      const { error } = await supabase
        .from("ip_access_rules")
        .insert({
          ip_pattern: rule.ip_pattern,
          description: rule.description || null,
          rule_type: rule.rule_type,
          created_by: user?.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ip-access-rules"] });
      toast({ title: "Regra adicionada com sucesso!" });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar regra",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle rule mutation
  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("ip_access_rules")
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ip-access-rules"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar regra",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ip_access_rules")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ip-access-rules"] });
      toast({ title: "Regra removida" });
      setDeleteRuleId(null);
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover regra",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setNewRule({ ip_pattern: "", description: "", rule_type: "whitelist" });
    setErrors({});
  };

  const handleAddRule = () => {
    setErrors({});
    
    const validation = ipSchema.safeParse(newRule);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[String(err.path[0])] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    addRuleMutation.mutate(newRule);
  };

  const handleAddCurrentIP = () => {
    if (currentIP) {
      setNewRule(prev => ({ ...prev, ip_pattern: currentIP }));
    }
  };

  const whitelistCount = rules?.filter(r => r.rule_type === "whitelist" && r.is_active).length || 0;
  const blacklistCount = rules?.filter(r => r.rule_type === "blacklist" && r.is_active).length || 0;

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Controle de Acesso por IP
          </CardTitle>
          <CardDescription>
            Apenas administradores podem gerenciar regras de IP
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Controle de Acesso por IP
              </CardTitle>
              <CardDescription>
                Gerencie IPs permitidos e bloqueados para acesso ao sistema
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Regra
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-success/10">
                <Shield className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Whitelist</p>
                <p className="text-lg font-bold">{whitelistCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-destructive/10">
                <ShieldBan className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Blacklist</p>
                <p className="text-lg font-bold">{blacklistCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-full bg-primary/10">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Seu IP</p>
                <p className="text-sm font-mono">{currentIP || "Carregando..."}</p>
              </div>
            </div>
          </div>

          {/* Rules Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP / Padrão</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhuma regra de IP configurada
                      </TableCell>
                    </TableRow>
                  ) : (
                    rules?.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-mono">{rule.ip_pattern}</TableCell>
                        <TableCell>
                          {rule.rule_type === "whitelist" ? (
                            <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Permitido
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                              <XCircle className="w-3 h-3 mr-1" />
                              Bloqueado
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{rule.description || "-"}</TableCell>
                        <TableCell>
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={(checked) => 
                              toggleRuleMutation.mutate({ id: rule.id, is_active: checked })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {format(new Date(rule.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteRuleId(rule.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Rule Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Regra de IP</DialogTitle>
            <DialogDescription>
              Configure um IP ou range para permitir ou bloquear acesso
            </DialogDescription>
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
                  <Button 
                    variant="outline" 
                    onClick={handleAddCurrentIP}
                    title="Usar meu IP atual"
                  >
                    Meu IP
                  </Button>
                )}
              </div>
              {errors.ip_pattern && (
                <p className="text-sm text-destructive">{errors.ip_pattern}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Tipo de Regra</Label>
              <Select
                value={newRule.rule_type}
                onValueChange={(value: "whitelist" | "blacklist") => 
                  setNewRule(prev => ({ ...prev, rule_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whitelist">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      Permitir (Whitelist)
                    </div>
                  </SelectItem>
                  <SelectItem value="blacklist">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-destructive" />
                      Bloquear (Blacklist)
                    </div>
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
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleAddRule} disabled={addRuleMutation.isPending}>
              {addRuleMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRuleId} onOpenChange={() => setDeleteRuleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Regra</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover esta regra de IP? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteRuleId && deleteRuleMutation.mutate(deleteRuleId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
