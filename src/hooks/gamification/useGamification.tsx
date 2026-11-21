import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/auth/useAuth";
import { useToast } from "@/hooks/ui/use-toast";
import { playCelebrationSound } from "@/utils/celebrationSounds";
import { QUERY_STALE_TIME } from "@/lib/queryConfig";

export interface UserLevel {
  id: string;
  user_id: string;
  current_xp: number;
  total_xp: number;
  level: number;
  coins: number;
  streak_days: number;
  last_activity_date: string | null;
  nexus_score?: number; // Core Nexus Score for logistics performance
  rank_id?: string;
  rank?: {
    name: string;
    icon: string;
    color: string;
    reward_multiplier: number;
  };
}

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  xp_reward: number;
  coins_reward: number;
  requirement_type: string;
  requirement_value: number;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement?: Achievement;
}

// Calculate XP needed for a level
export function xpForLevel(level: number): number {
  return (level - 1) * (level - 1) * 100;
}

// Calculate level from XP
export function calculateLevel(xp: number): number {
  return Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
}

// Calculate XP progress within current level
export function calculateLevelProgress(totalXP: number): {
  currentLevel: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progress: number;
} {
  const currentLevel = calculateLevel(totalXP);
  const currentLevelStart = xpForLevel(currentLevel);
  const nextLevelStart = xpForLevel(currentLevel + 1);
  const currentLevelXP = totalXP - currentLevelStart;
  const xpNeeded = nextLevelStart - currentLevelStart;

  return {
    currentLevel,
    currentLevelXP,
    nextLevelXP: xpNeeded,
    progress: (currentLevelXP / xpNeeded) * 100,
  };
}

