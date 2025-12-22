import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Zap, Trophy, Flame, Star, Target, Truck, Clock, Award, Crown, Rocket, Shield, TrendingUp, Calendar, Package, Users, Lock, CheckCircle2, Sparkles, PackagePlus, Boxes, Container, Warehouse, Timer, ShieldCheck, Medal, LayoutGrid, Building2, Moon, Sunrise, PackageCheck, Coins, LucideIcon, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGamification } from "@/hooks/useGamification";

import { Pagination } from "@/components/common/Pagination";
import { FilterBar } from "@/components/common/FilterBar";
import { usePagination } from "@/hooks/usePagination";
import { useFilters, FilterConfig } from "@/hooks/useFilters";
import { useSorting } from "@/hooks/useSorting";

interface Achievement { id: string; name: string; description: string; category: string; xpReward: number; icon: LucideIcon; unlocked: boolean; progress: number; maxProgress: number; rarity: "common" | "rare" | "epic" | "legendary"; }

const iconMap: Record<string, LucideIcon> = { Zap, Trophy, Flame, Star, Target, Truck, Clock, Award, Crown, Rocket, Shield, TrendingUp, Calendar, Package, Users, PackagePlus, Boxes, Container, Warehouse, Timer, ShieldCheck, Medal, LayoutGrid, Building2, Moon, Sunrise, PackageCheck, Coins };

const achievements: Achievement[] = [
  { id: "1", name: "Primeiro Passo", description: "Complete sua primeira entrega", category: "entregas", xpReward: 50, icon: Truck, unlocked: true, progress: 1, maxProgress: 1, rarity: "common" },
  { id: "2", name: "Velocista", description: "10 entregas no mesmo dia", category: "entregas", xpReward: 200, icon: Zap, unlocked: false, progress: 7, maxProgress: 10, rarity: "rare" },
  { id: "3", name: "Maratonista", description: "100 entregas no mês", category: "entregas", xpReward: 500, icon: Trophy, unlocked: false, progress: 45, maxProgress: 100, rarity: "epic" },
  { id: "4", name: "Lenda", description: "1000 entregas totais", category: "entregas", xpReward: 1000, icon: Crown, unlocked: false, progress: 312, maxProgress: 1000, rarity: "legendary" },
  { id: "5", name: "Pontual", description: "50 entregas sem atraso", category: "performance", xpReward: 300, icon: Clock, unlocked: true, progress: 50, maxProgress: 50, rarity: "rare" },
  { id: "6", name: "Streak Master", description: "30 dias consecutivos", category: "streak", xpReward: 500, icon: Flame, unlocked: false, progress: 12, maxProgress: 30, rarity: "epic" },
  { id: "7", name: "Coletor", description: "50 coletas realizadas", category: "coletas", xpReward: 200, icon: Package, unlocked: true, progress: 50, maxProgress: 50, rarity: "rare" },
  { id: "8", name: "Networker", description: "Cadastre 20 clientes", category: "cadastros", xpReward: 150, icon: Users, unlocked: false, progress: 15, maxProgress: 20, rarity: "common" },
];

const rarityColors = { common: "from-gray-400 to-gray-500", rare: "from-blue-400 to-blue-600", epic: "from-purple-400 to-purple-600", legendary: "from-amber-400 to-amber-600" };
const rarityLabels = { common: "Comum", rare: "Raro", epic: "Épico", legendary: "Lendário" };

const filterConfig: FilterConfig<Achievement> = {
  search: {
    fields: ["name", "description"],
    placeholder: "Buscar conquistas..."
  },
  select: {
    category: {
      field: "category",
      options: [{ value: "entregas", label: "Entregas" }, { value: "coletas", label: "Coletas" }, { value: "performance", label: "Performance" }, { value: "streak", label: "Streak" }, { value: "cadastros", label: "Cadastros" }],
      label: "Categoria"
    },
    rarity: {
      field: "rarity",
      options: [{ value: "common", label: "Comum" }, { value: "rare", label: "Raro" }, { value: "epic", label: "Épico" }, { value: "legendary", label: "Lendário" }],
      label: "Raridade"
    }
  }
};

