import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RankBadge {
  id: string;
  name: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  icon_url: string;
  xp_requirement: number;
  code?: string;
  icon?: string;
  rarity?: string;
  xp_reward?: number;
  coins_reward?: number;
  category?: string;
}

export interface TaskGift {
  id: string;
  name: string;
  description: string;
  coin_cost: number;
  stock_quantity: number;
  image_url: string;
}

export const useGamification = (userId?: string) => {
  const queryClient = useQueryClient();

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId as string)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: badges, isLoading: loadingBadges } = useQuery({
    queryKey: ["rank_badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_badges")
        .select("*")
        .order("xp_requirement", { ascending: true });
      if (error) throw error;
      return (data as any[]).map(b => ({
        ...b,
        code: b.name.toLowerCase().replace(/\s+/g, '_'),
        icon: b.icon_url || 'Award',
        rarity: b.tier === 'diamond' ? 'legendary' : b.tier === 'platinum' ? 'epic' : b.tier === 'gold' ? 'rare' : 'common',
        xp_reward: b.xp_requirement,
        coins_reward: Math.floor(b.xp_requirement / 10),
        category: 'performance'
      })) as RankBadge[];
    },
  });

  const { data: gifts, isLoading: loadingGifts } = useQuery({
    queryKey: ["task_gifts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_gifts")
        .select("*")
        .order("coin_cost", { ascending: true });
      if (error) throw error;
      return data as TaskGift[];
    },
  });

  const { data: unlockedAchievementIds, isLoading: loadingAchievements } = useQuery({
    queryKey: ["user_achievements", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_achievements")
        .select("badge_id")
        .eq("user_id", userId as string);
      if (error) throw error;
      return new Set(data.map((a: any) => a.badge_id));
    },
  });

  const awardPointsMutation = useMutation({
    mutationFn: async ({ xp, coins }: { xp: number; coins: number }) => {
      if (!userId) throw new Error("User not authenticated");
      const { error } = await supabase.rpc("award_gamification_points", {
        _user_id: userId,
        _xp_amount: xp,
        _coins_amount: coins,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    },
  });

  const xp = (profile as any)?.xp || 0;
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const currentLevelXP = Math.pow(level - 1, 2) * 100;
  const nextLevelXP = Math.pow(level, 2) * 100;
  const progress = nextLevelXP > currentLevelXP 
    ? ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100 
    : 100;

  const userLevel = {
    level,
    xp,
    total_xp: xp,
    coins: (profile as any)?.coins || 0,
    progress,
    rank: { name: "Novato", color: "#94a3b8" },
    streak_days: 1,
    current_xp: xp
  };

  return {
    profile,
    badges,
    gifts,
    unlockedAchievementIds: unlockedAchievementIds || new Set<string>(),
    userLevel,
    levelProgress: {
      currentLevel: level,
      progress,
      currentLevelXP,
      nextLevelXP
    },
    isLoading: loadingProfile || loadingBadges || loadingGifts || loadingAchievements,
    awardPoints: async (params: { xp: number; coins: number }) => awardPointsMutation.mutateAsync(params),
    achievements: badges || [],
    addXP: async (xpInput: number | { amount: number; reason: string }) => {
      const amount = typeof xpInput === 'number' ? xpInput : xpInput.amount;
      return awardPointsMutation.mutateAsync({ xp: amount, coins: 0 });
    },
    unlockAchievement: async (badgeId: string) => {
      if (!userId) return;
      const { error } = await supabase
        .from("user_achievements")
        .insert({ user_id: userId, badge_id: badgeId } as any);
      if (error && (error as any).code !== '23505') throw error;
      queryClient.invalidateQueries({ queryKey: ["user_achievements", userId] });
    },
    nexusScore: 85
  };
};
