import { MainLayout } from "@/components/layout/MainLayout";
import { BusinessRulesManager } from "@/components/automation/BusinessRulesManager";
import { Zap } from "lucide-react";

export default function AutomacaoRegras() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-display flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            Automação de Regras
          </h1>
          <p className="text-muted-foreground mt-1">Configure regras automáticas sem programação</p>
        </div>
        <BusinessRulesManager />
      </div>
    </MainLayout>
  );
}
