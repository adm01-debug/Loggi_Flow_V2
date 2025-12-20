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

  // Comments table doesn't exist yet - this hook is prepared for future implementation
  const { data: comments = [], isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<Comment[]> => {
      // TODO: Create comments table in database
      // For now, return empty array as the table doesn't exist
      console.warn("Comments table not yet implemented in database");
      return [];
    },
    enabled: !!entityId,
  });

  const addComment = useMutation({
    mutationFn: async (content: string): Promise<Comment | null> => {
      if (!user) throw new Error("Usuário não autenticado");
      
      // TODO: Implement when comments table is created
      console.warn("Comments table not yet implemented");
      toast.error("Funcionalidade de comentários ainda não disponível");
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setNewComment("");
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string): Promise<void> => {
      // TODO: Implement when comments table is created
      console.warn("Comments table not yet implemented");
      toast.error("Funcionalidade de comentários ainda não disponível");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
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
