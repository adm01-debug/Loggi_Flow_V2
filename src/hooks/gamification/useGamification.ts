import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RankBadge {
  id: string;
  name: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  icon_url: string;
  xp_requirement: number;
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
        .select("id, xp, coins, full_name, avatar_url")
        .eq("id", userId)
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
      return data as RankBadge[];
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
        .eq("user_id", userId);
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
      toast.success("Pontos recompensados com sucesso!");
    },
  });

  // Calculate current level based on XP (simple formula: floor(sqrt(xp/100)) + 1)
  const userLevel = {
    level: profile?.xp ? Math.floor(Math.sqrt(profile.xp / 100)) + 1 : 1,
    xp: profile?.xp || 0,
    coins: profile?.coins || 0,
    progress: profile?.xp ? (profile.xp % 100) : 0,
  };

  return {
    profile,
    badges,
    gifts,
    unlockedAchievementIds: unlockedAchievementIds || new Set<string>(),
    userLevel,
    isLoading: loadingProfile || loadingBadges || loadingGifts || loadingAchievements,
    awardPoints: awardPointsMutation.mutateAsync,
    // Add missing properties requested by components
    achievements: badges || [],
    addXP: async (xp: number) => awardPointsMutation.mutateAsync({ xp, coins: 0 }),
    unlockAchievement: async (badgeId: string) => {
      if (!userId) return;
      const { error } = await supabase
        .from("user_achievements")
        .insert({ user_id: userId, badge_id: badgeId });
      if (error && error.code !== '23505') throw error; // Ignore unique constraint violation
      queryClient.invalidateQueries({ queryKey: ["user_achievements", userId] });
    },
    nexusScore: 85, // Mock value for IntelligentLogisticsWidget
    levelProgress: userLevel.progress
  };
};
