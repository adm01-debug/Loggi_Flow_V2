import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Globe, Plus, Trash2, Shield, ShieldOff, AlertTriangle, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GeoAccessRule {
  id: string;
  country_code: string;
  country_name: string;
  is_active: boolean;
  created_at: string;
  created_by: string | null;
}

interface GeoBlockedAttempt {
  id: string;
  ip_address: string;
  country_code: string | null;
  country_name: string | null;
  email: string | null;
  user_agent: string | null;
  created_at: string;
}

// Common countries list
const COUNTRIES = [
  { code: "BR", name: "Brasil" },
  { code: "US", name: "Estados Unidos" },
  { code: "PT", name: "Portugal" },
  { code: "ES", name: "Espanha" },
  { code: "AR", name: "Argentina" },
  { code: "CL", name: "Chile" },
  { code: "CO", name: "Colômbia" },
  { code: "MX", name: "México" },
  { code: "PE", name: "Peru" },
  { code: "UY", name: "Uruguai" },
  { code: "PY", name: "Paraguai" },
  { code: "BO", name: "Bolívia" },
  { code: "EC", name: "Equador" },
  { code: "VE", name: "Venezuela" },
  { code: "DE", name: "Alemanha" },
  { code: "FR", name: "França" },
  { code: "IT", name: "Itália" },
  { code: "GB", name: "Reino Unido" },
  { code: "CA", name: "Canadá" },
  { code: "JP", name: "Japão" },
  { code: "CN", name: "China" },
  { code: "AU", name: "Austrália" },
  { code: "NZ", name: "Nova Zelândia" },
  { code: "ZA", name: "África do Sul" },
  { code: "IN", name: "Índia" },
  { code: "KR", name: "Coreia do Sul" },
  { code: "RU", name: "Rússia" },
  { code: "NL", name: "Holanda" },
  { code: "BE", name: "Bélgica" },
  { code: "CH", name: "Suíça" },
  { code: "AT", name: "Áustria" },
  { code: "SE", name: "Suécia" },
  { code: "NO", name: "Noruega" },
  { code: "DK", name: "Dinamarca" },
  { code: "FI", name: "Finlândia" },
  { code: "PL", name: "Polônia" },
  { code: "IE", name: "Irlanda" },
  { code: "SG", name: "Singapura" },
  { code: "AE", name: "Emirados Árabes" },
  { code: "IL", name: "Israel" },
].sort((a, b) => a.name.localeCompare(b.name));

