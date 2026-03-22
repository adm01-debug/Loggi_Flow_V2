import { ReactNode, Suspense, lazy } from "react";
import { AppSidebar } from "./AppSidebar";
import { Header } from "./Header";
import { MobileBottomNav } from "./MobileBottomNav";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { ScrollRestoration } from "@/components/common/ScrollRestoration";
import { PageSkeleton } from "@/components/ui/skeletons";
import { SkipLinks } from "@/components/accessibility/SkipLinks";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";

// Lazy-load non-critical overlays to reduce MainLayout chunk size
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
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Skip Links - Acessibilidade aprimorada */}
      <SkipLinks />
      
      {/* Offline Banner - PWA */}
      <OfflineBanner />

      {/* Scroll Restoration + Focus Management */}
      <ScrollRestoration />
      
      {/* Sidebar - hidden on mobile */}
      <aside className="hidden md:block" aria-label="Navegação principal" id="main-navigation">
        <AppSidebar />
      </aside>
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main 
          id="main-content" 
          className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 scroll-smooth overscroll-contain" 
          tabIndex={-1}
          role="main"
          aria-label="Conteúdo principal"
        >
          {/* Breadcrumbs navigation */}
          <nav aria-label="Navegação breadcrumb">
            <Breadcrumbs className="mb-4" />
          </nav>
          
          {/* Onboarding progress bar for new users */}
          <Suspense fallback={null}>
            <OnboardingProgress variant="full" className="mb-6" />
          </Suspense>
          
          {/* Main content with Suspense for lazy loading */}
          <Suspense fallback={<PageSkeleton />}>
            {children}
          </Suspense>
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
      
      {/* Non-critical overlays - lazy loaded */}
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
