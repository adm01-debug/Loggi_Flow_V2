import { lazy, Suspense, memo, useEffect } from "react";
import { ArrowLeft, Zap, Coins, Flame, User, Trophy, LogOut, ChevronRight, History } from "lucide-react";
import { RealtimeStatus } from "@/components/common/RealtimeStatus";
import { SystemPulse } from "./SystemPulse";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/auth/useAuth";
import { useGamification } from "@/hooks/gamification/useGamification";
import { useNavigationHistory } from "@/hooks/common/useNavigationHistory";
import { RecentlyVisited } from "@/components/common/RecentlyVisited";
import { supabase } from "@/integrations/supabase/client";
import { hapticFeedback } from "@/utils/haptics";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Lazy-load heavy notification components
const NotificationCenter = lazy(() => import("@/components/notifications/NotificationCenter").then(m => ({ default: m.NotificationCenter })));
const UserNotificationCenter = lazy(() => import("@/components/notifications/UserNotificationCenter").then(m => ({ default: m.UserNotificationCenter })));
const SLANotificationSettings = lazy(() => import("@/components/notifications/SLANotificationSettings").then(m => ({ default: m.SLANotificationSettings })));
const GlobalSearch = lazy(() => import("@/components/search/GlobalSearch").then(m => ({ default: m.GlobalSearch })));


export const Header = memo(function Header() {
  const { profile, isAdmin, signOut } = useAuth();
  const { userLevel } = useGamification();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentLabel, recentPages, goBack, canGoBack } = useNavigationHistory();
  
  const prevPage = recentPages.length > 1 ? recentPages[1] : null;

  const isHomePage = location.pathname === "/";

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === "ArrowLeft") {
        goBack();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goBack]);

  const handleSignOut = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('security_events').insert({
        user_id: user?.id,
        event_type: 'logout',
        description: 'Logout manual realizado pelo usuário',
        severity: 'low',
        ip_address: 'client-side',
        metadata: { timestamp: new Date().toISOString() }
      });
      await signOut();
      navigate("/auth");
    } catch {
      await signOut();
      navigate("/auth");
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-14 sm:h-20 px-4 sm:px-10 bg-background/40 backdrop-blur-2xl border-b border-primary/10 shadow-header gap-2 sm:gap-6 transition-all duration-500 group/header overflow-hidden">
      {/* Tactical Scanning Line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover/header:opacity-100 transition-opacity duration-700 animate-scan" />
      
      {/* Background Depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50 pointer-events-none" />

      {/* Left side: Back button + Page title with History */}
      <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center gap-1 min-w-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    hapticFeedback('light');
                    goBack();
                  }}
                  disabled={!canGoBack}
                  className={cn(
                    "h-8 w-8 sm:h-9 sm:w-9 shrink-0 text-muted-foreground transition-all duration-200",
                    canGoBack ? "hover:text-primary hover:bg-primary/10 active:scale-90" : "opacity-30 cursor-not-allowed"
                  )}
                  aria-label={prevPage ? `Voltar para ${prevPage.label}` : "Voltar"}
                >
                  <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </TooltipTrigger>
              {canGoBack && (
                <TooltipContent side="bottom" className="flex flex-col items-center gap-1">
                  <p className="text-xs font-medium">Voltar para {prevPage?.label || "Início"}</p>
                  <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border bg-muted px-1 font-mono text-[9px] font-medium opacity-100">
                    Alt + ←
                  </kbd>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center gap-1 px-1.5 h-8 sm:h-9 hover:bg-accent/50 transition-colors group"
              >
                <span className="text-base sm:text-xl font-black truncate text-foreground tracking-tighter uppercase italic">
                  {currentLabel}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 max-h-[70vh] overflow-y-auto">
              <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1.5 flex items-center gap-2">
                <History className="w-3 h-3" />
                Histórico de Navegação
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {recentPages.length > 0 ? (
                recentPages.map((page, idx) => (
                  <DropdownMenuItem 
                    key={`${page.path}-${idx}`} 
                    onClick={() => navigate(page.path)}
                    className={cn(
                      "flex flex-col items-start gap-0.5 px-3 py-2 cursor-pointer transition-colors",
                      location.pathname === page.path ? "bg-primary/10 text-primary" : "hover:bg-accent"
                    )}
                  >
                    <span className="font-semibold text-sm">{page.label}</span>
                    <span className="text-[10px] text-muted-foreground truncate w-full opacity-70">
                      {page.path}
                    </span>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-muted-foreground italic">
                  Nenhuma página visitada recentemente
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop: Search */}
        <div className="hidden lg:block flex-1 min-w-[240px] max-w-[400px] ml-4">
          <Suspense fallback={<div className="h-9 w-full rounded-md bg-muted animate-pulse" />}>
            <GlobalSearch />
          </Suspense>
        </div>
      </div>

      {/* Center - Realtime Status & System Pulse */}
      <div className="hidden md:flex shrink-0 items-center gap-4">
        <RealtimeStatus />
        <SystemPulse />
      </div>

      {/* Gamification Stats */}
      <div className="hidden xl:flex items-center gap-2 lg:gap-4 shrink-0">
        <div className="flex items-center gap-1.5 lg:gap-2 px-3 lg:px-5 py-2 lg:py-2.5 rounded-2xl bg-primary/5 border border-primary/10 transition-all hover:bg-primary/10 hover:border-primary/20 hover-lift shadow-sm">
          <Zap className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-primary animate-pulse" />
          <span className="text-xs lg:text-sm font-black text-primary tracking-tight">
            {userLevel?.total_xp?.toLocaleString() || 0}
          </span>
        </div>

        <div className="flex items-center gap-1.5 lg:gap-2 px-3 lg:px-5 py-2 lg:py-2.5 rounded-2xl bg-coins/5 border border-coins/10 transition-all hover:bg-coins/10 hover:border-coins/20 hover-lift shadow-sm">
          <Coins className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-coins" />
          <span className="text-xs lg:text-sm font-black text-coins tracking-tight">
            {userLevel?.coins?.toLocaleString() || 0}
          </span>
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-streak/5 border border-streak/10 transition-all hover:bg-streak/10 hover:border-streak/20 hover-lift shadow-sm">
          <Flame className="w-4 h-4 text-streak animate-float" />
          <span className="text-sm font-black text-streak tracking-tight">
            {userLevel?.streak_days || 0} dias
          </span>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <div className="hidden sm:block">
          <RecentlyVisited />
        </div>

        <Suspense fallback={null}>
          <div className="hidden sm:block">
            <SLANotificationSettings />
          </div>
          <NotificationCenter />
          <UserNotificationCenter />
        </Suspense>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 hover:bg-accent h-9 sm:h-10 rounded-full sm:rounded-md">
              <Avatar className="w-7 h-7 sm:w-8 sm:h-8 border-2 border-primary/20 ring-2 ring-transparent transition-all group-hover:ring-primary/20">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs sm:text-sm">
                  {getInitials(profile?.full_name ?? null)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex flex-col items-start leading-tight">
                <span className="text-sm font-bold truncate max-w-[100px]">
                  {profile?.full_name || "Usuário"}
                </span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter opacity-70">
                  {isAdmin ? "Admin" : profile?.cargo || "Operador"}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-1 border-2 border-primary/5">
            <DropdownMenuLabel className="font-bold text-xs">Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/perfil")} className="font-medium">
              <User className="w-4 h-4 mr-2 text-primary" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/conquistas")} className="font-medium">
              <Trophy className="w-4 h-4 mr-2 text-primary" />
              Minhas Conquistas
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive font-bold focus:bg-destructive/10 focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sair do Sistema
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
});
