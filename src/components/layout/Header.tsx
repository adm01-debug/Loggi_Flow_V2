import { Zap, Coins, Flame, User, Trophy, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { UserNotificationCenter } from "@/components/notifications/UserNotificationCenter";
import { SLANotificationSettings } from "@/components/notifications/SLANotificationSettings";
import { useGamification } from "@/hooks/useGamification";
import { GlobalSearch } from "@/components/search/GlobalSearch";

function RealtimeIndicator() {
  return (
    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
      </span>
      <span className="text-sm font-medium text-success">Dados em tempo real</span>
    </div>
  );
}

export function Header() {
  const { profile, isAdmin, signOut } = useAuth();
  const { userLevel } = useGamification();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
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
      {/* Global Search */}
      <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md">
        <GlobalSearch />
      </div>

      {/* Center - Realtime Indicator */}
      <RealtimeIndicator />

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
        {/* SLA Notification Settings - Hidden on mobile */}
        <div className="hidden sm:block">
          <SLANotificationSettings />
        </div>
        
        {/* System Alerts */}
        <NotificationCenter />
        
        {/* User Notifications */}
        <UserNotificationCenter />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 hover:bg-accent h-9 sm:h-10">
              <Avatar className="w-7 h-7 sm:w-8 sm:h-8 border-2 border-primary/20">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs sm:text-sm">
                  {getInitials(profile?.full_name)}
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
}
