import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Star,
  Flame,
  Zap,
  Coins,
  Target,
  Users,
  Loader2,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useGamification } from "@/hooks/gamification/useGamification";
import { useAuth } from "@/hooks/auth/useAuth";
import { Pagination } from "@/components/common/Pagination";
import { FilterBar } from "@/components/common/FilterBar";
import { usePagination } from "@/hooks/common/usePagination";
import { useFilters, FilterConfig } from "@/hooks/common/useFilters";
import { useSorting } from "@/hooks/common/useSorting";
import { useRealtime } from "@/hooks/data/useRealtime";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { RankingPodium } from "./ranking/RankingPodium";

interface RankUser {
  id: string;
  name: string;
  avatar?: string;
  xp: number;
  level: number;
  streak: number;
  coins: number;
  achievements: number;
  rank: number;
  rank_display?: {
    name: string;
    icon: string;
    color: string;
  };
}

const filterConfig: FilterConfig<RankUser> = { search: { fields: ["name"] } };

export default function Ranking() {
  const { user } = useAuth();
  useGamification();
  const [period, setPeriod] = useState<"weekly" | "monthly" | "all">("all");
  const [levelFilter, setLevelFilter] = useState("");

  const {
    data: leaderboard = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["leaderboard", period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_levels")
        .select(
          `
          user_id,
          total_xp,
          level,
          streak_days,
          coins,
          profiles:user_id(full_name, avatar_url),
          rank_display:user_ranks(*)
        `,
        )
        .order("total_xp", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });

  useRealtime({ table: "user_levels", onUpdate: () => refetch() });

  interface LeaderboardEntry {
    user_id: string;
    full_name?: string;
    avatar_url?: string;
    total_xp?: number;
    level?: number;
    streak_days?: number;
    coins?: number;
    achievements_count?: string | number;
    rank?: string | number;
  }

  const users: RankUser[] = useMemo(
    () =>
      ((leaderboard || []) as unknown as Array<{ user_id: string; total_xp?: number; level?: number; streak_days?: number; coins?: number; rank_display?: { name: string; icon: string; color: string }; profiles?: { full_name?: string; avatar_url?: string } }>).map((u, index) => ({
        id: u.user_id,
        name: u.profiles?.full_name || "Usuário",
        avatar: u.profiles?.avatar_url,
        xp: u.total_xp || 0,
        level: u.level || 1,
        streak: u.streak_days || 0,
        coins: u.coins || 0,
        achievements: 0, // Simplified for now
        rank: index + 1,
        rank_display: u.rank_display,
      })),
    [leaderboard],
  );

  const currentUserRank = useMemo(
    () => (user?.id ? users.find((u) => u.id === user.id) : null),
    [users, user],
  );
  const filteredByLevel = users.filter(
    (u) => !levelFilter || u.level >= parseInt(levelFilter),
  );
  const { filteredData, filters, setSearch, clearFilters, hasActiveFilters } =
    useFilters(filteredByLevel, filterConfig);
  const { sortedData, toggleSort, getSortDirection } = useSorting(
    filteredData,
    { defaultKey: "xp", defaultDirection: "desc" },
  );
  const pagination = usePagination(sortedData, { initialPageSize: 10 });
  const top3 = sortedData.slice(0, 3);

  type SortableField = keyof RankUser;
  const SortIcon = ({ field }: { field: SortableField }) => {
    const dir = getSortDirection(field);
    if (!dir) return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />;
    return dir === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const totalPlayers = users.length;
  const totalXP = users.reduce((sum, u) => sum + u.xp, 0);
  const totalAchievements = users.reduce((sum, u) => sum + u.achievements, 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-warning/20 to-warning/10">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />
              </div>
              <span className="truncate">Ranking Global</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Competição saudável entre operadores
            </p>
          </div>
          <Tabs
            value={period}
            onValueChange={(v) => setPeriod(v as "weekly" | "monthly" | "all")}
            className="w-full md:w-auto"
          >
            <TabsList className="grid grid-cols-3 w-full md:w-auto">
              <TabsTrigger value="weekly" className="text-xs sm:text-sm">
                Semanal
              </TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs sm:text-sm">
                Mensal
              </TabsTrigger>
              <TabsTrigger value="all" className="text-xs sm:text-sm">
                Geral
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: Users, value: totalPlayers, label: "Jogadores" },
            { icon: Zap, value: totalXP.toLocaleString(), label: "XP Total" },
            { icon: Trophy, value: totalAchievements, label: "Conquistas" },
            {
              icon: Target,
              value: currentUserRank?.rank || "-",
              label: "Sua Posição",
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="stat-card text-center p-3 sm:p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Current User */}
        {currentUserRank && (
          <motion.div
            className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="relative flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold text-xl shadow-lg">
                {currentUserRank.rank}º
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                {currentUserRank.avatar ? (
                  <img
                    src={currentUserRank.avatar}
                    alt={`Avatar de ${currentUserRank.name}`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-primary">
                    {currentUserRank.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-lg">
                  {currentUserRank.name}{" "}
                  <Badge variant="secondary" className="ml-2">
                    Você
                  </Badge>
                </p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Zap className="w-4 h-4 text-warning" />
                    {currentUserRank.xp.toLocaleString()} XP
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-accent-foreground" />
                    Nível {currentUserRank.level}
                  </span>
                  {currentUserRank.streak > 0 && (
                    <span className="flex items-center gap-1">
                      <Flame className="w-4 h-4 text-warning" />
                      {currentUserRank.streak} dias
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-sm text-muted-foreground">Moedas</p>
                <p className="text-lg font-bold flex items-center gap-1 justify-end">
                  <Coins className="w-4 h-4 text-warning" />
                  {currentUserRank.coins.toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <RankingPodium top3={top3} />
        )}

        <FilterBar
          search={filters.search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar jogador..."
          extraFilters={[
            {
              key: "level",
              label: "Nível mín.",
              value: levelFilter,
              options: [
                { value: "5", label: "5+" },
                { value: "10", label: "10+" },
                { value: "20", label: "20+" },
                { value: "50", label: "50+" },
              ],
              onChange: (v) => setLevelFilter(v),
            },
          ]}
          onClearFilters={() => {
            clearFilters();
            setLevelFilter("");
          }}
          hasActiveFilters={hasActiveFilters || !!levelFilter}
          totalFiltered={sortedData.length}
          totalOriginal={users.length}
        />

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-muted-foreground text-sm shrink-0">
            Ordenar:
          </span>
          {(["xp", "level", "achievements", "streak"] as SortableField[]).map(
            (field) => (
              <Button
                key={field}
                variant="ghost"
                size="sm"
                onClick={() => toggleSort(field)}
                className="gap-1 shrink-0"
              >
                {(() => {
                  if (field === "achievements") {
                    return (
                      <>
                        <span className="hidden sm:inline">Conquistas</span>
                        <span className="sm:hidden">Conq.</span>
                      </>
                    );
                  }
                  if (field === "xp") return "XP";
                  if (field === "level") return "Nível";
                  return "Streak";
                })()}
                <SortIcon field={field} />
              </Button>
            ),
          )}
        </div>

        <div className="space-y-2">
          {pagination.paginatedData.map((rankUser, i) => {
            const isCurrentUser = user?.id === rankUser.id;
            return (
              <motion.div
                key={rankUser.id}
                className={cn(
                  "card-interactive flex items-center gap-4 transition-all",
                  isCurrentUser && "ring-2 ring-primary/50 bg-primary/5",
                )}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                    (() => {
                      if (rankUser.rank === 1) return "bg-gradient-to-br from-warning to-warning/80 text-warning-foreground";
                      if (rankUser.rank === 2) return "bg-gradient-to-br from-muted-foreground/60 to-muted-foreground text-white";
                      if (rankUser.rank === 3) return "bg-gradient-to-br from-warning/80 to-warning/60 text-warning-foreground";
                      return "bg-muted";
                    })(),
                  )}
                >

                  {rankUser.rank}
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {rankUser.avatar ? (
                    <img
                      src={rankUser.avatar}
                      alt={`Avatar de ${rankUser.name}`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-lg font-bold text-primary">
                      {rankUser.name.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{rankUser.name}</p>
                    {isCurrentUser && (
                      <Badge variant="secondary" className="text-xs">
                        Você
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      Nível {rankUser.level}
                    </Badge>
                    {rankUser.rank_display && (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-black uppercase tracking-tighter border-none"
                        style={{
                          backgroundColor: `${rankUser.rank_display.color}15`,
                          color: rankUser.rank_display.color,
                        }}
                      >
                        {rankUser.rank_display.name}
                      </Badge>
                    )}
                    {rankUser.streak > 0 && (
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-warning" />
                        {rankUser.streak}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary flex items-center gap-1 justify-end">
                    <Zap className="w-4 h-4" />
                    {rankUser.xp.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                    <Coins className="w-3 h-3" />
                    {rankUser.coins.toLocaleString()}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {sortedData.length === 0 && !isLoading && (
          <div className="flex flex-col items-center py-12">
            <Trophy className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nenhum jogador encontrado</p>
          </div>
        )}

        {sortedData.length > 0 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={sortedData.length}
            startIndex={(pagination.currentPage - 1) * pagination.pageSize + 1}
            endIndex={Math.min(
              pagination.currentPage * pagination.pageSize,
              sortedData.length,
            )}
            pageSizeOptions={[10, 25, 50]}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
            onNextPage={pagination.nextPage}
            onPrevPage={pagination.prevPage}
            onFirstPage={pagination.firstPage}
            onLastPage={pagination.lastPage}
            hasNextPage={pagination.hasNextPage}
            hasPrevPage={pagination.hasPrevPage}
          />
        )}
      </div>
    </MainLayout>
  );
}
