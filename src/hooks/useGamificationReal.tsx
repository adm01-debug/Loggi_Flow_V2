import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserGamification {
  id: string;
  user_id: string;
  level: number;
  xp: number;
  xp_to_next_level: number;
  coins: number;
  streak_days: number;
  total_deliveries: number;
  achievements: string[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  coins_reward: number;
  requirement_type: string;
  requirement_value: number;
}

interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  avatar_url: string | null;
  level: number;
  xp: number;
  total_deliveries: number;
  position: number;
}

export function useGamificationReal() {
  const queryClient = useQueryClient();

  // Dados do usuário atual
  const userQuery = useQuery({
    queryKey: ['gamification-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data, error } = await supabase
        .from('user_gamification')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Se não existe, criar registro
      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from('user_gamification')
          .insert({ user_id: user.id, level: 1, xp: 0, coins: 0, streak_days: 0, total_deliveries: 0, achievements: [] })
          .select()
          .single();
        
        if (insertError) throw insertError;
        return newData as UserGamification;
      }

      return data as UserGamification;
    },
  });

  // Conquistas disponíveis
  const achievementsQuery = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('requirement_value');
      
      if (error) throw error;
      return data as Achievement[];
    },
  });

  // Leaderboard
  const leaderboardQuery = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_gamification')
        .select('user_id, level, xp, total_deliveries, profiles(full_name, avatar_url)')
        .order('xp', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data || []).map((entry, index) => ({
        user_id: entry.user_id,
        user_name: (entry as any).profiles?.full_name || 'Anônimo',
        avatar_url: (entry as any).profiles?.avatar_url,
        level: entry.level,
        xp: entry.xp,
        total_deliveries: entry.total_deliveries,
        position: index + 1,
      })) as LeaderboardEntry[];
    },
  });

  // Adicionar XP
  const addXPMutation = useMutation({
    mutationFn: async ({ amount, reason }: { amount: number; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data: current } = await supabase
        .from('user_gamification')
        .select('xp, level, xp_to_next_level')
        .eq('user_id', user.id)
        .single();

      if (!current) throw new Error('Perfil de gamificação não encontrado');

      let newXP = (current.xp || 0) + amount;
      let newLevel = current.level || 1;
      let xpToNext = current.xp_to_next_level || 100;

      // Level up
      while (newXP >= xpToNext) {
        newXP -= xpToNext;
        newLevel++;
        xpToNext = Math.floor(xpToNext * 1.5);
      }

      const { error } = await supabase
        .from('user_gamification')
        .update({ xp: newXP, level: newLevel, xp_to_next_level: xpToNext })
        .eq('user_id', user.id);

      if (error) throw error;

      return { newXP, newLevel, leveledUp: newLevel > (current.level || 1) };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['gamification-user'] });
      if (result.leveledUp) {
        toast.success(`🎉 Level Up! Você chegou ao nível ${result.newLevel}!`);
      }
    },
  });

  // Resgatar recompensa
  const redeemRewardMutation = useMutation({
    mutationFn: async ({ rewardId, cost }: { rewardId: string; cost: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data: current } = await supabase
        .from('user_gamification')
        .select('coins')
        .eq('user_id', user.id)
        .single();

      if (!current || current.coins < cost) {
        throw new Error('Moedas insuficientes');
      }

      const { error } = await supabase
        .from('user_gamification')
        .update({ coins: current.coins - cost })
        .eq('user_id', user.id);

      if (error) throw error;

      // Registrar resgate
      await supabase.from('reward_redemptions').insert({
        user_id: user.id,
        reward_id: rewardId,
        coins_spent: cost,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gamification-user'] });
      toast.success('Recompensa resgatada!');
    },
  });

  return {
    user: userQuery.data,
    achievements: achievementsQuery.data || [],
    leaderboard: leaderboardQuery.data || [],
    isLoading: userQuery.isLoading,
    addXP: addXPMutation.mutate,
    redeemReward: redeemRewardMutation.mutate,
    refetch: userQuery.refetch,
  };
}
