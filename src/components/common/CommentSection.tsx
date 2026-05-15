import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Send, Trash2, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user?: {
    email: string;
    full_name?: string;
  };
}

interface CommentSectionProps {
  comments: Comment[];
  isLoading: boolean;
  newComment: string;
  onNewCommentChange: (value: string) => void;
  onSubmit: () => void;
  onDelete: (commentId: string) => void;
  isAdding: boolean;
  isDeleting: boolean;
  placeholder?: string;
  maxHeight?: string;
}

export function CommentSection({
  comments,
  isLoading,
  newComment,
  onNewCommentChange,
  onSubmit,
  onDelete,
  isAdding,
  isDeleting,
  placeholder = "Adicione um comentário...",
  maxHeight = "300px",
}: CommentSectionProps) {
  const { user } = useAuth();

  const getInitials = (email: string, name?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSubmit();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Lista de comentários */}
      <div
        className={cn("space-y-3 overflow-y-auto pr-2")}
        style={{ maxHeight }}
      >
        {comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Nenhum comentário ainda</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={cn(
                "flex gap-3 p-3 rounded-lg",
                comment.user_id === user?.id
                  ? "bg-primary/5 ml-8"
                  : "bg-muted/50 mr-8"
              )}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="text-xs">
                  {getInitials(
                    comment.user?.email || "",
                    comment.user?.full_name
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium truncate">
                    {comment.user?.full_name || comment.user?.email}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>
              {comment.user_id === user?.id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:text-destructive"
                  onClick={() => onDelete(comment.id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Input de novo comentário */}
      <div className="flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => onNewCommentChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[80px] resize-none"
          disabled={isAdding}
        />
        <Button
          onClick={onSubmit}
          disabled={!newComment.trim() || isAdding}
          className="self-end"
        >
          {isAdding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Pressione Ctrl+Enter para enviar
      </p>
    </div>
  );
}

export default CommentSection;
