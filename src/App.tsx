import { lazy, Suspense, memo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/auth/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { NavigationProgressBar } from "@/components/common/NavigationProgressBar";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { useGlobalShortcuts } from "@/hooks/common/useKeyboardShortcuts";
import { useNavigationHistory } from "@/hooks/common/useNavigationHistory";


// Lazy load all pages
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const FretesInternos = lazy(() => import("./pages/FretesInternos"));
const Fornecedores = lazy(() => import("./pages/Fornecedores"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Ocorrencias = lazy(() => import("./pages/Ocorrencias"));
const Envios = lazy(() => import("./pages/Envios"));
const Coletas = lazy(() => import("./pages/Coletas"));
const Transportadoras = lazy(() => import("./pages/Transportadoras"));
const Despachos = lazy(() => import("./pages/Despachos"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const Conquistas = lazy(() => import("./pages/Conquistas"));
const Ranking = lazy(() => import("./pages/Ranking"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const AuditTrail = lazy(() => import("./pages/AuditTrail"));
const Profile = lazy(() => import("./pages/Profile"));
const GestaoBox = lazy(() => import("./pages/GestaoBox"));
const SLADashboard = lazy(() => import("./pages/SLADashboard"));
const CalendarioLogistico = lazy(() => import("./pages/CalendarioLogistico"));
const CotacaoFrete = lazy(() => import("./pages/CotacaoFrete"));
const CustosDashboard = lazy(() => import("./pages/CustosDashboard"));
const AlertasCusto = lazy(() => import("./pages/AlertasCusto"));
const MapaRotas = lazy(() => import("./pages/MapaRotas"));
const RastreamentoMotorista = lazy(() => import("./pages/RastreamentoMotorista"));
const Notificacoes = lazy(() => import("./pages/Notificacoes"));
const Analytics = lazy(() => import("./pages/Analytics"));
const RastreamentoPublico = lazy(() => import("./pages/RastreamentoPublico"));
const APIDocumentation = lazy(() => import("./pages/APIDocumentation"));
const LojaRecompensas = lazy(() => import("./pages/LojaRecompensas"));
const ConciliacaoFinanceira = lazy(() => import("./pages/ConciliacaoFinanceira"));
const RotasTransportadoras = lazy(() => import("./pages/RotasTransportadoras"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const GerenciamentoUsuarios = lazy(() => import("./pages/GerenciamentoUsuarios"));
const AprovacaoResetSenha = lazy(() => import("./pages/AprovacaoResetSenha"));
const Seguranca = lazy(() => import("./pages/Seguranca"));
const RateLimitDashboard = lazy(() => import("./pages/RateLimitDashboard"));
const GestaoRodonaves = lazy(() => import("./pages/GestaoRodonaves"));
const GestaoMelhorEnvio = lazy(() => import("./pages/GestaoMelhorEnvio"));
const DashboardExecutivo = lazy(() => import("./pages/DashboardExecutivo"));
const InteligenciaFrete = lazy(() => import("./pages/InteligenciaFrete"));
const CotacaoMultiCanal = lazy(() => import("./pages/CotacaoMultiCanal"));
const DashboardCotacoes = lazy(() => import("./pages/DashboardCotacoes"));
const PainelOTIF = lazy(() => import("./pages/PainelOTIF"));
const KanbanEntregas = lazy(() => import("./pages/KanbanEntregas"));
const RelatorioPDF = lazy(() => import("./pages/RelatorioPDF"));
const ConciliacaoAutomatica = lazy(() => import("./pages/ConciliacaoAutomatica"));
const ImportacaoMassa = lazy(() => import("./pages/ImportacaoMassa"));
const AutomacaoRegras = lazy(() => import("./pages/AutomacaoRegras"));
const CentralRastreamento = lazy(() => import("./pages/CentralRastreamento"));
const AdminTelemetria = lazy(() => import("./pages/AdminTelemetria"));
const RastreamentoRealTime = lazy(() => import("./pages/RastreamentoRealTime"));
const GestaoWebhooks = lazy(() => import("./pages/GestaoWebhooks"));
const IntegracaoBitrix = lazy(() => import("./pages/IntegracaoBitrix"));
const LogisticaReversa = lazy(() => import("./pages/LogisticaReversa"));
const AdminADR = lazy(() => import("./pages/AdminADR"));
const ConfiguracoesFrete = lazy(() => import("./pages/ConfiguracoesFrete"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Lazy load non-critical providers
const LazyProviders = lazy(() => import("./components/LazyProviders"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Lightweight loader — no framer-motion dependency
const PageLoader = memo(() => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
        <svg className="w-12 h-12 animate-spin text-primary relative z-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
      <p className="text-muted-foreground text-sm font-medium">Carregando...</p>
    </div>
  </div>
));
PageLoader.displayName = "PageLoader";

function AppRoutes() {
  const location = useLocation();
  const { direction } = useNavigationHistory();
  useGlobalShortcuts();
  
  // Animation direction logic
  const isBack = direction === "back";
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ 
          duration: 0.2
        }}
        className="w-full h-full"
      >
        <Routes location={location}>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/fretes-internos" element={<ProtectedRoute><FretesInternos /></ProtectedRoute>} />
          <Route path="/fornecedores" element={<ProtectedRoute><Fornecedores /></ProtectedRoute>} />
          <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
          <Route path="/ocorrencias" element={<ProtectedRoute><Ocorrencias /></ProtectedRoute>} />
          <Route path="/envios" element={<ProtectedRoute><Envios /></ProtectedRoute>} />
          <Route path="/coletas" element={<ProtectedRoute><Coletas /></ProtectedRoute>} />
          <Route path="/transportadoras" element={<ProtectedRoute><Transportadoras /></ProtectedRoute>} />
          <Route path="/despachos" element={<ProtectedRoute><Despachos /></ProtectedRoute>} />
          <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
          <Route path="/conquistas" element={<ProtectedRoute><Conquistas /></ProtectedRoute>} />
          <Route path="/ranking" element={<ProtectedRoute><Ranking /></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/gestao-box" element={<ProtectedRoute><GestaoBox /></ProtectedRoute>} />
          <Route path="/sla-dashboard" element={<ProtectedRoute><SLADashboard /></ProtectedRoute>} />
          <Route path="/calendario" element={<ProtectedRoute><CalendarioLogistico /></ProtectedRoute>} />
          <Route path="/cotacao-frete" element={<ProtectedRoute><CotacaoFrete /></ProtectedRoute>} />
          <Route path="/custos" element={<ProtectedRoute><CustosDashboard /></ProtectedRoute>} />
          <Route path="/alertas-custo" element={<ProtectedRoute><AlertasCusto /></ProtectedRoute>} />
          <Route path="/mapa-rotas" element={<ProtectedRoute><MapaRotas /></ProtectedRoute>} />
          <Route path="/rastreamento-motorista" element={<ProtectedRoute><RastreamentoMotorista /></ProtectedRoute>} />
          <Route path="/notificacoes" element={<ProtectedRoute><Notificacoes /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/loja" element={<ProtectedRoute><LojaRecompensas /></ProtectedRoute>} />
          <Route path="/conciliacao" element={<ProtectedRoute><ConciliacaoFinanceira /></ProtectedRoute>} />
          <Route path="/rotas-transportadoras" element={<ProtectedRoute><RotasTransportadoras /></ProtectedRoute>} />
          <Route path="/logistica-reversa" element={<ProtectedRoute><LogisticaReversa /></ProtectedRoute>} />
          <Route path="/gestao-rodonaves" element={<ProtectedRoute><GestaoRodonaves /></ProtectedRoute>} />
          <Route path="/melhor-envio" element={<ProtectedRoute><GestaoMelhorEnvio /></ProtectedRoute>} />
          <Route path="/dashboard-executivo" element={<ProtectedRoute><DashboardExecutivo /></ProtectedRoute>} />
          <Route path="/inteligencia-frete" element={<ProtectedRoute><InteligenciaFrete /></ProtectedRoute>} />
          <Route path="/cotacao-multicanal" element={<ProtectedRoute><CotacaoMultiCanal /></ProtectedRoute>} />
          <Route path="/dashboard-cotacoes" element={<ProtectedRoute><DashboardCotacoes /></ProtectedRoute>} />
          <Route path="/painel-otif" element={<ProtectedRoute><PainelOTIF /></ProtectedRoute>} />
          <Route path="/kanban-entregas" element={<ProtectedRoute><KanbanEntregas /></ProtectedRoute>} />
          <Route path="/relatorio-pdf" element={<ProtectedRoute><RelatorioPDF /></ProtectedRoute>} />
          <Route path="/conciliacao-automatica" element={<ProtectedRoute><ConciliacaoAutomatica /></ProtectedRoute>} />
          <Route path="/importacao-massa" element={<ProtectedRoute><ImportacaoMassa /></ProtectedRoute>} />
          <Route path="/automacao-regras" element={<ProtectedRoute><AutomacaoRegras /></ProtectedRoute>} />
          <Route path="/central-rastreamento" element={<ProtectedRoute><CentralRastreamento /></ProtectedRoute>} />
          <Route path="/rastreamento/:id" element={<ProtectedRoute><RastreamentoRealTime /></ProtectedRoute>} />
          <Route path="/audit-trail" element={<ProtectedRoute requiredRole="admin"><AuditTrail /></ProtectedRoute>} />
          <Route path="/api-docs" element={<ProtectedRoute requiredRole="admin"><APIDocumentation /></ProtectedRoute>} />
          <Route path="/gerenciamento-usuarios" element={<ProtectedRoute requiredRole="admin"><GerenciamentoUsuarios /></ProtectedRoute>} />
          <Route path="/aprovacao-reset-senha" element={<ProtectedRoute requiredRole="admin"><AprovacaoResetSenha /></ProtectedRoute>} />
          <Route path="/seguranca" element={<ProtectedRoute requiredRole="admin"><Seguranca /></ProtectedRoute>} />
          <Route path="/rate-limit" element={<ProtectedRoute requiredRole="admin"><RateLimitDashboard /></ProtectedRoute>} />
          <Route path="/admin/telemetria" element={<ProtectedRoute requiredRole="admin"><AdminTelemetria /></ProtectedRoute>} />
          <Route path="/webhooks" element={<ProtectedRoute requiredRole="admin"><GestaoWebhooks /></ProtectedRoute>} />
          <Route path="/bitrix24" element={<ProtectedRoute requiredRole="admin"><IntegracaoBitrix /></ProtectedRoute>} />
          <Route path="/admin/adr" element={<ProtectedRoute requiredRole="admin"><AdminADR /></ProtectedRoute>} />
          <Route path="/config-frete" element={<ProtectedRoute><ConfiguracoesFrete /></ProtectedRoute>} />
          <Route path="/rastrear" element={<RastreamentoPublico />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <NavigationProgressBar />
            <Suspense fallback={<PageLoader />}>
              <LazyProviders>
                <ErrorBoundary>
                  <AppRoutes />
                </ErrorBoundary>
              </LazyProviders>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

