import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Truck,
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  Clock,
  Package,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { NewFreightModal } from "@/components/freight/NewFreightModal";
import { cn } from "@/lib/utils";

type FreightStatus = "pending" | "in_transit" | "delivered" | "delayed" | "cancelled";

interface Freight {
  id: string;
  origin: string;
  destination: string;
  driver: string;
  items: number;
  status: FreightStatus;
  createdAt: Date;
  estimatedDelivery: Date;
  xpReward: number;
}

const statusConfig: Record<FreightStatus, { label: string; color: string }> = {
  pending: {
    label: "Pendente",
    color: "bg-warning/10 text-warning border-warning/20",
  },
  in_transit: {
    label: "Em Trânsito",
    color: "bg-info/10 text-info border-info/20",
  },
  delivered: {
    label: "Entregue",
    color: "bg-success/10 text-success border-success/20",
  },
  delayed: {
    label: "Atrasado",
    color: "bg-destructive/10 text-destructive border-destructive/20",
  },
  cancelled: {
    label: "Cancelado",
    color: "bg-muted text-muted-foreground border-muted",
  },
};

const mockFreights: Freight[] = [
  {
    id: "FR-2024-001",
    origin: "CD São Paulo",
    destination: "Loja Centro",
    driver: "Carlos Mendes",
    items: 25,
    status: "in_transit",
    createdAt: new Date(2024, 11, 14, 8, 30),
    estimatedDelivery: new Date(2024, 11, 14, 14, 30),
    xpReward: 50,
  },
  {
    id: "FR-2024-002",
    origin: "Loja Norte",
    destination: "CD São Paulo",
    driver: "Ana Santos",
    items: 12,
    status: "pending",
    createdAt: new Date(2024, 11, 14, 9, 0),
    estimatedDelivery: new Date(2024, 11, 15, 10, 0),
    xpReward: 35,
  },
  {
    id: "FR-2024-003",
    origin: "CD São Paulo",
    destination: "Loja Sul",
    driver: "Pedro Oliveira",
    items: 42,
    status: "delivered",
    createdAt: new Date(2024, 11, 13, 7, 0),
    estimatedDelivery: new Date(2024, 11, 13, 12, 0),
    xpReward: 75,
  },
  {
    id: "FR-2024-004",
    origin: "Loja Oeste",
    destination: "Loja Leste",
    driver: "Maria Silva",
    items: 8,
    status: "delayed",
    createdAt: new Date(2024, 11, 13, 14, 0),
    estimatedDelivery: new Date(2024, 11, 13, 18, 0),
    xpReward: 25,
  },
  {
    id: "FR-2024-005",
    origin: "CD São Paulo",
    destination: "Loja Norte",
    driver: "João Costa",
    items: 55,
    status: "in_transit",
    createdAt: new Date(2024, 11, 14, 6, 0),
    estimatedDelivery: new Date(2024, 11, 14, 16, 0),
    xpReward: 80,
  },
  {
    id: "FR-2024-006",
    origin: "Loja Centro",
    destination: "CD São Paulo",
    driver: "Lucas Pereira",
    items: 18,
    status: "pending",
    createdAt: new Date(2024, 11, 14, 10, 30),
    estimatedDelivery: new Date(2024, 11, 15, 8, 0),
    xpReward: 40,
  },
  {
    id: "FR-2024-007",
    origin: "CD São Paulo",
    destination: "Loja Oeste",
    driver: "Fernanda Lima",
    items: 30,
    status: "delivered",
    createdAt: new Date(2024, 11, 12, 9, 0),
    estimatedDelivery: new Date(2024, 11, 12, 15, 0),
    xpReward: 60,
  },
  {
    id: "FR-2024-008",
    origin: "Loja Sul",
    destination: "Loja Norte",
    driver: "Ricardo Souza",
    items: 5,
    status: "cancelled",
    createdAt: new Date(2024, 11, 11, 11, 0),
    estimatedDelivery: new Date(2024, 11, 11, 17, 0),
    xpReward: 0,
  },
];

