import * as React from "react";
import { Truck, Package, FileText, Scan, History, Sparkles, Zap, Shield, ArrowRight, MousePointer2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const actions = [
  {
    label: "Novo Despacho",
    icon: Truck,
    color: "from-primary via-primary/80 to-primary/40",
    glow: "shadow-primary/40",
    path: "/despachos",
    description: "Criação de saída",
    accent: "border-primary/50",
    shimmer: "bg-primary/20",
    id: "dispatch"
  },
  {
    label: "Agendar Coleta",
    icon: Package,
    color: "from-[#0EA5E9] via-[#0EA5E9]/80 to-[#0EA5E9]/40",
    glow: "shadow-[#0EA5E9]/40",
    path: "/coletas",
    description: "Solicitar transporte",
    accent: "border-[#0EA5E9]/50",
    shimmer: "bg-[#0EA5E9]/20",
    id: "pickup"
  },
  {
    label: "Relatório OTIF",
    icon: FileText,
    color: "from-[#8B5CF6] via-[#8B5CF6]/80 to-[#8B5CF6]/40",
    glow: "shadow-[#8B5CF6]/40",
    path: "/relatorios",
    description: "Exportar métricas",
    accent: "border-[#8B5CF6]/50",
    shimmer: "bg-[#8B5CF6]/20",
    id: "otif"
  },
  {
    label: "Rastreio Rápido",
    icon: Scan,
    color: "from-[#F59E0B] via-[#F59E0B]/80 to-[#F59E0B]/40",
    glow: "shadow-[#F59E0B]/40",
    path: "/rastreamento-publico",
    description: "QR Code scanner",
    accent: "border-[#F59E0B]/50",
    shimmer: "bg-[#F59E0B]/20",
    id: "track"
  },
];

type QuickActionsProps = React.HTMLAttributes<HTMLDivElement>;

const ActionButton = ({ action, index, navigate }: { action: typeof actions[0], index: number, navigate: (p: string) => void }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });
  
  const rotateX = useTransform(springY, [-50, 50], [10, -10]);
  const rotateY = useTransform(springX, [-50, 50], [-10, 10]);

  function handleMouseMove(event: React.MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
    
    mouseX.set(event.clientX - rect.left);
    mouseY.set(event.clientY - rect.top);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={() => navigate(action.path)}
      className={cn(
        "group/btn relative h-full py-12 px-10 flex flex-col items-start gap-10 transition-all duration-500 rounded-[3rem] border border-white/5 bg-white/[0.03] backdrop-blur-3xl overflow-hidden",
        "hover:border-white/20 hover:bg-white/[0.05] hover:shadow-[0_20px_80px_-15px_rgba(0,0,0,0.7)]"
      )}
    >
      {/* Dynamic Spotlight */}
      <motion.div 
        className="absolute inset-0 z-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: useTransform(
            [mouseX, mouseY],
            ([mx, my]) => `radial-gradient(600px circle at ${mx}px ${my}px, rgba(255,255,255,0.06), transparent 40%)`
          )
        }}
      />

      {/* Background Gradient Accents */}
      <div className={cn(
        "absolute -inset-[100%] opacity-0 group-hover/btn:opacity-10 transition-all duration-1000 bg-gradient-to-br blur-3xl",
        action.color
      )} />

      <div className="relative z-10 w-full flex flex-col h-full justify-between" style={{ transform: "translateZ(50px)" }}>
        <div className="flex items-center justify-between w-full">
          <div className={cn(
            "p-6 rounded-[1.5rem] bg-black/40 border border-white/10 backdrop-blur-xl transition-all duration-700 group-hover/btn:scale-110 group-hover/btn:shadow-[0_0_40px_rgba(255,255,255,0.1)] group-hover/btn:bg-white group-hover/btn:text-black group-hover/btn:border-transparent",
          )}>
            <action.icon className="w-8 h-8 stroke-[1.5]" />
          </div>
          <div className="opacity-0 group-hover/btn:opacity-100 transition-all duration-700 -translate-y-2 group-hover/btn:translate-y-0">
            <div className={cn("px-3 py-1 rounded-full border border-white/10 bg-black/50 backdrop-blur-md", action.accent.replace('border-', 'text-'))}>
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse shadow-[0_0_8px_currentColor]", action.accent.replace('border-', 'bg-'), action.accent.replace('border-', 'text-'))} />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] font-mono">
                {action.description}
              </span>
            </div>
            <h4 className="text-2xl font-black tracking-tighter uppercase italic leading-none bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent group-hover/btn:translate-x-2 transition-transform duration-700">
              {action.label}
            </h4>
          </div>
          
          <div className="flex items-center justify-between opacity-0 group-hover/btn:opacity-100 transition-all duration-700 translate-y-4 group-hover/btn:translate-y-0">
            <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Acessar Módulo</span>
            <ArrowRight className="w-4 h-4 text-white/40 group-hover/btn:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Decorative Corner */}
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover/btn:opacity-30 transition-opacity">
        <MousePointer2 className="w-4 h-4 text-white rotate-12" />
      </div>
    </motion.button>
  );
};

