import { useState } from "react";
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
  Heart,
  TrendingUp,
  Calendar,
  Package,
  Users,
  Lock,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AchievementBadge } from "@/components/achievements/AchievementBadge";
import { AchievementUnlockModal } from "@/components/achievements/AchievementUnlockModal";
import { cn } from "@/lib/utils";

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: "delivery" | "streak" | "performance" | "special";
  rarity: "common" | "rare" | "epic" | "legendary";
  xpReward: number;
  coinsReward: number;
  unlocked: boolean;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
}

const achievements: Achievement[] = [
  // Delivery Achievements
  {
    id: "first-delivery",
    name: "Primeira Entrega",
    description: "Complete sua primeira entrega com sucesso",
    icon: Truck,
    category: "delivery",
    rarity: "common",
    xpReward: 50,
    coinsReward: 25,
    unlocked: true,
    unlockedAt: new Date(2024, 10, 1),
  },
  {
    id: "ten-deliveries",
    name: "Entregador Iniciante",
    description: "Complete 10 entregas",
    icon: Package,
    category: "delivery",
    rarity: "common",
    xpReward: 100,
    coinsReward: 50,
    unlocked: true,
    unlockedAt: new Date(2024, 10, 15),
  },
  {
    id: "fifty-deliveries",
    name: "Entregador Dedicado",
    description: "Complete 50 entregas",
    icon: Award,
    category: "delivery",
    rarity: "rare",
    xpReward: 250,
    coinsReward: 125,
    unlocked: true,
    unlockedAt: new Date(2024, 11, 5),
  },
  {
    id: "hundred-deliveries",
    name: "Mestre das Entregas",
    description: "Complete 100 entregas",
    icon: Trophy,
    category: "delivery",
    rarity: "epic",
    xpReward: 500,
    coinsReward: 250,
    unlocked: false,
    progress: 67,
    maxProgress: 100,
  },
  {
    id: "speed-demon",
    name: "Velocidade Máxima",
    description: "Complete 5 entregas em menos de 1 hora cada",
    icon: Rocket,
    category: "delivery",
    rarity: "rare",
    xpReward: 200,
    coinsReward: 100,
    unlocked: true,
    unlockedAt: new Date(2024, 11, 10),
  },

  // Streak Achievements
  {
    id: "streak-3",
    name: "Sequência de 3 Dias",
    description: "Mantenha uma sequência de 3 dias consecutivos",
    icon: Flame,
    category: "streak",
    rarity: "common",
    xpReward: 75,
    coinsReward: 30,
    unlocked: true,
    unlockedAt: new Date(2024, 10, 20),
  },
  {
    id: "streak-7",
    name: "Semana Perfeita",
    description: "Mantenha uma sequência de 7 dias consecutivos",
    icon: Flame,
    category: "streak",
    rarity: "rare",
    xpReward: 200,
    coinsReward: 100,
    unlocked: true,
    unlockedAt: new Date(2024, 11, 1),
  },
  {
    id: "streak-30",
    name: "Mês Imparável",
    description: "Mantenha uma sequência de 30 dias consecutivos",
    icon: Crown,
    category: "streak",
    rarity: "epic",
    xpReward: 1000,
    coinsReward: 500,
    unlocked: false,
    progress: 12,
    maxProgress: 30,
  },
  {
    id: "early-bird",
    name: "Madrugador",
    description: "Complete 10 entregas antes das 8h",
    icon: Clock,
    category: "streak",
    rarity: "rare",
    xpReward: 150,
    coinsReward: 75,
    unlocked: false,
    progress: 6,
    maxProgress: 10,
  },

  // Performance Achievements
  {
    id: "top-performer",
    name: "Top Performer",
    description: "Fique em 1º lugar no ranking semanal",
    icon: Star,
    category: "performance",
    rarity: "epic",
    xpReward: 500,
    coinsReward: 250,
    unlocked: true,
    unlockedAt: new Date(2024, 11, 8),
  },
  {
    id: "perfect-week",
    name: "Semana Impecável",
    description: "100% de taxa de sucesso em uma semana",
    icon: Target,
    category: "performance",
    rarity: "rare",
    xpReward: 300,
    coinsReward: 150,
    unlocked: true,
    unlockedAt: new Date(2024, 11, 12),
  },
  {
    id: "efficiency-master",
    name: "Mestre da Eficiência",
    description: "Mantenha 95%+ de eficiência por 30 dias",
    icon: TrendingUp,
    category: "performance",
    rarity: "legendary",
    xpReward: 1500,
    coinsReward: 750,
    unlocked: false,
    progress: 18,
    maxProgress: 30,
  },
  {
    id: "team-player",
    name: "Jogador de Equipe",
    description: "Ajude 5 colegas a completar entregas",
    icon: Users,
    category: "performance",
    rarity: "rare",
    xpReward: 200,
    coinsReward: 100,
    unlocked: false,
    progress: 3,
    maxProgress: 5,
  },

  // Special Achievements
  {
    id: "veteran",
    name: "Veterano",
    description: "Complete 1 ano na plataforma",
    icon: Shield,
    category: "special",
    rarity: "legendary",
    xpReward: 2000,
    coinsReward: 1000,
    unlocked: false,
    progress: 45,
    maxProgress: 365,
  },
  {
    id: "beloved",
    name: "Queridinho",
    description: "Receba 50 avaliações 5 estrelas",
    icon: Heart,
    category: "special",
    rarity: "epic",
    xpReward: 750,
    coinsReward: 375,
    unlocked: false,
    progress: 32,
    maxProgress: 50,
  },
  {
    id: "holiday-hero",
    name: "Herói das Festas",
    description: "Complete entregas em 3 feriados",
    icon: Calendar,
    category: "special",
    rarity: "rare",
    xpReward: 300,
    coinsReward: 150,
    unlocked: true,
    unlockedAt: new Date(2024, 11, 14),
  },
];

