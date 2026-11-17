import React from "react";
import { BadgeCard } from "./BadgeCard";
import { GiftCard } from "./GiftCard";
import { useGamification } from "@/hooks/gamification/useGamification";
import { useAuth } from "@/hooks/auth/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Gift, Star } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const GamificationPanel: React.FC = () => {
  const { user } = useAuth();
  const {
    badges,
    gifts,
    unlockedAchievementIds,
    userLevel,
    levelProgress,
    isLoading,
  } = useGamification(user?.id);

  if (isLoading)
    return <div className="p-8 text-center">Carregando Gamificação...</div>;

  return (
    <div className="space-y-6">
      {/* Header com Progresso */}
      <div className="bg-card border rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20">
              <span className="text-2xl font-black text-primary">
                {userLevel.level}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Nível Atual</h2>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-warning fill-warning" />
                <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                  {userLevel.rank.name}
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-muted-foreground mb-1">
              {levelProgress.currentLevelXP} / {levelProgress.nextLevelXP} XP
            </div>
            <div className="text-2xl font-black text-primary">
              {Math.round(levelProgress.progress)}%
            </div>
          </div>
        </div>
        <Progress value={levelProgress.progress} className="h-2" />
      </div>

      <Tabs defaultValue="badges" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="badges" className="gap-2">
            <Trophy className="w-4 h-4" />
            Rank Badges
          </TabsTrigger>
          <TabsTrigger value="gifts" className="gap-2">
            <Gift className="w-4 h-4" />
            Task Gifts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="badges">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges?.map((badge) => (
              <BadgeCard
                key={badge.id}
                name={badge.name}
                description={badge.description}
                tier={badge.tier}
                xpRequirement={badge.xp_requirement}
                unlocked={unlockedAchievementIds.has(badge.id)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="gifts">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {gifts?.map((gift) => (
              <GiftCard
                key={gift.id}
                name={gift.name}
                description={gift.description}
                cost={gift.coin_cost}
                stock={gift.stock_quantity}
                disabled={userLevel.coins < gift.coin_cost}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
