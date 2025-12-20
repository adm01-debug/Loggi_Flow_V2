import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface HistoryEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  status?: "completed" | "current" | "pending" | "error";
  user?: string;
  metadata?: Record<string, any>;
}

interface UseEntityHistoryOptions {
  entityType: "coleta" | "entrega" | "ocorrencia" | "frete_interno";
  entityId: string;
}

export function useEntityHistory({ entityType, entityId }: UseEntityHistoryOptions) {
  const queryKey = ["entity-history", entityType, entityId];

  const { data: history = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, action, old_data, new_data, created_at, user_id")
        .eq("table_name", entityType === "frete_interno" ? "fretes_internos" : `${entityType}s`)
        .eq("record_id", entityId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transformar em eventos de histórico
      return (data || []).map((log): HistoryEvent => {
        let title = "";
        let description = "";

        switch (log.action) {
          case "INSERT":
            title = "Registro criado";
            break;
          case "UPDATE":
            title = "Registro atualizado";
            // Detectar mudanças específicas
            if (log.old_data && log.new_data) {
              const changes = getChanges(log.old_data, log.new_data);
              if (changes.length > 0) {
                description = changes.join(", ");
              }
            }
            break;
          case "DELETE":
            title = "Registro excluído";
            break;
          default:
            title = log.action;
        }

        return {
          id: log.id,
          title,
          description,
          timestamp: log.created_at,
          status: log.action === "DELETE" ? "error" : "completed",
          metadata: log.new_data,
        };
      });
    },
    enabled: !!entityId,
  });

  return { history, isLoading };
}

// Helper para detectar mudanças
function getChanges(oldData: any, newData: any): string[] {
  const changes: string[] = [];
  const fieldLabels: Record<string, string> = {
    status: "Status",
    resolvida: "Resolvida",
    acao_tomada: "Ação tomada",
    data_previsao: "Data previsão",
    data_entrega: "Data entrega",
    motorista: "Motorista",
    placa_veiculo: "Placa",
  };

  for (const key of Object.keys(newData)) {
    if (oldData[key] !== newData[key] && fieldLabels[key]) {
      changes.push(`${fieldLabels[key]} alterado`);
    }
  }

  return changes;
}

export default useEntityHistory;
