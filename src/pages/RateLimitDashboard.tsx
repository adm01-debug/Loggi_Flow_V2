import { MainLayout } from "@/components/layout/MainLayout";
import { RateLimitDashboardPanel } from "@/components/security/RateLimitDashboardPanel";
import { Gauge } from "lucide-react";

export default function RateLimitDashboard() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <Gauge className="h-8 w-8 text-primary" />
            Rate Limiting Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitore e gerencie limites de requisições por IP
          </p>
        </div>
        <RateLimitDashboardPanel />
      </div>
    </MainLayout>
  );
}
