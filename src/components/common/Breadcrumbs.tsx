import { memo, useState } from "react";
import { ChevronRight, Home, Copy, Check, History as HistoryIcon, ChevronDown } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useNavigationHistory } from "@/hooks/common/useNavigationHistory";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  const { recentPages, getPageLabel } = useNavigationHistory();
  const [copied, setCopied] = useState(false);
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Link copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };
  
  const breadcrumbItems: BreadcrumbItem[] = items || (() => {
    const result: BreadcrumbItem[] = [];
    const currentPath = location.pathname;
    
    const category = routeCategories[currentPath];
    if (category && category.path !== currentPath) {
      result.push({ label: category.label, path: category.path });
    }
    
    const label = getPageLabel(currentPath);
    result.push({ label });
    
    return result;
  })();

  if (location.pathname === "/" && !items) {
    return null;
  }

  return (
    <motion.nav
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Breadcrumb"
      className={cn(
        "flex items-center justify-between text-sm overflow-hidden gap-4",
        "bg-background/40 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none min-w-0 px-1">
        <ol className="flex items-center gap-1 flex-nowrap shrink-0">
          {showHome && (
            <li className="flex items-center">
              <Link
                to="/"
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300",
                  "text-muted-foreground hover:text-primary hover:bg-primary/10 hover:shadow-inner",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20",
                  "active:scale-90"
                )}
                aria-label="Ir para Dashboard"
              >
                <Home className="w-4 h-4" />
              </Link>
            </li>
          )}

          {breadcrumbItems.map((item, index) => {
            const isLast = index === breadcrumbItems.length - 1;
            
            return (
              <li key={index} className="flex items-center shrink-0">
                <div className="flex items-center justify-center w-4 h-4 text-muted-foreground/30">
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
                
                {item.path && !isLast ? (
                  <Link
                    to={item.path}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg transition-all duration-300",
                      "text-muted-foreground hover:text-primary hover:bg-primary/10 hover:shadow-sm",
                      "font-medium whitespace-nowrap active:scale-95 text-xs"
                    )}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300",
                          "bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/10",
                          "whitespace-nowrap group active:scale-95 text-xs"
                        )}
                        aria-current="page"
                      >
                        <span>{item.label}</span>
                        <ChevronDown className="w-3 h-3 opacity-70 transition-transform group-data-[state=open]:rotate-180" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="start" 
                      className="w-64 p-2 border-2 border-primary/5 shadow-2xl animate-in zoom-in-95 duration-200"
                    >
                      <div className="px-2 py-1.5 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Histórico de Navegação</span>
                      </div>
                      <DropdownMenuSeparator className="opacity-50" />
                      <div className="max-h-[300px] overflow-y-auto pr-1">
                        {recentPages.length > 0 ? (
                          recentPages.map((page, pIdx) => (
                            <DropdownMenuItem key={`${page.path}-${pIdx}`} asChild>
                              <Link 
                                to={page.path} 
                                className="flex flex-col items-start gap-0.5 py-2.5 px-3 rounded-md cursor-pointer transition-colors hover:bg-primary/10 group/item"
                              >
                                <div className="flex items-center justify-between w-full">
                                  <span className="font-bold text-sm text-foreground group-hover/item:text-primary transition-colors">{page.label}</span>
                                  {page.path === location.pathname && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                  )}
                                </div>
                                <span className="text-[10px] text-muted-foreground truncate w-full font-mono opacity-60">
                                  {page.path}
                                </span>
                              </Link>
                            </DropdownMenuItem>
                          ))
                        ) : (
                          <div className="py-8 text-center text-xs text-muted-foreground/50 italic">
                            Sem histórico disponível
                          </div>
                        )}
                      </div>
                      <DropdownMenuSeparator className="opacity-50" />
                      <DropdownMenuItem asChild>
                        <Link to="/audit-trail" className="flex items-center gap-2 py-2 px-3 text-xs font-semibold text-primary/80">
                          <HistoryIcon className="w-3.5 h-3.5" />
                          <span>Ver Audit Trail Completo</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex items-center gap-1.5 pr-1">
        <button
          onClick={handleCopyLink}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg",
            "text-muted-foreground hover:text-foreground hover:bg-white/10",
            "transition-all text-[10px] font-bold uppercase tracking-widest border border-white/5 bg-white/5 active:scale-95"
          )}
          title="Compartilhar link seguro"
        >
          {copied ? (
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
              <Check className="w-3.5 h-3.5 text-green-500" />
            </motion.div>
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
          <span className="hidden md:inline">Compartilhar</span>
        </button>
      </div>
    </motion.nav>
  );
});
