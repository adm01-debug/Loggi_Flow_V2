import { memo } from "react";
import { ChevronRight, Home, Copy, Check } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useNavigationHistory } from "@/hooks/useNavigationHistory";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

// Mapeamento de rotas para labels
const routeLabels: Record<string, string> = {
  "/": "Dashboard",
  "/analytics": "Analytics",
  "/sla-dashboard": "Dashboard SLA",
  "/calendario": "Calendário",
  "/custos": "Custos Logísticos",
  "/conciliacao": "Conciliação",
  "/alertas-custo": "Alertas de Custo",
  "/coletas": "Coletas",
  "/despachos": "Cotação e Despacho",
  "/envios": "Envios",
  "/fretes-internos": "Fretes Internos",
  "/gestao-box": "Gestão de BOX",
  "/ocorrencias": "Ocorrências",
  "/transportadoras": "Transportadoras",
  "/rotas-transportadoras": "Rotas",
  "/cotacao-frete": "Cotação Frete",
  "/mapa-rotas": "Mapa de Rotas",
  "/rastreamento-motorista": "Rastreamento",
  "/fornecedores": "Fornecedores",
  "/clientes": "Clientes",
  "/relatorios": "Relatórios",
  "/ranking": "Ranking",
  "/conquistas": "Conquistas",
  "/loja": "Loja de Recompensas",
  "/notificacoes": "Notificações",
  "/gerenciamento-usuarios": "Usuários",
  "/seguranca": "Segurança",
  "/aprovacao-reset-senha": "Reset de Senha",
  "/audit-trail": "Audit Trail",
  "/configuracoes": "Configurações",
  "/perfil": "Perfil",
  "/auth": "Autenticação",
  "/gestao-melhor-envio": "Melhor Envio",
  "/gestao-rodonaves": "Rodonaves",
  "/dashboard-executivo": "Dashboard Executivo",
  "/inteligencia-frete": "Inteligência de Frete",
  "/central-rastreamento": "Central de Rastreamento",
  "/painel-otif": "Painel OTIF",
  "/kanban-entregas": "Kanban Entregas",
  "/importacao-massa": "Importação em Massa",
  "/automacao-regras": "Automação de Regras",
};

// Mapeamento de categorias com rotas de referência
const routeCategories: Record<string, { label: string; path: string }> = {
  "/analytics": { label: "Visão Geral", path: "/" },
  "/sla-dashboard": { label: "Visão Geral", path: "/" },
  "/calendario": { label: "Visão Geral", path: "/" },
  "/dashboard-executivo": { label: "Visão Geral", path: "/" },
  "/painel-otif": { label: "Visão Geral", path: "/" },
  "/custos": { label: "Financeiro", path: "/custos" },
  "/conciliacao": { label: "Financeiro", path: "/custos" },
  "/alertas-custo": { label: "Financeiro", path: "/custos" },
  "/inteligencia-frete": { label: "Financeiro", path: "/custos" },
  "/coletas": { label: "Operações", path: "/envios" },
  "/despachos": { label: "Operações", path: "/envios" },
  "/envios": { label: "Operações", path: "/envios" },
  "/fretes-internos": { label: "Operações", path: "/envios" },
  "/gestao-box": { label: "Operações", path: "/envios" },
  "/ocorrencias": { label: "Operações", path: "/envios" },
  "/kanban-entregas": { label: "Operações", path: "/envios" },
  "/central-rastreamento": { label: "Operações", path: "/envios" },
  "/transportadoras": { label: "Rede Logística", path: "/transportadoras" },
  "/rotas-transportadoras": { label: "Rede Logística", path: "/transportadoras" },
  "/cotacao-frete": { label: "Rede Logística", path: "/transportadoras" },
  "/mapa-rotas": { label: "Rede Logística", path: "/transportadoras" },
  "/rastreamento-motorista": { label: "Rede Logística", path: "/transportadoras" },
  "/fornecedores": { label: "Cadastros", path: "/fornecedores" },
  "/clientes": { label: "Cadastros", path: "/clientes" },
  "/relatorios": { label: "Cadastros", path: "/relatorios" },
  "/ranking": { label: "Gamificação", path: "/ranking" },
  "/conquistas": { label: "Gamificação", path: "/ranking" },
  "/loja": { label: "Gamificação", path: "/ranking" },
  "/notificacoes": { label: "Gamificação", path: "/ranking" },
  "/gerenciamento-usuarios": { label: "Administração", path: "/gerenciamento-usuarios" },
  "/seguranca": { label: "Administração", path: "/seguranca" },
  "/aprovacao-reset-senha": { label: "Administração", path: "/seguranca" },
  "/audit-trail": { label: "Administração", path: "/audit-trail" },
  "/gestao-melhor-envio": { label: "Integrações", path: "/gestao-melhor-envio" },
  "/gestao-rodonaves": { label: "Integrações", path: "/gestao-rodonaves" },
  "/importacao-massa": { label: "Administração", path: "/configuracoes" },
  "/automacao-regras": { label: "Administração", path: "/configuracoes" },
};

