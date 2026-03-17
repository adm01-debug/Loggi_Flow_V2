import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AchievementProvider } from "@/hooks/useAchievementNotifications";
import { AchievementNotificationContainer } from "@/components/achievements/AchievementNotification";
import { AuthProvider } from "@/hooks/useAuth";
import { TimezoneProvider } from "@/hooks/useTimezone";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SessionTimeoutWarning } from "@/components/security/SessionTimeoutWarning";
import { NewDeviceDetector } from "@/components/security/NewDeviceDetector";
import { SecurityPushNotificationProvider } from "@/components/security/SecurityPushNotificationProvider";
import { LiveRegionProvider } from "@/components/accessibility/LiveRegion";
import { ReducedMotionProvider } from "@/components/accessibility/ReducedMotion";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Lazy load all pages for better initial performance
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
const NotFound = lazy(() => import("./pages/NotFound"));

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

// Premium loading component with animation
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <motion.div 
      className="flex flex-col items-center gap-4"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative">
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <Loader2 className="w-12 h-12 animate-spin text-primary relative z-10" />
      </div>
      <motion.p 
        className="text-muted-foreground text-sm font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        Carregando...
      </motion.p>
    </motion.div>
  </div>
);

// Animated routes wrapper
function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
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
          <Route path="/gestao-rodonaves" element={<ProtectedRoute><GestaoRodonaves /></ProtectedRoute>} />
          <Route path="/melhor-envio" element={<ProtectedRoute><GestaoMelhorEnvio /></ProtectedRoute>} />
          <Route path="/dashboard-executivo" element={<ProtectedRoute><DashboardExecutivo /></ProtectedRoute>} />
          <Route path="/inteligencia-frete" element={<ProtectedRoute><InteligenciaFrete /></ProtectedRoute>} />
          <Route path="/audit-trail" element={<ProtectedRoute requiredRole="admin"><AuditTrail /></ProtectedRoute>} />
          <Route path="/api-docs" element={<ProtectedRoute requiredRole="admin"><APIDocumentation /></ProtectedRoute>} />
          <Route path="/gerenciamento-usuarios" element={<ProtectedRoute requiredRole="admin"><GerenciamentoUsuarios /></ProtectedRoute>} />
          <Route path="/aprovacao-reset-senha" element={<ProtectedRoute requiredRole="admin"><AprovacaoResetSenha /></ProtectedRoute>} />
          <Route path="/seguranca" element={<ProtectedRoute requiredRole="admin"><Seguranca /></ProtectedRoute>} />
          <Route path="/rate-limit" element={<ProtectedRoute requiredRole="admin"><RateLimitDashboard /></ProtectedRoute>} />
          <Route path="/rastrear" element={<RastreamentoPublico />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ReducedMotionProvider>
      <LiveRegionProvider>
        <AuthProvider>
          <TimezoneProvider>
            <AchievementProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <AchievementNotificationContainer />
                <SessionTimeoutWarning />
                <NewDeviceDetector />
                <SecurityPushNotificationProvider />
                <BrowserRouter>
                  <Suspense fallback={<PageLoader />}>
                    <AnimatedRoutes />
                  </Suspense>
                </BrowserRouter>
              </TooltipProvider>
            </AchievementProvider>
          </TimezoneProvider>
        </AuthProvider>
      </LiveRegionProvider>
    </ReducedMotionProvider>
  </QueryClientProvider>
);

export default App;