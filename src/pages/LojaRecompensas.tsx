import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Gift, Coins, ShoppingCart, Award, Crown, Coffee, Shirt, Mouse, Fuel, UtensilsCrossed, Package, Loader2, Sparkles, ArrowUpDown, ChevronUp, ChevronDown, LucideIcon, History } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useGamification } from "@/hooks/useGamification";
import { cn } from "@/lib/utils";

import { Pagination } from "@/components/common/Pagination";
import { FilterBar } from "@/components/common/FilterBar";
import { usePagination } from "@/hooks/usePagination";
import { useFilters, FilterConfig } from "@/hooks/useFilters";
import { useSorting } from "@/hooks/useSorting";
import { RewardPurchaseHistory } from "@/components/rewards/RewardPurchaseHistory";

interface RewardItem { id: string; name: string; description: string; coins_cost: number; category: string; icon: string; rarity: string; available: boolean; stock: number | null; }

const iconMap: Record<string, LucideIcon> = { Gift, Award, Crown, Coffee, Shirt, Mouse, Fuel, UtensilsCrossed, Package, Sparkles };
const rarityColors: Record<string, string> = { common: "from-muted-foreground/40 to-muted-foreground/60", rare: "from-info to-info/80", epic: "from-primary to-primary/80", legendary: "from-coins to-coins/80" };

const filterConfig: FilterConfig<RewardItem> = {
  search: {
    fields: ["name", "description"],
    placeholder: "Buscar recompensas..."
  },
  select: {
    rarity: {
      field: "rarity",
      options: [{ value: "common", label: "Comum" }, { value: "rare", label: "Raro" }, { value: "epic", label: "Épico" }, { value: "legendary", label: "Lendário" }],
      label: "Raridade"
    }
  }
};

