import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/auth/useAuth";

type UserLevelRow = {
  current_xp?: number | null;
  total_xp?: number | null;
  level?: number | null;
  coins?: number | null;
  streak_days?: number | null;
  nexus_score?: number | null;
  rank?: { name: string; color: string } | null;
  [key: string]: unknown;
};

// P18: alinhado ao schema em uso por useGamification.ts.
// Tabelas usadas no projeto: achievements, rewards, user_levels,
// user_achievements, user_ranks. RPC: add_user_xp. As antigas
// rank_badges/task_gifts/update_user_streak não existem (404/403).

export type BadgeTier = "bronze" | "silver" | "gold" | "platinum" | "diamond";
export type BadgeRarity = "common" | "rare" | "epic" | "legendary";

export interface RankBadge {
  id: string;
  name: string;
  description: string;
  tier: BadgeTier;
  icon_url: string;
  xp_requirement: number;
  code: string;
  icon: string;
  rarity: BadgeRarity;
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

export const useGamification = (userIdParam?: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  // P23: a maioria dos consumidores chama useGamification() sem argumento.
  // Sem este fallback o `enabled: !!userId` desligava todas as queries e o
  // saldo/XP/nivel apareciam zerados em toda a UI.
  const userId = userIdParam ?? user?.id;

  const {
    data: profile,
    isLoading: loadingProfile,
    isError: isErrorProfile,
  } = useQuery({
    queryKey: ["userLevel", userId],
    enabled: !!userId,
    queryFn: async () => {
      // P23: XP e moedas vivem em user_levels; profiles nao tem xp/coins.
      const { data, error } = await supabase
        .from("user_levels")
        .select("*, rank:user_ranks(*)")
        .eq("user_id", userId as string)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as UserLevelRow | null;
    },
  });

  const {
    data: badges,
    isLoading: loadingBadges,
    isError: isErrorBadges,
  } = useQuery({
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
        } as unknown as RankBadge;
      });
    },
  });

  const {
    data: gifts,
    isLoading: loadingGifts,
    isError: isErrorGifts,
  } = useQuery({
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

  const {
    data: unlockedAchievementIds,
    isLoading: loadingAchievements,
    isError: isErrorAchievements,
  } = useQuery({
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

  const xpValue = profile?.total_xp || 0;
  const levelValue = profile?.level || Math.floor(Math.sqrt(xpValue / 100)) + 1;
  const levelStartXP = Math.pow(levelValue - 1, 2) * 100;
  const levelEndXP = Math.pow(levelValue, 2) * 100;
  // XP relativo ao nivel atual: a sidebar exibe `currentLevelXP / nextLevelXP`
  // como progresso dentro do nivel, e os valores absolutos nao variavam
  // conforme o usuario ganhava XP.
  const currentLevelXP = Math.max(0, xpValue - levelStartXP);
  const nextLevelXP = Math.max(0, levelEndXP - levelStartXP);
  const progressPercent =
    nextLevelXP > 0 ? Math.min(100, (currentLevelXP / nextLevelXP) * 100) : 100;

  const userLevel = {
    level: levelValue,
    xp: xpValue,
    total_xp: xpValue,
    coins: profile?.coins || 0,
    progress: progressPercent,
    rank: profile?.rank ?? { name: "Novato", color: "#94a3b8" },
    streak_days: profile?.streak_days ?? 0,
    current_xp: profile?.current_xp ?? xpValue,
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
    isError:
      isErrorProfile || isErrorBadges || isErrorGifts || isErrorAchievements,
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
      // Concede a recompensa da conquista. Nao existe trigger no banco que
      // pague `xp_reward`/`coins_reward` (o unico em user_achievements apenas
      // notifica), entao sem este passo o usuario desbloqueava a conquista e
      // nao recebia nada. So paga quando o insert foi novo (23505 = ja tinha).
      if (!error) {
        const badge = (badges || []).find(
          (b) => (b as { id?: string }).id === badgeId,
        ) as { xp_reward?: number; coins_reward?: number } | undefined;
        const xp = badge?.xp_reward ?? 0;
        const coins = badge?.coins_reward ?? 0;
        if (xp > 0 || coins > 0) {
          await awardPointsMutation.mutateAsync({ xp, coins });
        }
      }
      queryClient.invalidateQueries({
        queryKey: ["user_achievements", userId],
      });
    },
    nexusScore: (profile?.nexus_score as number | null) ?? 85,
  };
};
