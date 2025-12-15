import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useGamification } from "@/hooks/useGamification";
import { XPProgressCard } from "@/components/gamification/XPProgressCard";
import { AchievementUnlockModal } from "@/components/achievements/AchievementUnlockModal";

// Icon mapping for database icons
const iconMap: Record<string, LucideIcon> = {
  Trophy,
  Truck,
  Package,
  PackageCheck,
  Crown,
  PackagePlus,
  Boxes,
  Container,
  Warehouse,
  Flame,
  Zap,
  Star,
  Sparkles,
  ShieldCheck,
  Timer,
  Award,
  Medal,
  LayoutGrid,
  Building2,
  Moon,
  Sunrise,
  Target,
  Clock,
  Rocket,
  Shield,
  TrendingUp,
  Calendar,
  Users,
};

const rarityConfig = {
  common: {
    border: "border-muted-foreground/30",
    bg: "bg-muted/30",
    glow: "",
    label: "Comum",
    labelColor: "text-muted-foreground",
  },
  rare: {
    border: "border-info/50",
    bg: "bg-info/10",
    glow: "shadow-[0_0_15px_hsl(var(--info)/0.3)]",
    label: "Raro",
    labelColor: "text-info",
  },
  epic: {
    border: "border-primary/50",
    bg: "bg-primary/10",
    glow: "shadow-[0_0_20px_hsl(var(--primary)/0.4)]",
    label: "Épico",
    labelColor: "text-primary",
  },
  legendary: {
    border: "border-coins/50",
    bg: "bg-coins/10",
    glow: "shadow-[0_0_25px_hsl(var(--coins)/0.5)]",
    label: "Lendário",
    labelColor: "text-coins",
  },
};

const categories = [
  { id: "all", label: "Todas", icon: Sparkles },
  { id: "delivery", label: "Entregas", icon: Truck },
  { id: "collection", label: "Coletas", icon: PackagePlus },
  { id: "streak", label: "Sequências", icon: Flame },
  { id: "performance", label: "Performance", icon: TrendingUp },
  { id: "special", label: "Especiais", icon: Star },
];

