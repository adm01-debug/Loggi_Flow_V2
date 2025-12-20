import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Gift,
  Coins,
  ShoppingCart,
  Calendar,
  Award,
  Crown,
  Coffee,
  Shirt,
  Mouse,
  Fuel,
  UtensilsCrossed,
  Package,
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useGamification } from "@/hooks/useGamification";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RewardItem {
  id: string;
  name: string;
  description: string;
  coins_cost: number;
  category: string;
  icon: string;
  rarity: string;
  available: boolean;
  stock: number | null;
  created_at: string;
}

interface RewardPurchase {
  id: string;
  user_id: string;
  reward_item_id: string;
  coins_spent: number;
  status: string;
  redeemed_at: string | null;
  created_at: string;
  reward_items?: RewardItem;
}

const iconMap: Record<string, React.ElementType> = {
  Gift,
  Calendar,
  Award,
  Crown,
  Coffee,
  Shirt,
  Mouse,
  Fuel,
  UtensilsCrossed,
  Package,
};

const rarityConfig: Record<string, { label: string; color: string; glow: string }> = {
  common: { label: "Comum", color: "bg-muted text-muted-foreground", glow: "" },
  rare: { label: "Raro", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", glow: "shadow-blue-500/20" },
  epic: { label: "Épico", color: "bg-purple-500/20 text-purple-400 border-purple-500/30", glow: "shadow-purple-500/30" },
  legendary: { label: "Lendário", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", glow: "shadow-amber-500/40" },
};

const categoryLabels: Record<string, string> = {
  beneficio: "Benefícios",
  item: "Itens Físicos",
  virtual: "Itens Virtuais",
  geral: "Geral",
};

export default function LojaRecompensas() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { userLevel } = useGamification();
  const [selectedItem, setSelectedItem] = useState<RewardItem | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch reward items
  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ["reward-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reward_items")
        .select("*")
        .eq("available", true)
        .order("coins_cost");
      if (error) throw error;
      return data as RewardItem[];
    },
  });

  // Fetch user purchases
  const { data: purchases = [], isLoading: loadingPurchases } = useQuery({
    queryKey: ["reward-purchases", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("reward_purchases")
        .select("*, reward_items(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as RewardPurchase[];
    },
    enabled: !!user?.id,
  });

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async (item: RewardItem) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      if (!userLevel || userLevel.coins < item.coins_cost) {
        throw new Error("Moedas insuficientes");
      }

      // Deduct coins
      const { error: updateError } = await supabase
        .from("user_levels")
        .update({ coins: userLevel.coins - item.coins_cost })
        .eq("user_id", user.id);
      if (updateError) throw updateError;

      // Create purchase record
      const { error: purchaseError } = await supabase
        .from("reward_purchases")
        .insert({
          user_id: user.id,
          reward_item_id: item.id,
          coins_spent: item.coins_cost,
          status: "pending",
        });
      if (purchaseError) throw purchaseError;

      // Update stock if applicable
      if (item.stock !== null) {
        await supabase
          .from("reward_items")
          .update({ stock: item.stock - 1, available: item.stock - 1 > 0 })
          .eq("id", item.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reward-items"] });
      queryClient.invalidateQueries({ queryKey: ["reward-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["user-level"] });
      setConfirmOpen(false);
      setSelectedItem(null);
      toast.success("Compra realizada com sucesso! 🎉", {
        description: "Você receberá sua recompensa em breve.",
      });
    },
    onError: (error: Error) => {
      toast.error("Erro na compra", { description: error.message });
    },
  });

  const handlePurchase = (item: RewardItem) => {
    setSelectedItem(item);
    setConfirmOpen(true);
  };

  const confirmPurchase = () => {
    if (selectedItem) {
      purchaseMutation.mutate(selectedItem);
    }
  };

  const filteredItems = activeTab === "all" 
    ? items 
    : items.filter(item => item.category === activeTab);

  const categories = ["all", ...new Set(items.map(item => item.category))];

  const userCoins = userLevel?.coins || 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-display text-foreground flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10">
                <Gift className="w-6 h-6 text-amber-500" />
              </div>
              Loja de Recompensas
            </h1>
            <p className="text-muted-foreground mt-1">
              Troque suas moedas por benefícios exclusivos
            </p>
          </div>

          {/* User coins */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/20">
            <Coins className="w-6 h-6 text-amber-500" />
            <div>
              <p className="text-sm text-muted-foreground">Suas moedas</p>
              <p className="text-2xl font-bold text-amber-500">{userCoins}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            {categories.filter(c => c !== "all").map(cat => (
              <TabsTrigger key={cat} value={cat}>
                {categoryLabels[cat] || cat}
              </TabsTrigger>
            ))}
            <TabsTrigger value="purchases">Minhas Compras</TabsTrigger>
          </TabsList>

          <TabsContent value="purchases" className="mt-6">
            {loadingPurchases ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : purchases.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Você ainda não fez nenhuma compra</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {purchases.map(purchase => {
                  const item = purchase.reward_items;
                  if (!item) return null;
                  const IconComponent = iconMap[item.icon] || Gift;
                  const rarity = rarityConfig[item.rarity] || rarityConfig.common;

                  return (
                    <Card key={purchase.id} className="border-border">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <IconComponent className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{item.name}</CardTitle>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(purchase.created_at), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <Badge variant={purchase.status === "redeemed" ? "default" : "secondary"}>
                            {purchase.status === "redeemed" ? (
                              <><CheckCircle2 className="w-3 h-3 mr-1" /> Resgatado</>
                            ) : (
                              <><Clock className="w-3 h-3 mr-1" /> Pendente</>
                            )}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        <div className="flex items-center gap-1 mt-2 text-amber-500">
                          <Coins className="w-4 h-4" />
                          <span className="font-medium">-{purchase.coins_spent}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {categories.map(cat => (
            <TabsContent key={cat} value={cat} className="mt-6">
              {loadingItems ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum item disponível nesta categoria</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredItems.map(item => {
                    const IconComponent = iconMap[item.icon] || Gift;
                    const rarity = rarityConfig[item.rarity] || rarityConfig.common;
                    const canAfford = userCoins >= item.coins_cost;

                    return (
                      <Card 
                        key={item.id} 
                        className={cn(
                          "border-border transition-all hover:border-primary/50",
                          item.rarity === "legendary" && "border-amber-500/30",
                          item.rarity === "epic" && "border-purple-500/30"
                        )}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className={cn(
                              "w-14 h-14 rounded-xl flex items-center justify-center",
                              item.rarity === "legendary" ? "bg-gradient-to-br from-amber-500/20 to-amber-600/10" :
                              item.rarity === "epic" ? "bg-gradient-to-br from-purple-500/20 to-purple-600/10" :
                              item.rarity === "rare" ? "bg-gradient-to-br from-blue-500/20 to-blue-600/10" :
                              "bg-muted"
                            )}>
                              <IconComponent className={cn(
                                "w-7 h-7",
                                item.rarity === "legendary" ? "text-amber-500" :
                                item.rarity === "epic" ? "text-purple-500" :
                                item.rarity === "rare" ? "text-blue-500" :
                                "text-muted-foreground"
                              )} />
                            </div>
                            <Badge variant="outline" className={rarity.color}>
                              {item.rarity === "legendary" && <Sparkles className="w-3 h-3 mr-1" />}
                              {rarity.label}
                            </Badge>
                          </div>
                          <CardTitle className="text-lg mt-3">{item.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                          {item.stock !== null && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Estoque: {item.stock} unidade(s)
                            </p>
                          )}
                        </CardContent>
                        <CardFooter className="flex items-center justify-between pt-2 border-t border-border">
                          <div className="flex items-center gap-1 text-amber-500">
                            <Coins className="w-5 h-5" />
                            <span className="text-lg font-bold">{item.coins_cost}</span>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => handlePurchase(item)}
                            disabled={!canAfford}
                            variant={canAfford ? "default" : "secondary"}
                          >
                            {canAfford ? "Comprar" : "Moedas insuficientes"}
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Confirm Dialog */}
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Compra</DialogTitle>
              <DialogDescription>
                Você está prestes a comprar este item
              </DialogDescription>
            </DialogHeader>
            {selectedItem && (
              <div className="py-4">
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  {(() => {
                    const IconComponent = iconMap[selectedItem.icon] || Gift;
                    return <IconComponent className="w-10 h-10 text-primary" />;
                  })()}
                  <div className="flex-1">
                    <p className="font-medium">{selectedItem.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                  </div>
                </div>
                <div className="mt-4 p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Custo</span>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Coins className="w-4 h-4" />
                      <span className="font-bold">{selectedItem.coins_cost}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-muted-foreground">Saldo atual</span>
                    <span className="font-medium">{userCoins}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                    <span className="text-muted-foreground">Saldo após compra</span>
                    <span className="font-bold text-success">
                      {userCoins - selectedItem.coins_cost}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={confirmPurchase} 
                disabled={purchaseMutation.isPending}
              >
                {purchaseMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmar Compra
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}