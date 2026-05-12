import { useState, lazy, Suspense } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Truck, Package, Building2, Send, BarChart3, Settings,
  Trophy, Zap, ChevronLeft, ChevronRight, Box, PackageSearch, History,
  Shield, Target, CalendarDays, Calculator, DollarSign, AlertTriangle,
  Map, Navigation, Users, Bell, FileCheck, Route, Bot, ChevronDown,
  Sparkles, TrendingUp, Gamepad2, Cog, KeyRound, Award, Upload, Zap as ZapIcon, Webhook,
  Code, Star, Coins, RotateCcw
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
// Lazy-load AIAssistant - only needed when user opens the sheet
const AIAssistant = lazy(() => import("@/components/ai/AIAssistant").then(m => ({ default: m.AIAssistant })));
import { usePrefetch } from "@/hooks/usePrefetch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useGamification } from "@/hooks/useGamification";
import { Progress } from "@/components/ui/progress";

interface MenuSection {
  id: string;
  title: string;
  icon: React.ElementType;
  items: { title: string; url: string; icon: React.ElementType }[];
}

const menuSections: MenuSection[] = [
  {
    id: "overview",
    title: "Visão Geral",
    icon: LayoutDashboard,
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "Analytics", url: "/analytics", icon: BarChart3 },
      { title: "Executivo", url: "/dashboard-executivo", icon: TrendingUp },
      { title: "Dashboard SLA", url: "/sla-dashboard", icon: Target },
      { title: "Painel OTIF", url: "/painel-otif", icon: Award },
      { title: "Calendário", url: "/calendario", icon: CalendarDays },
    ],
  },
  {
    id: "finance",
    title: "Financeiro",
    icon: DollarSign,
    items: [
      { title: "Custos Logísticos", url: "/custos", icon: DollarSign },
      { title: "Inteligência Frete", url: "/inteligencia-frete", icon: TrendingUp },
      { title: "Conciliação", url: "/conciliacao", icon: FileCheck },
      { title: "Alertas Custo", url: "/alertas-custo", icon: AlertTriangle },
    ],
  },
  {
    id: "operations",
    title: "Operações",
    icon: Truck,
    items: [
      { title: "Coletas Compras", url: "/coletas", icon: PackageSearch },
      { title: "Cotação e Despacho", url: "/despachos", icon: Send },
      { title: "Envios Clientes", url: "/envios", icon: Package },
      { title: "Kanban Entregas", url: "/kanban-entregas", icon: Sparkles },
      { title: "Fretes Internos", url: "/fretes-internos", icon: Truck },
      { title: "Gestão de BOX", url: "/gestao-box", icon: Box },
      { title: "Ocorrências", url: "/ocorrencias", icon: AlertTriangle },
      { title: "Logística Reversa", url: "/logistica-reversa", icon: RotateCcw },
    ],
  },
  {
    id: "network",
    title: "Rede Logística",
    icon: Map,
    items: [
      { title: "Transportadoras", url: "/transportadoras", icon: Truck },
      { title: "Rotas", url: "/rotas-transportadoras", icon: Route },
      { title: "Cotação Frete", url: "/cotacao-frete", icon: Calculator },
      { title: "Cotação Multi-Canal", url: "/cotacao-multicanal", icon: Zap },
      { title: "Dashboard Cotações", url: "/dashboard-cotacoes", icon: FileCheck },
      { title: "Mapa de Rotas", url: "/mapa-rotas", icon: Map },
      { title: "Central Rastreamento", url: "/central-rastreamento", icon: Target },
      { title: "Rastreamento Motorista", url: "/rastreamento-motorista", icon: Navigation },
       { title: "Rodonaves RTE", url: "/gestao-rodonaves", icon: Truck },
       { title: "Melhor Envio", url: "/melhor-envio", icon: Package },
       { title: "Bitrix24 CRM", url: "/bitrix24", icon: Building2 },
     ],
   },
  {
    id: "entities",
    title: "Cadastros",
    icon: Users,
    items: [
      { title: "Fornecedores", url: "/fornecedores", icon: Building2 },
      { title: "Clientes", url: "/clientes", icon: Users },
      { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
      { title: "Relatório PDF", url: "/relatorio-pdf", icon: FileCheck },
      { title: "Conciliação Auto", url: "/conciliacao-automatica", icon: Cog },
      { title: "Importação Massa", url: "/importacao-massa", icon: Upload },
      { title: "Automação Regras", url: "/automacao-regras", icon: ZapIcon },
    ],
  },
];