export function GeoBlockingPanel() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [customCode, setCustomCode] = useState("");
  const [customName, setCustomName] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  // Fetch allowed countries
  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ["geo-access-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("geo_access_rules")
        .select("*")
        .order("country_name");
      if (error) throw error;
      return data as GeoAccessRule[];
    },
    enabled: isAdmin,
  });

  // Fetch blocked attempts (last 50)
  const { data: blockedAttempts = [] } = useQuery({
    queryKey: ["geo-blocked-attempts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("geo_blocked_attempts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as GeoBlockedAttempt[];
    },
    enabled: isAdmin,
  });

  // Add country mutation
  const addCountryMutation = useMutation({
    mutationFn: async ({ code, name }: { code: string; name: string }) => {
      const { error } = await supabase.from("geo_access_rules").insert({
        country_code: code.toUpperCase(),
        country_name: name,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geo-access-rules"] });
      toast.success("País adicionado à whitelist");
      resetForm();
      setIsAddDialogOpen(false);
    },
    onError: (error: Error) => {
      if (error.message.includes("duplicate")) {
        toast.error("Este país já está na whitelist");
      } else {
        toast.error("Erro ao adicionar país: " + error.message);
      }
    },
  });

  // Toggle country mutation
  const toggleCountryMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("geo_access_rules")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geo-access-rules"] });
      toast.success("Status atualizado");
    },
    onError: (error: Error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  // Delete country mutation
  const deleteCountryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("geo_access_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geo-access-rules"] });
      toast.success("País removido da whitelist");
      setDeleteConfirmId(null);
    },
    onError: (error: Error) => {
      toast.error("Erro ao remover: " + error.message);
    },
  });

  const resetForm = () => {
    setSelectedCountry("");
    setCustomCode("");
    setCustomName("");
    setUseCustom(false);
  };

  const handleAddCountry = () => {
    if (useCustom) {
      if (!customCode || !customName) {
        toast.error("Preencha código e nome do país");
        return;
      }
      if (customCode.length !== 2) {
        toast.error("O código do país deve ter 2 caracteres");
        return;
      }
      addCountryMutation.mutate({ code: customCode, name: customName });
    } else {
      if (!selectedCountry) {
        toast.error("Selecione um país");
        return;
      }
      const country = COUNTRIES.find((c) => c.code === selectedCountry);
      if (country) {
        addCountryMutation.mutate({ code: country.code, name: country.name });
      }
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          <ShieldOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Acesso restrito a administradores</p>
        </CardContent>
      </Card>
    );
  }

  const activeRules = rules.filter((r) => r.is_active);
  const existingCodes = rules.map((r) => r.country_code);
  const availableCountries = COUNTRIES.filter((c) => !existingCodes.includes(c.code));

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <Globe className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Países Permitidos</p>
                <p className="text-2xl font-bold">{activeRules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Shield className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total na Whitelist</p>
                <p className="text-2xl font-bold">{rules.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tentativas Bloqueadas</p>
                <p className="text-2xl font-bold">{blockedAttempts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Whitelist Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Whitelist de Países
              </CardTitle>
              <CardDescription>
                Apenas usuários de países na whitelist podem fazer login
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar País
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar País à Whitelist</DialogTitle>
                  <DialogDescription>
                    Permita acesso de um novo país ao sistema
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={useCustom}
                      onCheckedChange={setUseCustom}
                      id="custom-mode"
                    />
                    <Label htmlFor="custom-mode">Inserir país manualmente</Label>
                  </div>

                  {useCustom ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Código ISO (2 caracteres)</Label>
                        <Input
                          placeholder="Ex: BR"
                          value={customCode}
                          onChange={(e) => setCustomCode(e.target.value.toUpperCase().slice(0, 2))}
                          maxLength={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nome do País</Label>
                        <Input
                          placeholder="Ex: Brasil"
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Selecione o País</Label>
                      <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha um país..." />
                        </SelectTrigger>
                        <SelectContent>
                          <ScrollArea className="h-[200px]">
                            {availableCountries.map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.name} ({country.code})
                              </SelectItem>
                            ))}
                          </ScrollArea>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAddCountry} disabled={addCountryMutation.isPending}>
                    {addCountryMutation.isPending ? "Adicionando..." : "Adicionar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {rulesLoading ? (
            <p className="text-center text-muted-foreground py-4">Carregando...</p>
          ) : rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum país na whitelist</p>
              <p className="text-sm">Adicione países para habilitar o bloqueio geográfico</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>País</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Adicionado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {rule.country_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{rule.country_code}</Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={rule.is_active}
                        onCheckedChange={(checked) =>
                          toggleCountryMutation.mutate({ id: rule.id, isActive: checked })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(rule.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirmId(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Blocked Attempts Log */}
      {blockedAttempts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Tentativas Bloqueadas (Últimas 50)
            </CardTitle>
            <CardDescription>
              Tentativas de login de países não autorizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>País</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blockedAttempts.map((attempt) => (
                  <TableRow key={attempt.id}>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(attempt.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {attempt.ip_address}
                      </code>
                    </TableCell>
                    <TableCell>
                      {attempt.country_name ? (
                        <Badge variant="destructive">
                          {attempt.country_name} ({attempt.country_code})
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Desconhecido</span>
                      )}
                    </TableCell>
                    <TableCell>{attempt.email || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover país da whitelist?</AlertDialogTitle>
            <AlertDialogDescription>
              Usuários deste país não poderão mais fazer login no sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirmId && deleteCountryMutation.mutate(deleteConfirmId)}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
