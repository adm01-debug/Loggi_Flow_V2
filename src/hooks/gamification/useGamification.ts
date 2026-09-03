import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type ProfileWithXP = {
  xp?: number | null;
  coins?: number | null;
  [key: string]: unknown;
};

// P18: alinhado ao schema em uso por useGamification.tsx.
// Tabelas usadas no projeto: achievements, rewards, user_levels,
// user_achievements, user_ranks. RPC: add_user_xp. As antigas
// rank_badges/task_gifts/update_user_streak não existem (404/403).

export interface RankBadge {
  id: string;
  name: string;
  description: string;
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  icon_url: string;
  xp_requirement: number;
  code: string;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  xp_reward: number;
  coins_reward: number;
  category: string;
}

export interface TaskGift {
  id: string;
  name: string;
  description: string;
  coin_cost: number;
  stock_quantity: number;
  image_url: string;
}

const tierFromRequirement = (req: number): RankBadge["tier"] => {
  if (req >= 1000) return "diamond";
  if (req >= 500) return "platinum";
  if (req >= 100) return "gold";
  if (req >= 25) return "silver";
  return "bronze";
};

const tierToRarity = (tier: RankBadge["tier"]): RankBadge["rarity"] => {
  if (tier === "diamond") return "legendary";
  if (tier === "platinum") return "epic";
  if (tier === "gold") return "rare";
  return "common";
};

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
      return data as unknown as ProfileWithXP;
    },
  });

  const { data: badges, isLoading: loadingBadges } = useQuery({
    queryKey: ["rank_badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("requirement_value", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((b) => {
        const req =
          ((b as Record<string, unknown>).requirement_value as number) || 0;
        const tier = tierFromRequirement(req);
        return {
          ...b,
          tier,
          icon_url: (b as Record<string, unknown>).icon || "",
          xp_requirement: req,
          code: String((b as Record<string, unknown>).name || "")
            .toLowerCase()
            .replace(/\s+/g, "_"),
          icon: (b as Record<string, unknown>).icon || "Award",
          rarity: tierToRarity(tier),
          xp_reward: (b as Record<string, unknown>).xp_reward || 0,
          coins_reward: (b as Record<string, unknown>).coins_reward || 0,
          category:
            (b as Record<string, unknown>).requirement_type || "performance",
        } as RankBadge;
      });
    },
  });

  const { data: gifts, isLoading: loadingGifts } = useQuery({
    queryKey: ["task_gifts"],
    queryFn: async () => {
      // P18: tabela real no banco deployado é `reward_items` (ver types.ts).
      // Colunas: available, coins_cost, category, rarity, stock, etc.
      const { data, error } = await supabase
        .from("reward_items")
        .select("*")
        .eq("available", true)
        .order("coins_cost", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        description: (r as Record<string, unknown>).description || "",
        coin_cost: r.coins_cost,
        stock_quantity: ((r as Record<string, unknown>).stock as number) ?? 0,
        image_url: (r as Record<string, unknown>).icon || "",
      })) as TaskGift[];
    },
  });

  const { data: unlockedAchievementIds, isLoading: loadingAchievements } =
    useQuery({
      queryKey: ["user_achievements", userId],
      enabled: !!userId,
      queryFn: async () => {
        // P18: tabela user_achievements existe neste schema (linhas com
        // achievement_id, mesmo formato da versão .tsx).
        const { data, error } = await supabase
          .from("user_achievements")
          .select("achievement_id")
          .eq("user_id", userId as string);
        if (error) throw error;
        return new Set<string>((data ?? []).map((a) => a.achievement_id));
      },
    });

  const awardPointsMutation = useMutation({
    mutationFn: async ({ xp, coins }: { xp: number; coins: number }) => {
      if (!userId) throw new Error("User not authenticated");
      // P18: RPC add_user_xp é o RPC real do schema em uso.
      const { error } = await supabase.rpc("add_user_xp", {
        p_user_id: userId,
        p_xp_amount: xp,
        p_coins_amount: coins,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userLevel", userId] });
    },
  });

  const xpValue = profile?.xp || 0;
  const levelValue = Math.floor(Math.sqrt(xpValue / 100)) + 1;
  const currentLevelXP = Math.pow(levelValue - 1, 2) * 100;
  const nextLevelXP = Math.pow(levelValue, 2) * 100;
  const progressPercent =
    nextLevelXP > currentLevelXP
      ? ((xpValue - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100
      : 100;

  const userLevel = {
    level: levelValue,
    xp: xpValue,
    total_xp: xpValue,
    coins: profile?.coins || 0,
    progress: progressPercent,
    rank: { name: "Novato", color: "#94a3b8" },
    streak_days: 1,
    current_xp: xpValue,
  };

  return {
    profile,
    badges,
    gifts,
    unlockedAchievementIds: unlockedAchievementIds || new Set<string>(),
    userLevel,
    levelProgress: {
      currentLevel: levelValue,
      progress: progressPercent,
      currentLevelXP,
      nextLevelXP,
    },
    isLoading:
      loadingProfile || loadingBadges || loadingGifts || loadingAchievements,
    awardPoints: async (params: { xp: number; coins: number }) =>
      awardPointsMutation.mutateAsync(params),
    achievements: (badges || []) as RankBadge[],
    addXP: async (xpInput: number | { amount: number; reason: string }) => {
      const amount = typeof xpInput === "number" ? xpInput : xpInput.amount;
      return awardPointsMutation.mutateAsync({ xp: amount, coins: 0 });
    },
    unlockAchievement: async (badgeId: string) => {
      if (!userId) return;
      // P18: insere em user_achievements (idempotente via catch 23505).
      const { error } = await supabase
        .from("user_achievements")
        .insert({ user_id: userId, achievement_id: badgeId });
      if (error && (error as { code?: string }).code !== "23505") throw error;
      queryClient.invalidateQueries({
        queryKey: ["user_achievements", userId],
      });
    },
    nexusScore: 85,
  };
};
