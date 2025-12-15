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
import Envios from "./pages/Envios";
import Coletas from "./pages/Coletas";
import Transportadoras from "./pages/Transportadoras";
import Despachos from "./pages/Despachos";
import Relatorios from "./pages/Relatorios";
import Conquistas from "./pages/Conquistas";
import Ranking from "./pages/Ranking";
import Configuracoes from "./pages/Configuracoes";
import AuditTrail from "./pages/AuditTrail";
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
              <Route path="/envios" element={<ProtectedRoute><Envios /></ProtectedRoute>} />
              <Route path="/coletas" element={<ProtectedRoute><Coletas /></ProtectedRoute>} />
              <Route path="/transportadoras" element={<ProtectedRoute><Transportadoras /></ProtectedRoute>} />
              <Route path="/despachos" element={<ProtectedRoute><Despachos /></ProtectedRoute>} />
              <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
              <Route path="/conquistas" element={<ProtectedRoute><Conquistas /></ProtectedRoute>} />
              <Route path="/ranking" element={<ProtectedRoute><Ranking /></ProtectedRoute>} />
              <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
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
