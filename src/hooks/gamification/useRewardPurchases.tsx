import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks';

export interface RewardPurchase {
  id: string;
  user_id: string;
  reward_item_id: string;
  coins_spent: number;
  status: string;
  created_at: string;
  reward_item?: { name: string; icon: string; rarity: string; category: string };
}

export function useRewardPurchases() {
  const { user } = useAuth();

  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ['reward-purchases', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reward_purchases')
        .select(`
          *,
          reward_item:reward_items(name, icon, rarity, category)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as RewardPurchase[];
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  const totalSpent = purchases.reduce((acc, p) => acc + p.coins_spent, 0);

  return { purchases, isLoading, totalSpent };
}
