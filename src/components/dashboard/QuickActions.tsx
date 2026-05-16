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
    description: "Criação de saída",
    accent: "border-primary/50"
  },
  {
    label: "Agendar Coleta",
    icon: Package,
    color: "bg-[#0EA5E9] hover:bg-[#0EA5E9]/90 text-white",
    glow: "shadow-[#0EA5E9]/40",
    path: "/coletas",
    description: "Solicitar transporte",
    accent: "border-[#0EA5E9]/50"
  },
  {
    label: "Relatório OTIF",
    icon: FileText,
    color: "bg-[#8B5CF6] hover:bg-[#8B5CF6]/90 text-white",
    glow: "shadow-[#8B5CF6]/40",
    path: "/relatorios",
    description: "Exportar métricas",
    accent: "border-[#8B5CF6]/50"
  },
  {
    label: "Rastreio Rápido",
    icon: Scan,
    color: "bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white",
    glow: "shadow-[#F59E0B]/40",
    path: "/rastreamento-publico",
    description: "QR Code scanner",
    accent: "border-[#F59E0B]/50"
  },
];

type QuickActionsProps = React.HTMLAttributes<HTMLDivElement>;

const QuickActions = React.forwardRef<HTMLDivElement, QuickActionsProps>(
  ({ className, ...props }, ref) => {
    const navigate = useNavigate();

    return (
      <div ref={ref} className={cn("relative overflow-hidden group p-[2px] rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-white/5 to-white/10 shadow-2xl", className)} {...props}>
        <div className="card-base p-6 sm:p-8 border-none bg-black/80 backdrop-blur-3xl rounded-[2.4rem] relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-[100px] pointer-events-none group-hover:bg-primary/20 transition-colors duration-700" />
          
          <div className="flex items-center justify-between mb-10 relative z-10">
            <div className="flex items-center gap-5">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-xl group-hover:scale-110 transition-transform duration-500">
                <PlusCircle className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h3 className="font-display font-black text-2xl sm:text-3xl leading-none tracking-tight italic bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent">FLUXO EXPRESSO</h3>
                <p className="text-[10px] sm:text-[11px] text-primary/80 mt-2 uppercase tracking-[0.4em] font-black opacity-80">AÇÕES PRIORITÁRIAS NEXUS</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="h-10 px-5 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:text-primary gap-2 bg-white/5 hover:bg-primary/10 rounded-full transition-all border border-white/10 hover:border-primary/30">
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
              whileHover={{ y: -10, scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(action.path)}
              className={cn(
                "group/btn relative h-auto py-8 sm:py-10 flex flex-col items-center gap-5 transition-all duration-500 rounded-[2.5rem] border-2 border-white/5 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden shadow-xl bg-gradient-to-br from-white/10 to-white/5",
                action.accent,
                action.glow
              )}
            >
              {/* Background Color Fill on Hover */}
              <div className={cn("absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500", action.color)} />
              
              {/* Floating icon background */}
              <div className="absolute -top-6 -right-6 p-2 opacity-5 group-hover/btn:opacity-20 group-hover/btn:scale-[2] transition-all duration-700 pointer-events-none">
                <action.icon className="w-32 h-32" />
              </div>
              
              <div className="relative z-10 flex flex-col items-center gap-5">
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xl shadow-2xl ring-1 ring-white/20 group-hover/btn:rotate-[15deg] group-hover/btn:scale-125 transition-all duration-500 group-hover/btn:bg-white group-hover/btn:text-black">
                  <action.icon className="w-8 h-8" />
                </div>
                <div className="flex flex-col items-center text-center px-4">
                  <span className="text-sm sm:text-[15px] font-black tracking-tighter uppercase italic group-hover/btn:scale-110 transition-transform duration-500">
                    {action.label}
                  </span>
                  <span className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-2 group-hover/btn:opacity-100">
                    {action.description}
                  </span>
                </div>
              </div>

              <div className="absolute bottom-4 right-4 opacity-0 group-hover/btn:opacity-100 transition-all duration-500 translate-y-4 group-hover/btn:translate-y-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>

              {/* Shine effect on hover */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-in-out" />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
    );
  }
);
QuickActions.displayName = "QuickActions";

export { QuickActions };