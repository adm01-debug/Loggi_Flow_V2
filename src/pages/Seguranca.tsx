import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { TwoFactorSetup } from "@/components/security/TwoFactorSetup";
import { IPAccessControl } from "@/components/security/IPAccessControl";
import { LoginAttemptsLog } from "@/components/security/LoginAttemptsLog";
import { DeviceManagement } from "@/components/security/DeviceManagement";
import { SecurityEventsPanel } from "@/components/security/SecurityEventsPanel";
import { RateLimitDashboardPanel } from "@/components/security/RateLimitDashboardPanel";
import { PermissionMatrix } from "@/components/security/PermissionMatrix";
import { SecurityOverviewPanel } from "@/components/security/SecurityOverviewPanel";
import { SecurityNotificationSettings } from "@/components/security/SecurityNotificationSettings";
import { PasskeyManager } from "@/components/security/PasskeyManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AlertTriangle, 
  Shield, 
  Globe, 
  Activity, 
  Smartphone, 
  Gauge, 
  Lock,
  Users,
  LayoutDashboard,
  Bell,
  Fingerprint
} from "lucide-react";

export default function Seguranca() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <AlertTriangle className="h-16 w-16 text-destructive" />
          <h1 className="text-2xl font-bold">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Central de Segurança
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie autenticação, controle de acesso, rate limiting e monitore eventos de segurança
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="2fa" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">2FA</span>
            </TabsTrigger>
            <TabsTrigger value="passkeys" className="flex items-center gap-2">
              <Fingerprint className="h-4 w-4" />
              <span className="hidden sm:inline">Passkeys</span>
            </TabsTrigger>
            <TabsTrigger value="devices" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              <span className="hidden sm:inline">Dispositivos</span>
            </TabsTrigger>
            <TabsTrigger value="ip" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Acesso IP</span>
            </TabsTrigger>
            <TabsTrigger value="rate-limit" className="flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              <span className="hidden sm:inline">Rate Limit</span>
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Permissões</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Eventos</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Logins</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Alertas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <SecurityOverviewPanel />
          </TabsContent>

          <TabsContent value="2fa">
            <TwoFactorSetup />
          </TabsContent>

          <TabsContent value="passkeys">
            <PasskeyManager />
          </TabsContent>

          <TabsContent value="devices">
            <DeviceManagement />
          </TabsContent>

          <TabsContent value="ip">
            <IPAccessControl />
          </TabsContent>

          <TabsContent value="rate-limit">
            <RateLimitDashboardPanel />
          </TabsContent>

          <TabsContent value="permissions">
            <PermissionMatrix />
          </TabsContent>

          <TabsContent value="events">
            <SecurityEventsPanel />
          </TabsContent>

          <TabsContent value="logs">
            <LoginAttemptsLog />
          </TabsContent>

          <TabsContent value="notifications">
            <SecurityNotificationSettings />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
