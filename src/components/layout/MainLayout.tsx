import { ReactNode, Suspense, lazy, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { Header } from "./Header";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileQuickActions } from "./MobileQuickActions";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { ScrollRestoration } from "@/components/common/ScrollRestoration";
import { GlobalLoadingBar } from "@/components/common/GlobalLoadingBar";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import { PageSkeleton } from "@/components/ui/skeletons";
import { SkipLinks } from "@/components/accessibility/SkipLinks";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import { LevelUpModal } from "@/components/gamification/LevelUpModal";

const OnboardingWizard = lazy(() => import("@/components/onboarding/OnboardingWizard").then(m => ({ default: m.OnboardingWizard })));
const OnboardingProgress = lazy(() => import("@/components/onboarding/OnboardingProgress").then(m => ({ default: m.OnboardingProgress })));
const BrowserNotificationPrompt = lazy(() => import("@/components/notifications/BrowserNotificationPrompt").then(m => ({ default: m.BrowserNotificationPrompt })));
const KeyboardShortcutsHelp = lazy(() => import("@/components/common/KeyboardShortcutsHelp").then(m => ({ default: m.KeyboardShortcutsHelp })));
const SearchCommand = lazy(() => import("@/components/common/SearchCommand").then(m => ({ default: m.SearchCommand })));
const InstallPrompt = lazy(() => import("@/components/pwa/InstallPrompt").then(m => ({ default: m.InstallPrompt })));
const UpdatePrompt = lazy(() => import("@/components/pwa/UpdatePrompt").then(m => ({ default: m.UpdatePrompt })));

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let touchStartX = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const deltaX = touchEndX - touchStartX;
      
      // Swipe from left to right (at least 100px) and starting near the edge (0-50px)
      if (deltaX > 100 && touchStartX < 50) {
        if (location.pathname !== "/") {
          navigate(-1);
        }
      }
    };

    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);
    
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [navigate, location]);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <GlobalLoadingBar />
      <SkipLinks />
      <OfflineBanner />
      <ScrollRestoration />
      
      <aside className="hidden md:block" aria-label="Navegação principal" id="main-navigation">
        <AppSidebar />
      </aside>
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <div className="flex-1 flex overflow-hidden">
          <main 
            id="main-content" 
            className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 scroll-smooth overscroll-contain animate-in fade-in duration-700" 
            tabIndex={-1}
            role="main"
            aria-label="Conteúdo principal"
          >
          <nav aria-label="Navegação breadcrumb">
            <Breadcrumbs className="mb-4" />
          </nav>
          
          <Suspense fallback={null}>
            <OnboardingProgress variant="full" className="mb-6" />
          </Suspense>
          
          <Suspense fallback={<PageSkeleton />}>
            {children}
          </Suspense>
        </main>
      </div>
      </div>
      
      <MobileBottomNav />
      <MobileQuickActions />
      <LevelUpModal />
      <ScrollToTop />
      
      <Suspense fallback={null}>
        <InstallPrompt />
        <UpdatePrompt />
        <BrowserNotificationPrompt />
        <KeyboardShortcutsHelp />
        <SearchCommand />
        <OnboardingWizard />
      </Suspense>
    </div>
  );
}
