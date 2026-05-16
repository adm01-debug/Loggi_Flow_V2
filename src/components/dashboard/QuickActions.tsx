import * as React from "react";
import { Truck, Package, FileText, Scan, ArrowRight, PlusCircle, History, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const actions = [
  {
    label: "Novo Despacho",
    icon: Truck,
    color: "bg-primary hover:bg-primary/90 text-primary-foreground",
    glow: "shadow-primary/40",
    path: "/despachos",
    description: "Criação de saída"
  },
  {
    label: "Agendar Coleta",
    icon: Package,
    color: "bg-success hover:bg-success/90 text-success-foreground",
    glow: "shadow-success/40",
    path: "/coletas",
    description: "Solicitar transporte"
  },
  {
    label: "Relatório OTIF",
    icon: FileText,
    color: "bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground",
    glow: "shadow-sidebar-accent/40",
    path: "/relatorios",
    description: "Exportar métricas"
  },
  {
    label: "Rastreio Rápido",
    icon: Scan,
    color: "bg-warning hover:bg-warning/90 text-warning-foreground",
    glow: "shadow-warning/40",
    path: "/rastreamento-publico",
    description: "QR Code scanner"
  },
];

type QuickActionsProps = React.HTMLAttributes<HTMLDivElement>;

const QuickActions = React.forwardRef<HTMLDivElement, QuickActionsProps>(
  ({ className, ...props }, ref) => {
    const navigate = useNavigate();

    return (
      <div ref={ref} className={cn("card-base p-6 border-none shadow-xl bg-gradient-to-br from-card via-card to-card-elevated/50", className)} {...props}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <PlusCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg leading-none">Fluxo Expresso</h3>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest font-bold">Ações Prioritárias</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary gap-2">
            <History className="w-3.5 h-3.5" />
            Recentes
          </Button>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <motion.button
              key={action.label}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(action.path)}
              className={cn(
                "group relative h-auto py-5 flex flex-col items-center gap-3 transition-all duration-300 rounded-2xl border border-transparent hover:shadow-2xl overflow-hidden",
                action.color,
                action.glow
              )}
            >
              {/* Animated background element */}
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-150 transition-transform duration-500">
                <action.icon className="w-16 h-16" />
              </div>
              
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md shadow-inner group-hover:rotate-12 transition-transform duration-300">
                  <action.icon className="w-6 h-6" />
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-sm font-black tracking-tight uppercase">{action.label}</span>
                  <span className="text-[9px] font-bold opacity-70 uppercase tracking-tighter">{action.description}</span>
                </div>
              </div>

              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    );
  }
);
QuickActions.displayName = "QuickActions";

export { QuickActions };
