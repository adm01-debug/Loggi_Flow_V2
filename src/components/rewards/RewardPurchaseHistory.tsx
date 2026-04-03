import { useRewardPurchases } from '@/hooks/useRewardPurchases';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShoppingBag, Coins, Gift, Award, Crown, Coffee, Shirt, Mouse, Fuel, UtensilsCrossed, Package, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = { Gift, Award, Crown, Coffee, Shirt, Mouse, Fuel, UtensilsCrossed, Package, Sparkles };
const rarityLabels: Record<string, string> = { common: 'Comum', rare: 'Raro', epic: 'Épico', legendary: 'Lendário' };

export function RewardPurchaseHistory() {
  const { purchases, isLoading, totalSpent } = useRewardPurchases();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        <Coins className="w-5 h-5 text-coins" />
        <span className="text-sm">Total gasto: <strong className="text-coins">{totalSpent} moedas</strong></span>
        <span className="text-sm text-muted-foreground">• {purchases.length} resgates</span>
      </div>

      {purchases.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma recompensa resgatada ainda</p>
        </div>
      ) : (
        <div className="space-y-2">
          {purchases.map((p) => {
            const Icon = iconMap[p.reward_item?.icon || ''] || Gift;
            return (
              <Card key={p.id} className="overflow-hidden">
                <CardContent className="flex items-center gap-3 py-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{p.reward_item?.name || 'Item'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-xs">
                        {rarityLabels[p.reward_item?.rarity || ''] || p.reward_item?.rarity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(p.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-coins shrink-0">
                    <Coins className="w-4 h-4" />
                    <span className="font-bold">{p.coins_spent}</span>
                  </div>
                  <Badge className={p.status === 'purchased' ? 'bg-success/10 text-success border-success/20' : 'bg-muted text-muted-foreground'}>
                    {p.status === 'purchased' ? 'Resgatado' : p.status}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
