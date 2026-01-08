import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Trophy, Medal, Star, TrendingUp, Flame, Crown, Award, ArrowUpDown, ChevronUp, ChevronDown, Loader2, Zap, Coins, Target, Users, Sparkles } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";
import { useAuth } from "@/hooks/useAuth";
import { Pagination } from "@/components/common/Pagination";
import { FilterBar } from "@/components/common/FilterBar";
import { usePagination } from "@/hooks/usePagination";
import { useFilters, FilterConfig } from "@/hooks/useFilters";
import { useSorting } from "@/hooks/useSorting";
import { useRealtime } from "@/hooks/useRealtime";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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
}

const filterConfig: FilterConfig<RankUser> = {
  search: { fields: ["name"] },
};

export default function Ranking() {
  const { user } = useAuth();
  const { userLevel, isLoading: gamificationLoading } = useGamification();
  const [period, setPeriod] = useState<"weekly" | "monthly" | "all">("all");
  const [levelFilter, setLevelFilter] = useState("");

  // Fetch leaderboard data using the new function
  const { data: leaderboard = [], isLoading, refetch } = useQuery({
    queryKey: ["leaderboard", period],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_leaderboard", {
        limit_count: 100,
        period_filter: period,
      });
      if (error) throw error;
      return data;
    },
  });

  useRealtime({ table: "user_levels", onUpdate: () => refetch() });

  const users: RankUser[] = useMemo(
    () =>
      (leaderboard || []).map((u: any) => ({
        id: u.user_id,
        name: u.full_name || "Usuário",
        avatar: u.avatar_url,
        xp: u.total_xp || 0,
        level: u.level || 1,
        streak: u.streak_days || 0,
        coins: u.coins || 0,
        achievements: Number(u.achievements_count) || 0,
        rank: Number(u.rank) || 0,
      })),
    [leaderboard]
  );

  // Find current user's position
  const currentUserRank = useMemo(() => {
    if (!user?.id) return null;
    return users.find((u) => u.id === user.id);
  }, [users, user]);

  // Filter by level
  const filteredByLevel = users.filter((u) => {
    if (!levelFilter) return true;
    return u.level >= parseInt(levelFilter);
  });

  const { filteredData, filters, setSearch, clearFilters, hasActiveFilters } = useFilters(filteredByLevel, filterConfig);
  const { sortedData, toggleSort, getSortDirection } = useSorting(filteredData, { defaultKey: "xp", defaultDirection: "desc" });
  const pagination = usePagination(sortedData, { initialPageSize: 10 });

  const top3 = sortedData.slice(0, 3);
  const SortIcon = ({ field }: { field: string }) => {
    const dir = getSortDirection(field as any);
    if (!dir) return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />;
    return dir === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  const podiumColors = ["from-amber-400 to-amber-600", "from-gray-300 to-gray-500", "from-amber-600 to-amber-800"];
  const podiumIcons = [Crown, Medal, Award];
  const podiumHeights = ["h-28", "h-20", "h-14"];
  const podiumBg = ["bg-gradient-to-t from-amber-500 to-amber-400", "bg-gradient-to-t from-gray-400 to-gray-300", "bg-gradient-to-t from-amber-700 to-amber-600"];

  const handleClearFilters = () => {
    clearFilters();
    setLevelFilter("");
  };

  // Stats
  const totalPlayers = users.length;
  const totalXP = users.reduce((sum, u) => sum + u.xp, 0);
  const totalAchievements = users.reduce((sum, u) => sum + u.achievements, 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground flex items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/10">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
              </div>
              <span className="truncate">Ranking Global</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Competição saudável entre operadores</p>
          </div>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="w-full md:w-auto">
            <TabsList className="grid grid-cols-3 w-full md:w-auto">
              <TabsTrigger value="weekly" className="text-xs sm:text-sm">Semanal</TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs sm:text-sm">Mensal</TabsTrigger>
              <TabsTrigger value="all" className="text-xs sm:text-sm">Geral</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <motion.div className="stat-card text-center p-3 sm:p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Users className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-xl sm:text-2xl font-bold">{totalPlayers}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Jogadores</p>
          </motion.div>
          <motion.div className="stat-card text-center p-3 sm:p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Zap className="w-5 h-5 text-yellow-500 mx-auto mb-2" />
            <p className="text-xl sm:text-2xl font-bold">{totalXP.toLocaleString()}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">XP Total</p>
          </motion.div>
          <motion.div className="stat-card text-center p-3 sm:p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Trophy className="w-5 h-5 text-amber-500 mx-auto mb-2" />
            <p className="text-xl sm:text-2xl font-bold">{totalAchievements}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Conquistas</p>
          </motion.div>
          <motion.div className="stat-card text-center p-3 sm:p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Target className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
            <p className="text-xl sm:text-2xl font-bold">{currentUserRank?.rank || "-"}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Sua Posição</p>
          </motion.div>
        </div>

        {/* Current User Card */}
        {currentUserRank && (
          <motion.div
            className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="absolute inset-0 bg-grid-white/5" />
            <div className="relative flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold text-xl shadow-lg">
                {currentUserRank.rank}º
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                {currentUserRank.avatar ? (
                  <img src={currentUserRank.avatar} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-primary">{currentUserRank.name.charAt(0)}</span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-lg">{currentUserRank.name} <Badge variant="secondary" className="ml-2">Você</Badge></p>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1"><Zap className="w-4 h-4 text-yellow-500" />{currentUserRank.xp.toLocaleString()} XP</span>
                  <span className="flex items-center gap-1"><Star className="w-4 h-4 text-purple-500" />Nível {currentUserRank.level}</span>
                  {currentUserRank.streak > 0 && <span className="flex items-center gap-1"><Flame className="w-4 h-4 text-orange-500" />{currentUserRank.streak} dias</span>}
                  <span className="flex items-center gap-1"><Trophy className="w-4 h-4 text-amber-500" />{currentUserRank.achievements}</span>
                </div>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-sm text-muted-foreground">Moedas</p>
                <p className="text-lg font-bold flex items-center gap-1 justify-end"><Coins className="w-4 h-4 text-yellow-500" />{currentUserRank.coins.toLocaleString()}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Podium */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          top3.length > 0 && (
            <motion.div
              className="relative overflow-hidden rounded-2xl border bg-gradient-to-b from-background to-muted/20 p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/10 blur-3xl rounded-full" />
              <div className="relative flex items-end justify-center gap-4 pt-4 pb-2">
                {[1, 0, 2].map((pos) => {
                  const user = top3[pos];
                  if (!user) return null;
                  const Icon = podiumIcons[pos];
                  return (
                    <motion.div
                      key={pos}
                      className={cn("text-center", pos === 0 && "order-2", pos === 1 && "order-1", pos === 2 && "order-3")}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: pos === 0 ? 0 : pos === 1 ? 0.1 : 0.2 }}
                    >
                      <div className="relative">
                        <div
                          className={cn(
                            "w-20 h-20 rounded-full bg-gradient-to-br flex items-center justify-center mx-auto mb-2 shadow-lg ring-4 ring-background",
                            podiumColors[pos]
                          )}
                        >
                          {user.avatar ? (
                            <img src={user.avatar} className="w-16 h-16 rounded-full object-cover" />
                          ) : (
                            <Icon className="w-8 h-8 text-white" />
                          )}
                        </div>
                        {pos === 0 && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
                          </div>
                        )}
                      </div>
                      <p className="font-bold text-sm truncate max-w-24">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.xp.toLocaleString()} XP</p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">Nv. {user.level}</Badge>
                        <Badge variant="secondary" className="text-xs"><Trophy className="w-3 h-3 mr-0.5" />{user.achievements}</Badge>
                      </div>
                      <div
                        className={cn(
                          "w-20 mx-auto mt-3 rounded-t-xl flex items-center justify-center text-white font-bold text-xl shadow-lg",
                          podiumHeights[pos],
                          podiumBg[pos]
                        )}
                      >
                        {pos + 1}º
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )
        )}

        {/* Filters */}
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
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters || !!levelFilter}
          totalFiltered={sortedData.length}
          totalOriginal={users.length}
        />

        {/* Sort Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-muted-foreground text-sm shrink-0">Ordenar:</span>
          <Button variant="ghost" size="sm" onClick={() => toggleSort("xp")} className="gap-1 shrink-0">
            XP <SortIcon field="xp" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => toggleSort("level")} className="gap-1 shrink-0">
            Nível <SortIcon field="level" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => toggleSort("achievements")} className="gap-1 shrink-0">
            <span className="hidden sm:inline">Conquistas</span>
            <span className="sm:hidden">Conq.</span>
            <SortIcon field="achievements" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => toggleSort("streak")} className="gap-1 shrink-0">
            Streak <SortIcon field="streak" />
          </Button>
        </div>

        {/* Leaderboard Table */}
        <div className="space-y-2">
          {pagination.paginatedData.map((rankUser, i) => {
            const isCurrentUser = user?.id === rankUser.id;
            return (
              <motion.div
                key={rankUser.id}
                className={cn(
                  "card-interactive flex items-center gap-4 transition-all",
                  isCurrentUser && "ring-2 ring-primary/50 bg-primary/5"
                )}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                    rankUser.rank === 1
                      ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white"
                      : rankUser.rank === 2
                      ? "bg-gradient-to-br from-gray-300 to-gray-500 text-white"
                      : rankUser.rank === 3
                      ? "bg-gradient-to-br from-amber-600 to-amber-800 text-white"
                      : "bg-muted"
                  )}
                >
                  {rankUser.rank}
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {rankUser.avatar ? (
                    <img src={rankUser.avatar} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <span className="text-lg font-bold text-primary">{rankUser.name.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{rankUser.name}</p>
                    {isCurrentUser && <Badge variant="secondary" className="text-xs">Você</Badge>}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="text-xs">Nível {rankUser.level}</Badge>
                    {rankUser.streak > 0 && (
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-500" />
                        {rankUser.streak}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-amber-500" />
                      {rankUser.achievements}
                    </span>
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

        {/* Empty State */}
        {sortedData.length === 0 && !isLoading && (
          <div className="flex flex-col items-center py-12">
            <Trophy className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">Nenhum jogador encontrado</p>
          </div>
        )}

        {/* Pagination */}
        {sortedData.length > 0 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={sortedData.length}
            startIndex={(pagination.currentPage - 1) * pagination.pageSize + 1}
            endIndex={Math.min(pagination.currentPage * pagination.pageSize, sortedData.length)}
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