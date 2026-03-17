import * as React from "react";
import { Truck, Package, FileText, Scan, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const actions = [
  {
    label: "Novo Despacho",
    icon: Truck,
    color: "bg-primary hover:bg-primary/90 text-primary-foreground",
    glow: true,
    path: "/despachos",
  },
  {
    label: "Nova Coleta",
    icon: Package,
    color: "bg-success hover:bg-success/90 text-success-foreground",
    path: "/coletas",
  },
  {
    label: "Gerar Relatório",
    icon: FileText,
    color: "bg-secondary hover:bg-secondary/80 text-secondary-foreground",
    path: "/relatorios",
  },
  {
    label: "Escanear QR",
    icon: Scan,
    color: "bg-accent hover:bg-accent/80 text-accent-foreground",
    path: "/rastreamento-publico",
  },
];

interface QuickActionsProps extends React.HTMLAttributes<HTMLDivElement> {}

const QuickActions = React.forwardRef<HTMLDivElement, QuickActionsProps>(
  ({ className, ...props }, ref) => {
    const navigate = useNavigate();

    return (
      <div ref={ref} className={cn("card-base space-y-3 sm:space-y-4", className)} {...props}>
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-base sm:text-lg">Ações Rápidas</h3>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {actions.map((action, index) => (
            <Button
              key={action.label}
              onClick={() => navigate(action.path)}
              className={cn(
                "h-auto py-3 sm:py-4 flex-col gap-1.5 sm:gap-2 transition-all duration-200 press-scale group",
                action.color,
                action.glow && "glow-primary"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <action.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium text-center leading-tight">{action.label}</span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Button>
          ))}
        </div>
      </div>
    );
  }
);
QuickActions.displayName = "QuickActions";

export { QuickActions };
