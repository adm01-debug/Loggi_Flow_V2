import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/auth/useAuth";
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
import { GeoBlockingPanel } from "@/components/security/GeoBlockingPanel";
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
  Fingerprint,
  MapPin
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
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between px-2">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white flex items-center gap-4 tracking-tighter uppercase italic">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black border border-white/10 shadow-2xl transition-transform hover:scale-110">
                  <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="drop-shadow-2xl">Cyber Security</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                    <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Shield_Active</span>
                  </div>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">AUTH • ACCESS • GEO-FENCING</span>
                </div>
              </div>
            </h1>
          </div>
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
            <TabsTrigger value="geo" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Geo</span>
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

          <TabsContent value="geo">
            <GeoBlockingPanel />
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
