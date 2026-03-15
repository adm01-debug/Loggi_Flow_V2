import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useRodonavesTracking } from '@/hooks/useRodonavesTracking';
import { RTETrackingPanel } from '@/components/rodonaves/RTETrackingPanel';
import { RTEDeliveryReceipts } from '@/components/rodonaves/RTEDeliveryReceipts';
import { RTEOrdersPanel } from '@/components/rodonaves/RTEOrdersPanel';
import { RTECustomerManager } from '@/components/rodonaves/RTECustomerManager';
import { RTEAdvancedPickup } from '@/components/rodonaves/RTEAdvancedPickup';
import { RTESelfAttendance } from '@/components/rodonaves/RTESelfAttendance';
import { RTEAdvancedQuotation } from '@/components/rodonaves/RTEAdvancedQuotation';
import { Truck, RefreshCw, Loader2, Package, FileText, Users, MapPin, Calculator, Building } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function GestaoRodonaves() {
  const rte = useRodonavesTracking();
  const [tab, setTab] = useState('tracking');

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Truck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Gestão Rodonaves RTE</h1>
              <p className="text-sm text-muted-foreground">Central completa de integração com a API Rodonaves — 58 endpoints</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">API v1.27.3</Badge>
            <Button variant="outline" onClick={() => rte.syncAll(undefined)} disabled={rte.isSyncing}>
              {rte.isSyncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Sincronizar Tudo
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
          {[
            { label: 'Rastreamento', icon: Package, count: 6, color: 'text-blue-500' },
            { label: 'Comprovantes', icon: FileText, count: 7, color: 'text-green-500' },
            { label: 'Pedidos', icon: Package, count: 1, color: 'text-purple-500' },
            { label: 'Cotação', icon: Calculator, count: 8, color: 'text-orange-500' },
            { label: 'Clientes', icon: Users, count: 11, color: 'text-pink-500' },
            { label: 'Coletas', icon: Truck, count: 11, color: 'text-yellow-500' },
            { label: 'Autoatend.', icon: Building, count: 10, color: 'text-cyan-500' },
          ].map((stat) => (
            <div key={stat.label} className="p-3 rounded-lg border bg-card text-center">
              <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
              <p className="text-lg font-bold">{stat.count}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Main Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="flex flex-wrap gap-1 h-auto p-1">
            <TabsTrigger value="tracking" className="gap-1"><Package className="w-3 h-3" />Rastreamento</TabsTrigger>
            <TabsTrigger value="receipts" className="gap-1"><FileText className="w-3 h-3" />Comprovantes</TabsTrigger>
            <TabsTrigger value="orders" className="gap-1"><Package className="w-3 h-3" />Pedidos</TabsTrigger>
            <TabsTrigger value="quotation" className="gap-1"><Calculator className="w-3 h-3" />Cotações</TabsTrigger>
            <TabsTrigger value="customers" className="gap-1"><Users className="w-3 h-3" />Clientes</TabsTrigger>
            <TabsTrigger value="pickups" className="gap-1"><Truck className="w-3 h-3" />Coletas</TabsTrigger>
            <TabsTrigger value="selfservice" className="gap-1"><Building className="w-3 h-3" />Autoatendimento</TabsTrigger>
          </TabsList>

          <div className="mt-4 p-4 border rounded-lg bg-card/50">
            <TabsContent value="tracking"><RTETrackingPanel /></TabsContent>
            <TabsContent value="receipts"><RTEDeliveryReceipts /></TabsContent>
            <TabsContent value="orders"><RTEOrdersPanel /></TabsContent>
            <TabsContent value="quotation"><RTEAdvancedQuotation /></TabsContent>
            <TabsContent value="customers"><RTECustomerManager /></TabsContent>
            <TabsContent value="pickups"><RTEAdvancedPickup /></TabsContent>
            <TabsContent value="selfservice"><RTESelfAttendance /></TabsContent>
          </div>
        </Tabs>
      </div>
    </MainLayout>
  );
}
