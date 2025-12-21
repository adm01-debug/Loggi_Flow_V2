import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { Header } from "./Header";
import { BrowserNotificationPrompt } from "@/components/notifications/BrowserNotificationPrompt";
import { KeyboardShortcutsHelp } from "@/components/common/KeyboardShortcutsHelp";
import { SearchCommand } from "@/components/common/SearchCommand";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      
      {/* Browser notification permission prompt */}
      <BrowserNotificationPrompt />
      
      {/* Global keyboard shortcuts help (Ctrl+/) */}
      <KeyboardShortcutsHelp />
      
      {/* Global search command (Ctrl+K) */}
      <SearchCommand />
    </div>
  );
}
