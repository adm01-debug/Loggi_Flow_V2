import { 
  Truck, 
  Building2, 
  Send, 
  Clock, 
  TrendingUp,
  Package,
  Users,
  AlertTriangle 
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { FreightCard } from "@/components/dashboard/FreightCard";
import { XPProgressBar } from "@/components/dashboard/XPProgressBar";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Button } from "@/components/ui/button";

const freights = [
  {
    id: "FR-2024-001",
    type: "internal" as const,
    origin: "CD São Paulo",
    destination: "Loja Centro",
    status: "in_transit" as const,
    driver: "Carlos M.",
    estimatedTime: "14:30",
    items: 25,
  },
  {
    id: "FR-2024-002",
    type: "supplier" as const,
    origin: "Fornecedor ABC",
    destination: "CD São Paulo",
    status: "pending" as const,
    estimatedTime: "Amanhã",
    items: 150,
  },
  {
    id: "FR-2024-003",
    type: "customer" as const,
    origin: "CD São Paulo",
    destination: "Cliente XYZ",
    status: "delivered" as const,
    driver: "Ana S.",
    items: 12,
  },
  {
    id: "FR-2024-004",
    type: "internal" as const,
    origin: "Loja Norte",
    destination: "Loja Sul",
    status: "delayed" as const,
    driver: "Pedro R.",
    estimatedTime: "Atrasado 2h",
    items: 8,
  },
];

export default function Index() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-display text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Visão geral das operações logísticas
            </p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary press-scale">
            <Truck className="w-4 h-4 mr-2" />
            Novo Frete
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Fretes Internos"
            value={42}
            change="+12% vs ontem"
            changeType="positive"
            icon={Truck}
            iconColor="text-freight-internal"
            iconBgColor="bg-freight-internal/10"
          />
          <StatCard
            title="Fornecedores"
            value={18}
            change="3 pendentes"
            changeType="neutral"
            icon={Building2}
            iconColor="text-freight-supplier"
            iconBgColor="bg-freight-supplier/10"
          />
          <StatCard
            title="Envios Clientes"
            value={67}
            change="+28% vs ontem"
            changeType="positive"
            icon={Send}
            iconColor="text-freight-customer"
            iconBgColor="bg-freight-customer/10"
          />
          <StatCard
            title="Pendentes"
            value={8}
            change="2 atrasados"
            changeType="negative"
            icon={Clock}
            iconColor="text-freight-pending"
            iconBgColor="bg-freight-pending/10"
          />
        </div>

        {/* XP Progress */}
        <XPProgressBar
          currentXP={2450}
          nextLevelXP={3000}
          level={12}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Freights List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-xl">Fretes Ativos</h2>
              <Button variant="outline" size="sm">
                Ver todos
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {freights.map((freight, index) => (
                <div
                  key={freight.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <FreightCard {...freight} />
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <QuickActions />
            <RecentActivity />
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Mercadorias"
            value="2.4k"
            change="Em estoque"
            changeType="neutral"
            icon={Package}
            iconColor="text-primary"
            iconBgColor="bg-primary/10"
          />
          <StatCard
            title="Motoristas Ativos"
            value={15}
            change="3 disponíveis"
            changeType="positive"
            icon={Users}
            iconColor="text-success"
            iconBgColor="bg-success/10"
          />
          <StatCard
            title="Taxa de Entrega"
            value="94%"
            change="+2% vs semana"
            changeType="positive"
            icon={TrendingUp}
            iconColor="text-xp"
            iconBgColor="bg-xp/10"
          />
          <StatCard
            title="Alertas"
            value={3}
            change="Requer atenção"
            changeType="negative"
            icon={AlertTriangle}
            iconColor="text-destructive"
            iconBgColor="bg-destructive/10"
          />
        </div>
      </div>
    </MainLayout>
  );
}
