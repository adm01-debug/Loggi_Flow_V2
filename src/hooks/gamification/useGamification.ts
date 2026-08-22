import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useGamification = (userId?: string) => {
  const { data: badges, isLoading: loadingBadges } = useQuery({
    queryKey: ["rank_badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rank_badges")
        .select("*")
        .order("xp_requirement", { ascending: true });
      if (error) throw error;
      return data;
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
      return data;
    },
  });

  const { data: userAchievements, isLoading: loadingAchievements } = useQuery({
    queryKey: ["user_achievements", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_achievements")
        .select("badge_id")
        .eq("user_id", userId);
      if (error) throw error;
      return data.map((a) => a.badge_id);
    },
  });

  return {
    badges,
    gifts,
    userAchievements,
    isLoading: loadingBadges || loadingGifts || loadingAchievements,
  };
};
