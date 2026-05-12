import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type TableName = keyof Database['public']['Tables'];

export function useSoftDelete(tableName: TableName, queryKeysToInvalidate: string[][]) {
  const queryClient = useQueryClient();

  const softDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(tableName as any)
        .update({ deleted_at: new Date().toISOString() } as any)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryKeysToInvalidate.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
      toast.success("Item movido para a lixeira");
    },
    onError: (error) => {
      console.error(`Error soft deleting from ${tableName}:`, error);
      toast.error("Erro ao remover item");
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(tableName as any)
        .update({ deleted_at: null } as any)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryKeysToInvalidate.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
      toast.success("Item restaurado com sucesso");
    },
    onError: (error) => {
      console.error(`Error restoring to ${tableName}:`, error);
      toast.error("Erro ao restaurar item");
    },
  });

  return {
    softDelete: softDeleteMutation.mutate,
    isDeleting: softDeleteMutation.isPending,
    restore: restoreMutation.mutate,
    isRestoring: restoreMutation.isPending,
  };
}
