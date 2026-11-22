/* eslint-disable max-lines */
import { useState } from "react";
import { useConfirmExit } from "@/hooks/common/useConfirmExit";
import {
  useIntegrationValidation,
  type IntegrationStatus,
} from "@/hooks/security/useIntegrationValidation";
import { useNotificationPreferences } from "@/hooks/notifications/useNotificationPreferences";
import { type NotificationPreferences } from "@/hooks";
import { format } from "date-fns";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Bell,
  Shield,
  Link,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Save,
  Globe,
  Database,
  Zap,
  Truck,
  Package,
  Palette,
} from "lucide-react";
import { PreferencePanel } from "@/features/preferences";
import { OnboardingTooltip } from "@/components/onboarding/OnboardingTooltip";
import { BusinessRulesManager } from "@/components/automation/BusinessRulesManager";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { useSearchParams, useNavigate } from "react-router-dom";
import { TwoFactorSetup } from "@/components/security/TwoFactorSetup";
import { useSessionTimeout } from "@/hooks/auth/useSessionTimeout";

export default function Configuracoes() {
  const [searchParams] = useSearchParams();
  const integrationValidation = useIntegrationValidation();
  const notificationPrefs = useNotificationPreferences();
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const navigate = useNavigate();
  const { sessionInfo, refreshSession } = useSessionTimeout();

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
      // Notification preferences are saved automatically via updatePreference.
      // If additional page-level settings are added, persist them here.
      setIsDirty(false);
      toast.success("Configurações salvas!");
    } catch {
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const findStatus = (
    name: string,
    fallback: IntegrationStatus["status"] = "not_configured",
  ) =>
    (integrations.find((i) => i.name === name)?.status ||
      fallback) as IntegrationStatus["status"];

  const integrationsList = [
    {
      id: "supabase",
      name: "Supabase",
      icon: Database,
      status: "connected" as IntegrationStatus["status"],
    },
    {
      id: "bitrix24",
      name: "Bitrix24",
      icon: Link,
      status: findStatus("Bitrix24"),
    },
    {
      id: "lalamove",
      name: "Lalamove",
      icon: Globe,
      status: findStatus("Lalamove"),
    },
    {
      id: "n8n",
      name: "n8n",
      icon: Settings,
      status: findStatus("n8n", "unknown"),
    },
    {
      id: "rodonaves",
      name: "Rodonaves RTE",
      icon: Truck,
      status: findStatus("Rodonaves"),
    },
    {
      id: "melhorenvio",
      name: "Melhor Envio",
      icon: Package,
      status: findStatus("Melhor Envio"),
    },
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
        email: "notifications_email",
        push: "notifications_push",
        whatsapp: "notifications_whatsapp",
        sla: "notifications_sla",
        ocorrencias: "notifications_ocorrencias",
        coletas: "notifications_coletas",
        entregas: "notifications_entregas",
        custos: "notifications_custos",
        achievements: "notifications_achievements",
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
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                      Core_System_Admin
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">
                    GOVERNANÇA • INTEGRAÇÕES • SEGURANÇA
                  </span>
                </div>
              </div>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {isDirty && (
              <Badge
                variant="outline"
                className="text-warning border-warning animate-pulse"
              >
                Alterações não salvas
              </Badge>
            )}
            <Button
              size="lg"
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[11px] gap-2 bg-gradient-to-r from-primary via-primary/90 to-primary/80 shadow-xl shadow-primary/20 hover:scale-[1.03] transition-all"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        </div>
        <OnboardingTooltip
          id="configuracoes-tabs"
          title="Personalize seu sistema"
          description="Configure integrações com serviços externos, personalize notificações e ajuste as configurações de segurança."
          position="bottom"
        >
          {(() => {
            const tabFromUrl = searchParams.get("tab");
            const validTab: string = [
              "integrations",
              "preferences",
              "automation",
              "notifications",
              "security",
            ].includes(tabFromUrl || "")
              ? (tabFromUrl ?? "integrations")
              : "integrations";
            return (
              <Tabs key={validTab} defaultValue={validTab}>
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto p-1.5 bg-sidebar-accent/50 rounded-2xl border border-white/5 mb-8">
                  <TabsTrigger
                    value="integrations"
                    className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all"
                  >
                    <Link className="w-4 h-4" />
                    Integrações
                  </TabsTrigger>
                  <TabsTrigger
                    value="preferences"
                    className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all"
                  >
                    <Palette className="w-4 h-4" />
                    Personalização
                  </TabsTrigger>
                  <TabsTrigger
                    value="automation"
                    className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all"
                  >
                    <Zap className="w-4 h-4" />
                    Automações
                  </TabsTrigger>
                  <TabsTrigger
                    value="notifications"
                    className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all"
                  >
                    <Bell className="w-4 h-4" />
                    Notificações
                  </TabsTrigger>
                  <TabsTrigger
                    value="security"
                    className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all"
                  >
                    <Shield className="w-4 h-4" />
                    Segurança
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="integrations" className="space-y-4">
                  <div className="flex justify-end mb-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleValidateAll}
                      disabled={isValidating}
                      className="h-10 px-6 rounded-xl border-2 font-bold uppercase tracking-widest text-[10px] gap-2"
                    >
                      <RefreshCw
                        className={cn(
                          "w-3.5 h-3.5",
                          isValidating && "animate-spin",
                        )}
                      />
                      Validar Todas
                    </Button>
                  </div>
                  <div className="grid gap-4">
                    {integrationsList.map((int) => {
                      const Icon = int.icon;
                      const integrationData = integrations.find(
                        (i) =>
                          i.name.toLowerCase() === int.name.toLowerCase() ||
                          i.name.toLowerCase() === int.id.toLowerCase(),
                      );
                      const status = integrationData?.status || int.status;
                      const isConnected = status === "connected";
                      const isError = status === "error";

                      let badgeVariant:
                        "default" | "destructive" | "secondary" = "secondary";
                      if (isConnected) badgeVariant = "default";
                      else if (isError) badgeVariant = "destructive";
                      let badgeContent: React.ReactNode = "Pendente";
                      if (isConnected) {
                        badgeContent = (
                          <>
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Conectado
                          </>
                        );
                      } else if (isError) {
                        badgeContent = (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Erro
                          </>
                        );
                      }

                      return (
                        <div
                          key={int.id}
                          className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-card to-card/95 border-none shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-between"
                        >
                          <div className="flex items-center gap-5">
                            <div
                              className={cn(
                                "p-4 rounded-2xl transition-all shadow-inner group-hover:scale-110 duration-500",
                                isConnected
                                  ? "bg-success/15 text-success"
                                  : "bg-muted/20 text-muted-foreground",
                              )}
                            >
                              <Icon className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-black text-xl tracking-tighter uppercase italic">
                                {int.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-0.5">
                                ID_NODE: {int.id}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                              <Badge variant={badgeVariant} className="mb-1">
                                {badgeContent}
                              </Badge>
                              {integrationData?.lastCheck && (
                                <p className="text-[10px] text-muted-foreground">
                                  Check:{" "}
                                  {format(
                                    new Date(integrationData.lastCheck),
                                    "HH:mm:ss",
                                  )}
                                </p>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleValidateIntegration(int.id)}
                              disabled={isValidating}
                              className="h-10 px-6 rounded-xl border-2 font-black uppercase tracking-widest text-[10px] hover:bg-primary/5"
                            >
                              Testar
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                    {[
                      { key: "email", label: "Notificações por Email" },
                      { key: "push", label: "Notificações Push" },
                      { key: "whatsapp", label: "Notificações WhatsApp" },
                      { key: "sms", label: "Notificações SMS" },
                      { key: "slack", label: "Integração Slack" },
                    ].map((pref) => (
                      <div
                        key={pref.key}
                        className="flex items-center justify-between py-2"
                      >
                        <div>
                          <p className="font-medium">{pref.label}</p>
                          <p className="text-sm text-muted-foreground">
                            Receber alertas via {pref.key}
                          </p>
                        </div>
                        <Switch
                          checked={
                            (
                              preferences as Partial<NotificationPreferences> &
                                Record<string, boolean | undefined>
                            )?.[`notifications_${pref.key}`] ?? false
                          }
                          onCheckedChange={(v) =>
                            handleUpdatePreference(pref.key, v)
                          }
                          disabled={!isLoaded}
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="security" className="space-y-4">
                  <TwoFactorSetup />
                  <div className="card-base p-4 space-y-4">
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium">Sessão atual</p>
                        <p className="text-sm text-muted-foreground">
                          {sessionInfo.expiresAt
                            ? `Expira em ${format(
                                sessionInfo.expiresAt,
                                "dd/MM/yyyy HH:mm",
                              )}`
                            : "Sessão de duração padrão"}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void refreshSession()}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Estender
                      </Button>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium">Chaves de API e Webhooks</p>
                        <p className="text-sm text-muted-foreground">
                          Gerencie credenciais de integração no centro de
                          segurança
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/seguranca")}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Abrir Segurança
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            );
          })()}
        </OnboardingTooltip>
      </div>
    </MainLayout>
  );
}
