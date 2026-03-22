import { useEffect, useCallback, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useLocalStorage } from "./useLocalStorage";

interface VisitedPage {
  path: string;
  label: string;
  timestamp: number;
}

// Route labels for display
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
  "/configuracoes": "Configurações",
  "/perfil": "Perfil",
  "/gestao-melhor-envio": "Melhor Envio",
  "/gestao-rodonaves": "Rodonaves",
  "/dashboard-executivo": "Dashboard Executivo",
  "/inteligencia-frete": "Inteligência de Frete",
  "/central-rastreamento": "Central de Rastreamento",
  "/painel-otif": "Painel OTIF",
  "/kanban-entregas": "Kanban Entregas",
  "/importacao-massa": "Importação em Massa",
  "/automacao-regras": "Automação de Regras",
  "/audit-trail": "Audit Trail",
};

const MAX_RECENT = 8;

export function useNavigationHistory() {
  const location = useLocation();
  const [recentPages, setRecentPages] = useLocalStorage<VisitedPage[]>("recent-pages", []);
  const prevPathRef = useRef(location.pathname);
  const directionRef = useRef<"forward" | "back">("forward");

  useEffect(() => {
    const currentPath = location.pathname;
    
    // Skip auth pages
    if (currentPath === "/auth" || currentPath === "/reset-password") return;

    const label = routeLabels[currentPath] || currentPath.split("/").pop() || "Página";
    
    // Determine direction
    const prevIndex = recentPages.findIndex(p => p.path === currentPath);
    directionRef.current = prevIndex >= 0 ? "back" : "forward";
    
    setRecentPages(prev => {
      const filtered = prev.filter(p => p.path !== currentPath);
      const newEntry: VisitedPage = { path: currentPath, label, timestamp: Date.now() };
      return [newEntry, ...filtered].slice(0, MAX_RECENT);
    });

    prevPathRef.current = currentPath;
  }, [location.pathname]);

  const getPageLabel = useCallback((path: string) => {
    return routeLabels[path] || path.split("/").pop() || "Página";
  }, []);

  return {
    recentPages,
    currentLabel: getPageLabel(location.pathname),
    direction: directionRef.current,
    getPageLabel,
  };
}