const QuickActions = React.forwardRef<HTMLDivElement, QuickActionsProps>(
  ({ className, ...props }, ref) => {
    const navigate = useNavigate();

    return (
      <div ref={ref} className={cn("relative group/container", className)} {...props}>
        {/* Deep Atmosphere */}
        <div className="absolute -inset-10 bg-primary/5 rounded-[5rem] blur-[120px] opacity-0 group-hover/container:opacity-100 transition-opacity duration-1000" />
        
        <div className="relative overflow-hidden rounded-[4rem] border border-white/10 bg-[#050505]/60 backdrop-blur-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] transition-all duration-700 hover:border-primary/30">
          {/* Animated Matrix Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
          <div className="absolute inset-0 bg-radial-at-t from-primary/5 via-transparent to-transparent opacity-50" />
          
          <div className="p-10 sm:p-14 relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-16 gap-10">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse" />
                    <div className="relative flex items-center justify-center w-20 h-20 rounded-[1.75rem] bg-gradient-to-br from-primary/40 to-black border border-primary/40 shadow-2xl group-hover/container:rotate-12 transition-transform duration-1000">
                      <Zap className="w-10 h-10 text-primary animate-pulse" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-[1px] w-8 bg-primary/40" />
                      <Shield className="w-3.5 h-3.5 text-primary/60" />
                      <span className="text-[11px] font-black text-primary/60 uppercase tracking-[0.5em] font-mono">Central de Comando</span>
                    </div>
                    <h3 className="font-display font-black text-4xl sm:text-5xl leading-none tracking-tighter italic bg-gradient-to-r from-white via-white to-white/30 bg-clip-text text-transparent">
                      SISTEMA DE ATALHOS
                    </h3>
                  </div>
                </div>
                <p className="text-white/40 text-sm font-medium tracking-tight max-w-md lg:ml-24">
                  Execute operações críticas com latência zero através da interface de acesso rápido Nexus.
                </p>
              </div>
              
              <div className="flex items-center gap-4 lg:self-end">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/historico')}
                  className="h-14 px-10 text-[12px] font-black uppercase tracking-[0.4em] text-white/60 hover:text-primary gap-4 bg-white/5 hover:bg-primary/10 rounded-2xl transition-all border border-white/5 hover:border-primary/40 group/hist font-mono"
                >
                  <History className="w-5 h-5 group-hover/hist:rotate-[-45deg] transition-transform" />
                  Logs de Atividade
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover/hist:opacity-100 group-hover/hist:translate-x-2 transition-all" />
                </Button>
              </div>
            </div>
          
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 relative z-10">
              {actions.map((action, index) => (
                <ActionButton 
                  key={action.id} 
                  action={action} 
                  index={index} 
                  navigate={navigate} 
                />
              ))}
            </div>
          </div>
          
          {/* Bottom Integrated Status */}
          <div className="px-14 py-8 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-[#050505] bg-gradient-to-br from-white/20 to-white/5 backdrop-blur-md flex items-center justify-center text-[10px] font-bold text-white/40">
                    {i}
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">Operadores Sincronizados</span>
                <span className="text-[9px] font-bold text-primary/60 uppercase tracking-widest">Cluster Nexus 01-Alpha ativo</span>
              </div>
            </div>
            
            <div className="flex items-center gap-8">
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">Status do Núcleo</span>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-black text-primary uppercase tracking-widest">Operacional</span>
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </div>
                </div>
              </div>
              <div className="h-10 w-[1px] bg-white/10 hidden sm:block" />
              <div className="text-right">
                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Versão de Interface</span>
                <p className="text-[11px] font-black text-white/60 tracking-widest">NEXUS-UI/v10.0</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
QuickActions.displayName = "QuickActions";

export { QuickActions };