import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  Truck,
  Trophy,
  Menu,
  X,
  BarChart3,
  Settings,
  Bell,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: number;
}

const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Início", path: "/" },
  { icon: Package, label: "Envios", path: "/envios" },
  { icon: Truck, label: "Coletas", path: "/coletas" },
  { icon: Trophy, label: "Ranking", path: "/ranking" },
];

const moreNavItems: NavItem[] = [
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: Bell, label: "Notificações", path: "/notificacoes" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

export function MobileBottomNav() {
  const location = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 md:hidden",
          "bg-card/95 backdrop-blur-lg border-t border-border",
          "pb-[env(safe-area-inset-bottom)]"
        )}
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {mainNavItems.map((item) => {
            const active = isActive(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 py-2 px-1 relative",
                  "transition-all duration-200",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset rounded-lg"
                )}
                aria-current={active ? "page" : undefined}
              >
                {/* Active indicator */}
                <AnimatePresence>
                  {active && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute inset-x-2 top-0 h-0.5 bg-primary rounded-full"
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      exit={{ opacity: 0, scaleX: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </AnimatePresence>

                {/* Icon with animation */}
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

                {/* Label */}
                <span
                  className={cn(
                    "text-[10px] mt-1 font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </span>

                {/* Badge */}
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
            <SheetContent side="bottom" className="h-auto rounded-t-2xl">
              <div className="grid grid-cols-3 gap-4 py-4">
                {moreNavItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-xl transition-all",
                      "hover:bg-accent active:scale-95",
                      isActive(item.path) && "bg-primary/10 text-primary"
                    )}
                  >
                    <item.icon className="w-6 h-6" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Spacer to prevent content from being hidden behind nav */}
      <div className="h-[calc(4rem+env(safe-area-inset-bottom))] md:hidden" aria-hidden="true" />
    </>
  );
}

// CSS for safe area (add to index.css if not present)
// .safe-area-inset-bottom {
//   padding-bottom: env(safe-area-inset-bottom);
// }
