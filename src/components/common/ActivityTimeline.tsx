import { motion } from "framer-motion";
import { CheckCircle2, Clock, Package, Truck, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useAuditLogs, AuditLog } from "@/hooks/security/useAuditLogs";

interface ActivityTimelineProps {
  recordId: string;
  tableName: string;
}

interface LogDataWithStatus {
  status?: string;
}

export function ActivityTimeline({ recordId, tableName }: ActivityTimelineProps) {
  const { data: logs = [], isLoading } = useAuditLogs({
    record_id: recordId,
    table_name: tableName,
    limit: 50,
  });

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhum histórico disponível</p>
      </div>
    );
  }

  const getStepIcon = (log: AuditLog) => {
    if (log.action === "INSERT") return <Package className="w-4 h-4" />;
    if (log.action === "DELETE") return <AlertCircle className="w-4 h-4" />;
    
    const newData = log.new_data as LogDataWithStatus | null;
    const status = newData?.status;
    
    if (status === "entregue" || status === "finalizada") return <CheckCircle2 className="w-4 h-4" />;
    if (status === "em_transito") return <Truck className="w-4 h-4" />;
    if (status === "ocorrencia") return <AlertCircle className="w-4 h-4" />;
    
    return <Clock className="w-4 h-4" />;
  };

  const getStepColor = (log: AuditLog) => {
    if (log.action === "INSERT") return "text-primary bg-primary/10 border-primary/20";
    if (log.action === "DELETE") return "text-destructive bg-destructive/10 border-destructive/20";
    
    const newData = log.new_data as LogDataWithStatus | null;
    const status = newData?.status;
    
    if (status === "entregue" || status === "finalizada") return "text-success bg-success/10 border-success/20";
    if (status === "ocorrencia") return "text-warning bg-warning/10 border-warning/20";
    
    return "text-muted-foreground bg-muted border-border";
  };

  const getActionTitle = (action: string) => {
    switch (action) {
      case "INSERT": return "Criado no Sistema";
      case "UPDATE": return "Atualização de Dados";
      case "DELETE": return "Excluído";
      default: return action;
    }
  };

  return (
    <div className="relative space-y-0 pb-4">
      {/* Vertical Line */}
      <div className="absolute left-[15px] top-4 bottom-4 w-px bg-border z-0" />

      {logs.map((log, index) => (
        <motion.div
          key={log.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="relative flex gap-4 pb-8 last:pb-0 z-10"
        >
          <div className={cn(
            "w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 shadow-sm",
            getStepColor(log)
          )}>
            {getStepIcon(log)}
          </div>
          <div className="flex-1 pt-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
              <h4 className="font-semibold text-sm text-foreground truncate">
                {getActionTitle(log.action)}
              </h4>
              <time className="text-[10px] text-muted-foreground font-medium uppercase whitespace-nowrap">
                {format(new Date(log.created_at), "dd MMM, HH:mm", { locale: ptBR })}
              </time>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {log.action === "INSERT" ? "Registro inserido na plataforma." : 
               `Alterações realizadas por ${log.user_id?.slice(0, 8) || "Sistema"}.`}
            </p>
            {log.action === "UPDATE" && log.new_data && (log.new_data as LogDataWithStatus).status && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted font-medium border border-border">
                  Status: {(log.new_data as LogDataWithStatus).status}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
