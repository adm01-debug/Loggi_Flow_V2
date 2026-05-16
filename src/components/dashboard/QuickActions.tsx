import * as React from "react";
import { Truck, Package, FileText, Scan, PlusCircle, History, Sparkles } from "lucide-react";
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
      <div ref={ref} className={cn("card-base p-6 sm:p-8 border-none shadow-2xl bg-gradient-to-br from-card via-card to-card-elevated/50 relative overflow-hidden group", className)} {...props}>
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors duration-700" />
        
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 shadow-inner group-hover:scale-110 transition-transform duration-500">
              <PlusCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-black text-xl sm:text-2xl leading-none tracking-tight">Fluxo Expresso</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 uppercase tracking-[0.3em] font-black opacity-60">Ações Prioritárias</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-9 px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary gap-2 bg-muted/30 hover:bg-primary/5 rounded-full transition-all border border-transparent hover:border-primary/20">
            <History className="w-4 h-4" />
            Recentes
          </Button>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 relative z-10">
          {actions.map((action, index) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(action.path)}
              className={cn(
                "group/btn relative h-auto py-6 sm:py-8 flex flex-col items-center gap-4 transition-all duration-500 rounded-[2rem] border-2 border-transparent hover:shadow-2xl overflow-hidden shadow-lg",
                action.color,
                action.glow,
                "hover:border-white/20"
              )}
            >
              {/* Background Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity" />
              
              {/* Floating icon background */}
              <div className="absolute -top-4 -right-4 p-2 opacity-5 group-hover/btn:opacity-20 group-hover/btn:scale-150 transition-all duration-700 pointer-events-none">
                <action.icon className="w-24 h-24" />
              </div>
              
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-white/20 backdrop-blur-md shadow-xl ring-1 ring-white/30 group-hover/btn:rotate-[15deg] group-hover/btn:scale-110 transition-all duration-500">
                  <action.icon className="w-7 h-7" />
                </div>
                <div className="flex flex-col items-center text-center px-2">
                  <span className="text-sm sm:text-base font-black tracking-tight uppercase drop-shadow-sm">{action.label}</span>
                  <span className="text-[9px] sm:text-[10px] font-bold opacity-80 uppercase tracking-tighter mt-1">{action.description}</span>
                </div>
              </div>

              <div className="absolute bottom-3 right-3 opacity-0 group-hover/btn:opacity-100 transition-all duration-500 translate-y-4 group-hover/btn:translate-y-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>

              {/* Shine effect on hover */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-in-out" />
            </motion.button>
          ))}
        </div>
      </div>
    );
  }
);
QuickActions.displayName = "QuickActions";

export { QuickActions };