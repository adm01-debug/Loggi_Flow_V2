import { 
  Truck, 
  Package, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  ArrowRight 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Activity {
  id: string;
  type: "freight_created" | "freight_delivered" | "freight_delayed" | "item_received";
  title: string;
  description: string;
  time: string;
}

const activityConfig = {
  freight_created: {
    icon: Truck,
    iconColor: "text-info",
    bgColor: "bg-info/10",
  },
  freight_delivered: {
    icon: CheckCircle2,
    iconColor: "text-success",
    bgColor: "bg-success/10",
  },
  freight_delayed: {
    icon: AlertCircle,
    iconColor: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  item_received: {
    icon: Package,
    iconColor: "text-primary",
    bgColor: "bg-primary/10",
  },
};

const activities: Activity[] = [
  {
    id: "1",
    type: "freight_delivered",
    title: "Entrega Concluída",
    description: "Frete #FR-2024-001 entregue com sucesso",
    time: "Há 5 min",
  },
  {
    id: "2",
    type: "freight_created",
    title: "Novo Frete Criado",
    description: "Frete #FR-2024-002 para Cliente XYZ",
    time: "Há 15 min",
  },
  {
    id: "3",
    type: "item_received",
    title: "Mercadoria Recebida",
    description: "50 unidades do Fornecedor ABC",
    time: "Há 30 min",
  },
  {
    id: "4",
    type: "freight_delayed",
    title: "Atraso Detectado",
    description: "Frete #FR-2024-003 com 2h de atraso",
    time: "Há 1h",
  },
];

export function RecentActivity() {
  return (
    <div className="card-base space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-lg">Atividade Recente</h3>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
          Ver tudo
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="space-y-3">
        {activities.map((activity, index) => {
          const config = activityConfig[activity.type];
          const Icon = config.icon;

          return (
            <div
              key={activity.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg transition-all duration-200 hover:bg-accent/50 cursor-pointer animate-slide-up",
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0",
                  config.bgColor
                )}
              >
                <Icon className={cn("w-4 h-4", config.iconColor)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{activity.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {activity.description}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                <Clock className="w-3 h-3" />
                {activity.time}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
