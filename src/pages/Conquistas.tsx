/* eslint-disable max-lines */
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Trophy,
  Flame,
  Star,
  Target,
  Truck,
  Clock,
  Award,
  Crown,
  Rocket,
  Shield,
  TrendingUp,
  Calendar,
  Package,
  Users,
  Lock,
  CheckCircle2,
  Sparkles,
  PackagePlus,
  Boxes,
  Container,
  Warehouse,
  Timer,
  ShieldCheck,
  Medal,
  LayoutGrid,
  Building2,
  Moon,
  Sunrise,
  PackageCheck,
  Coins,
  LucideIcon,
  GraduationCap,
  User,
  Bell,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGamification } from "@/hooks/gamification/useGamification";

import { Pagination } from "@/components/common/Pagination";
import { FilterBar } from "@/components/common/FilterBar";
import { usePagination } from "@/hooks/common/usePagination";
import { useFilters, FilterConfig } from "@/hooks/common/useFilters";
import { useSorting } from "@/hooks/common/useSorting";

type AchievementRarity = "common" | "rare" | "epic" | "legendary";

interface AchievementDisplay {
  id: string;
  name: string;
  description: string;
  category: string;
  xpReward: number;
  icon: LucideIcon;
  unlocked: boolean;
  rarity: AchievementRarity;
}

const iconMap: Record<string, LucideIcon> = {
  Zap,
  Trophy,
  Flame,
  Star,
  Target,
  Truck,
  Clock,
  Award,
  Crown,
  Rocket,
  Shield,
  TrendingUp,
  Calendar,
  Package,
  Users,
  PackagePlus,
  Boxes,
  Container,
  Warehouse,
  Timer,
  ShieldCheck,
  Medal,
  LayoutGrid,
  Building2,
  Moon,
  Sunrise,
  PackageCheck,
  Coins,
  GraduationCap,
  User,
  Bell,
};

const rarityColors = {
  common: "from-muted-foreground to-muted-foreground/80",
  rare: "from-info to-info/80",
  epic: "from-accent to-accent/80",
  legendary: "from-warning to-warning/80",
};
const rarityLabels = {
  common: "Comum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
};

const filterConfig: FilterConfig<AchievementDisplay> = {
  search: {
    fields: ["name", "description"],
    placeholder: "Buscar conquistas...",
  },
  select: {
    category: {
      field: "category",
      options: [
        { value: "entregas", label: "Entregas" },
        { value: "coletas", label: "Coletas" },
        { value: "performance", label: "Performance" },
        { value: "streak", label: "Streak" },
        { value: "cadastros", label: "Cadastros" },
      ],
      label: "Categoria",
    },
    rarity: {
      field: "rarity",
      options: [
        { value: "common", label: "Comum" },
        { value: "rare", label: "Raro" },
        { value: "epic", label: "Épico" },
        { value: "legendary", label: "Lendário" },
      ],
      label: "Raridade",
    },
  },
};

