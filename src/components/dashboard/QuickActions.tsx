import * as React from "react";
import { Truck, Package, FileText, Scan, PlusCircle, History, Sparkles, Zap, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const actions = [
  {
    label: "Novo Despacho",
    icon: Truck,
    color: "from-primary via-primary/80 to-primary/40",
    glow: "shadow-primary/40",
    path: "/despachos",
    description: "Criação de saída",
    accent: "border-primary/50",
    shimmer: "bg-primary/20"
  },
  {
    label: "Agendar Coleta",
    icon: Package,
    color: "from-[#0EA5E9] via-[#0EA5E9]/80 to-[#0EA5E9]/40",
    glow: "shadow-[#0EA5E9]/40",
    path: "/coletas",
    description: "Solicitar transporte",
    accent: "border-[#0EA5E9]/50",
    shimmer: "bg-[#0EA5E9]/20"
  },
  {
    label: "Relatório OTIF",
    icon: FileText,
    color: "from-[#8B5CF6] via-[#8B5CF6]/80 to-[#8B5CF6]/40",
    glow: "shadow-[#8B5CF6]/40",
    path: "/relatorios",
    description: "Exportar métricas",
    accent: "border-[#8B5CF6]/50",
    shimmer: "bg-[#8B5CF6]/20"
  },
  {
    label: "Rastreio Rápido",
    icon: Scan,
    color: "from-[#F59E0B] via-[#F59E0B]/80 to-[#F59E0B]/40",
    glow: "shadow-[#F59E0B]/40",
    path: "/rastreamento-publico",
    description: "QR Code scanner",
    accent: "border-[#F59E0B]/50",
    shimmer: "bg-[#F59E0B]/20"
  },
];

type QuickActionsProps = React.HTMLAttributes<HTMLDivElement>;

const QuickActions = React.forwardRef<HTMLDivElement, QuickActionsProps>(
  ({ className, ...props }, ref) => {
    const navigate = useNavigate();

    return (
      <div ref={ref} className={cn("relative group", className)} {...props}>
        {/* Outer Glow / Atmospheric Light */}
        <div className="absolute -inset-4 bg-primary/5 rounded-[3.5rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        
        <div className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-black/40 backdrop-blur-3xl shadow-2xl transition-all duration-500 hover:border-primary/20">
          {/* Internal Grid Decoration */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
          
          <div className="p-8 sm:p-10 relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-2xl animate-pulse" />
                  <div className="relative flex items-center justify-center w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-primary/30 to-black border border-primary/40 shadow-2xl group-hover:rotate-6 transition-transform duration-700">
                    <Zap className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <Shield className="w-3 h-3 text-primary/60" />
                    <span className="text-[10px] font-black text-primary/60 uppercase tracking-[0.4em]">Protocolo Nexus</span>
                  </div>
                  <h3 className="font-display font-black text-3xl sm:text-4xl leading-none tracking-tighter italic bg-gradient-to-r from-white via-white to-white/40 bg-clip-text text-transparent">
                    AÇÕES TÁTICAS
                  </h3>
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-12 px-8 text-[11px] font-black uppercase tracking-[0.3em] text-white/70 hover:text-primary gap-3 bg-white/5 hover:bg-primary/10 rounded-2xl transition-all border border-white/10 hover:border-primary/40 hover:shadow-[0_0_30px_rgba(var(--primary),0.2)] group/hist"
              >
                <History className="w-4 h-4 group-hover/hist:rotate-[-45deg] transition-transform" />
                Histórico
                <ArrowRight className="w-3 h-3 opacity-0 group-hover/hist:opacity-100 group-hover/hist:translate-x-1 transition-all" />
              </Button>
            </div>
          
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
              {actions.map((action, index) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(action.path)}
                  className={cn(
                    "group/btn relative h-full py-10 px-8 flex flex-col items-start gap-8 transition-all duration-500 rounded-[2.5rem] border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden",
                    "hover:border-white/20 hover:shadow-2xl"
                  )}
                >
                  {/* Dynamic Gradient Background on Hover */}
                  <div className={cn(
                    "absolute inset-0 opacity-0 group-hover/btn:opacity-20 transition-all duration-700 bg-gradient-to-br",
                    action.color
                  )} />
                  
                  {/* Corner Accent */}
                  <div className={cn("absolute top-0 right-0 w-24 h-24 blur-3xl opacity-0 group-hover/btn:opacity-40 transition-opacity", action.shimmer)} />
                  
                  {/* Animated Border Reveal */}
                  <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none">
                    <div className={cn("absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-current to-transparent opacity-50", action.accent.replace('border-', 'text-'))} />
                  </div>

                  <div className="relative z-10 w-full">
                    <div className="flex items-center justify-between w-full mb-10">
                      <div className={cn(
                        "p-5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl transition-all duration-500 group-hover/btn:scale-110 group-hover/btn:shadow-[0_0_30px_rgba(255,255,255,0.1)]",
                        "group-hover/btn:bg-white group-hover/btn:text-black group-hover/btn:border-transparent"
                      )}>
                        <action.icon className="w-7 h-7" />
                      </div>
                      <div className="opacity-0 group-hover/btn:opacity-40 transition-all duration-500 translate-x-4 group-hover/btn:translate-x-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-1 h-1 rounded-full animate-pulse", action.accent.replace('border-', 'bg-'))} />
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
                          {action.description}
                        </span>
                      </div>
                      <h4 className="text-xl font-black tracking-tighter uppercase italic leading-none group-hover/btn:translate-x-1 transition-transform duration-500">
                        {action.label}
                      </h4>
                    </div>
                  </div>

                  {/* Shine effect */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-transparent via-white/10 to-transparent -translate-x-[150%] group-hover/btn:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
                </motion.button>
              ))}
            </div>
          </div>
          
          {/* Bottom Info Bar */}
          <div className="px-10 py-5 bg-white/[0.02] border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-black bg-white/10" />
                ))}
              </div>
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest italic">
                +14 operadores ativos
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-primary/60 uppercase tracking-widest">Nexus Core v4.0</span>
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            </div>
          </div>
        </div>
      </div>
    );
  }
);
QuickActions.displayName = "QuickActions";

export { QuickActions };