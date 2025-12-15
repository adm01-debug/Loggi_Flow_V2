import { useState } from "react";
import { 
  History, 
  Plus, 
  Pencil, 
  Trash2, 
  User, 
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  FileText,
  Package,
  Truck,
  Building2,
  Users,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { 
  useAuditLogs, 
  AuditLog, 
  tableNameLabels, 
  actionLabels,
  fieldNameLabels,
} from "@/hooks/useAuditLogs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AuditTrailViewerProps {
  recordId?: string;
  tableName?: string;
  showFilters?: boolean;
  maxHeight?: string;
}

export function AuditTrailViewer({ 
  recordId, 
  tableName, 
  showFilters = true,
  maxHeight = "600px",
}: AuditTrailViewerProps) {
  const [filters, setFilters] = useState({
    table_name: tableName || '',
    action: '' as '' | 'INSERT' | 'UPDATE' | 'DELETE',
    record_id: recordId || '',
  });
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data: logs = [], isLoading } = useAuditLogs({
    table_name: filters.table_name || undefined,
    action: filters.action || undefined,
    record_id: filters.record_id || undefined,
    limit: 200,
  });

  const toggleExpanded = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'INSERT':
        return <Plus className="w-4 h-4" />;
      case 'UPDATE':
        return <Pencil className="w-4 h-4" />;
      case 'DELETE':
        return <Trash2 className="w-4 h-4" />;
      default:
        return <History className="w-4 h-4" />;
    }
  };

  const getActionStyles = (action: string) => {
    switch (action) {
      case 'INSERT':
        return {
          bg: 'bg-success/10',
          text: 'text-success',
          border: 'border-success/30',
        };
      case 'UPDATE':
        return {
          bg: 'bg-info/10',
          text: 'text-info',
          border: 'border-info/30',
        };
      case 'DELETE':
        return {
          bg: 'bg-destructive/10',
          text: 'text-destructive',
          border: 'border-destructive/30',
        };
      default:
        return {
          bg: 'bg-muted',
          text: 'text-muted-foreground',
          border: 'border-border',
        };
    }
  };

  const getTableIcon = (table: string) => {
    switch (table) {
      case 'coletas':
        return Package;
      case 'entregas':
        return Truck;
      case 'fornecedores':
      case 'clientes':
        return Building2;
      case 'transportadoras':
        return Truck;
      case 'ocorrencias':
        return AlertTriangle;
      default:
        return FileText;
    }
  };

  const formatFieldValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const renderChangedFields = (log: AuditLog) => {
    if (!log.changed_fields || log.changed_fields.length === 0) return null;

    return (
      <div className="mt-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Campos alterados:</p>
        <div className="space-y-1">
          {log.changed_fields.map((field) => {
            const oldValue = log.old_data?.[field];
            const newValue = log.new_data?.[field];
            const fieldLabel = fieldNameLabels[field] || field;

            return (
              <div 
                key={field} 
                className="flex items-start gap-2 text-xs p-2 rounded bg-muted/50"
              >
                <span className="font-medium min-w-[120px] text-foreground">
                  {fieldLabel}:
                </span>
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-destructive line-through">
                    {formatFieldValue(oldValue)}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-success">
                    {formatFieldValue(newValue)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex flex-wrap gap-3 p-4 bg-muted/30 rounded-lg border border-border">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>
          <Select
            value={filters.table_name}
            onValueChange={(value) => setFilters(f => ({ ...f, table_name: value }))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todas as tabelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as tabelas</SelectItem>
              {Object.entries(tableNameLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.action}
            onValueChange={(value) => setFilters(f => ({ ...f, action: value as any }))}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Todas as ações" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as ações</SelectItem>
              <SelectItem value="INSERT">Criação</SelectItem>
              <SelectItem value="UPDATE">Atualização</SelectItem>
              <SelectItem value="DELETE">Exclusão</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="ID do registro..."
            value={filters.record_id}
            onChange={(e) => setFilters(f => ({ ...f, record_id: e.target.value }))}
            className="w-[200px]"
          />
        </div>
      )}

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <History className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground">Nenhum registro encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            O histórico de alterações aparecerá aqui
          </p>
        </div>
      ) : (
        <ScrollArea style={{ maxHeight }}>
          <div className="space-y-2 pr-4">
            <AnimatePresence mode="popLayout">
              {logs.map((log, index) => {
                const styles = getActionStyles(log.action);
                const TableIcon = getTableIcon(log.table_name);
                const isExpanded = expandedIds.has(log.id);

                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={cn(
                      "rounded-lg border p-4 transition-all",
                      styles.border,
                      isExpanded && "bg-muted/20"
                    )}
                  >
                    <div 
                      className="flex items-start gap-3 cursor-pointer"
                      onClick={() => toggleExpanded(log.id)}
                    >
                      {/* Action Badge */}
                      <div className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-lg shrink-0",
                        styles.bg
                      )}>
                        <span className={styles.text}>
                          {getActionIcon(log.action)}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn(
                            "px-2 py-0.5 text-xs font-medium rounded",
                            styles.bg,
                            styles.text
                          )}>
                            {actionLabels[log.action] || log.action}
                          </span>
                          <span className="flex items-center gap-1 text-sm font-medium">
                            <TableIcon className="w-3.5 h-3.5" />
                            {tableNameLabels[log.table_name] || log.table_name}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {log.user_name || log.user_email || 'Sistema'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(log.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                          </span>
                        </div>

                        {log.action === 'UPDATE' && log.changed_fields && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {log.changed_fields.length} campo(s) alterado(s)
                          </p>
                        )}
                      </div>

                      {/* Expand Button */}
                      <Button variant="ghost" size="icon" className="shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-4 border-t border-border">
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-muted-foreground">ID do Registro:</span>
                                <p className="font-mono text-foreground">{log.record_id}</p>
                              </div>
                              {log.user_email && (
                                <div>
                                  <span className="text-muted-foreground">Email:</span>
                                  <p className="text-foreground">{log.user_email}</p>
                                </div>
                              )}
                            </div>

                            {log.action === 'UPDATE' && renderChangedFields(log)}

                            {log.action === 'INSERT' && log.new_data && (
                              <div className="mt-3">
                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                  Dados inseridos:
                                </p>
                                <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto max-h-[200px]">
                                  {JSON.stringify(log.new_data, null, 2)}
                                </pre>
                              </div>
                            )}

                            {log.action === 'DELETE' && log.old_data && (
                              <div className="mt-3">
                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                  Dados excluídos:
                                </p>
                                <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto max-h-[200px]">
                                  {JSON.stringify(log.old_data, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
