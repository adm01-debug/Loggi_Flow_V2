import { useState, useEffect } from "react";
import { useConfirmExit } from "@/hooks/common/useConfirmExit";
import { useIntegrationValidation } from "@/hooks/security/useIntegrationValidation";
import { useNotificationPreferences } from "@/hooks/notifications/useNotificationPreferences";
import { type NotificationPreferences } from "@/hooks";
import { format } from "date-fns";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Bell, Shield, Link, CheckCircle2, XCircle, Loader2, RefreshCw, Save, Globe, Database, Zap, Truck, Package, Palette } from "lucide-react";
import { PreferencePanel } from "@/features/preferences";
import { OnboardingTooltip } from "@/components/onboarding/OnboardingTooltip";
import { BusinessRulesManager } from "@/components/automation/BusinessRulesManager";
import { toast } from "sonner";
import { cn } from "@/lib/utils";


export default function Configuracoes() {
  const integrationValidation = useIntegrationValidation();
  const notificationPrefs = useNotificationPreferences();
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const integrations = integrationValidation?.integrations || [];
  const isValidating = integrationValidation?.isValidating || false;
  const validateAll = integrationValidation?.validateAll;
  const validateSingle = integrationValidation?.validateSingle;

  const preferences = notificationPrefs?.preferences || {};
  const updatePreference = notificationPrefs?.updatePreference;
  const isLoaded = notificationPrefs?.isLoaded ?? true;

  useConfirmExit(isDirty);

  const handleSave = async () => { 
    setSaving(true); 
    try {
      // In a real app, this would call an API or update Supabase
      await new Promise(r => setTimeout(r, 1000)); 
      toast.success("Configurações salvas!"); 
      setIsDirty(false);
    } catch (error) {
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const integrationsList = [
    { id: "supabase", name: "Supabase", icon: Database, status: "connected" as const },
    { id: "bitrix24", name: "Bitrix24", icon: Link, status: (integrations.find(i => i.name === "Bitrix24")?.status || "not_configured") as any },
    { id: "lalamove", name: "Lalamove", icon: Globe, status: (integrations.find(i => i.name === "Lalamove")?.status || "not_configured") as any },
    { id: "n8n", name: "n8n", icon: Settings, status: (integrations.find(i => i.name === "n8n")?.status || "unknown") as any },
    { id: "rodonaves", name: "Rodonaves RTE", icon: Truck, status: (integrations.find(i => i.name === "Rodonaves")?.status || "not_configured") as any },
    { id: "melhorenvio", name: "Melhor Envio", icon: Package, status: (integrations.find(i => i.name === "Melhor Envio")?.status || "not_configured") as any },
  ];

  const handleValidateIntegration = (id: string) => {
    if (validateSingle) {
      validateSingle(id);
    }
  };

  const handleValidateAll = () => {
    if (validateAll) {
      validateAll();
    }
  };

  const handleUpdatePreference = (key: string, value: boolean) => {
    setIsDirty(true);
    if (updatePreference) {
      // Map UI keys to actual preference keys
      const keyMap: Record<string, keyof NotificationPreferences> = {
        'email': 'notifications_email',
        'push': 'notifications_push',
        'whatsapp': 'notifications_whatsapp',
        'sla': 'notifications_sla',
        'ocorrencias': 'notifications_ocorrencias',
        'coletas': 'notifications_coletas',
        'entregas': 'notifications_entregas',
        'custos': 'notifications_custos',
        'achievements': 'notifications_achievements',
      };
      const mappedKey = keyMap[key];
      if (mappedKey) {
        updatePreference(mappedKey, value);
      }
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between px-2">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white flex items-center gap-4 tracking-tighter uppercase italic">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black border border-white/10 shadow-2xl transition-transform hover:scale-110">
                  <Settings className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="drop-shadow-2xl">Nexus Hub</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                    <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Core_System_Admin</span>
                  </div>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">GOVERNANÇA • INTEGRAÇÕES • SEGURANÇA</span>
                </div>
              </div>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {isDirty && <Badge variant="outline" className="text-warning border-warning animate-pulse">Alterações não salvas</Badge>}
            <Button size="lg" onClick={handleSave} disabled={saving || !isDirty} className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[11px] gap-2 bg-gradient-to-r from-primary via-primary/90 to-primary/80 shadow-xl shadow-primary/20 hover:scale-[1.03] transition-all">{saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Salvar</Button>
          </div>
        </div>
        <OnboardingTooltip
          id="configuracoes-tabs"
          title="Personalize seu sistema"
          description="Configure integrações com serviços externos, personalize notificações e ajuste as configurações de segurança."
          position="bottom"
        >
          <Tabs defaultValue="integrations">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto p-1.5 bg-sidebar-accent/50 rounded-2xl border border-white/5 mb-8">
              <TabsTrigger value="integrations" className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all"><Link className="w-4 h-4" />Integrações</TabsTrigger>
              <TabsTrigger value="preferences" className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all"><Palette className="w-4 h-4" />Personalização</TabsTrigger>
              <TabsTrigger value="automation" className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all"><Zap className="w-4 h-4" />Automações</TabsTrigger>
              <TabsTrigger value="notifications" className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all"><Bell className="w-4 h-4" />Notificações</TabsTrigger>
              <TabsTrigger value="security" className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all"><Shield className="w-4 h-4" />Segurança</TabsTrigger>
            </TabsList>
            <TabsContent value="integrations" className="space-y-4">
              <div className="flex justify-end mb-6"><Button variant="outline" size="sm" onClick={handleValidateAll} disabled={isValidating} className="h-10 px-6 rounded-xl border-2 font-bold uppercase tracking-widest text-[10px] gap-2"><RefreshCw className={cn("w-3.5 h-3.5", isValidating && "animate-spin")} />Validar Todas</Button></div>
              <div className="grid gap-4">{integrationsList.map((int) => {
                const Icon = int.icon;
                const integrationData = integrations.find(i => i.name.toLowerCase() === int.name.toLowerCase() || i.name.toLowerCase() === int.id.toLowerCase());
                const status = integrationData?.status || int.status;
                const isConnected = status === "connected";
                const isError = status === "error";
                
                return (
                  <div key={int.id} className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-card to-card/95 border-none shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className={cn("p-4 rounded-2xl transition-all shadow-inner group-hover:scale-110 duration-500", isConnected ? "bg-success/15 text-success" : "bg-muted/20 text-muted-foreground")}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-black text-xl tracking-tighter uppercase italic">{int.name}</p>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-0.5">ID_NODE: {int.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <Badge variant={isConnected ? "default" : isError ? "destructive" : "secondary"} className="mb-1">
                          {isConnected ? <><CheckCircle2 className="w-3 h-3 mr-1" />Conectado</> : isError ? <><XCircle className="w-3 h-3 mr-1" />Erro</> : "Pendente"}
                        </Badge>
                        {integrationData?.lastCheck && (
                          <p className="text-[10px] text-muted-foreground">Check: {format(new Date(integrationData.lastCheck), 'HH:mm:ss')}</p>
                        )}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleValidateIntegration(int.id)} disabled={isValidating} className="h-10 px-6 rounded-xl border-2 font-black uppercase tracking-widest text-[10px] hover:bg-primary/5">Testar</Button>
                    </div>
                  </div>
                );
              })}</div>
            </TabsContent>
            <TabsContent value="preferences" className="space-y-4">
              <div className="card-base p-6">
                <PreferencePanel />
              </div>
            </TabsContent>
            <TabsContent value="automation" className="space-y-4">
              <BusinessRulesManager />
            </TabsContent>
            <TabsContent value="notifications" className="space-y-4">
              <div className="card-base p-4 space-y-4">
                {[{ key: "email", label: "Notificações por Email" }, { key: "push", label: "Notificações Push" }, { key: "whatsapp", label: "Notificações WhatsApp" }, { key: "sms", label: "Notificações SMS" }, { key: "slack", label: "Integração Slack" }].map((pref) => (
                  <div key={pref.key} className="flex items-center justify-between py-2">
                    <div><p className="font-medium">{pref.label}</p><p className="text-sm text-muted-foreground">Receber alertas via {pref.key}</p></div>
                    <Switch 
                      checked={(preferences as any)?.[pref.key] ?? false} 
                      onCheckedChange={(v) => handleUpdatePreference(pref.key, v)} 
                      disabled={!isLoaded} 
                    />
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="security" className="space-y-4">
              <div className="card-base p-4 space-y-4">
                <div><Label>API Key</Label><div className="flex gap-2 mt-1"><Input type="password" value="••••••••••••••••" readOnly /><Button variant="outline">Regenerar</Button></div></div>
                <div><Label>Webhook Secret</Label><div className="flex gap-2 mt-1"><Input type="password" value="••••••••••••••••" readOnly /><Button variant="outline">Regenerar</Button></div></div>
                <div className="flex items-center justify-between py-2"><div><p className="font-medium">Two-Factor Authentication</p><p className="text-sm text-muted-foreground">Adicionar camada extra de segurança</p></div><Switch /></div>
                <div className="flex items-center justify-between py-2"><div><p className="font-medium">Session Timeout</p><p className="text-sm text-muted-foreground">Logout automático após inatividade</p></div><Switch defaultChecked /></div>
              </div>
            </TabsContent>
          </Tabs>
        </OnboardingTooltip>
      </div>
    </MainLayout>
  );
}
