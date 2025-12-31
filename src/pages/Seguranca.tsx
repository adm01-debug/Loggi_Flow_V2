import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { TwoFactorSetup } from "@/components/security/TwoFactorSetup";
import { IPAccessControl } from "@/components/security/IPAccessControl";
import { LoginAttemptsLog } from "@/components/security/LoginAttemptsLog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Shield, Globe, Activity } from "lucide-react";

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
            Configure autenticação de dois fatores, controle de acesso por IP e monitore tentativas de login
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="2fa" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="2fa" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              2FA
            </TabsTrigger>
            <TabsTrigger value="ip" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Acesso IP
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Logs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="2fa">
            <TwoFactorSetup />
          </TabsContent>

          <TabsContent value="ip">
            <IPAccessControl />
          </TabsContent>

          <TabsContent value="logs">
            <LoginAttemptsLog />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