export default function FretesInternos() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const filteredFreights = mockFreights.filter((freight) => {
    const matchesSearch =
      freight.id.toLowerCase().includes(search.toLowerCase()) ||
      freight.origin.toLowerCase().includes(search.toLowerCase()) ||
      freight.destination.toLowerCase().includes(search.toLowerCase()) ||
      freight.driver.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || freight.status === statusFilter;

    const matchesDate =
      !dateFilter ||
      format(freight.createdAt, "yyyy-MM-dd") === format(dateFilter, "yyyy-MM-dd");

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalPages = Math.ceil(filteredFreights.length / itemsPerPage);
  const paginatedFreights = filteredFreights.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = {
    total: mockFreights.length,
    pending: mockFreights.filter((f) => f.status === "pending").length,
    inTransit: mockFreights.filter((f) => f.status === "in_transit").length,
    delivered: mockFreights.filter((f) => f.status === "delivered").length,
    delayed: mockFreights.filter((f) => f.status === "delayed").length,
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-display text-foreground flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-freight-internal/10">
                <Truck className="w-6 h-6 text-freight-internal" />
              </div>
              Fretes Internos
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os fretes entre unidades da empresa
            </p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground glow-primary press-scale"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Frete
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="stat-card text-center">
            <p className="text-2xl font-display font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="stat-card text-center border-warning/20">
            <p className="text-2xl font-display font-bold text-warning">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </div>
          <div className="stat-card text-center border-info/20">
            <p className="text-2xl font-display font-bold text-info">{stats.inTransit}</p>
            <p className="text-xs text-muted-foreground">Em Trânsito</p>
          </div>
          <div className="stat-card text-center border-success/20">
            <p className="text-2xl font-display font-bold text-success">{stats.delivered}</p>
            <p className="text-xs text-muted-foreground">Entregues</p>
          </div>
          <div className="stat-card text-center border-destructive/20">
            <p className="text-2xl font-display font-bold text-destructive">{stats.delayed}</p>
            <p className="text-xs text-muted-foreground">Atrasados</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card-base">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID, origem, destino ou motorista..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="in_transit">Em Trânsito</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="delayed">Atrasado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full md:w-48 justify-start text-left font-normal",
                    !dateFilter && "text-muted-foreground"
                  )}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  {dateFilter
                    ? format(dateFilter, "dd/MM/yyyy", { locale: ptBR })
                    : "Filtrar por data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  mode="single"
                  selected={dateFilter}
                  onSelect={setDateFilter}
                  initialFocus
                />
                {dateFilter && (
                  <div className="p-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setDateFilter(undefined)}
                    >
                      Limpar filtro
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Table */}
        <div className="card-base overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>ID</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Motorista</TableHead>
                <TableHead className="text-center">Itens</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Previsão</TableHead>
                <TableHead className="text-center">XP</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedFreights.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Truck className="w-10 h-10 opacity-20" />
                      <p>Nenhum frete encontrado</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedFreights.map((freight, index) => (
                  <TableRow
                    key={freight.id}
                    className="animate-fade-in cursor-pointer hover:bg-accent/50"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <TableCell className="font-semibold">{freight.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        {freight.origin}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-primary" />
                        {freight.destination}
                      </div>
                    </TableCell>
                    <TableCell>{freight.driver}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Package className="w-3 h-3 text-muted-foreground" />
                        {freight.items}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn("border", statusConfig[freight.status].color)}
                      >
                        {statusConfig[freight.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {format(freight.estimatedDelivery, "dd/MM HH:mm")}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-xp font-semibold">+{freight.xpReward}</span>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
                {Math.min(currentPage * itemsPerPage, filteredFreights.length)} de{" "}
                {filteredFreights.length} fretes
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      currentPage === page && "bg-primary text-primary-foreground"
                    )}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Freight Modal */}
      <NewFreightModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </MainLayout>
  );
}