export default function Conquistas() {
  const { userLevel } = useGamification();
  const [tab, setTab] = useState("all");

  const tabFiltered = useMemo(() => tab === "all" ? achievements : tab === "unlocked" ? achievements.filter(a => a.unlocked) : achievements.filter(a => !a.unlocked), [tab]);
  const { filteredData, filters, setSearch, setFilter, clearFilters, hasActiveFilters, totalFiltered, totalOriginal } = useFilters(tabFiltered, filterConfig);
  const { sortedData, toggleSort, getSortDirection } = useSorting(filteredData, { defaultKey: "rarity", defaultDirection: "desc" });
  const pagination = usePagination(sortedData, { initialPageSize: 12 });

  const stats = { total: achievements.length, unlocked: achievements.filter(a => a.unlocked).length, totalXp: achievements.filter(a => a.unlocked).reduce((s, a) => s + a.xpReward, 0) };
  const SortIcon = ({ field }: { field: string }) => { const dir = getSortDirection(field as any); if (!dir) return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />; return dir === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />; };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><h1 className="text-display flex items-center gap-3"><div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/10"><Trophy className="w-6 h-6 text-amber-500" /></div>Conquistas</h1><p className="text-muted-foreground mt-1">Desbloqueie conquistas e ganhe XP</p></div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card text-center"><Trophy className="w-5 h-5 text-amber-500 mx-auto mb-2" /><p className="text-2xl font-bold">{stats.unlocked}/{stats.total}</p><p className="text-xs text-muted-foreground">Desbloqueadas</p></div>
          <div className="stat-card text-center"><Sparkles className="w-5 h-5 text-purple-500 mx-auto mb-2" /><p className="text-2xl font-bold">{stats.totalXp}</p><p className="text-xs text-muted-foreground">XP Ganho</p></div>
          <div className="stat-card text-center"><Star className="w-5 h-5 text-yellow-500 mx-auto mb-2" /><p className="text-2xl font-bold">Nível {userLevel?.level || 1}</p><p className="text-xs text-muted-foreground">Atual</p></div>
        </div>

        <Tabs value={tab} onValueChange={setTab}><TabsList><TabsTrigger value="all">Todas</TabsTrigger><TabsTrigger value="unlocked">Desbloqueadas</TabsTrigger><TabsTrigger value="locked">Bloqueadas</TabsTrigger></TabsList></Tabs>

        <FilterBar 
          search={filters.search} 
          onSearchChange={setSearch} 
          searchPlaceholder="Buscar conquistas..." 
          extraFilters={[
            { key: "category", label: "Categoria", value: filters.category as string || "all", options: [{ value: "entregas", label: "Entregas" }, { value: "coletas", label: "Coletas" }, { value: "performance", label: "Performance" }, { value: "streak", label: "Streak" }], onChange: (v) => setFilter("category", v === "all" ? undefined : v) },
            { key: "rarity", label: "Raridade", value: filters.rarity as string || "all", options: [{ value: "common", label: "Comum" }, { value: "rare", label: "Raro" }, { value: "epic", label: "Épico" }, { value: "legendary", label: "Lendário" }], onChange: (v) => setFilter("rarity", v === "all" ? undefined : v) }
          ]} 
          onClearFilters={clearFilters} 
          hasActiveFilters={hasActiveFilters} 
          totalFiltered={totalFiltered} 
          totalOriginal={totalOriginal} 
        />

        <div className="flex items-center gap-2"><Button variant="ghost" size="sm" onClick={() => toggleSort("xpReward")} className="gap-1">XP <SortIcon field="xpReward" /></Button><Button variant="ghost" size="sm" onClick={() => toggleSort("progress")} className="gap-1">Progresso <SortIcon field="progress" /></Button></div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pagination.paginatedData.map((a, i) => {
            const Icon = a.icon;
            const progress = (a.progress / a.maxProgress) * 100;
            return (
              <motion.div key={a.id} className={cn("card-interactive relative overflow-hidden", !a.unlocked && "opacity-70")} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-10", rarityColors[a.rarity])} />
                <div className="relative p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn("p-3 rounded-xl bg-gradient-to-br", rarityColors[a.rarity], "text-white")}><Icon className="w-6 h-6" /></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2"><h3 className="font-semibold">{a.name}</h3>{a.unlocked && <CheckCircle2 className="w-4 h-4 text-green-500" />}{!a.unlocked && <Lock className="w-4 h-4 text-muted-foreground" />}</div>
                      <p className="text-sm text-muted-foreground">{a.description}</p>
                      <div className="flex items-center gap-2 mt-2"><Badge variant="outline" className="text-xs">{rarityLabels[a.rarity]}</Badge><Badge variant="secondary" className="text-xs">+{a.xpReward} XP</Badge></div>
                    </div>
                  </div>
                  {!a.unlocked && <div className="mt-3"><div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Progresso</span><span>{a.progress}/{a.maxProgress}</span></div><Progress value={progress} className="h-2" /></div>}
                </div>
              </motion.div>
            );
          })}
        </div>

        {sortedData.length === 0 && <div className="flex flex-col items-center py-12"><Trophy className="w-12 h-12 text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">Nenhuma conquista encontrada</p></div>}
        
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
      </div>
    </MainLayout>
  );
}