const categories = [
  { id: "all", label: "Todas", icon: Sparkles },
  { id: "delivery", label: "Entregas", icon: Truck },
  { id: "streak", label: "Sequências", icon: Flame },
  { id: "performance", label: "Performance", icon: TrendingUp },
  { id: "special", label: "Especiais", icon: Star },
];

export default function Conquistas() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  const filteredAchievements = achievements.filter(
    (a) => selectedCategory === "all" || a.category === selectedCategory
  );

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalXP = achievements.filter((a) => a.unlocked).reduce((acc, a) => acc + a.xpReward, 0);
  const totalCoins = achievements.filter((a) => a.unlocked).reduce((acc, a) => acc + a.coinsReward, 0);

  const handleAchievementClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    if (achievement.unlocked) {
      setShowUnlockModal(true);
    }
  };

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
              Desbloqueie badges e ganhe recompensas
            </p>
          </div>
        </div>

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
                  {unlockedCount}
                  <span className="text-lg text-muted-foreground font-normal">
                    /{achievements.length}
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-4">
              <Progress value={(unlockedCount / achievements.length) * 100} className="h-2" />
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
                <p className="text-sm text-muted-foreground">XP Ganho</p>
                <p className="text-3xl font-display font-bold text-xp">
                  {totalXP.toLocaleString()}
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
                <Star className="w-7 h-7 text-coins" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Moedas Ganhas</p>
                <p className="text-3xl font-display font-bold text-coins">
                  {totalCoins.toLocaleString()}
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
                {filteredAchievements.map((achievement, index) => (
                  <motion.div
                    key={achievement.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <AchievementBadge
                      achievement={achievement}
                      onClick={() => handleAchievementClick(achievement)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </TabsContent>
        </Tabs>

        {/* Recent Unlocks */}
        <div className="card-base space-y-4">
          <h3 className="font-display font-semibold text-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-success" />
            Desbloqueadas Recentemente
          </h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {achievements
              .filter((a) => a.unlocked)
              .sort((a, b) => (b.unlockedAt?.getTime() || 0) - (a.unlockedAt?.getTime() || 0))
              .slice(0, 5)
              .map((achievement, index) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex-shrink-0"
                >
                  <AchievementBadge
                    achievement={achievement}
                    compact
                    onClick={() => handleAchievementClick(achievement)}
                  />
                </motion.div>
              ))}
          </div>
        </div>
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
