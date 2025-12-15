import { useState } from "react";
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Package,
  Calendar,
  Star,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  Clock,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  rating: number;
  totalOrders: number;
  pendingDeliveries: number;
  lastDelivery: string;
  status: "active" | "inactive";
}

const mockSuppliers: Supplier[] = [
  {
    id: "SUP-001",
    name: "Distribuidora ABC",
    contact: "Roberto Lima",
    email: "contato@abc.com",
    phone: "(11) 99999-1111",
    address: "Av. Industrial, 1500 - SP",
    category: "Eletrônicos",
    rating: 4.8,
    totalOrders: 156,
    pendingDeliveries: 3,
    lastDelivery: "Há 2 dias",
    status: "active",
  },
  {
    id: "SUP-002",
    name: "Tech Components Ltda",
    contact: "Mariana Costa",
    email: "vendas@techcomp.com",
    phone: "(11) 98888-2222",
    address: "Rua das Indústrias, 420 - SP",
    category: "Componentes",
    rating: 4.5,
    totalOrders: 89,
    pendingDeliveries: 1,
    lastDelivery: "Há 5 dias",
    status: "active",
  },
  {
    id: "SUP-003",
    name: "Mega Suprimentos",
    contact: "Carlos Ferreira",
    email: "compras@megasup.com",
    phone: "(11) 97777-3333",
    address: "Av. Brasil, 2800 - RJ",
    category: "Suprimentos",
    rating: 4.2,
    totalOrders: 234,
    pendingDeliveries: 5,
    lastDelivery: "Hoje",
    status: "active",
  },
  {
    id: "SUP-004",
    name: "Importadora Global",
    contact: "Ana Rodrigues",
    email: "ana@global.com",
    phone: "(21) 96666-4444",
    address: "Porto de Santos - SP",
    category: "Importados",
    rating: 4.0,
    totalOrders: 67,
    pendingDeliveries: 0,
    lastDelivery: "Há 2 semanas",
    status: "inactive",
  },
  {
    id: "SUP-005",
    name: "Embalagens Express",
    contact: "Paulo Santos",
    email: "paulo@embalagens.com",
    phone: "(11) 95555-5555",
    address: "Distrito Industrial, 100 - SP",
    category: "Embalagens",
    rating: 4.9,
    totalOrders: 312,
    pendingDeliveries: 2,
    lastDelivery: "Ontem",
    status: "active",
  },
  {
    id: "SUP-006",
    name: "LogiParts Brasil",
    contact: "Fernanda Oliveira",
    email: "comercial@logiparts.com",
    phone: "(19) 94444-6666",
    address: "Rod. Anhanguera, km 45 - SP",
    category: "Peças",
    rating: 4.6,
    totalOrders: 145,
    pendingDeliveries: 4,
    lastDelivery: "Há 3 dias",
    status: "active",
  },
];

export default function Fornecedores() {
  const [search, setSearch] = useState("");

  const filteredSuppliers = mockSuppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(search.toLowerCase()) ||
      supplier.contact.toLowerCase().includes(search.toLowerCase()) ||
      supplier.category.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: mockSuppliers.length,
    active: mockSuppliers.filter((s) => s.status === "active").length,
    pending: mockSuppliers.reduce((acc, s) => acc + s.pendingDeliveries, 0),
    avgRating: (mockSuppliers.reduce((acc, s) => acc + s.rating, 0) / mockSuppliers.length).toFixed(1),
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-display text-foreground flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-freight-supplier/10">
                <Building2 className="w-6 h-6 text-freight-supplier" />
              </div>
              Fornecedores
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus fornecedores e entregas recebidas
            </p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary press-scale">
            <Plus className="w-4 h-4 mr-2" />
            Novo Fornecedor
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card text-center">
            <p className="text-2xl font-display font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="stat-card text-center border-success/20">
            <p className="text-2xl font-display font-bold text-success">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Ativos</p>
          </div>
          <div className="stat-card text-center border-warning/20">
            <p className="text-2xl font-display font-bold text-warning">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Entregas Pendentes</p>
          </div>
          <div className="stat-card text-center border-coins/20">
            <div className="flex items-center justify-center gap-1">
              <Star className="w-5 h-5 text-coins fill-coins" />
              <p className="text-2xl font-display font-bold text-coins">{stats.avgRating}</p>
            </div>
            <p className="text-xs text-muted-foreground">Avaliação Média</p>
          </div>
        </div>

        {/* Search */}
        <div className="card-base">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, contato ou categoria..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Suppliers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.map((supplier, index) => (
            <div
              key={supplier.id}
              className="card-interactive animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-freight-supplier/10">
                    <Building2 className="w-6 h-6 text-freight-supplier" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{supplier.name}</h3>
                    <p className="text-sm text-muted-foreground">{supplier.category}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="w-4 h-4 mr-2" />
                      Visualizar
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>{supplier.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{supplier.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{supplier.address}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{supplier.totalOrders}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-coins fill-coins" />
                    <span className="text-sm font-medium">{supplier.rating}</span>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "border",
                    supplier.status === "active"
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {supplier.status === "active" ? "Ativo" : "Inativo"}
                </Badge>
              </div>

              {supplier.pendingDeliveries > 0 && (
                <div className="mt-3 p-2 rounded-lg bg-warning/10 border border-warning/20">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-warning font-medium">
                      {supplier.pendingDeliveries} entregas pendentes
                    </span>
                    <Clock className="w-4 h-4 text-warning" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredSuppliers.length === 0 && (
          <div className="card-base flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nenhum fornecedor encontrado</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
