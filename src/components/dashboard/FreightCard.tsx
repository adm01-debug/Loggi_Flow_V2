import { Truck, Building2, Send, Clock, MapPin, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type FreightType = "internal" | "supplier" | "customer";
type FreightStatus = "pending" | "in_transit" | "delivered" | "delayed";

interface FreightCardProps {
  id: string;
  type: FreightType;
  origin: string;
  destination: string;
  status: FreightStatus;
  driver?: string;
  estimatedTime?: string;
  items?: number;
}

const typeConfig = {
  internal: {
    icon: Truck,
    label: "Interno",
    color: "bg-freight-internal/10 text-freight-internal border-freight-internal/20",
  },
  supplier: {
    icon: Building2,
    label: "Fornecedor",
    color: "bg-freight-supplier/10 text-freight-supplier border-freight-supplier/20",
  },
  customer: {
    icon: Send,
    label: "Cliente",
    color: "bg-freight-customer/10 text-freight-customer border-freight-customer/20",
  },
};

const statusConfig = {
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
};

export function FreightCard({
  id,
  type,
  origin,
  destination,
  status,
  driver,
  estimatedTime,
  items,
}: FreightCardProps) {
  const TypeIcon = typeConfig[type].icon;

  return (
    <div className="card-interactive hover-lift-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-lg border",
              typeConfig[type].color
            )}
          >
            <TypeIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-foreground">{id}</p>
            <p className="text-xs text-muted-foreground">{typeConfig[type].label}</p>
          </div>
        </div>
        <Badge variant="outline" className={cn("border", statusConfig[status].color)}>
          {statusConfig[status].label}
        </Badge>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">De:</span>
          <span className="font-medium">{origin}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-muted-foreground">Para:</span>
          <span className="font-medium">{destination}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        {driver && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Truck className="w-4 h-4" />
            <span>{driver}</span>
          </div>
        )}
        {estimatedTime && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{estimatedTime}</span>
          </div>
        )}
        {items && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="w-4 h-4" />
            <span>{items} itens</span>
          </div>
        )}
      </div>
    </div>
  );
}
