import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/auth/useAuth";
import { toast } from "sonner";

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
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
    queryFn: async (): Promise<Comment[]> => {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch user profiles for comments
      const userIds = [...new Set((data || []).map((c) => c.user_id))];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", userIds);

      const profilesMap = new Map(
        (profiles || []).map((p) => [p.id, { email: p.email || "", full_name: p.full_name ?? undefined }])
      );

      return (data || []).map((comment) => ({
        ...comment,
        user: profilesMap.get(comment.user_id),
      })) as Comment[];
    },
    enabled: !!entityId,
  });

  const addComment = useMutation({
    mutationFn: async (content: string): Promise<Comment | null> => {
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
      return data as Comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setNewComment("");
      toast.success("Comentário adicionado!");
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string): Promise<void> => {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Comentário removido!");
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