import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Gift, Coins, ShoppingCart, Award, Crown, Coffee, Shirt, Mouse, Fuel, UtensilsCrossed, Package, Loader2, Sparkles, ArrowUpDown, ChevronUp, ChevronDown, LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useGamification } from "@/hooks/useGamification";
import { cn } from "@/lib/utils";

import { Pagination } from "@/components/common/Pagination";
import { FilterBar } from "@/components/common/FilterBar";
import { usePagination } from "@/hooks/usePagination";
import { useFilters, FilterConfig } from "@/hooks/useFilters";
import { useSorting } from "@/hooks/useSorting";

interface RewardItem { id: string; name: string; description: string; coins_cost: number; category: string; icon: string; rarity: string; available: boolean; }

const iconMap: Record<string, LucideIcon> = { Gift, Award, Crown, Coffee, Shirt, Mouse, Fuel, UtensilsCrossed, Package, Sparkles };
const rarityColors: Record<string, string> = { common: "from-gray-400 to-gray-500", rare: "from-blue-400 to-blue-600", epic: "from-purple-400 to-purple-600", legendary: "from-amber-400 to-amber-600" };

const mockRewards: RewardItem[] = [
  { id: "1", name: "Vale Café", description: "Um café grátis no refeitório", coins_cost: 50, category: "alimentacao", icon: "Coffee", rarity: "common", available: true },
  { id: "2", name: "Camiseta", description: "Camiseta exclusiva da empresa", coins_cost: 200, category: "vestuario", icon: "Shirt", rarity: "rare", available: true },
  { id: "3", name: "Mouse Gamer", description: "Mouse ergonômico premium", coins_cost: 500, category: "tecnologia", icon: "Mouse", rarity: "epic", available: true },
  { id: "4", name: "Vale Combustível", description: "R$ 100 em combustível", coins_cost: 800, category: "vale", icon: "Fuel", rarity: "epic", available: true },
  { id: "5", name: "Almoço VIP", description: "Almoço com a diretoria", coins_cost: 1000, category: "experiencia", icon: "Crown", rarity: "legendary", available: true },
  { id: "6", name: "Day Off", description: "Um dia de folga extra", coins_cost: 1500, category: "experiencia", icon: "Sparkles", rarity: "legendary", available: false },
];

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

  const tabFiltered = useMemo(() => {
    let result = tab === "all" ? mockRewards : mockRewards.filter(r => r.category === tab);
    if (availabilityFilter === "yes") result = result.filter(r => r.available);
    if (availabilityFilter === "no") result = result.filter(r => !r.available);
    return result;
  }, [tab, availabilityFilter]);
  
  const { filteredData, filters, setSearch, setFilter, clearFilters, hasActiveFilters } = useFilters(tabFiltered, filterConfig);
  const { sortedData, toggleSort, getSortDirection } = useSorting(filteredData, { defaultKey: "coins_cost", defaultDirection: "asc" });
  const pagination = usePagination(sortedData, { initialPageSize: 9 });

  const redeemMutation = useMutation({
    mutationFn: async (reward: RewardItem) => {
      if (coins < reward.coins_cost) throw new Error("Moedas insuficientes");
      const { error } = await supabase.from("user_levels").update({ coins: coins - reward.coins_cost }).eq("user_id", user?.id);
      if (error) throw error;
      return reward;
    },
    onSuccess: (reward) => { qc.invalidateQueries({ queryKey: ["user-level"] }); toast.success(`${reward.name} resgatado!`); setConfirmDialog(false); setSelectedReward(null); },
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
          <div><h1 className="text-display flex items-center gap-3"><div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/10"><ShoppingCart className="w-6 h-6 text-amber-500" /></div>Loja de Recompensas</h1><p className="text-muted-foreground mt-1">Troque suas moedas por prêmios</p></div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-700"><Coins className="w-5 h-5" /><span className="font-bold text-lg">{coins}</span><span className="text-sm">moedas</span></div>
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
                    <div className="flex-1"><h3 className="font-semibold">{r.name}</h3><p className="text-sm text-muted-foreground">{r.description}</p></div>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1 text-amber-600"><Coins className="w-4 h-4" /><span className="font-bold">{r.coins_cost}</span></div>
                    <Button size="sm" disabled={!r.available || !canAfford || redeemMutation.isPending} onClick={() => handleRedeem(r)}>
                      {!canAfford ? "Sem moedas" : !r.available ? "Indisponível" : "Resgatar"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {sortedData.length === 0 && <div className="flex flex-col items-center py-12"><ShoppingCart className="w-12 h-12 text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">Nenhuma recompensa encontrada</p></div>}
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