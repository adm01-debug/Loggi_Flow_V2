import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useRodonavesTracking } from "@/hooks/logistics/useRodonavesTracking";
import { RTETrackingPanel } from "@/components/rodonaves/RTETrackingPanel";
import { RTEDeliveryReceipts } from "@/components/rodonaves/RTEDeliveryReceipts";
import { RTEOrdersPanel } from "@/components/rodonaves/RTEOrdersPanel";
import { RTECustomerManager } from "@/components/rodonaves/RTECustomerManager";
import { RTEAdvancedPickup } from "@/components/rodonaves/RTEAdvancedPickup";
import { RTESelfAttendance } from "@/components/rodonaves/RTESelfAttendance";
import { RTEAdvancedQuotation } from "@/components/rodonaves/RTEAdvancedQuotation";
import { RTEGatewayHealthPanel } from "@/components/rodonaves/RTEGatewayHealthPanel";
import { RTEFreightAnomalies } from "@/components/rodonaves/RTEFreightAnomalies";
import {
  Activity,
  Truck,
  RefreshCw,
  Loader2,
  Package,
  FileText,
  Users,
  Calculator,
  Building,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function GestaoRodonaves() {
  const rte = useRodonavesTracking();
  const [tab, setTab] = useState("tracking");

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between px-2">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white flex items-center gap-4 tracking-tighter uppercase italic">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black border border-white/10 shadow-2xl transition-transform hover:scale-110">
                  <Truck className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="drop-shadow-2xl">Rodonaves RTE</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                    <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                      Carrier_Intelligence
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">
                    58 ENDPOINTS • FULL INTEGRATION
                  </span>
                </div>
              </div>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              API v1.27.3
            </Badge>
            <Button
              variant="outline"
              onClick={() => rte.syncAll(undefined)}
              disabled={rte.isSyncing}
            >
              {rte.isSyncing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Sincronizar Tudo
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
          {[
            {
              label: "Rastreamento",
              icon: Package,
              count: 6,
              color: "text-blue-500",
            },
            {
              label: "Comprovantes",
              icon: FileText,
              count: 7,
              color: "text-green-500",
            },
            {
              label: "Pedidos",
              icon: Package,
              count: 1,
              color: "text-purple-500",
            },
            {
              label: "Cotação",
              icon: Calculator,
              count: 8,
              color: "text-orange-500",
            },
            {
              label: "Clientes",
              icon: Users,
              count: 11,
              color: "text-pink-500",
            },
            {
              label: "Coletas",
              icon: Truck,
              count: 11,
              color: "text-yellow-500",
            },
            {
              label: "Autoatend.",
              icon: Building,
              count: 10,
              color: "text-cyan-500",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-3 rounded-lg border bg-card text-center"
            >
              <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
              <p className="text-lg font-bold">{stat.count}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex flex-wrap gap-1 h-auto p-1">
            <TabsTrigger value="tracking" className="gap-1">
              <Package className="w-3 h-3" />
              Rastreamento
            </TabsTrigger>
            <TabsTrigger value="receipts" className="gap-1">
              <FileText className="w-3 h-3" />
              Comprovantes
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-1">
              <Package className="w-3 h-3" />
              Pedidos
            </TabsTrigger>
            <TabsTrigger value="quotation" className="gap-1">
              <Calculator className="w-3 h-3" />
              Cotações
            </TabsTrigger>
            <TabsTrigger value="customers" className="gap-1">
              <Users className="w-3 h-3" />
              Clientes
            </TabsTrigger>
            <TabsTrigger value="pickups" className="gap-1">
              <Truck className="w-3 h-3" />
              Coletas
            </TabsTrigger>
            <TabsTrigger value="selfservice" className="gap-1">
              <Building className="w-3 h-3" />
              Autoatendimento
            </TabsTrigger>
            <TabsTrigger value="anomalies" className="gap-1">
              <AlertTriangle className="w-3 h-3" />
              Anomalias
            </TabsTrigger>
            <TabsTrigger value="health" className="gap-1">
              <Activity className="w-3 h-3" />
              Saúde
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 p-4 border rounded-lg bg-card/50">
            <TabsContent value="tracking">
              <RTETrackingPanel />
            </TabsContent>
            <TabsContent value="receipts">
              <RTEDeliveryReceipts />
            </TabsContent>
            <TabsContent value="orders">
              <RTEOrdersPanel />
            </TabsContent>
            <TabsContent value="quotation">
              <RTEAdvancedQuotation />
            </TabsContent>
            <TabsContent value="customers">
              <RTECustomerManager />
            </TabsContent>
            <TabsContent value="pickups">
              <RTEAdvancedPickup />
            </TabsContent>
            <TabsContent value="selfservice">
              <RTESelfAttendance />
            </TabsContent>
            <TabsContent value="anomalies">
              <RTEFreightAnomalies />
            </TabsContent>
            <TabsContent value="health">
              <RTEGatewayHealthPanel />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </MainLayout>
  );
}
