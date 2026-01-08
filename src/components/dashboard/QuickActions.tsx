import * as React from "react";
import { Truck, Package, FileText, Scan } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const actions = [
  {
    label: "Novo Frete",
    icon: Truck,
    color: "bg-primary hover:bg-primary/90 text-primary-foreground",
    glow: true,
  },
  {
    label: "Receber Mercadoria",
    icon: Package,
    color: "bg-success hover:bg-success/90 text-success-foreground",
  },
  {
    label: "Gerar Relatório",
    icon: FileText,
    color: "bg-secondary hover:bg-secondary/80 text-secondary-foreground",
  },
  {
    label: "Escanear",
    icon: Scan,
    color: "bg-accent hover:bg-accent/80 text-accent-foreground",
  },
];

interface QuickActionsProps extends React.HTMLAttributes<HTMLDivElement> {}

const QuickActions = React.forwardRef<HTMLDivElement, QuickActionsProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("card-base space-y-3 sm:space-y-4", className)} {...props}>
        <h3 className="font-display font-semibold text-base sm:text-lg">Ações Rápidas</h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {actions.map((action, index) => (
            <Button
              key={action.label}
              className={cn(
                "h-auto py-3 sm:py-4 flex-col gap-1.5 sm:gap-2 transition-all duration-200 press-scale",
                action.color,
                action.glow && "glow-primary"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <action.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium text-center leading-tight">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>
    );
  }
);
QuickActions.displayName = "QuickActions";

export { QuickActions };
