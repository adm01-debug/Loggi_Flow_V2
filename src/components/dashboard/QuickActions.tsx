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
      <div ref={ref} className={cn("card-base space-y-4", className)} {...props}>
        <h3 className="font-display font-semibold text-lg">Ações Rápidas</h3>
        
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Button
              key={action.label}
              className={cn(
                "h-auto py-4 flex-col gap-2 transition-all duration-200 press-scale",
                action.color,
                action.glow && "glow-primary"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <action.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>
    );
  }
);
QuickActions.displayName = "QuickActions";

export { QuickActions };
