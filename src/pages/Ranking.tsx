import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Star, TrendingUp, Flame, Crown, Award, ArrowUpDown, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { useGamification } from "@/hooks/useGamification";
import { Pagination } from "@/components/common/Pagination";
import { FilterBar } from "@/components/common/FilterBar";
import { usePagination } from "@/hooks/usePagination";
import { useFilters, FilterConfig } from "@/hooks/useFilters";
import { useSorting } from "@/hooks/useSorting";
import { useRealtime } from "@/hooks/useRealtime";
import { cn } from "@/lib/utils";

interface RankUser { id: string; name: string; avatar?: string; xp: number; level: number; streak: number; deliveries: number; }

const filterConfig: FilterConfig<RankUser>[] = [
  { key: "search", type: "search", fields: ["name"] },
  { key: "level", type: "custom", filterFn: (item, value) => !value || item.level >= parseInt(value as string) }
];

export default function Ranking() {
  const { leaderboard, userLevel, isLoading, refetch } = useGamification();
  const [period, setPeriod] = useState<"weekly" | "monthly" | "all">("weekly");

  useRealtime({ table: "user_levels", onUpdate: () => refetch?.() });

  const users: RankUser[] = useMemo(() => (leaderboard || []).map((u: any) => ({ id: u.user_id, name: u.full_name || "Usuário", avatar: u.avatar_url, xp: u.xp || 0, level: u.level || 1, streak: u.streak_days || 0, deliveries: u.total_deliveries || 0 })), [leaderboard]);

  const { filteredData, filters, setFilter, clearFilters, hasActiveFilters } = useFilters(users, filterConfig);
  const { sortedData, toggleSort, getSortDirection } = useSorting(filteredData, { defaultKey: "xp", defaultDirection: "desc" });
  const { paginatedData, currentPage, totalPages, pageSize, setPageSize, goToPage, hasNextPage, hasPrevPage } = usePagination(sortedData, { initialPageSize: 10 });

  const top3 = sortedData.slice(0, 3);
  const SortIcon = ({ field }: { field: string }) => { const dir = getSortDirection(field as any); if (!dir) return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />; return dir === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />; };

  const podiumColors = ["from-amber-400 to-amber-600", "from-gray-300 to-gray-500", "from-amber-600 to-amber-800"];
  const podiumIcons = [Crown, Medal, Award];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><h1 className="text-display flex items-center gap-3"><div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/10"><Trophy className="w-6 h-6 text-amber-500" /></div>Ranking</h1><p className="text-muted-foreground mt-1">Top operadores por XP e entregas</p></div>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}><TabsList><TabsTrigger value="weekly">Semanal</TabsTrigger><TabsTrigger value="monthly">Mensal</TabsTrigger><TabsTrigger value="all">Geral</TabsTrigger></TabsList></Tabs>
        </div>

        {isLoading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : top3.length > 0 && (
          <div className="flex items-end justify-center gap-4 py-8">
            {[1, 0, 2].map((pos) => {
              const user = top3[pos];
              if (!user) return null;
              const Icon = podiumIcons[pos];
              return (
                <div key={pos} className={cn("text-center", pos === 0 && "order-2", pos === 1 && "order-1", pos === 2 && "order-3")}>
                  <div className={cn("w-20 h-20 rounded-full bg-gradient-to-br flex items-center justify-center mx-auto mb-2", podiumColors[pos])}>{user.avatar ? <img src={user.avatar} className="w-16 h-16 rounded-full" /> : <Icon className="w-8 h-8 text-white" />}</div>
                  <p className="font-bold">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.xp.toLocaleString()} XP</p>
                  <div className={cn("w-16 mx-auto mt-2 rounded-t-lg flex items-center justify-center text-white font-bold", pos === 0 ? "h-24 bg-amber-500" : pos === 1 ? "h-16 bg-gray-400" : "h-12 bg-amber-700")}>{pos + 1}º</div>
                </div>
              );
            })}
          </div>
        )}

        <FilterBar searchValue={filters.search as string || ""} onSearchChange={(v) => setFilter("search", v)} searchPlaceholder="Buscar usuário..." filters={[{ key: "level", label: "Nível mín.", type: "select", value: filters.level as string || "", options: [{ value: "", label: "Todos" }, { value: "5", label: "5+" }, { value: "10", label: "10+" }, { value: "20", label: "20+" }], onChange: (v) => setFilter("level", v || undefined) }]} onClearFilters={clearFilters} hasActiveFilters={hasActiveFilters} totalCount={sortedData.length} filteredCount={sortedData.length} />
        <div className="flex items-center gap-2"><Button variant="ghost" size="sm" onClick={() => toggleSort("xp")} className="gap-1">XP <SortIcon field="xp" /></Button><Button variant="ghost" size="sm" onClick={() => toggleSort("deliveries")} className="gap-1">Entregas <SortIcon field="deliveries" /></Button><Button variant="ghost" size="sm" onClick={() => toggleSort("streak")} className="gap-1">Streak <SortIcon field="streak" /></Button></div>

        <div className="space-y-2">{paginatedData.map((user, i) => {
          const rank = sortedData.indexOf(user) + 1;
          return (
            <div key={user.id} className="card-interactive flex items-center gap-4">
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-bold", rank <= 3 ? "bg-amber-100 text-amber-700" : "bg-muted")}>{rank}</div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">{user.avatar ? <img src={user.avatar} className="w-10 h-10 rounded-full" /> : <span className="text-lg font-bold">{user.name.charAt(0)}</span>}</div>
              <div className="flex-1"><p className="font-semibold">{user.name}</p><div className="flex items-center gap-2 text-sm text-muted-foreground"><Badge variant="outline">Nível {user.level}</Badge>{user.streak > 0 && <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-500" />{user.streak} dias</span>}</div></div>
              <div className="text-right"><p className="text-lg font-bold text-primary">{user.xp.toLocaleString()} XP</p><p className="text-sm text-muted-foreground">{user.deliveries} entregas</p></div>
            </div>
          );
        })}</div>

        {sortedData.length > 0 && <Pagination currentPage={currentPage} totalPages={totalPages} pageSize={pageSize} totalItems={sortedData.length} onPageChange={goToPage} onPageSizeChange={setPageSize} hasNextPage={hasNextPage} hasPrevPage={hasPrevPage} />}
      </div>
    </MainLayout>
  );
}
