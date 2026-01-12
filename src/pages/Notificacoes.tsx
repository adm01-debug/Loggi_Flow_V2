import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Check, Trash2, CheckCheck, Loader2, AlertCircle, Package, Truck, AlertTriangle, Info, LucideIcon } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Pagination } from "@/components/common/Pagination";
import { FilterBar } from "@/components/common/FilterBar";
import { BulkActions, useSelection } from "@/components/common/BulkActions";
import { usePagination } from "@/hooks/usePagination";
import { useFilters, FilterConfig } from "@/hooks/useFilters";
import { useRealtime } from "@/hooks/useRealtime";

interface Notification { id: string; title: string; message: string; type: string; read: boolean; created_at: string; user_id: string; }

const typeConfig: Record<string, { icon: LucideIcon; color: string }> = {
  info: { icon: Info, color: "text-blue-500" },
  success: { icon: Check, color: "text-green-500" },
  warning: { icon: AlertTriangle, color: "text-yellow-500" },
  error: { icon: AlertCircle, color: "text-red-500" },
  coleta: { icon: Package, color: "text-purple-500" },
  entrega: { icon: Truck, color: "text-cyan-500" },
};

const filterConfig: FilterConfig<Notification> = {
  search: {
    fields: ["title", "message"],
    placeholder: "Buscar..."
  }
};

export default function Notificacoes() {
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter] = useState("all");
  const [readFilter, setReadFilter] = useState("all");

  const { data: list = [], isLoading, error, refetch } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data as Notification[];
    },
  });

  useRealtime({ table: "notifications", onInsert: () => refetch(), onUpdate: () => refetch(), onDelete: () => refetch() });

  // Apply custom filters
  const customFiltered = list.filter(n => {
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    if (readFilter === "unread" && n.read) return false;
    if (readFilter === "read" && !n.read) return false;
    return true;
  });

  const { filteredData, filters, setSearch, clearFilters, hasActiveFilters } = useFilters(customFiltered, filterConfig);
  const pagination = usePagination(filteredData, { initialPageSize: 15 });
  const { selectedIds, toggle, selectAll, clearSelection, isSelected } = useSelection(pagination.paginatedData);

  const markReadMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllReadMut = useMutation({
    mutationFn: async () => { const { data: { user } } = await supabase.auth.getUser(); if (!user) return; const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); toast.success("Todas marcadas como lidas!"); },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("notifications").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications"] }); toast.success("Excluída!"); },
  });

  const bulkMarkRead = async (ids: string[]) => {
    const { error } = await supabase.from("notifications").update({ read: true }).in("id", ids);
    if (error) toast.error("Erro"); else { qc.invalidateQueries({ queryKey: ["notifications"] }); clearSelection(); toast.success(`${ids.length} marcada(s) como lida(s)`); }
  };

  const bulkDelete = async (ids: string[]) => {
    const { error } = await supabase.from("notifications").delete().in("id", ids);
    if (error) toast.error("Erro"); else { qc.invalidateQueries({ queryKey: ["notifications"] }); clearSelection(); toast.success(`${ids.length} excluída(s)`); }
  };

  const stats = { total: list.length, unread: list.filter(n => !n.read).length };

  const handleClearFilters = () => {
    clearFilters();
    setTypeFilter("all");
    setReadFilter("all");
  };

  if (error) return <MainLayout><div className="flex flex-col items-center py-12"><AlertCircle className="w-12 h-12 text-destructive mb-4" /><p>Erro: {(error as Error).message}</p></div></MainLayout>;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><h1 className="text-display text-foreground flex items-center gap-3"><div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10"><Bell className="w-6 h-6 text-primary" /></div>Notificações</h1><p className="text-muted-foreground mt-1">{stats.unread} não lida(s) de {stats.total}</p></div>
          <Button variant="outline" onClick={() => markAllReadMut.mutate()} disabled={stats.unread === 0}><CheckCheck className="w-4 h-4 mr-2" />Marcar todas como lidas</Button>
        </div>

        <FilterBar 
          search={filters.search} 
          onSearchChange={setSearch} 
          searchPlaceholder="Buscar..." 
          extraFilters={[
            { key: "type", label: "Tipo", value: typeFilter, options: Object.keys(typeConfig).map(t => ({ value: t, label: t })), onChange: setTypeFilter },
            { key: "read", label: "Status", value: readFilter, options: [{ value: "unread", label: "Não lidas" }, { value: "read", label: "Lidas" }], onChange: setReadFilter }
          ]} 
          onClearFilters={handleClearFilters} 
          hasActiveFilters={hasActiveFilters || typeFilter !== "all" || readFilter !== "all"} 
          totalFiltered={filteredData.length} 
          totalOriginal={list.length} 
        />

        {selectedIds.length > 0 && <BulkActions selectedIds={selectedIds} totalCount={pagination.paginatedData.length} onClearSelection={clearSelection} onSelectAll={selectAll} actions={[{ id: "read", label: "Marcar Lidas", icon: Check, onClick: bulkMarkRead }, { id: "delete", label: "Excluir", icon: Trash2, variant: "destructive", onClick: bulkDelete }]} />}

        {isLoading && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}

        {!isLoading && <div className="space-y-2">{pagination.paginatedData.map((n) => { const config = typeConfig[n.type] || typeConfig.info; const Icon = config.icon; return (
          <div key={n.id} className={cn("card-interactive flex items-start gap-3", !n.read && "bg-primary/5 border-primary/20", isSelected(n.id) && "ring-2 ring-primary")} onClick={() => !n.read && markReadMut.mutate(n.id)}>
            <Checkbox checked={isSelected(n.id)} onCheckedChange={() => toggle(n.id)} onClick={(e) => e.stopPropagation()} />
            <div className={cn("p-2 rounded-lg", n.read ? "bg-muted" : "bg-primary/10")}><Icon className={cn("w-5 h-5", config.color)} /></div>
            <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><p className={cn("font-medium", !n.read && "font-semibold")}>{n.title}</p>{!n.read && <Badge variant="secondary" className="text-xs">Nova</Badge>}</div><p className="text-sm text-muted-foreground line-clamp-2">{n.message}</p><p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}</p></div>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); deleteMut.mutate(n.id); }}><Trash2 className="w-4 h-4 text-muted-foreground" /></Button>
          </div>
        ); })}</div>}

        {!isLoading && filteredData.length === 0 && <div className="card-base flex flex-col items-center py-12"><Bell className="w-12 h-12 text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">Nenhuma notificação</p></div>}
        {!isLoading && filteredData.length > 0 && (
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