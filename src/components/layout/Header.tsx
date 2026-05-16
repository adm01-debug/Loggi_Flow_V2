import { lazy, Suspense, memo } from "react";
import { ArrowLeft, Zap, Coins, Flame, User, Trophy, LogOut } from "lucide-react";
import { RealtimeStatus } from "@/components/common/RealtimeStatus";
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
import { useAuth } from "@/hooks/useAuth";
import { useGamification } from "@/hooks/useGamification";
import { useNavigationHistory } from "@/hooks/useNavigationHistory";
import { RecentlyVisited } from "@/components/common/RecentlyVisited";
import { supabase } from "@/integrations/supabase/client";

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
  const { currentLabel, recentPages } = useNavigationHistory();
  
  const prevPage = recentPages.length > 1 ? recentPages[1] : null;

  const isHomePage = location.pathname === "/";

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
    } catch (err) {
      // Erro registrado via ErrorBoundary ou telemetria dedicada
      await signOut();
      navigate("/auth");
    }
  };

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate("/");
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
    <header className="sticky top-0 z-40 flex items-center justify-between h-14 sm:h-16 px-3 sm:px-6 bg-card/80 backdrop-blur-md border-b border-border shadow-header gap-2 sm:gap-4">
      {/* Mobile: Back button + Page title | Desktop: Global Search */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Universal Back Button + Page Title */}
        <div className="flex items-center gap-1 min-w-0">
          {!isHomePage && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
              aria-label={prevPage ? `Voltar para ${prevPage.label}` : "Voltar"}
              title={prevPage ? `Voltar para ${prevPage.label}` : "Voltar (ou Alt + ←)"}
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          )}
          <span className="text-sm sm:text-base font-semibold truncate text-foreground ml-1">
            {currentLabel}
          </span>
        </div>

        {/* Desktop: Search - Slightly shifted for back button */}
        <div className="hidden md:block flex-1 max-w-sm lg:max-w-md ml-4">
          <Suspense fallback={<div className="h-9 w-full rounded-md bg-muted animate-pulse" />}>
            <GlobalSearch />
          </Suspense>
        </div>
      </div>

      {/* Center - Realtime Status */}
      <RealtimeStatus />

      {/* Gamification Stats - Compact on tablet */}
      <div className="hidden md:flex items-center gap-2 lg:gap-4">
        {/* XP */}
        <div className="flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-1 lg:py-1.5 rounded-full bg-primary/10 border border-primary/20">
          <Zap className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-primary" />
          <span className="text-xs lg:text-sm font-semibold text-primary">
            {userLevel?.total_xp?.toLocaleString() || 0}
          </span>
        </div>

        {/* Coins */}
        <div className="flex items-center gap-1.5 lg:gap-2 px-2 lg:px-3 py-1 lg:py-1.5 rounded-full bg-coins/10 border border-coins/20">
          <Coins className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-coins" />
          <span className="text-xs lg:text-sm font-semibold text-coins">
            {userLevel?.coins?.toLocaleString() || 0}
          </span>
        </div>

        {/* Streak - Hidden on tablet, visible on desktop */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-streak/10 border border-streak/20">
          <Flame className="w-4 h-4 text-streak animate-pulse" />
          <span className="text-sm font-semibold text-streak">
            {userLevel?.streak_days || 0} dias
          </span>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Recently Visited */}
        <div className="hidden sm:block">
          <RecentlyVisited />
        </div>

        <Suspense fallback={null}>
          {/* SLA Notification Settings - Hidden on mobile */}
          <div className="hidden sm:block">
            <SLANotificationSettings />
          </div>
          
          {/* System Alerts */}
          <NotificationCenter />
          
          {/* User Notifications */}
          <UserNotificationCenter />
        </Suspense>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 hover:bg-accent h-9 sm:h-10">
              <Avatar className="w-7 h-7 sm:w-8 sm:h-8 border-2 border-primary/20">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs sm:text-sm">
                  {getInitials(profile?.full_name ?? null)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex flex-col items-start">
                <span className="text-sm font-medium truncate max-w-[100px]">
                  {profile?.full_name || "Usuário"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {isAdmin ? "Admin" : profile?.cargo || "Operador"}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/perfil")}>
              <User className="w-4 h-4 mr-2" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/conquistas")}>
              <Trophy className="w-4 h-4 mr-2" />
              Minhas Conquistas
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
});
