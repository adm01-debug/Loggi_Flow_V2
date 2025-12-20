import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTimezone, brazilianTimezones } from "@/hooks/useTimezone";
import { MainLayout } from "@/components/layout/MainLayout";
import { Settings, Bell, User, Palette, Link2, Database, Loader2, Save, Check, Moon, Sun, BarChart3, Package, Truck, DollarSign, Trophy, AlertTriangle, Mail, RefreshCw, ExternalLink, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { NotificationStats } from "@/components/notifications/NotificationStats";
import { NotificationPermissionStatus } from "@/components/notifications/BrowserNotificationPrompt";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { useIntegrationValidation, getStatusColor, getStatusLabel } from "@/hooks/useIntegrationValidation";
import { useBitrix24 } from "@/hooks/useBitrix24";
import { useN8n } from "@/hooks/useN8n";

interface AppSettings {
  theme: "light" | "dark" | "system";
  language: string;
  timezone: string;
}

const defaultAppSettings: AppSettings = {
  theme: "system",
  language: "pt-BR",
  timezone: "America/Sao_Paulo",
};

export default function Configuracoes() {
  const { user } = useAuth();
  const { timezone, setTimezone } = useTimezone();
  const queryClient = useQueryClient();
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: "", avatar_url: "" });
  const [appSettings, setAppSettings] = useState<AppSettings>({ ...defaultAppSettings, timezone });
  const [hasChanges, setHasChanges] = useState(false);
  const [configDialog, setConfigDialog] = useState<string | null>(null);
  
  // Use the notification preferences hook
  const { preferences, updatePreference } = useNotificationPreferences();
  
  // Integration hooks
  const { integrations, isValidating, validateAll, validateSingle } = useIntegrationValidation();
  const { webhookUrl: bitrix24Url, setWebhookUrl: setBitrix24Url } = useBitrix24();
  const { webhookUrl: n8nUrl, setWebhookUrl: setN8nUrl } = useN8n();
  
  const [tempBitrix24Url, setTempBitrix24Url] = useState(bitrix24Url);
  const [tempN8nUrl, setTempN8nUrl] = useState(n8nUrl);

  // Fetch profile
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Load app settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`app_settings_${user?.id}`);
    if (saved) {
      setAppSettings(JSON.parse(saved));
    }
  }, [user?.id]);
  
  // Update temp URLs when hooks change
  useEffect(() => {
    setTempBitrix24Url(bitrix24Url);
  }, [bitrix24Url]);
  
  useEffect(() => {
    setTempN8nUrl(n8nUrl);
  }, [n8nUrl]);

  // Update profile mutation
  const updateProfileMut = useMutation({
    mutationFn: async (data: { full_name: string; avatar_url?: string }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase.from("profiles").upsert({ id: user.id, ...data, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setEditProfile(false);
      toast.success("Perfil atualizado!");
    },
    onError: (e) => toast.error("Erro: " + e.message),
  });

  // Save app settings
  const saveAppSettings = () => {
    if (user?.id) {
      localStorage.setItem(`app_settings_${user.id}`, JSON.stringify(appSettings));
      setHasChanges(false);
      
      // Apply timezone
      setTimezone(appSettings.timezone);
      
      toast.success("Configurações salvas!");
      
      // Apply theme
      if (appSettings.theme === "dark") {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else if (appSettings.theme === "light") {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      } else {
        localStorage.setItem("theme", "system");
        if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    }
  };

  const updateAppSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setAppSettings((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };
  
  const handleSaveIntegration = (name: string) => {
    if (name === 'Bitrix24') {
      setBitrix24Url(tempBitrix24Url);
      toast.success('Bitrix24 configurado!');
    } else if (name === 'n8n') {
      setN8nUrl(tempN8nUrl);
      toast.success('n8n configurado!');
    }
    setConfigDialog(null);
  };
  
  const handleTestIntegration = async (name: string) => {
    await validateSingle(name);
  };

  return (
    <MainLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display text-foreground flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent"><Settings className="w-6 h-6 text-accent-foreground" /></div>
              Configurações
            </h1>
            <p className="text-muted-foreground mt-1">Gerencie as configurações do sistema</p>
          </div>
          {hasChanges && (
            <Button onClick={saveAppSettings} className="gap-2"><Save className="w-4 h-4" />Salvar Alterações</Button>
          )}
        </div>

        <div className="space-y-6">
          {/* Profile */}
          <div className="card-base space-y-4">
            <div className="flex items-center gap-3"><User className="w-5 h-5 text-primary" /><h2 className="font-display font-semibold text-lg">Perfil</h2></div>
            <Separator />
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Nome completo</p>
                  <p className="text-sm text-muted-foreground">{profile?.full_name || user?.email || "Não definido"}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setProfileForm({ full_name: profile?.full_name || "", avatar_url: profile?.avatar_url || "" }); setEditProfile(true); }}>Editar</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications - Now using the real preferences hook */}
          <div className="card-base space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><Bell className="w-5 h-5 text-warning" /><h2 className="font-display font-semibold text-lg">Preferências de Notificação</h2></div>
              <NotificationPermissionStatus />
            </div>
            <Separator />
            
            {/* General Notification Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Canais de Notificação</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <div><Label htmlFor="notif-email">Notificações por Email</Label><p className="text-sm text-muted-foreground">Receber resumos e alertas por email</p></div>
                </div>
                <Switch id="notif-email" checked={preferences.notifications_email} onCheckedChange={(v) => updatePreference("notifications_email", v)} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  <div><Label htmlFor="notif-push">Notificações Push</Label><p className="text-sm text-muted-foreground">Alertas em tempo real no navegador</p></div>
                </div>
                <Switch id="notif-push" checked={preferences.notifications_push} onCheckedChange={(v) => updatePreference("notifications_push", v)} />
              </div>
            </div>

            <Separator />
            
            {/* Category-specific Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Categorias de Alerta</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <div><Label htmlFor="notif-sla">Alertas de SLA</Label><p className="text-sm text-muted-foreground">Avisar quando prazos estiverem próximos</p></div>
                </div>
                <Switch id="notif-sla" checked={preferences.notifications_sla} onCheckedChange={(v) => updatePreference("notifications_sla", v)} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <div><Label htmlFor="notif-ocor">Novas Ocorrências</Label><p className="text-sm text-muted-foreground">Notificar sobre problemas e incidentes</p></div>
                </div>
                <Switch id="notif-ocor" checked={preferences.notifications_ocorrencias} onCheckedChange={(v) => updatePreference("notifications_ocorrencias", v)} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="w-4 h-4 text-info" />
                  <div><Label htmlFor="notif-coletas">Coletas</Label><p className="text-sm text-muted-foreground">Atualizações sobre coletas</p></div>
                </div>
                <Switch id="notif-coletas" checked={preferences.notifications_coletas} onCheckedChange={(v) => updatePreference("notifications_coletas", v)} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Truck className="w-4 h-4 text-success" />
                  <div><Label htmlFor="notif-entregas">Entregas</Label><p className="text-sm text-muted-foreground">Atualizações sobre entregas</p></div>
                </div>
                <Switch id="notif-entregas" checked={preferences.notifications_entregas} onCheckedChange={(v) => updatePreference("notifications_entregas", v)} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-warning" />
                  <div><Label htmlFor="notif-custos">Alertas de Custo</Label><p className="text-sm text-muted-foreground">Notificar sobre limites de custo</p></div>
                </div>
                <Switch id="notif-custos" checked={preferences.notifications_custos} onCheckedChange={(v) => updatePreference("notifications_custos", v)} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="w-4 h-4 text-primary" />
                  <div><Label htmlFor="notif-achievements">Conquistas</Label><p className="text-sm text-muted-foreground">Notificar sobre novas conquistas</p></div>
                </div>
                <Switch id="notif-achievements" checked={preferences.notifications_achievements} onCheckedChange={(v) => updatePreference("notifications_achievements", v)} />
              </div>
            </div>
          </div>

          {/* Notification Stats */}
          <div className="card-base space-y-4">
            <div className="flex items-center gap-3"><BarChart3 className="w-5 h-5 text-primary" /><h2 className="font-display font-semibold text-lg">Estatísticas de Notificações</h2></div>
            <Separator />
            <NotificationStats />
          </div>

          {/* Appearance */}
          <div className="card-base space-y-4">
            <div className="flex items-center gap-3"><Palette className="w-5 h-5 text-info" /><h2 className="font-display font-semibold text-lg">Aparência</h2></div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div><Label>Tema</Label><p className="text-sm text-muted-foreground">Escolha o tema do sistema</p></div>
                <Select value={appSettings.theme} onValueChange={(v) => updateAppSetting("theme", v as "light" | "dark" | "system")}>
                  <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light"><div className="flex items-center gap-2"><Sun className="w-4 h-4" />Claro</div></SelectItem>
                    <SelectItem value="dark"><div className="flex items-center gap-2"><Moon className="w-4 h-4" />Escuro</div></SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div><Label>Idioma</Label><p className="text-sm text-muted-foreground">Idioma da interface</p></div>
                <Select value={appSettings.language} onValueChange={(v) => updateAppSetting("language", v)}>
                  <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (BR)</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <div><Label>Fuso Horário</Label><p className="text-sm text-muted-foreground">Timezone para datas e horários</p></div>
                </div>
                <Select value={appSettings.timezone} onValueChange={(v) => updateAppSetting("timezone", v)}>
                  <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {brazilianTimezones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Integrations */}
          <div className="card-base space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><Link2 className="w-5 h-5 text-success" /><h2 className="font-display font-semibold text-lg">Integrações</h2></div>
              <Button variant="outline" size="sm" onClick={validateAll} disabled={isValidating}>
                {isValidating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Validar Todas
              </Button>
            </div>
            <Separator />
            <div className="space-y-4">
              {integrations.map((int) => (
                <div key={int.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(int.status)}`} />
                    <div>
                      <p className="font-medium">{int.name}</p>
                      <p className="text-sm text-muted-foreground">{getStatusLabel(int.status)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {(int.name === 'Bitrix24' || int.name === 'n8n') && (
                      <Button variant="outline" size="sm" onClick={() => setConfigDialog(int.name)}>Configurar</Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleTestIntegration(int.name)} disabled={isValidating}>
                      <RefreshCw className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data */}
          <div className="card-base space-y-4">
            <div className="flex items-center gap-3"><Database className="w-5 h-5 text-destructive" /><h2 className="font-display font-semibold text-lg">Dados</h2></div>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div><p className="font-medium">Exportar Dados</p><p className="text-sm text-muted-foreground">Baixe todos os seus dados em formato JSON</p></div>
                <Button variant="outline" size="sm" onClick={async () => {
                  try {
                    toast.info("Exportando dados...");
                    const exportData: Record<string, unknown[]> = {};
                    
                    const { data: coletas } = await supabase.from("coletas").select("*");
                    const { data: entregas } = await supabase.from("entregas").select("*");
                    const { data: fretesInternos } = await supabase.from("fretes_internos").select("*");
                    const { data: ocorrencias } = await supabase.from("ocorrencias").select("*");
                    const { data: clientes } = await supabase.from("clientes").select("*");
                    const { data: fornecedores } = await supabase.from("fornecedores").select("*");
                    const { data: transportadoras } = await supabase.from("transportadoras").select("*");
                    
                    exportData["coletas"] = coletas || [];
                    exportData["entregas"] = entregas || [];
                    exportData["fretes_internos"] = fretesInternos || [];
                    exportData["ocorrencias"] = ocorrencias || [];
                    exportData["clientes"] = clientes || [];
                    exportData["fornecedores"] = fornecedores || [];
                    exportData["transportadoras"] = transportadoras || [];
                    
                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `loggiflow-export-${new Date().toISOString().split("T")[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.success("Dados exportados com sucesso!");
                  } catch (e) {
                    toast.error("Erro ao exportar: " + (e as Error).message);
                  }
                }}>Exportar</Button>
              </div>
              <div className="flex items-center justify-between">
                <div><p className="font-medium text-destructive">Limpar Cache</p><p className="text-sm text-muted-foreground">Remove dados temporários do navegador</p></div>
                <Button variant="destructive" size="sm" onClick={() => { localStorage.clear(); toast.success("Cache limpo!"); }}>Limpar</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Dialog */}
        <Dialog open={editProfile} onOpenChange={setEditProfile}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Perfil</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2"><Label>Nome Completo</Label><Input value={profileForm.full_name} onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} placeholder="Seu nome" /></div>
              <div className="grid gap-2"><Label>URL do Avatar</Label><Input value={profileForm.avatar_url} onChange={(e) => setProfileForm({ ...profileForm, avatar_url: e.target.value })} placeholder="https://..." /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditProfile(false)}>Cancelar</Button>
              <Button onClick={() => updateProfileMut.mutate(profileForm)} disabled={updateProfileMut.isPending}>{updateProfileMut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Bitrix24 Config Dialog */}
        <Dialog open={configDialog === 'Bitrix24'} onOpenChange={() => setConfigDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configurar Bitrix24</DialogTitle>
              <DialogDescription>Insira a URL do webhook do Bitrix24</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Webhook URL</Label>
                <Input value={tempBitrix24Url} onChange={(e) => setTempBitrix24Url(e.target.value)} placeholder="https://seu-dominio.bitrix24.com.br/rest/..." />
                <p className="text-xs text-muted-foreground">Obtenha em Bitrix24 → Aplicativos → Webhooks</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfigDialog(null)}>Cancelar</Button>
              <Button onClick={() => handleSaveIntegration('Bitrix24')}><Save className="w-4 h-4 mr-2" />Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* n8n Config Dialog */}
        <Dialog open={configDialog === 'n8n'} onOpenChange={() => setConfigDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Configurar n8n</DialogTitle>
              <DialogDescription>Insira a URL do webhook do n8n</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Webhook URL</Label>
                <Input value={tempN8nUrl} onChange={(e) => setTempN8nUrl(e.target.value)} placeholder="https://seu-n8n.com/webhook/..." />
                <p className="text-xs text-muted-foreground">Crie um webhook trigger no n8n e cole a URL aqui</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfigDialog(null)}>Cancelar</Button>
              <Button onClick={() => handleSaveIntegration('n8n')}><Save className="w-4 h-4 mr-2" />Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
