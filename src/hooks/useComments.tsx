import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  user?: {
    email: string;
    full_name?: string;
  };
}

interface UseCommentsOptions {
  entityType: "ocorrencia" | "coleta" | "entrega" | "frete_interno";
  entityId: string;
}

export function useComments({ entityType, entityId }: UseCommentsOptions) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");

  const queryKey = ["comments", entityType, entityId];

  const { data: comments = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          id, content, created_at, user_id, entity_type, entity_id,
          profiles:user_id (email, full_name)
        `)
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Comment[];
    },
    enabled: !!entityId,
  });

  const addComment = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("Usuário não autenticado");
      
      const { data, error } = await supabase
        .from("comments")
        .insert({
          content,
          entity_type: entityType,
          entity_id: entityId,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setNewComment("");
      toast.success("Comentário adicionado");
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Comentário excluído");
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    addComment.mutate(newComment.trim());
  };

  return {
    comments,
    isLoading,
    newComment,
    setNewComment,
    addComment: handleSubmit,
    deleteComment: deleteComment.mutate,
    isAdding: addComment.isPending,
    isDeleting: deleteComment.isPending,
  };
}

export default useComments;
