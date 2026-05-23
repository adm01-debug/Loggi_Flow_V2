import { MainLayout } from "@/components/layout/MainLayout";
import { AuditTrailViewer } from "@/components/audit/AuditTrailViewer";
import { DecisionAudit } from "@/components/freight/DecisionAudit";
import { History, Shield, Download, Brain, Database } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth/useAuth";
import { Navigate } from "react-router-dom";

export default function AuditTrail() {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between px-2">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white flex items-center gap-4 tracking-tighter uppercase italic">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black border border-white/10 shadow-2xl transition-transform hover:scale-110">
                  <History className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="drop-shadow-2xl">Audit Trail</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                    <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Compliance_Nexus</span>
                  </div>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">HISTÓRICO IMUTÁVEL • GOVERNANÇA 10/10</span>
                </div>
              </div>
            </h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar Logs
            </Button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-info/10 border border-info/30">
          <Shield className="w-5 h-5 text-info shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Acesso Restrito
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Este módulo registra automaticamente todas as operações de criação, atualização e 
              exclusão realizadas no sistema. Os logs são imutáveis e apenas administradores 
              têm acesso a esta visualização.
            </p>
          </div>
        </div>

        <Tabs defaultValue="decisions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="decisions" className="gap-2">
              <Brain className="h-4 w-4" />
              Decisões de Frete
            </TabsTrigger>
            <TabsTrigger value="general" className="gap-2">
              <Database className="h-4 w-4" />
              Logs do Sistema
            </TabsTrigger>
          </TabsList>

          <TabsContent value="decisions" className="space-y-4">
            <DecisionAudit />
          </TabsContent>

          <TabsContent value="general" className="card-base">
            <AuditTrailViewer maxHeight="calc(100vh - 450px)" />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
