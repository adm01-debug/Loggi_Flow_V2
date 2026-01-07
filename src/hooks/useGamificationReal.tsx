import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserGamification {
  id: string;
  user_id: string;
  level: number;
  current_xp: number;
  total_xp: number;
  coins: number;
  streak_days: number;
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
        .from('user_levels')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // Se não existe, criar registro
      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from('user_levels')
          .insert({ user_id: user.id, level: 1, current_xp: 0, total_xp: 0, coins: 0, streak_days: 0 })
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
        .from('user_levels')
        .select('user_id, level, current_xp, total_xp, coins')
        .order('total_xp', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get profiles separately
      const userIds = (data || []).map(entry => entry.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      return (data || []).map((entry, index) => {
        const profile = profileMap.get(entry.user_id);
        return {
          user_id: entry.user_id,
          user_name: profile?.full_name || 'Anônimo',
          avatar_url: profile?.avatar_url || null,
          level: entry.level,
          xp: entry.total_xp,
          position: index + 1,
        };
      }) as LeaderboardEntry[];
    },
  });

  // Adicionar XP
  const addXPMutation = useMutation({
    mutationFn: async ({ amount, reason }: { amount: number; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data: current } = await supabase
        .from('user_levels')
        .select('current_xp, total_xp, level')
        .eq('user_id', user.id)
        .single();

      if (!current) throw new Error('Perfil de gamificação não encontrado');

      const xpToNextLevel = Math.floor(100 * Math.pow(1.5, current.level - 1));
      let newXP = (current.current_xp || 0) + amount;
      let newTotalXP = (current.total_xp || 0) + amount;
      let newLevel = current.level || 1;

      // Level up
      while (newXP >= xpToNextLevel) {
        newXP -= xpToNextLevel;
        newLevel++;
      }

      const { error } = await supabase
        .from('user_levels')
        .update({ current_xp: newXP, total_xp: newTotalXP, level: newLevel })
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
        .from('user_levels')
        .select('coins')
        .eq('user_id', user.id)
        .single();

      if (!current || current.coins < cost) {
        throw new Error('Moedas insuficientes');
      }

      const { error } = await supabase
        .from('user_levels')
        .update({ coins: current.coins - cost })
        .eq('user_id', user.id);

      if (error) throw error;

      // Registrar resgate
      await supabase.from('reward_purchases').insert({
        user_id: user.id,
        reward_item_id: rewardId,
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
