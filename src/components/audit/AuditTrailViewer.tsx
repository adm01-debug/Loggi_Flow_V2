import { useState } from "react";
import { History, Plus, Pencil, Trash2, User, Calendar, ChevronDown, ChevronUp, FileText, Package, Truck, Building2, Users, AlertTriangle, Loader2, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { useAuditLogs, AuditLog, tableNameLabels, actionLabels } from "@/hooks/useAuditLogs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Pagination } from "@/components/common/Pagination";
import { FilterBar } from "@/components/common/FilterBar";
import { BulkActions, useSelection } from "@/components/common/BulkActions";
import { usePagination } from "@/hooks/usePagination";
import { useFilters } from "@/hooks/useFilters";
import { useSorting } from "@/hooks/useSorting";
import { useRealtime } from "@/hooks/useRealtime";
import { useExport } from "@/hooks/useExport";
import { useVirtualTable } from "@/hooks/useVirtualTable";

interface AuditTrailViewerProps { 
  recordId?: string; 
  tableName?: string; 
  showFilters?: boolean; 
  maxHeight?: string; 
}

export function AuditTrailViewer({ recordId, tableName, showFilters = true, maxHeight = "600px" }: AuditTrailViewerProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [actionFilter, setActionFilter] = useState("all");
  const [tableFilter, setTableFilter] = useState("all");
  const { exportToCSV } = useExport();

  const { data: logs = [], isLoading, refetch } = useAuditLogs({ 
    table_name: tableName || undefined, 
    record_id: recordId || undefined, 
    limit: 500 
  });

  useRealtime({ table: "audit_logs", onInsert: () => refetch() });

  const { filteredData, filters, setSearch, clearFilters, hasActiveFilters } = useFilters(logs, {
    search: { fields: ["table_name", "action", "record_id"] as (keyof AuditLog)[] }
  });

  // Apply additional filters
  const fullyFilteredData = filteredData.filter(log => {
    if (actionFilter !== "all" && log.action !== actionFilter) return false;
    if (tableFilter !== "all" && log.table_name !== tableFilter) return false;
    return true;
  });

  const { sortedData, toggleSort, getSortDirection } = useSorting(fullyFilteredData, { defaultKey: "created_at", defaultDirection: "desc" });
  const pagination = usePagination(sortedData, { initialPageSize: 20 });
  const { selectedIds, toggle, selectAll, clearSelection, isSelected } = useSelection(pagination.paginatedData);

  const toggleExpanded = (id: string) => { 
    const s = new Set(expandedIds); 
    s.has(id) ? s.delete(id) : s.add(id); 
    setExpandedIds(s); 
  };

  const getActionIcon = (action: string) => {
    switch (action) { 
      case "INSERT": return <Plus className="w-4 h-4" />; 
      case "UPDATE": return <Pencil className="w-4 h-4" />; 
      case "DELETE": return <Trash2 className="w-4 h-4" />; 
      default: return <History className="w-4 h-4" />; 
    }
  };

  const getActionColor = (action: string) => {
    switch (action) { 
      case "INSERT": return "bg-success/15 text-success"; 
      case "UPDATE": return "bg-info/15 text-info"; 
      case "DELETE": return "bg-destructive/15 text-destructive"; 
      default: return "bg-muted text-muted-foreground"; 
    }
  };

  const getTableIcon = (table: string) => {
    switch (table) { 
      case "coletas": return Package; 
      case "entregas": return Truck; 
      case "clientes": 
      case "fornecedores": return Building2; 
      case "transportadoras": return Truck; 
      case "user_levels": return Users; 
      case "ocorrencias": return AlertTriangle; 
      default: return FileText; 
    }
  };

  const SortIcon = ({ field }: { field: string }) => { 
    const dir = getSortDirection(field as keyof AuditLog); 
    if (!dir) return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />; 
    return dir === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />; 
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {showFilters && (
        <>
          <FilterBar 
            search={filters.search} 
            onSearchChange={setSearch} 
            searchPlaceholder="Buscar logs..."
            status={actionFilter}
            onStatusChange={setActionFilter}
            statusOptions={[
              { value: "INSERT", label: "Criação" }, 
              { value: "UPDATE", label: "Atualização" }, 
              { value: "DELETE", label: "Exclusão" }
            ]}
            statusLabel="Ação"
            extraFilters={[{
              key: "table_name",
              value: tableFilter,
              onChange: setTableFilter,
              options: Object.entries(tableNameLabels).map(([k, v]) => ({ value: k, label: v })),
              label: "Tabela"
            }]}
            hasActiveFilters={hasActiveFilters || actionFilter !== "all" || tableFilter !== "all"}
            onClearFilters={() => { clearFilters(); setActionFilter("all"); setTableFilter("all"); }}
            totalFiltered={sortedData.length}
            totalOriginal={logs.length}
          />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => toggleSort("created_at")} className="gap-1">
              Data <SortIcon field="created_at" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => toggleSort("action")} className="gap-1">
              Ação <SortIcon field="action" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportToCSV(sortedData as unknown as Record<string, unknown>[], { filename: "audit-logs" })}>
              Exportar CSV
            </Button>
          </div>
        </>
      )}

      {selectedIds.length > 0 && (
        <BulkActions 
          selectedIds={selectedIds} 
          totalCount={pagination.paginatedData.length} 
          onClearSelection={clearSelection} 
          onSelectAll={selectAll} 
          actions={[]} 
        />
      )}

      <div className="space-y-2" style={{ maxHeight, overflowY: "auto" }}>
        <AnimatePresence>
          {pagination.paginatedData.map((log, i) => {
            const TableIcon = getTableIcon(log.table_name);
            const isExpanded = expandedIds.has(log.id);
            return (
              <motion.div 
                key={log.id} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }} 
                transition={{ delay: i * 0.02 }}
                className={cn("border rounded-lg p-3 bg-card hover:bg-muted/50 transition-colors", isSelected(log.id) && "ring-2 ring-primary")}
              >
                <div className="flex items-start gap-3">
                  <Checkbox checked={isSelected(log.id)} onCheckedChange={() => toggle(log.id)} className="mt-1" />
                  <div className={cn("p-2 rounded-lg shrink-0", getActionColor(log.action))}>{getActionIcon(log.action)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("px-2 py-0.5 rounded text-xs font-medium", getActionColor(log.action))}>
                        {actionLabels[log.action] || log.action}
                      </span>
                      <span className="flex items-center gap-1 text-sm">
                        <TableIcon className="w-3 h-3" />
                        {tableNameLabels[log.table_name] || log.table_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {log.user_id?.slice(0, 8) || "Sistema"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(log.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                      </span>
                      <span className="font-mono text-xs">ID: {log.record_id.slice(0, 8)}</span>
                    </div>
                  </div>
                  {(log.old_data || log.new_data) && (
                    <Button variant="ghost" size="sm" onClick={() => toggleExpanded(log.id)}>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
                {isExpanded && (log.old_data || log.new_data) && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }} 
                    animate={{ height: "auto", opacity: 1 }} 
                    exit={{ height: 0, opacity: 0 }} 
                    className="mt-3 pt-3 border-t"
                  >
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      {log.old_data && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Antes:</p>
                          <pre className="bg-muted p-2 rounded overflow-x-auto">{JSON.stringify(log.old_data, null, 2)}</pre>
                        </div>
                      )}
                      {log.new_data && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Depois:</p>
                          <pre className="bg-muted p-2 rounded overflow-x-auto">{JSON.stringify(log.new_data, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {sortedData.length === 0 && (
        <div className="flex flex-col items-center py-12">
          <History className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Nenhum log encontrado</p>
        </div>
      )}
      
      {sortedData.length > 0 && (
        <Pagination 
          currentPage={pagination.currentPage} 
          totalPages={pagination.totalPages} 
          pageSize={pagination.pageSize} 
          totalItems={sortedData.length} 
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
  );
}