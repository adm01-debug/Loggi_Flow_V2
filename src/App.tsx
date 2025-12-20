import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AchievementProvider } from "@/hooks/useAchievementNotifications";
import { AchievementNotificationContainer } from "@/components/achievements/AchievementNotification";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import FretesInternos from "./pages/FretesInternos";
import Fornecedores from "./pages/Fornecedores";
import Clientes from "./pages/Clientes";
import Ocorrencias from "./pages/Ocorrencias";
import Envios from "./pages/Envios";
import Coletas from "./pages/Coletas";
import Transportadoras from "./pages/Transportadoras";
import Despachos from "./pages/Despachos";
import Relatorios from "./pages/Relatorios";
import Conquistas from "./pages/Conquistas";
import Ranking from "./pages/Ranking";
import Configuracoes from "./pages/Configuracoes";
import AuditTrail from "./pages/AuditTrail";
import Profile from "./pages/Profile";
import GestaoBox from "./pages/GestaoBox";
import SLADashboard from "./pages/SLADashboard";
import CalendarioLogistico from "./pages/CalendarioLogistico";
import CotacaoFrete from "./pages/CotacaoFrete";
import CustosDashboard from "./pages/CustosDashboard";
import AlertasCusto from "./pages/AlertasCusto";
import MapaRotas from "./pages/MapaRotas";
import RastreamentoMotorista from "./pages/RastreamentoMotorista";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AchievementProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AchievementNotificationContainer />
          <BrowserRouter>
            <Routes>
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
              <Route path="/audit-trail" element={<ProtectedRoute requiredRole="admin"><AuditTrail /></ProtectedRoute>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AchievementProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