export const Breadcrumbs = memo(function Breadcrumbs({ items, className, showHome = true }: BreadcrumbsProps) {
  const location = useLocation();
  const { recentPages } = useNavigationHistory();
  const [copied, setCopied] = useState(false);
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Link copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Auto-generate breadcrumbs from route if items not provided
  const breadcrumbItems: BreadcrumbItem[] = items || (() => {
    const result: BreadcrumbItem[] = [];
    const currentPath = location.pathname;
    
    // Add category as clickable link
    const category = routeCategories[currentPath];
    if (category && category.path !== currentPath) {
      result.push({ label: category.label, path: category.path });
    }
    
    // Add current page (no link — it's the active page)
    const label = routeLabels[currentPath] || currentPath.split("/").pop() || "Página";
    result.push({ label });
    
    return result;
  })();

  if (location.pathname === "/" && !items) {
    return null;
  }

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      aria-label="Breadcrumb"
      className={cn("flex items-center justify-between text-sm overflow-x-auto scrollbar-none gap-4", className)}
    >
      <ol className="flex items-center gap-1 flex-nowrap min-w-0">
        {showHome && (
          <li className="flex items-center shrink-0">
            <Link
              to="/"
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md transition-all duration-200",
                "text-muted-foreground hover:text-foreground hover:bg-accent",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              )}
              aria-label="Ir para Dashboard"
            >
              <Home className="w-4 h-4" />
              <span className="sr-only sm:not-sr-only">Início</span>
            </Link>
          </li>
        )}

        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          
          return (
            <li key={index} className="flex items-center shrink-0 min-w-0">
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 mx-0.5 sm:mx-1 shrink-0" />
              
              {item.path && !isLast ? (
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-1.5 px-1.5 sm:px-2 py-1 rounded-md transition-all duration-200",
                    "text-muted-foreground hover:text-foreground hover:bg-accent",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    "truncate max-w-[120px] sm:max-w-none"
                  )}
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </Link>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "flex items-center gap-1.5 px-1.5 sm:px-2 py-1 rounded-md transition-all duration-200",
                        "text-primary bg-primary/10 border border-primary/20 font-semibold hover:bg-primary/20",
                        "truncate max-w-[150px] sm:max-w-none"
                      )}
                      aria-current="page"
                    >
                      {item.icon}
                      <span className="truncate">{item.label}</span>
                      <ChevronRight className="w-3 h-3 opacity-50 rotate-90 ml-0.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Histórico Recente
                    </div>
                    {recentPages.slice(0, 5).map((page) => (
                      <DropdownMenuItem key={page.path} asChild>
                        <Link to={page.path} className="flex items-center gap-2 cursor-pointer">
                          <span className="truncate">{page.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </li>
          );
        })}
      </ol>

      <button
        onClick={handleCopyLink}
        className="shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-xs font-medium border border-border/50"
        title="Copiar link desta página"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
        <span className="hidden sm:inline">Compartilhar</span>
      </button>
    </motion.nav>
  );
});
