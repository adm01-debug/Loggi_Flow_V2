import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { Header } from "./Header";
import { MobileBottomNav } from "./MobileBottomNav";
import { BrowserNotificationPrompt } from "@/components/notifications/BrowserNotificationPrompt";
import { KeyboardShortcutsHelp } from "@/components/common/KeyboardShortcutsHelp";
import { SearchCommand } from "@/components/common/SearchCommand";
import { OnboardingWizard, OnboardingProgress } from "@/components/onboarding";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Skip Link - Acessibilidade */}
      <a href="#main-content" className="skip-link">
        Pular para conteúdo principal
      </a>
      
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6" tabIndex={-1}>
          {/* Breadcrumbs navigation */}
          <Breadcrumbs className="mb-4" />
          
          {/* Onboarding progress bar for new users */}
          <OnboardingProgress variant="full" className="mb-6" />
          {children}
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
