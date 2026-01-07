import { ReactNode, Suspense } from "react";
import { AppSidebar } from "./AppSidebar";
import { Header } from "./Header";
import { MobileBottomNav } from "./MobileBottomNav";
import { BrowserNotificationPrompt } from "@/components/notifications/BrowserNotificationPrompt";
import { KeyboardShortcutsHelp } from "@/components/common/KeyboardShortcutsHelp";
import { SearchCommand } from "@/components/common/SearchCommand";
import { OnboardingWizard, OnboardingProgress } from "@/components/onboarding";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { PageSkeleton } from "@/components/ui/skeletons";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Skip Link - Acessibilidade */}
      <a 
        href="#main-content" 
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-foreground focus:border focus:border-primary focus:rounded-md focus:top-4 focus:left-4"
      >
        Pular para conteúdo principal
      </a>
      
      {/* Sidebar - hidden on mobile */}
      <aside className="hidden md:block" aria-label="Navegação principal">
        <AppSidebar />
      </aside>
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main 
          id="main-content" 
          className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6 scroll-smooth" 
          tabIndex={-1}
          role="main"
          aria-label="Conteúdo principal"
        >
          {/* Breadcrumbs navigation */}
          <nav aria-label="Navegação breadcrumb">
            <Breadcrumbs className="mb-4" />
          </nav>
          
          {/* Onboarding progress bar for new users */}
          <OnboardingProgress variant="full" className="mb-6" />
          
          {/* Main content with Suspense for lazy loading */}
          <Suspense fallback={<PageSkeleton />}>
            {children}
          </Suspense>
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
      
      {/* Browser notification permission prompt */}
      <BrowserNotificationPrompt />
      
      {/* Global keyboard shortcuts help (Ctrl+/) */}
      <KeyboardShortcutsHelp />
      
      {/* Global search command (Ctrl+K) */}
      <SearchCommand />
      
      {/* Onboarding wizard modal */}
      <OnboardingWizard />
    </div>
  );
}
