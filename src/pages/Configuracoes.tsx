import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Bell, Shield, Link, CheckCircle2, XCircle, Loader2, RefreshCw, Save, Globe, Database, Zap, Truck, Package } from "lucide-react";
import { useIntegrationValidation } from "@/hooks/useIntegrationValidation";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { OnboardingTooltip } from "@/components/onboarding/OnboardingTooltip";
import { BusinessRulesManager } from "@/components/automation/BusinessRulesManager";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Configuracoes() {
  const integrationValidation = useIntegrationValidation();
  const notificationPrefs = useNotificationPreferences();
  const [saving, setSaving] = useState(false);

  const integrations = integrationValidation?.integrations || [];
  const isValidating = integrationValidation?.isValidating || false;
  const validateAll = integrationValidation?.validateAll;
  const validateSingle = integrationValidation?.validateSingle;

  const preferences = notificationPrefs?.preferences || {};
  const updatePreference = notificationPrefs?.updatePreference;
  const isLoaded = notificationPrefs?.isLoaded ?? true;

  const handleSave = async () => { 
    setSaving(true); 
    await new Promise(r => setTimeout(r, 1000)); 
    toast.success("Configurações salvas!"); 
    setSaving(false); 
  };

  const integrationsList = [
    { id: "supabase", name: "Supabase", icon: Database, status: "connected" },
    { id: "bitrix24", name: "Bitrix24", icon: Link, status: integrations.find(i => i.name === "bitrix24")?.status || "unknown" },
    { id: "lalamove", name: "Lalamove", icon: Globe, status: integrations.find(i => i.name === "lalamove")?.status || "unknown" },
    { id: "n8n", name: "n8n", icon: Settings, status: integrations.find(i => i.name === "n8n")?.status || "unknown" },
    { id: "rodonaves", name: "Rodonaves RTE", icon: Truck, status: "connected" },
    { id: "melhorenvio", name: "Melhor Envio", icon: Package, status: "connected" },
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
    if (updatePreference) {
      // Map UI keys to actual preference keys
      const keyMap: Record<string, keyof import('@/hooks/useNotificationPreferences').NotificationPreferences> = {
        'email': 'notifications_email',
        'push': 'notifications_push',
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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><h1 className="text-display flex items-center gap-3"><div className="flex items-center justify-center w-12 h-12 rounded-xl bg-muted"><Settings className="w-6 h-6 text-muted-foreground" /></div>Configurações</h1><p className="text-muted-foreground mt-1">Gerencie as configurações do sistema</p></div>
          <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Salvar</Button>
        </div>
        <OnboardingTooltip
          id="configuracoes-tabs"
          title="Personalize seu sistema"
          description="Configure integrações com serviços externos, personalize notificações e ajuste as configurações de segurança."
          position="bottom"
        >
          <Tabs defaultValue="integrations">
            <TabsList>
              <TabsTrigger value="integrations"><Link className="w-4 h-4 mr-2" />Integrações</TabsTrigger>
              <TabsTrigger value="automation"><Zap className="w-4 h-4 mr-2" />Automações</TabsTrigger>
              <TabsTrigger value="notifications"><Bell className="w-4 h-4 mr-2" />Notificações</TabsTrigger>
              <TabsTrigger value="security"><Shield className="w-4 h-4 mr-2" />Segurança</TabsTrigger>
            </TabsList>
            <TabsContent value="integrations" className="space-y-4">
              <div className="flex justify-end"><Button variant="outline" onClick={handleValidateAll} disabled={isValidating}><RefreshCw className={cn("w-4 h-4 mr-2", isValidating && "animate-spin")} />Validar Todas</Button></div>
              <div className="grid gap-4">{integrationsList.map((int) => {
                const Icon = int.icon;
                const isConnected = int.status === "connected";
                return (
                  <div key={int.id} className="card-interactive flex items-center justify-between">
                    <div className="flex items-center gap-3"><div className={cn("p-2 rounded-lg", isConnected ? "bg-success/15" : "bg-muted")}><Icon className={cn("w-5 h-5", isConnected ? "text-success" : "text-muted-foreground")} /></div><div><p className="font-semibold">{int.name}</p><p className="text-sm text-muted-foreground">ID: {int.id}</p></div></div>
                    <div className="flex items-center gap-3">
                      <Badge variant={isConnected ? "default" : int.status === "error" ? "destructive" : "secondary"}>{isConnected ? <><CheckCircle2 className="w-3 h-3 mr-1" />Conectado</> : int.status === "error" ? <><XCircle className="w-3 h-3 mr-1" />Erro</> : "Pendente"}</Badge>
                      <Button variant="outline" size="sm" onClick={() => handleValidateIntegration(int.id)}>Testar</Button>
                    </div>
                  </div>
                );
              })}</div>
            </TabsContent>
            <TabsContent value="automation" className="space-y-4">
              <BusinessRulesManager />
            </TabsContent>
            <TabsContent value="notifications" className="space-y-4">
              <div className="card-base p-4 space-y-4">
                {[{ key: "email", label: "Notificações por Email" }, { key: "push", label: "Notificações Push" }, { key: "sms", label: "Notificações SMS" }, { key: "slack", label: "Integração Slack" }].map((pref) => (
                  <div key={pref.key} className="flex items-center justify-between py-2">
                    <div><p className="font-medium">{pref.label}</p><p className="text-sm text-muted-foreground">Receber alertas via {pref.key}</p></div>
                    <Switch 
                      checked={(preferences as Record<string, boolean>)?.[pref.key] ?? false} 
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
