import { useState, useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, LayoutDashboard, Package, Truck, Trophy, Menu, X,
  BarChart3, Settings, Bell, DollarSign, Calculator,
  Users, Shield, Map, Send, Box, AlertTriangle,
  PackageSearch, Target, Building2, FileCheck, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useNavigationHistory } from "@/hooks/useNavigationHistory";
import { hapticFeedback } from "@/utils/haptics";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number;
}

interface NavCategory {
  title: string;
  items: NavItem[];
}

const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Início", path: "/" },
  { icon: Package, label: "Envios", path: "/envios" },
  { icon: Truck, label: "Coletas", path: "/coletas" },
  { icon: Trophy, label: "Ranking", path: "/ranking" },
];

const moreCategories: NavCategory[] = [
  {
    title: "Visão Geral",
    items: [
      { icon: BarChart3, label: "Analytics", path: "/analytics" },
      { icon: Target, label: "SLA", path: "/sla-dashboard" },
      { icon: Target, label: "OTIF", path: "/painel-otif" },
    ],
  },
  {
    title: "Operações",
    items: [
      { icon: Send, label: "Despachos", path: "/despachos" },
      { icon: Box, label: "BOX", path: "/gestao-box" },
      { icon: AlertTriangle, label: "Ocorrências", path: "/ocorrencias" },
      { icon: PackageSearch, label: "Rastreamento", path: "/central-rastreamento" },
    ],
  },
  {
    title: "Rede Logística",
    items: [
      { icon: Truck, label: "Transportadoras", path: "/transportadoras" },
      { icon: Calculator, label: "Cotação", path: "/cotacao-frete" },
      { icon: Map, label: "Mapa", path: "/mapa-rotas" },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { icon: DollarSign, label: "Custos", path: "/custos" },
      { icon: FileCheck, label: "Conciliação", path: "/conciliacao" },
    ],
  },
  {
    title: "Cadastros",
    items: [
      { icon: Building2, label: "Fornecedores", path: "/fornecedores" },
      { icon: Users, label: "Clientes", path: "/clientes" },
    ],
  },
  {
    title: "Sistema",
    items: [
      { icon: Bell, label: "Notificações", path: "/notificacoes" },
      { icon: Shield, label: "Segurança", path: "/seguranca" },
      { icon: Settings, label: "Configurações", path: "/configuracoes" },
    ],
  },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { goBack, canGoBack } = useNavigationHistory();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 md:hidden",
          "bg-background/80 backdrop-blur-xl border-t border-border/50 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]",
          "pb-[env(safe-area-inset-bottom)]"
        )}
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {/* Dynamic Mobile Back/Home Button */}
          <button
            onClick={() => {
              hapticFeedback('medium');
              if (canGoBack) {
                goBack();
              } else {
                navigate("/");
              }
            }}
            className={cn(
              "flex flex-col items-center justify-center flex-1 py-2 px-1 relative transition-all duration-300 active:scale-90",
              !canGoBack && location.pathname === "/" ? "text-primary" : "text-muted-foreground"
            )}
          >
            <motion.div
              animate={{
                scale: location.pathname === "/" ? 1.1 : 1,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              {canGoBack ? (
                <ArrowLeft className="w-5 h-5" />
              ) : (
                <LayoutDashboard className={cn("w-5 h-5", location.pathname === "/" ? "text-primary" : "text-muted-foreground")} />
              )}
            </motion.div>
            <span className="text-[10px] mt-1 font-bold uppercase tracking-tighter">
              {canGoBack ? "Voltar" : "Início"}
            </span>
          </button>

          {mainNavItems.slice(1).map((item) => {
            const active = isActive(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => hapticFeedback('light')}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 py-2 px-1 relative",
                  "transition-all duration-300",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset rounded-lg",
                  "active:scale-90"
                )}
                aria-current={active ? "page" : undefined}
              >
                <AnimatePresence>
                  {active && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute inset-x-2 top-0 h-1 bg-gradient-to-r from-primary to-primary-glow rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      exit={{ opacity: 0, scaleX: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </AnimatePresence>

                <motion.div
                  animate={{
                    scale: active ? 1.1 : 1,
                    y: active ? -2 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 transition-colors",
                      active ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                </motion.div>

                <span
                  className={cn(
                    "text-[10px] mt-1 font-bold uppercase tracking-tighter transition-colors",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>

                {item.badge && item.badge > 0 && (
                  <span className="absolute top-1 right-1/4 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}

          {/* More button with Sheet */}
          <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-center flex-1 py-2 px-1",
                  "transition-all duration-200 rounded-lg",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                )}
                aria-label="Mais opções"
              >
                <motion.div
                  animate={{ rotate: isMoreOpen ? 90 : 0 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {isMoreOpen ? (
                    <X className="w-5 h-5 text-primary" />
                  ) : (
                    <Menu className="w-5 h-5 text-muted-foreground" />
                  )}
                </motion.div>
                <span className={cn(
                  "text-[10px] mt-1 font-medium",
                  isMoreOpen ? "text-primary" : "text-muted-foreground"
                )}>
                  Mais
                </span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[75vh] rounded-t-3xl overflow-hidden flex flex-col p-0 border-t-2 border-primary/20">
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto my-3 shrink-0" />
              <div className="flex-1 overflow-y-auto px-4 pb-10">
                {moreCategories.map((cat) => (
                  <div key={cat.title}>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                      {cat.title}
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {cat.items.map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsMoreOpen(false)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all",
                            "hover:bg-accent active:scale-95",
                            isActive(item.path) && "bg-primary/10 text-primary"
                          )}
                        >
                          <item.icon className="w-5 h-5" />
                          <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Spacer */}
      <div className="h-[calc(4rem+env(safe-area-inset-bottom))] md:hidden" aria-hidden="true" />
    </>
  );
}
