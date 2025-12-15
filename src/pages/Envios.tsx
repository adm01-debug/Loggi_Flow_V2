import { useState } from "react";
import {
  Send,
  Plus,
  Search,
  MapPin,
  Clock,
  Package,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  User,
  Phone,
  CheckCircle2,
  Truck,
  AlertCircle,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ShipmentStatus = "processing" | "shipped" | "in_transit" | "delivered" | "returned";

interface Shipment {
  id: string;
  customer: string;
  phone: string;
  address: string;
  city: string;
  items: number;
  status: ShipmentStatus;
  trackingCode: string;
  createdAt: string;
  estimatedDelivery: string;
}

const statusConfig: Record<ShipmentStatus, { label: string; color: string; icon: React.ElementType }> = {
  processing: {
    label: "Processando",
    color: "bg-warning/10 text-warning border-warning/20",
    icon: Clock,
  },
  shipped: {
    label: "Enviado",
    color: "bg-info/10 text-info border-info/20",
    icon: Package,
  },
  in_transit: {
    label: "Em Trânsito",
    color: "bg-primary/10 text-primary border-primary/20",
    icon: Truck,
  },
  delivered: {
    label: "Entregue",
    color: "bg-success/10 text-success border-success/20",
    icon: CheckCircle2,
  },
  returned: {
    label: "Devolvido",
    color: "bg-destructive/10 text-destructive border-destructive/20",
    icon: AlertCircle,
  },
};

const mockShipments: Shipment[] = [
  {
    id: "ENV-2024-001",
    customer: "Maria Oliveira",
    phone: "(11) 99999-1234",
    address: "Rua das Flores, 123",
    city: "São Paulo - SP",
    items: 3,
    status: "in_transit",
    trackingCode: "BR123456789",
    createdAt: "14/12/2024",
    estimatedDelivery: "16/12/2024",
  },
  {
    id: "ENV-2024-002",
    customer: "João Santos",
    phone: "(21) 98888-5678",
    address: "Av. Atlântica, 456",
    city: "Rio de Janeiro - RJ",
    items: 1,
    status: "delivered",
    trackingCode: "BR987654321",
    createdAt: "12/12/2024",
    estimatedDelivery: "14/12/2024",
  },
  {
    id: "ENV-2024-003",
    customer: "Ana Costa",
    phone: "(31) 97777-9012",
    address: "Rua da Liberdade, 789",
    city: "Belo Horizonte - MG",
    items: 5,
    status: "processing",
    trackingCode: "BR456789123",
    createdAt: "14/12/2024",
    estimatedDelivery: "18/12/2024",
  },
  {
    id: "ENV-2024-004",
    customer: "Carlos Lima",
    phone: "(41) 96666-3456",
    address: "Rua XV de Novembro, 321",
    city: "Curitiba - PR",
    items: 2,
    status: "shipped",
    trackingCode: "BR789123456",
    createdAt: "13/12/2024",
    estimatedDelivery: "17/12/2024",
  },
  {
    id: "ENV-2024-005",
    customer: "Fernanda Souza",
    phone: "(51) 95555-7890",
    address: "Av. Borges de Medeiros, 654",
    city: "Porto Alegre - RS",
    items: 4,
    status: "in_transit",
    trackingCode: "BR321654987",
    createdAt: "13/12/2024",
    estimatedDelivery: "16/12/2024",
  },
  {
    id: "ENV-2024-006",
    customer: "Ricardo Almeida",
    phone: "(85) 94444-1234",
    address: "Rua José Avelino, 987",
    city: "Fortaleza - CE",
    items: 1,
    status: "returned",
    trackingCode: "BR654987321",
    createdAt: "10/12/2024",
    estimatedDelivery: "14/12/2024",
  },
];

export default function Envios() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredShipments = mockShipments.filter((shipment) => {
    const matchesSearch =
      shipment.id.toLowerCase().includes(search.toLowerCase()) ||
      shipment.customer.toLowerCase().includes(search.toLowerCase()) ||
      shipment.trackingCode.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "all" || shipment.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: mockShipments.length,
    processing: mockShipments.filter((s) => s.status === "processing").length,
    inTransit: mockShipments.filter((s) => s.status === "in_transit" || s.status === "shipped").length,
    delivered: mockShipments.filter((s) => s.status === "delivered").length,
    returned: mockShipments.filter((s) => s.status === "returned").length,
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-display text-foreground flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-freight-customer/10">
                <Send className="w-6 h-6 text-freight-customer" />
              </div>
              Envios para Clientes
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os envios e rastreamento de pedidos
            </p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary press-scale">
            <Plus className="w-4 h-4 mr-2" />
            Novo Envio
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="stat-card text-center">
            <p className="text-2xl font-display font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="stat-card text-center border-warning/20">
            <p className="text-2xl font-display font-bold text-warning">{stats.processing}</p>
            <p className="text-xs text-muted-foreground">Processando</p>
          </div>
          <div className="stat-card text-center border-primary/20">
            <p className="text-2xl font-display font-bold text-primary">{stats.inTransit}</p>
            <p className="text-xs text-muted-foreground">Em Trânsito</p>
          </div>
          <div className="stat-card text-center border-success/20">
            <p className="text-2xl font-display font-bold text-success">{stats.delivered}</p>
            <p className="text-xs text-muted-foreground">Entregues</p>
          </div>
          <div className="stat-card text-center border-destructive/20">
            <p className="text-2xl font-display font-bold text-destructive">{stats.returned}</p>
            <p className="text-xs text-muted-foreground">Devolvidos</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card-base">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID, cliente ou código de rastreio..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="processing">Processando</SelectItem>
                <SelectItem value="shipped">Enviado</SelectItem>
                <SelectItem value="in_transit">Em Trânsito</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="returned">Devolvido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Shipments Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShipments.map((shipment, index) => {
            const StatusIcon = statusConfig[shipment.status].icon;

            return (
              <div
                key={shipment.id}
                className="card-interactive animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold text-lg">{shipment.id}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      {shipment.trackingCode}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn("border flex items-center gap-1", statusConfig[shipment.status].color)}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig[shipment.status].label}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          Rastrear
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Cancelar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{shipment.customer}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    <span>{shipment.phone}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    <div>
                      <p>{shipment.address}</p>
                      <p className="font-medium text-foreground">{shipment.city}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Package className="w-4 h-4" />
                    <span>{shipment.items} {shipment.items === 1 ? "item" : "itens"}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Prev: {shipment.estimatedDelivery}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredShipments.length === 0 && (
          <div className="card-base flex flex-col items-center justify-center py-12 text-center">
            <Send className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nenhum envio encontrado</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
