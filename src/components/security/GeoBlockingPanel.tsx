import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/auth/useAuth";
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
import { Globe, Plus, Trash2, Shield, ShieldOff, MapPin } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { GeoBlockingStats } from "./GeoBlockingStats";
import { GeoBlockingAttemptsLog } from "./GeoBlockingAttemptsLog";

const COUNTRIES = [
  { code: "BR", name: "Brasil" }, { code: "US", name: "Estados Unidos" }, { code: "PT", name: "Portugal" },
  { code: "ES", name: "Espanha" }, { code: "AR", name: "Argentina" }, { code: "CL", name: "Chile" },
  { code: "CO", name: "Colômbia" }, { code: "MX", name: "México" }, { code: "PE", name: "Peru" },
  { code: "UY", name: "Uruguai" }, { code: "PY", name: "Paraguai" }, { code: "BO", name: "Bolívia" },
  { code: "EC", name: "Equador" }, { code: "VE", name: "Venezuela" }, { code: "DE", name: "Alemanha" },
  { code: "FR", name: "França" }, { code: "IT", name: "Itália" }, { code: "GB", name: "Reino Unido" },
  { code: "CA", name: "Canadá" }, { code: "JP", name: "Japão" }, { code: "CN", name: "China" },
  { code: "AU", name: "Austrália" }, { code: "NZ", name: "Nova Zelândia" }, { code: "ZA", name: "África do Sul" },
  { code: "IN", name: "Índia" }, { code: "KR", name: "Coreia do Sul" }, { code: "RU", name: "Rússia" },
  { code: "NL", name: "Holanda" }, { code: "BE", name: "Bélgica" }, { code: "CH", name: "Suíça" },
  { code: "AT", name: "Áustria" }, { code: "SE", name: "Suécia" }, { code: "NO", name: "Noruega" },
  { code: "DK", name: "Dinamarca" }, { code: "FI", name: "Finlândia" }, { code: "PL", name: "Polônia" },
  { code: "IE", name: "Irlanda" }, { code: "SG", name: "Singapura" }, { code: "AE", name: "Emirados Árabes" },
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

  const { data: blockingSettings } = useQuery({
    queryKey: ["geo-blocking-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("geo_blocking_settings").select("*").limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const updateModeMutation = useMutation({
    mutationFn: async (mode: string) => {
      if (blockingSettings?.id) {
        const { error } = await supabase.from("geo_blocking_settings").update({ mode, default_action: mode === "whitelist" ? "block" : "allow" }).eq("id", blockingSettings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("geo_blocking_settings").insert({ mode, default_action: mode === "whitelist" ? "block" : "allow" });
        if (error) throw error;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["geo-blocking-settings"] }); toast.success("Modo de bloqueio atualizado"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: blockingRules = [] } = useQuery({
    queryKey: ["geo-blocking-rules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("geo_blocking_rules").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ["geo-access-rules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("geo_access_rules").select("*").order("country_name");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const { data: blockedAttempts = [] } = useQuery({
    queryKey: ["geo-blocked-attempts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("geo_blocked_attempts").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const addCountryMutation = useMutation({
    mutationFn: async ({ code, name }: { code: string; name: string }) => {
      const { error } = await supabase.from("geo_access_rules").insert({ country_code: code.toUpperCase(), country_name: name });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["geo-access-rules"] }); toast.success("País adicionado à whitelist"); resetForm(); setIsAddDialogOpen(false); },
    onError: (error: Error) => { toast.error(error.message.includes("duplicate") ? "Este país já está na whitelist" : "Erro ao adicionar país: " + error.message); },
  });

  const toggleCountryMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase.from("geo_access_rules").update({ is_active: isActive }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["geo-access-rules"] }); toast.success("Status atualizado"); },
    onError: (error: Error) => toast.error("Erro ao atualizar: " + error.message),
  });

  const deleteCountryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("geo_access_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["geo-access-rules"] }); toast.success("País removido da whitelist"); setDeleteConfirmId(null); },
    onError: (error: Error) => toast.error("Erro ao remover: " + error.message),
  });

  const resetForm = () => { setSelectedCountry(""); setCustomCode(""); setCustomName(""); setUseCustom(false); };

  const handleAddCountry = () => {
    if (useCustom) {
      if (!customCode || !customName) { toast.error("Preencha código e nome do país"); return; }
      if (customCode.length !== 2) { toast.error("O código do país deve ter 2 caracteres"); return; }
      addCountryMutation.mutate({ code: customCode, name: customName });
    } else {
      if (!selectedCountry) { toast.error("Selecione um país"); return; }
      const country = COUNTRIES.find((c) => c.code === selectedCountry);
      if (country) addCountryMutation.mutate({ code: country.code, name: country.name });
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
      {/* Blocking Mode */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" />Modo de Bloqueio Geográfico</CardTitle>
          <CardDescription>Configure o modo de controle de acesso geográfico</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Select value={blockingSettings?.mode || "whitelist"} onValueChange={(v) => updateModeMutation.mutate(v)}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="whitelist">Whitelist (permitir listados)</SelectItem>
                <SelectItem value="blacklist">Blacklist (bloquear listados)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {blockingSettings?.mode === "blacklist" ? "Todos os países são permitidos, exceto os listados" : "Apenas países na whitelist podem acessar"}
            </p>
            {blockingRules.length > 0 && (
              <Badge variant="outline" className="sm:ml-auto">{blockingRules.filter(r => r.is_active).length} regras avançadas ativas</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <GeoBlockingStats activeRulesCount={activeRules.length} totalRulesCount={rules.length} blockedAttemptsCount={blockedAttempts.length} />

      {/* Whitelist Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />Whitelist de Países</CardTitle>
              <CardDescription>Apenas usuários de países na whitelist podem fazer login</CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Adicionar País</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar País à Whitelist</DialogTitle>
                  <DialogDescription>Permita acesso de um novo país ao sistema</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={useCustom} onCheckedChange={setUseCustom} id="custom-mode" />
                    <Label htmlFor="custom-mode">Inserir país manualmente</Label>
                  </div>
                  {useCustom ? (
                    <div className="space-y-4">
                      <div className="space-y-2"><Label>Código ISO (2 caracteres)</Label><Input placeholder="Ex: BR" value={customCode} onChange={(e) => setCustomCode(e.target.value.toUpperCase().slice(0, 2))} maxLength={2} /></div>
                      <div className="space-y-2"><Label>Nome do País</Label><Input placeholder="Ex: Brasil" value={customName} onChange={(e) => setCustomName(e.target.value)} /></div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Selecione o País</Label>
                      <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                        <SelectTrigger><SelectValue placeholder="Escolha um país..." /></SelectTrigger>
                        <SelectContent><ScrollArea className="h-[200px]">{availableCountries.map((country) => (<SelectItem key={country.code} value={country.code}>{country.name} ({country.code})</SelectItem>))}</ScrollArea></SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleAddCountry} disabled={addCountryMutation.isPending}>{addCountryMutation.isPending ? "Adicionando..." : "Adicionar"}</Button>
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
                  <TableHead>País</TableHead><TableHead>Código</TableHead><TableHead>Status</TableHead><TableHead>Adicionado em</TableHead><TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium"><div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />{rule.country_name}</div></TableCell>
                    <TableCell><Badge variant="outline">{rule.country_code}</Badge></TableCell>
                    <TableCell><Switch checked={rule.is_active} onCheckedChange={(checked) => toggleCountryMutation.mutate({ id: rule.id, isActive: checked })} /></TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(rule.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteConfirmId(rule.id)}><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <GeoBlockingAttemptsLog attempts={blockedAttempts} />

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover país da whitelist?</AlertDialogTitle>
            <AlertDialogDescription>Usuários deste país não poderão mais fazer login no sistema.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteConfirmId && deleteCountryMutation.mutate(deleteConfirmId)}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
