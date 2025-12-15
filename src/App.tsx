import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AchievementProvider } from "@/hooks/useAchievementNotifications";
import { AchievementNotificationContainer } from "@/components/achievements/AchievementNotification";
import Index from "./pages/Index";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AchievementProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AchievementNotificationContainer />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/fretes-internos" element={<FretesInternos />} />
            <Route path="/fornecedores" element={<Fornecedores />} />
            <Route path="/envios" element={<Envios />} />
            <Route path="/coletas" element={<Coletas />} />
            <Route path="/transportadoras" element={<Transportadoras />} />
            <Route path="/despachos" element={<Despachos />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/conquistas" element={<Conquistas />} />
            <Route path="/ranking" element={<Ranking />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AchievementProvider>
  </QueryClientProvider>
);

export default App;
