import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
};

// Mapeamento de categorias
const routeCategories: Record<string, string> = {
  "/analytics": "Visão Geral",
  "/sla-dashboard": "Visão Geral",
  "/calendario": "Visão Geral",
  "/custos": "Financeiro",
  "/conciliacao": "Financeiro",
  "/alertas-custo": "Financeiro",
  "/coletas": "Operações",
  "/despachos": "Operações",
  "/envios": "Operações",
  "/fretes-internos": "Operações",
  "/gestao-box": "Operações",
  "/ocorrencias": "Operações",
  "/transportadoras": "Rede Logística",
  "/rotas-transportadoras": "Rede Logística",
  "/cotacao-frete": "Rede Logística",
  "/mapa-rotas": "Rede Logística",
  "/rastreamento-motorista": "Rede Logística",
  "/fornecedores": "Cadastros",
  "/clientes": "Cadastros",
  "/relatorios": "Cadastros",
  "/ranking": "Gamificação",
  "/conquistas": "Gamificação",
  "/loja": "Gamificação",
  "/notificacoes": "Gamificação",
  "/gerenciamento-usuarios": "Administração",
  "/seguranca": "Administração",
  "/aprovacao-reset-senha": "Administração",
  "/audit-trail": "Administração",
};

export function Breadcrumbs({ items, className, showHome = true }: BreadcrumbsProps) {
  const location = useLocation();
  
  // Auto-generate breadcrumbs from route if items not provided
  const breadcrumbItems: BreadcrumbItem[] = items || (() => {
    const result: BreadcrumbItem[] = [];
    const currentPath = location.pathname;
    
    // Add category if exists
    const category = routeCategories[currentPath];
    if (category) {
      result.push({ label: category });
    }
    
    // Add current page
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
      className={cn("flex items-center text-sm", className)}
    >
      <ol className="flex items-center gap-1 flex-wrap">
        {showHome && (
          <li className="flex items-center">
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
              <span className="sr-only md:not-sr-only">Início</span>
            </Link>
          </li>
        )}

        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          
          return (
            <li key={index} className="flex items-center">
              <ChevronRight className="w-4 h-4 text-muted-foreground/50 mx-1" />
              
              {item.path && !isLast ? (
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-md transition-all duration-200",
                    "text-muted-foreground hover:text-foreground hover:bg-accent",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-md",
                    isLast 
                      ? "font-medium text-foreground bg-accent/50" 
                      : "text-muted-foreground"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </motion.nav>
  );
}
