import { MainLayout } from "@/components/layout/MainLayout";
import { AuditTrailViewer } from "@/components/audit/AuditTrailViewer";
import { DecisionAudit } from "@/components/freight/DecisionAudit";
import { History, Shield, Download, Brain, Database } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
              <History className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-display text-foreground">Audit Trail</h1>
              <p className="text-muted-foreground mt-1">
                Histórico completo de alterações para compliance e rastreabilidade
              </p>
            </div>
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

        {/* Audit Trail Viewer */}
        <div className="card-base">
          <AuditTrailViewer maxHeight="calc(100vh - 350px)" />
        </div>
      </div>
    </MainLayout>
  );
}