const gamificationItems = [
  { title: "Ranking", url: "/ranking", icon: Trophy },
  { title: "Conquistas", url: "/conquistas", icon: Zap },
  { title: "Loja", url: "/loja", icon: Package },
  { title: "Notificações", url: "/notificacoes", icon: Bell },
];

const adminItems = [
  { title: "Usuários", url: "/gerenciamento-usuarios", icon: Users },
  { title: "Segurança", url: "/seguranca", icon: Shield },
  { title: "Webhooks", url: "/webhooks", icon: Webhook },
  { title: "Reset Senha", url: "/aprovacao-reset-senha", icon: KeyRound },
  { title: "Audit Trail", url: "/audit-trail", icon: History },
  { title: "Documentação API", url: "/api-docs", icon: Code },
];


export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { isAdmin } = useAuth();
  const { prefetch } = usePrefetch();
  const { userLevel, levelProgress } = useGamification();

  // Determine initially active section based on current route
  const getActiveSection = () => {
    for (const section of menuSections) {
      if (section.items.some(item => location.pathname === item.url)) {
        return section.id;
      }
    }
    return "overview";
  };

  // Exclusive accordion — only one section open at a time
  const [openSection, setOpenSection] = useState<string | null>(getActiveSection);

  const isActive = (path: string) => location.pathname === path;
  const isSectionActive = (section: MenuSection) => section.items.some(item => isActive(item.url));

  const toggleSection = (id: string) => {
    setOpenSection(prev => prev === id ? null : id);
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-[72px]" : "w-72"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-sidebar-border">
        <div 
          className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30 animate-[sidebar-logo_4s_ease-in-out_infinite]"
        >
          <Box className="w-6 h-6 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div 
            className="flex flex-col animate-in fade-in slide-in-from-left-2 duration-200"
          >
            <span className="font-display font-bold text-xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              LogiFlow
            </span>
            <span className="text-[10px] text-muted-foreground font-medium tracking-wide uppercase">
              Logística Gamificada
            </span>
          </div>
        )}
      </div>

      {/* XP Progress Bar */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-sidebar-border/50 bg-sidebar-accent/30">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <div className="p-1 rounded bg-xp/20">
                <Star className="w-3 h-3 text-xp fill-xp" />
              </div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nível {levelProgress.currentLevel}</span>
            </div>
            <span className="text-[10px] font-bold text-xp">{Math.round(levelProgress.progress)}%</span>
          </div>
          <Progress value={levelProgress.progress} className="h-1 bg-xp/10" />
          <div className="flex justify-between items-center mt-1.5">
             <div className="flex items-center gap-1">
               <Coins className="w-3 h-3 text-warning" />
               <span className="text-[10px] font-bold text-foreground">{userLevel?.coins || 0}</span>
             </div>
             <span className="text-[9px] text-muted-foreground tabular-nums">{levelProgress.currentLevelXP} / {levelProgress.nextLevelXP} XP</span>
          </div>
        </div>
      )}

      {/* Scroll indicator top */}
      <div className="absolute top-[145px] left-0 right-0 h-6 bg-gradient-to-b from-sidebar to-transparent z-10 pointer-events-none" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-none">
        {menuSections.map((section) => (
          <Collapsible 
            key={section.id} 
            open={openSection === section.id || collapsed}
            onOpenChange={() => !collapsed && toggleSection(section.id)}
          >
            <CollapsibleTrigger asChild>
              <button
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-all duration-200 group",
                  isSectionActive(section)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <section.icon className={cn(
                  "w-5 h-5 flex-shrink-0 transition-colors",
                  isSectionActive(section) && "text-primary"
                )} />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left text-xs font-semibold uppercase tracking-wider">
                      {section.title}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground/60 tabular-nums mr-1">
                      {section.items.length}
                    </span>
                    <ChevronDown className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      openSection === section.id && "rotate-180"
                    )} />
                  </>
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-1">
              {section.items.map((item, idx) => (
                <div
                  key={item.url}
                  className="animate-in fade-in slide-in-from-left-2 duration-150"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <NavLink
                    to={item.url}
                    onMouseEnter={() => prefetch(item.url)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group/item relative",
                      collapsed ? "justify-center" : "ml-2",
                      isActive(item.url)
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/80 hover:text-sidebar-accent-foreground"
                    )}
                  >
                    {/* Active indicator pill */}
                    {isActive(item.url) && !collapsed && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary-foreground/60" />
                    )}
                    <item.icon className={cn(
                      "w-4 h-4 flex-shrink-0 transition-transform duration-200",
                      !isActive(item.url) && "group-hover/item:scale-110"
                    )} />
                    {!collapsed && (
                      <span className="text-sm font-medium">{item.title}</span>
                    )}
                  </NavLink>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ))}

        {/* Gamification Section */}
        <div className="pt-4 mt-4 border-t border-sidebar-border/50">
          {!collapsed && (
            <div className="flex items-center gap-2 px-3 mb-2">
              <Gamepad2 className="w-4 h-4 text-xp" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Gamificação
              </span>
            </div>
          )}
          <div className="space-y-1">
            {gamificationItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                  collapsed && "justify-center",
                  isActive(item.url)
                    ? "bg-gradient-to-r from-xp/20 to-primary/20 text-primary border border-primary/20"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className={cn(
                  "w-4 h-4 flex-shrink-0 transition-transform duration-200",
                  !isActive(item.url) && "group-hover:scale-110",
                  isActive(item.url) && "text-xp"
                )} />
                {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Scroll indicator bottom */}
      <div className="absolute bottom-[180px] left-0 right-0 h-6 bg-gradient-to-t from-sidebar to-transparent z-10 pointer-events-none" />

      {/* Admin Section */}
      {isAdmin && (
        <div className="px-3 py-2 border-t border-sidebar-border/50">
          {!collapsed && (
            <div className="flex items-center gap-2 px-3 mb-2">
              <Shield className="w-3 h-3 text-warning" />
              <span className="text-[10px] font-bold text-warning uppercase tracking-wider">Admin</span>
            </div>
          )}
          {adminItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                collapsed && "justify-center",
                isActive(item.url)
                  ? "bg-warning/20 text-warning border border-warning/30"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
            </NavLink>
          ))}
        </div>
      )}

      {/* AI Assistant Button */}
      <div className="p-3 border-t border-sidebar-border">
        <Sheet>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group w-full",
                "bg-gradient-to-r from-primary/15 via-primary/10 to-transparent",
                "text-primary hover:from-primary/25 hover:via-primary/15",
                "border border-primary/20 hover:border-primary/40",
                "shadow-sm hover:shadow-md hover:shadow-primary/10"
              )}
            >
              <div className="relative">
                <Bot className="w-5 h-5 flex-shrink-0" />
                <Sparkles className="w-2.5 h-2.5 absolute -top-1 -right-1 text-xp animate-pulse" />
              </div>
              {!collapsed && (
                <span className="font-semibold text-sm">Assistente IA</span>
              )}
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0">
            <SheetHeader className="p-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
              <SheetTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                Assistente de Logística
              </SheetTitle>
            </SheetHeader>
            <div className="p-4 h-[calc(100vh-80px)]">
              <Suspense fallback={<div className="flex items-center justify-center h-full text-muted-foreground text-sm">Carregando assistente...</div>}>
                <AIAssistant />
              </Suspense>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Settings */}
      <div className="p-3 border-t border-sidebar-border">
        <NavLink
          to="/configuracoes"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
            collapsed && "justify-center",
            isActive("/configuracoes")
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <Cog className="w-5 h-5 flex-shrink-0 group-hover:rotate-90 transition-transform duration-500" />
          {!collapsed && <span className="text-sm font-medium">Configurações</span>}
        </NavLink>
      </div>

      {/* Collapse Toggle */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "absolute -right-3 top-20 w-6 h-6 rounded-full shadow-lg border-2",
          "bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary",
          "transition-all duration-200"
        )}
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