export function useGamification() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user level data
  const {
    data: userLevel,
    isLoading: isLoadingLevel,
    isError: isErrorLevel,
  } = useQuery({
    queryKey: ["userLevel", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("user_levels")
        .select(
          `
          *,
          rank:user_ranks(*)
        `,
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      // Create record if doesn't exist
      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from("user_levels")
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) throw insertError;
        return newData as UserLevel;
      }

      return data as UserLevel;
    },
    enabled: !!user?.id,
    staleTime: QUERY_STALE_TIME.USER,
  });

  // Fetch all achievements
  const {
    data: achievements = [],
    isLoading: isLoadingAchievements,
    isError: isErrorAchievements,
  } = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("category", { ascending: true });

      if (error) throw error;
      return data as Achievement[];
    },
    staleTime: QUERY_STALE_TIME.STATIC,
  });

  // Fetch user's unlocked achievements
  const {
    data: userAchievements = [],
    isLoading: isLoadingUserAchievements,
    isError: isErrorUserAchievements,
  } = useQuery({
    queryKey: ["userAchievements", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("user_achievements")
        .select(
          `
          *,
          achievement:achievements(*)
        `,
        )
        .eq("user_id", user.id);

      if (error) throw error;
      return data as (UserAchievement & { achievement: Achievement })[];
    },
    enabled: !!user?.id,
    staleTime: QUERY_STALE_TIME.DYNAMIC,
  });

  // Add XP mutation
  const addXPMutation = useMutation({
    mutationFn: async ({
      amount,
      reason,
    }: {
      amount: number;
      reason?: string;
    }) => {
      if (!user?.id || !userLevel) throw new Error("User not logged in");

      const newTotalXP = userLevel.total_xp + amount;
      const newLevel = calculateLevel(newTotalXP);
      const leveledUp = newLevel > userLevel.level;

      const { error } = await supabase.rpc("add_user_xp", {
        p_user_id: user.id,
        p_xp_amount: amount,
        p_coins_amount: 0,
      });

      if (error) throw error;
      return { leveledUp, newLevel, amount };
    },
    onSuccess: ({ leveledUp, newLevel, amount }) => {
      queryClient.invalidateQueries({ queryKey: ["userLevel"] });

      toast({
        title: `+${amount} XP`,
        description: leveledUp
          ? `Você subiu para o Nível ${newLevel}!`
          : undefined,
      });

      if (leveledUp) {
        playCelebrationSound("legendary");
      }
    },
  });

  // Add coins mutation
  const addCoinsMutation = useMutation({
    mutationFn: async ({ amount }: { amount: number }) => {
      if (!user?.id || !userLevel) throw new Error("User not logged in");

      const { error } = await supabase.rpc("add_user_xp", {
        p_user_id: user.id,
        p_xp_amount: 0,
        p_coins_amount: amount,
      });

      if (error) throw error;
      return { amount };
    },
    onSuccess: ({ amount }) => {
      queryClient.invalidateQueries({ queryKey: ["userLevel"] });
      toast({
        title: `+${amount} Moedas`,
      });
    },
  });

  // Unlock achievement mutation
  const unlockAchievementMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      if (!user?.id) throw new Error("User not logged in");

      // Check if already unlocked
      const existing = userAchievements.find(
        (ua) => ua.achievement_id === achievementId,
      );
      if (existing) return null;

      const achievement = achievements.find((a) => a.id === achievementId);
      if (!achievement) throw new Error("Achievement not found");

      // Insert user achievement
      const { error: achievementError } = await supabase
        .from("user_achievements")
        .insert({ user_id: user.id, achievement_id: achievementId });

      if (achievementError) throw achievementError;

      // Add rewards via RPC
      if (userLevel) {
        await supabase.rpc("add_user_xp", {
          p_user_id: user.id,
          p_xp_amount: achievement.xp_reward,
          p_coins_amount: achievement.coins_reward,
        });
      }

      return achievement;
    },
    onSuccess: (achievement) => {
      if (!achievement) return;

      queryClient.invalidateQueries({ queryKey: ["userAchievements"] });
      queryClient.invalidateQueries({ queryKey: ["userLevel"] });

      playCelebrationSound(achievement.rarity);

      toast({
        title: "🏆 Conquista Desbloqueada!",
        description: `${achievement.name} - +${achievement.xp_reward} XP, +${achievement.coins_reward} moedas`,
      });
    },
  });

  // Update streak
  const updateStreakMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not logged in");

      // P18: substituído update_user_streak RPC (403 anon) por update direto
      // em user_levels.last_activity_date, alinhado com o schema em uso neste
      // arquivo. Debounce de 1x/dia fica a cargo do caller via localStorage.
      const today = new Date().toISOString().slice(0, 10);
      const { error } = await supabase
        .from("user_levels")
        .update({ last_activity_date: today })
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userLevel"] });
    },
  });

  // Get unlocked achievement IDs for easy lookup
  const unlockedAchievementIds = new Set(
    userAchievements.map((ua) => ua.achievement_id),
  );

  // Calculate level progress
  const levelProgress = useMemo(() => {
    if (!userLevel)
      return {
        currentLevel: 1,
        currentLevelXP: 0,
        nextLevelXP: 100,
        progress: 0,
      };
    return calculateLevelProgress(userLevel.total_xp);
  }, [userLevel]);

  // Derived Nexus Score based on global logistics efficiency
  const nexusScore = useMemo(() => {
    return userLevel?.nexus_score || 85; // Fallback to base score
  }, [userLevel]);

  return {
    // Data
    userLevel,
    achievements,
    userAchievements,
    unlockedAchievementIds,
    levelProgress,
    nexusScore,

    // Loading states
    isLoading:
      isLoadingLevel || isLoadingAchievements || isLoadingUserAchievements,
    isError: isErrorLevel || isErrorAchievements || isErrorUserAchievements,

    // Actions
    addXP: addXPMutation.mutate,
    addCoins: addCoinsMutation.mutate,
    unlockAchievement: unlockAchievementMutation.mutate,
    updateStreak: updateStreakMutation.mutate,

    // Mutation states
    isAddingXP: addXPMutation.isPending,
    isUnlockingAchievement: unlockAchievementMutation.isPending,
  };
}