// Onboarding achievement card component
function OnboardingAchievementCard({
  achievement,
  isUnlocked,
}: {
  achievement: {
    id: string;
    name: string;
    description: string;
    icon: string;
    rarity: string;
    xp_reward: number;
    coins_reward: number;
  };
  isUnlocked: boolean;
}) {
  const Icon = iconMap[achievement.icon] || GraduationCap;
  const rarity = achievement.rarity as keyof typeof rarityColors;

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-xl border transition-all duration-300",
        isUnlocked
          ? "bg-gradient-to-br from-success/10 to-success/5 border-success/30 shadow-lg shadow-success/10"
          : "bg-card/50 border-border/50 opacity-60",
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: isUnlocked ? 1.02 : 1 }}
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "p-2.5 rounded-lg",
              isUnlocked
                ? `bg-gradient-to-br ${rarityColors[rarity]} text-white shadow-lg`
                : "bg-muted text-muted-foreground",
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm truncate">
                {achievement.name}
              </h4>
              {isUnlocked ? (
                <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
              ) : (
                <Lock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {achievement.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Badge
            variant={isUnlocked ? "default" : "outline"}
            className="text-xs"
          >
            +{achievement.xp_reward} XP
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <Coins className="w-3 h-3 mr-1" />
            {achievement.coins_reward}
          </Badge>
        </div>
      </div>
      {isUnlocked && (
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-success/20 to-transparent" />
      )}
    </motion.div>
  );
}

function getTierRarity(
  tier?: string,
): "legendary" | "epic" | "rare" | "common" {
  if (tier === "diamond") return "legendary";
  if (tier === "platinum") return "epic";
  if (tier === "gold") return "rare";
  return "common";
}

export default function Conquistas() {
  const {
    userLevel,
    achievements: dbAchievements,
    unlockedAchievementIds,
  } = useGamification();
  const [tab, setTab] = useState("all");

  const mappedAchievements = useMemo((): AchievementDisplay[] => {
    if (!dbAchievements) return [];
    return dbAchievements.map((a) => ({
      id: (a as unknown as Record<string, unknown>).id as string,
      name: (a as unknown as Record<string, unknown>).name as string,
      description: (a as unknown as Record<string, unknown>)
        .description as string,
      category:
        ((a as unknown as Record<string, unknown>).category as string) ||
        "performance",
      xpReward:
        ((a as unknown as Record<string, unknown>).xp_reward as number) ||
        ((a as unknown as Record<string, unknown>).xp_requirement as number) ||
        0,
      icon:
        iconMap[(a as unknown as Record<string, unknown>).icon as string] ||
        Award,
      unlocked:
        unlockedAchievementIds instanceof Set
          ? unlockedAchievementIds.has(
              (a as unknown as Record<string, unknown>).id as string,
            )
          : false,
      rarity: (((a as unknown as Record<string, unknown>).rarity as string) ||
        getTierRarity(
          (a as unknown as Record<string, unknown>).tier as string | undefined,
        )) as AchievementRarity,
    }));
  }, [dbAchievements, unlockedAchievementIds]);

  const onboardingAchievements = useMemo(() => {
    return mappedAchievements.filter((a) => a.category === "onboarding");
  }, [mappedAchievements]);

  const onboardingStats = useMemo(() => {
    const total = onboardingAchievements.length;
    const unlocked = onboardingAchievements.filter((a) => a.unlocked).length;
    const xpEarned = onboardingAchievements
      .filter((a) => a.unlocked)
      .reduce((sum, a) => sum + a.xpReward, 0);
    return {
      total,
      unlocked,
      xpEarned,
      progress: total > 0 ? (unlocked / total) * 100 : 0,
    };
  }, [onboardingAchievements]);

  const mainAchievements = useMemo(() => {
    return mappedAchievements.filter((a) => a.category !== "onboarding");
  }, [mappedAchievements]);

  const tabFiltered = useMemo(() => {
    if (tab === "all") return mainAchievements;
    if (tab === "unlocked") return mainAchievements.filter((a) => a.unlocked);
    return mainAchievements.filter((a) => !a.unlocked);
  }, [tab, mainAchievements]);

  const {
    filteredData,
    filters,
    setSearch,
    setFilter,
    clearFilters,
    hasActiveFilters,
    totalFiltered,
    totalOriginal,
  } = useFilters(tabFiltered, filterConfig);
  const { sortedData } = useSorting(filteredData, {
    defaultKey: "unlocked",
    defaultDirection: "desc",
  });
  const pagination = usePagination(sortedData, { initialPageSize: 12 });

  const stats = useMemo(
    () => ({
      total: mappedAchievements.length,
      unlocked: mappedAchievements.filter((a) => a.unlocked).length,
      totalXp: mappedAchievements
        .filter((a) => a.unlocked)
        .reduce((s, a) => s + a.xpReward, 0),
    }),
    [mappedAchievements],
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-warning/20 to-warning/5 shadow-inner">
              <Trophy className="w-8 h-8 text-warning" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Galeria de Conquistas
              </h1>
              <p className="text-muted-foreground">
                Sua jornada rumo à excelência logística
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat-card p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-coins/10">
              <Medal className="w-6 h-6 text-coins" />
            </div>
            <div>
              <p className="text-2xl font-black">
                {stats.unlocked}{" "}
                <span className="text-muted-foreground text-sm font-normal">
                  / {stats.total}
                </span>
              </p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                Medalhas Atuais
              </p>
            </div>
          </div>
          <div className="stat-card p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-black">{stats.totalXp}</p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                XP Acumulado
              </p>
            </div>
          </div>
          <div className="stat-card p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-xp/10">
              <Star className="w-6 h-6 text-xp" />
            </div>
            <div>
              <p className="text-2xl font-black">
                Nível {userLevel?.level || 1}
              </p>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                Ranking Atual
              </p>
            </div>
          </div>
        </div>

        {onboardingAchievements.length > 0 && (
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card p-8 shadow-xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8" />
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">
                      Certificações Iniciais
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Conclua o onboarding para desbloquear recursos avançados
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-primary">
                    {Math.round(onboardingStats.progress)}%
                  </p>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                    Concluído
                  </p>
                </div>
              </div>

              <Progress
                value={onboardingStats.progress}
                className="h-3 mb-8 bg-primary/10"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {onboardingAchievements.map((a) => {
                  const Icon = a.icon;
                  return (
                    <div
                      key={a.id}
                      className={cn(
                        "p-4 rounded-2xl border transition-all duration-300 flex items-center gap-4",
                        a.unlocked
                          ? "bg-success/5 border-success/30 shadow-sm"
                          : "bg-muted/30 border-dashed opacity-50",
                      )}
                    >
                      <div
                        className={cn(
                          "p-2 rounded-lg",
                          a.unlocked
                            ? "bg-success text-success-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{a.name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {a.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-6 bg-card rounded-3xl p-8 border border-border/50 shadow-sm">
          <div className="flex items-center justify-between">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="all">Todas as Medalhas</TabsTrigger>
                <TabsTrigger value="unlocked">Conquistadas</TabsTrigger>
                <TabsTrigger value="locked">Em Progresso</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <FilterBar
            search={filters.search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por nome ou descrição..."
            extraFilters={[
              {
                key: "category",
                label: "Filtrar Categoria",
                value: (filters.category as string) || "all",
                options: [
                  { value: "entregas", label: "Entregas" },
                  { value: "coletas", label: "Coletas" },
                  { value: "performance", label: "Performance" },
                  { value: "streak", label: "Streak" },
                ],
                onChange: (v) =>
                  setFilter("category", v === "all" ? undefined : v),
              },
              {
                key: "rarity",
                label: "Raridade",
                value: (filters.rarity as string) || "all",
                options: [
                  { value: "common", label: "Comum" },
                  { value: "rare", label: "Rara" },
                  { value: "epic", label: "Épica" },
                  { value: "legendary", label: "Lendária" },
                ],
                onChange: (v) =>
                  setFilter("rarity", v === "all" ? undefined : v),
              },
            ]}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
            totalFiltered={totalFiltered}
            totalOriginal={totalOriginal}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pagination.paginatedData.map((a, i) => {
              const Icon = a.icon;
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className={cn(
                    "group relative p-5 rounded-3xl border-2 transition-all duration-300 overflow-hidden",
                    a.unlocked
                      ? "bg-background border-primary/20 shadow-md hover:shadow-xl hover:scale-[1.02]"
                      : "bg-muted/20 border-dashed border-muted-foreground/20 opacity-60 grayscale",
                  )}
                >
                  <div
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br opacity-[0.03] transition-opacity group-hover:opacity-[0.08]",
                      rarityColors[a.rarity],
                    )}
                  />

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div
                        className={cn(
                          "p-3 rounded-2xl bg-gradient-to-br shadow-lg text-white",
                          rarityColors[a.rarity],
                        )}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      {a.unlocked ? (
                        <div className="bg-success/20 text-success p-1 rounded-full">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="bg-muted text-muted-foreground p-1 rounded-full">
                          <Lock className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <h3 className="font-bold text-lg mb-1 leading-tight">
                      {a.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px] mb-4">
                      {a.description}
                    </p>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-bold uppercase border-muted-foreground/20"
                      >
                        {a.rarity}
                      </Badge>
                      <Badge className="bg-xp/10 text-xp text-[10px] font-bold hover:bg-xp/20">
                        +{a.xpReward} XP
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {sortedData.length > 12 && (
            <div className="mt-8 pt-8 border-t border-border/50">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                pageSize={pagination.pageSize}
                totalItems={pagination.totalItems}
                startIndex={pagination.startIndex}
                endIndex={pagination.endIndex}
                hasNextPage={pagination.hasNextPage}
                hasPrevPage={pagination.hasPrevPage}
                pageSizeOptions={pagination.pageSizeOptions}
                onPageChange={pagination.setPage}
                onPageSizeChange={pagination.setPageSize}
                onNextPage={pagination.nextPage}
                onPrevPage={pagination.prevPage}
                onFirstPage={pagination.firstPage}
                onLastPage={pagination.lastPage}
              />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
