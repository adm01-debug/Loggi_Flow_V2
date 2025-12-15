import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Truck,
  Package,
  Users,
  Building2,
  Send,
  BarChart3,
  Settings,
  Trophy,
  Zap,
  ChevronLeft,
  ChevronRight,
  Box,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Fretes Internos", url: "/fretes-internos", icon: Truck },
  { title: "Fornecedores", url: "/fornecedores", icon: Building2 },
  { title: "Envios Clientes", url: "/envios", icon: Send },
  { title: "Mercadorias", url: "/mercadorias", icon: Package },
  { title: "Motoristas", url: "/motoristas", icon: Users },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
];

const gamificationItems = [
  { title: "Ranking", url: "/ranking", icon: Trophy },
  { title: "Conquistas", url: "/conquistas", icon: Zap },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary glow-primary">
          <Box className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="flex flex-col animate-fade-in">
            <span className="font-display font-bold text-lg text-sidebar-foreground">
              LogiFlow
            </span>
            <span className="text-xs text-muted-foreground">
              Logística Gamificada
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="space-y-1">
          {!collapsed && (
            <span className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Operações
            </span>
          )}
          {menuItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive(item.url)
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 flex-shrink-0 transition-transform duration-200",
                  !isActive(item.url) && "group-hover:scale-110"
                )}
              />
              {!collapsed && (
                <span className="font-medium animate-fade-in">{item.title}</span>
              )}
            </NavLink>
          ))}
        </div>

        <div className="pt-4 space-y-1">
          {!collapsed && (
            <span className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Gamificação
            </span>
          )}
          {gamificationItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive(item.url)
                  ? "bg-gradient-to-r from-xp to-primary text-primary-foreground shadow-md"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 flex-shrink-0 transition-transform duration-200",
                  !isActive(item.url) && "group-hover:scale-110"
                )}
              />
              {!collapsed && (
                <span className="font-medium animate-fade-in">{item.title}</span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Settings */}
      <div className="p-3 border-t border-sidebar-border">
        <NavLink
          to="/configuracoes"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
            isActive("/configuracoes")
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <Settings className="w-5 h-5 flex-shrink-0 group-hover:rotate-90 transition-transform duration-300" />
          {!collapsed && (
            <span className="font-medium animate-fade-in">Configurações</span>
          )}
        </NavLink>
      </div>

      {/* Collapse Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border shadow-md hover:bg-accent transition-all duration-200"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </Button>
    </aside>
  );
}