export default function LojaRecompensas() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { userLevel } = useGamification();
  const [selectedReward, setSelectedReward] = useState<RewardItem | null>(null);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [tab, setTab] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");

  const coins = userLevel?.coins || 0;

  // Fetch real reward items from database
  const { data: rewardItems = [], isLoading } = useQuery({
    queryKey: ["reward-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reward_items")
        .select("*")
        .order("coins_cost", { ascending: true });
      if (error) throw error;
      return data as RewardItem[];
    },
  });

  const tabFiltered = useMemo(() => {
    let result = tab === "all" ? rewardItems : rewardItems.filter(r => r.category === tab);
    if (availabilityFilter === "yes") result = result.filter(r => r.available);
    if (availabilityFilter === "no") result = result.filter(r => !r.available);
    return result;
  }, [tab, availabilityFilter, rewardItems]);
  
  const { filteredData, filters, setSearch, setFilter, clearFilters, hasActiveFilters } = useFilters(tabFiltered, filterConfig);
  const { sortedData, toggleSort, getSortDirection } = useSorting(filteredData, { defaultKey: "coins_cost", defaultDirection: "asc" });
  const pagination = usePagination(sortedData, { initialPageSize: 9 });

  const redeemMutation = useMutation({
    mutationFn: async (reward: RewardItem) => {
      if (!user?.id) throw new Error("Não autenticado");
      const { data, error } = await supabase.rpc("purchase_reward", {
        p_user_id: user.id,
        p_reward_item_id: reward.id,
      });
      if (error) throw error;
      const result = data as unknown as { success: boolean; error?: string; coins_spent?: number; remaining_coins?: number };
      if (!result.success) throw new Error(result.error || "Erro ao resgatar");
      return { reward, result };
    },
    onSuccess: ({ reward, result }) => {
      qc.invalidateQueries({ queryKey: ["user-level"] });
      qc.invalidateQueries({ queryKey: ["gamification-user"] });
      qc.invalidateQueries({ queryKey: ["reward-items"] });
      toast.success(`${reward.name} resgatado! -${result.coins_spent} moedas`);
      setConfirmDialog(false);
      setSelectedReward(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const handleRedeem = (reward: RewardItem) => { setSelectedReward(reward); setConfirmDialog(true); };
  const SortIcon = ({ field }: { field: keyof RewardItem }) => { const dir = getSortDirection(field); if (!dir) return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />; return dir === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />; };

  const handleClearFilters = () => {
    clearFilters();
    setAvailabilityFilter("all");
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><h1 className="text-display flex items-center gap-3"><div className="flex items-center justify-center w-12 h-12 rounded-xl bg-coins/10"><ShoppingCart className="w-6 h-6 text-coins" /></div>Loja de Recompensas</h1><p className="text-muted-foreground mt-1">Troque suas moedas por prêmios</p></div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-coins/15 text-coins"><Coins className="w-5 h-5" /><span className="font-bold text-lg">{coins}</span><span className="text-sm">moedas</span></div>
        </div>

        <Tabs value={tab} onValueChange={setTab}><TabsList><TabsTrigger value="all">Todos</TabsTrigger><TabsTrigger value="alimentacao">Alimentação</TabsTrigger><TabsTrigger value="vestuario">Vestuário</TabsTrigger><TabsTrigger value="tecnologia">Tecnologia</TabsTrigger><TabsTrigger value="experiencia">Experiências</TabsTrigger></TabsList></Tabs>

        <FilterBar 
          search={filters.search} 
          onSearchChange={setSearch} 
          searchPlaceholder="Buscar recompensas..." 
          extraFilters={[
            { key: "rarity", label: "Raridade", value: filters.rarity as string || "all", options: [{ value: "common", label: "Comum" }, { value: "rare", label: "Raro" }, { value: "epic", label: "Épico" }, { value: "legendary", label: "Lendário" }], onChange: (v) => setFilter("rarity", v === "all" ? undefined : v) },
            { key: "available", label: "Disponível", value: availabilityFilter, options: [{ value: "yes", label: "Disponível" }, { value: "no", label: "Indisponível" }], onChange: setAvailabilityFilter }
          ]} 
          onClearFilters={handleClearFilters} 
          hasActiveFilters={hasActiveFilters || availabilityFilter !== "all"} 
          totalFiltered={sortedData.length} 
          totalOriginal={tabFiltered.length} 
        />

        <div className="flex items-center gap-2"><Button variant="ghost" size="sm" onClick={() => toggleSort("coins_cost")} className="gap-1">Preço <SortIcon field="coins_cost" /></Button><Button variant="ghost" size="sm" onClick={() => toggleSort("rarity")} className="gap-1">Raridade <SortIcon field="rarity" /></Button></div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pagination.paginatedData.map((r, i) => {
              const Icon = iconMap[r.icon] || Gift;
              const canAfford = coins >= r.coins_cost;
              return (
                <div key={r.id} className={cn("card-interactive relative overflow-hidden", !r.available && "opacity-50")} style={{ animationDelay: `${i * 50}ms` }}>
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-10", rarityColors[r.rarity])} />
                  <div className="relative p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn("p-3 rounded-xl bg-gradient-to-br text-white", rarityColors[r.rarity])}><Icon className="w-6 h-6" /></div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{r.name}</h3>
                        <p className="text-sm text-muted-foreground">{r.description}</p>
                        {r.stock !== null && <p className="text-xs text-muted-foreground mt-1">Estoque: {r.stock}</p>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-1 text-coins"><Coins className="w-4 h-4" /><span className="font-bold">{r.coins_cost}</span></div>
                      <Button size="sm" disabled={!r.available || !canAfford || redeemMutation.isPending} onClick={() => handleRedeem(r)}>
                        {!canAfford ? "Sem moedas" : !r.available ? "Indisponível" : "Resgatar"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && sortedData.length === 0 && <div className="flex flex-col items-center py-12"><ShoppingCart className="w-12 h-12 text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">Nenhuma recompensa encontrada</p></div>}
        {sortedData.length > 0 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            startIndex={pagination.startIndex}
            endIndex={pagination.endIndex}
            hasNextPage={pagination.hasNextPage}
            hasPrevPage={pagination.hasPrevPage}
            pageSizeOptions={pagination.pageSizeOptions}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
            onNextPage={pagination.nextPage}
            onPrevPage={pagination.prevPage}
            onFirstPage={pagination.firstPage}
            onLastPage={pagination.lastPage}
          />
        )}

        <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}><DialogContent><DialogHeader><DialogTitle>Confirmar Resgate</DialogTitle><DialogDescription>Deseja resgatar {selectedReward?.name} por {selectedReward?.coins_cost} moedas?</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setConfirmDialog(false)}>Cancelar</Button><Button onClick={() => selectedReward && redeemMutation.mutate(selectedReward)} disabled={redeemMutation.isPending}>{redeemMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Confirmar</Button></DialogFooter></DialogContent></Dialog>
      </div>
    </MainLayout>
  );
}