export default function Conquistas() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  const { 
    achievements, 
    userAchievements, 
    unlockedAchievementIds, 
    userLevel,
    isLoading 
  } = useGamification();

  // Merge achievements with unlock status
  const enrichedAchievements = useMemo(() => {
    return achievements.map(achievement => {
      const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id);
      const unlocked = unlockedAchievementIds.has(achievement.id);
      
      return {
        ...achievement,
        unlocked,
        unlockedAt: userAchievement?.unlocked_at ? new Date(userAchievement.unlocked_at) : undefined,
        iconComponent: iconMap[achievement.icon] || Trophy,
      };
    });
  }, [achievements, userAchievements, unlockedAchievementIds]);

  const filteredAchievements = useMemo(() => {
    return enrichedAchievements.filter(
      a => selectedCategory === "all" || a.category === selectedCategory
    );
  }, [enrichedAchievements, selectedCategory]);

  const stats = useMemo(() => {
    const unlocked = enrichedAchievements.filter(a => a.unlocked);
    return {
      unlockedCount: unlocked.length,
      totalCount: enrichedAchievements.length,
      totalXP: unlocked.reduce((acc, a) => acc + a.xp_reward, 0),
      totalCoins: unlocked.reduce((acc, a) => acc + a.coins_reward, 0),
    };
  }, [enrichedAchievements]);

  const handleAchievementClick = (achievement: any) => {
    if (achievement.unlocked) {
      setSelectedAchievement({
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        icon: achievement.iconComponent,
        rarity: achievement.rarity,
        xpReward: achievement.xp_reward,
        coinsReward: achievement.coins_reward,
        unlocked: true,
        unlockedAt: achievement.unlockedAt,
      });
      setShowUnlockModal(true);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-display text-foreground flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-xp to-primary glow-primary">
                <Trophy className="w-6 h-6 text-primary-foreground" />
              </div>
              Conquistas
            </h1>
            <p className="text-muted-foreground mt-1">
              Desbloqueie badges e ganhe recompensas por sua performance
            </p>
          </div>
        </div>

        {/* Level Progress Card */}
        <XPProgressCard />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-elevated"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10">
                <Award className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Conquistas</p>
                <p className="text-3xl font-display font-bold">
                  {stats.unlockedCount}
                  <span className="text-lg text-muted-foreground font-normal">
                    /{stats.totalCount}
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Progress 
                value={stats.totalCount > 0 ? (stats.unlockedCount / stats.totalCount) * 100 : 0} 
                className="h-2" 
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card-elevated"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-xp/10">
                <Zap className="w-7 h-7 text-xp" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">XP de Conquistas</p>
                <p className="text-3xl font-display font-bold text-xp">
                  {stats.totalXP.toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card-elevated"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-coins/10">
                <Coins className="w-7 h-7 text-coins" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Moedas Ganhas</p>
                <p className="text-3xl font-display font-bold text-coins">
                  {stats.totalCoins.toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Categories */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="w-full justify-start overflow-x-auto bg-card border border-border p-1 h-auto flex-wrap">
            {categories.map((category) => (
              <TabsTrigger
                key={category.id}
                value={category.id}
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <category.icon className="w-4 h-4" />
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredAchievements.map((achievement, index) => {
                  const config = rarityConfig[achievement.rarity];
                  const Icon = achievement.iconComponent;

                  return (
                    <motion.button
                      key={achievement.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAchievementClick(achievement)}
                      className={cn(
                        "relative flex flex-col items-center p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer w-full text-center",
                        config.border,
                        achievement.unlocked ? config.bg : "bg-card",
                        achievement.unlocked && config.glow,
                        !achievement.unlocked && "opacity-70"
                      )}
                    >
                      {/* Rarity Badge */}
                      <span
                        className={cn(
                          "absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full",
                          config.bg,
                          config.labelColor
                        )}
                      >
                        {config.label}
                      </span>

                      {/* Icon */}
                      <div className="relative mb-4">
                        <motion.div
                          animate={achievement.unlocked ? {
                            boxShadow: [
                              "0 0 0 0 hsl(var(--primary) / 0)",
                              "0 0 20px 10px hsl(var(--primary) / 0.2)",
                              "0 0 0 0 hsl(var(--primary) / 0)",
                            ],
                          } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                          className={cn(
                            "flex items-center justify-center w-16 h-16 rounded-2xl",
                            achievement.unlocked
                              ? `${config.bg} border-2 ${config.border}`
                              : "bg-muted border-2 border-muted-foreground/20"
                          )}
                        >
                          {achievement.unlocked ? (
                            <Icon className={cn("w-8 h-8", config.labelColor)} />
                          ) : (
                            <Lock className="w-8 h-8 text-muted-foreground" />
                          )}
                        </motion.div>

                        {achievement.unlocked && (
                          <motion.div
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.5, 1, 0.5],
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -top-1 -right-1"
                          >
                            <div className="w-4 h-4 bg-coins rounded-full" />
                          </motion.div>
                        )}
                      </div>

                      {/* Name & Description */}
                      <h4 className="font-display font-semibold text-lg mb-1">{achievement.name}</h4>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {achievement.description}
                      </p>

                      {/* Rewards */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Zap className="w-4 h-4 text-xp" />
                          <span className="text-sm font-semibold text-xp">+{achievement.xp_reward}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Coins className="w-4 h-4 text-coins" />
                          <span className="text-sm font-semibold text-coins">+{achievement.coins_reward}</span>
                        </div>
                      </div>

                      {/* Unlocked date */}
                      {achievement.unlocked && achievement.unlockedAt && (
                        <p className="text-xs text-muted-foreground mt-3">
                          Desbloqueado em {achievement.unlockedAt.toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>

            {filteredAchievements.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Nenhuma conquista nesta categoria</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Recent Unlocks */}
        {enrichedAchievements.filter(a => a.unlocked).length > 0 && (
          <div className="card-base space-y-4">
            <h3 className="font-display font-semibold text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-success" />
              Desbloqueadas Recentemente
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {enrichedAchievements
                .filter(a => a.unlocked)
                .sort((a, b) => (b.unlockedAt?.getTime() || 0) - (a.unlockedAt?.getTime() || 0))
                .slice(0, 5)
                .map((achievement, index) => {
                  const config = rarityConfig[achievement.rarity];
                  const Icon = achievement.iconComponent;

                  return (
                    <motion.button
                      key={achievement.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleAchievementClick(achievement)}
                      className={cn(
                        "relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-300 cursor-pointer min-w-[200px] flex-shrink-0",
                        config.border,
                        config.bg,
                        config.glow
                      )}
                    >
                      <div className={cn("flex items-center justify-center w-10 h-10 rounded-lg", config.bg)}>
                        <Icon className={cn("w-5 h-5", config.labelColor)} />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-sm">{achievement.name}</p>
                        <p className={cn("text-xs", config.labelColor)}>{config.label}</p>
                      </div>
                    </motion.button>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Unlock Modal */}
      <AchievementUnlockModal
        achievement={selectedAchievement}
        open={showUnlockModal}
        onOpenChange={setShowUnlockModal}
      />
    </MainLayout>
  );
}
