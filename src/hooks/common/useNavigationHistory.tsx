import { useEffect, useCallback, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLocalStorage } from "@/hooks/common/useLocalStorage";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/auth/useAuth";

interface VisitedPage {
  path: string;
  label: string;
  timestamp: number;
}

// Route labels for display
export const routeLabels: Record<string, string> = {
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

const MAX_RECENT = 12;

export function useNavigationHistory() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recentPages, setRecentPages] = useLocalStorage<VisitedPage[]>("recent-pages", []);
  const [historyStack, setHistoryStack] = useState<string[]>([]);
  const prevPathRef = useRef(location.pathname);
  const directionRef = useRef<"forward" | "back" | "none">("none");

  useEffect(() => {
    const currentPath = location.pathname;
    
    // Skip auth pages
    if (currentPath === "/auth" || currentPath === "/reset-password") return;

    const label = routeLabels[currentPath] || currentPath.split("/").pop() || "Página";
    
    // Detect navigation direction by comparing with the stack
    setHistoryStack(prev => {
      const isGoingBack = prev.length > 1 && prev[prev.length - 2] === currentPath;
      
      if (isGoingBack) {
        directionRef.current = "back";
        return prev.slice(0, -1);
      } else {
        directionRef.current = prevPathRef.current === currentPath ? "none" : "forward";
        // Avoid adding the same path multiple times in a row
        if (prev[prev.length - 1] === currentPath) return prev;
        return [...prev, currentPath];
      }
    });
    
    setRecentPages(prev => {
      const filtered = prev.filter(p => p.path !== currentPath);
      const newEntry: VisitedPage = { path: currentPath, label, timestamp: Date.now() };
      return [newEntry, ...filtered].slice(0, MAX_RECENT);
    });

    // Track page view in security_events for audit/UX analytics
    const trackPageView = async () => {
      if (user?.id) {
        await supabase.from("security_events").insert({
          user_id: user.id,
          event_type: "page_view",
          description: `Visualizou: ${label}`,
          severity: "low",
          ip_address: "client-side",
          metadata: { path: currentPath, label, timestamp: new Date().toISOString() }
        });
      }
    };
    trackPageView();

    prevPathRef.current = currentPath;
  }, [location.pathname, user?.id]);

  const getPageLabel = useCallback((path: string) => {
    return routeLabels[path] || path.split("/").pop() || "Página";
  }, []);

  const goBack = useCallback(() => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/");
    }
  }, [navigate]);

  return {
    recentPages,
    currentLabel: getPageLabel(location.pathname),
    direction: directionRef.current,
    getPageLabel,
    goBack,
    canGoBack: historyStack.length > 1 || location.pathname !== "/",
  };
}
