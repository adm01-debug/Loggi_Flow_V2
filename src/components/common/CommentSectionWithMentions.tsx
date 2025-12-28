import { useState, useRef, useCallback, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Send, Trash2, Loader2, MessageSquare, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useMentions, MentionUser } from "@/hooks/useMentions";
import { MentionSuggestions } from "@/components/mentions/MentionSuggestions";
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

// Helper to render comment content with highlighted mentions
function renderContentWithMentions(content: string) {
  const mentionRegex = /@([^\s@]+(?:\s+[^\s@]+)?)/g;
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }
    // Add mention badge
    parts.push(
      <Badge 
        key={match.index} 
        variant="secondary" 
        className="text-xs font-normal px-1.5 py-0 mx-0.5"
      >
        @{match[1]}
      </Badge>
    );
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts;
}

export function CommentSectionWithMentions({
  comments,
  isLoading,
  newComment,
  onNewCommentChange,
  onSubmit,
  onDelete,
  isAdding,
  isDeleting,
  placeholder = "Adicione um comentário... Use @ para mencionar",
  maxHeight = "300px",
}: CommentSectionProps) {
  const { user } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);

  const {
    users,
    isLoading: mentionsLoading,
    showSuggestions,
    selectedIndex,
    detectMention,
    insertMention,
    handleKeyDown: handleMentionKeyDown,
    closeSuggestions,
    setSelectedIndex,
  } = useMentions();

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

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const newCursor = e.target.selectionStart || 0;
    onNewCommentChange(newValue);
    setCursorPosition(newCursor);
    detectMention(newValue, newCursor);
  }, [onNewCommentChange, detectMention]);

  const handleSelectMention = useCallback((selectedUser: MentionUser) => {
    const { newText, newCursorPosition } = insertMention(
      newComment,
      selectedUser,
      cursorPosition
    );
    onNewCommentChange(newText);
    
    // Set cursor after mention
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    });
  }, [newComment, cursorPosition, insertMention, onNewCommentChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // First check for mention navigation
    if (handleMentionKeyDown(e, handleSelectMention)) {
      return;
    }

    // Then check for submit shortcut
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleClick = () => {
    if (textareaRef.current) {
      const pos = textareaRef.current.selectionStart || 0;
      setCursorPosition(pos);
      detectMention(newComment, pos);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeSuggestions();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeSuggestions]);

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
                "group flex gap-3 p-3 rounded-lg",
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
                  {renderContentWithMentions(comment.content)}
                </p>
              </div>
              {comment.user_id === user?.id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
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

      {/* Input de novo comentário com mentions */}
      <div ref={containerRef} className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              value={newComment}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onClick={handleClick}
              placeholder={placeholder}
              className="min-h-[80px] resize-none pr-10"
              disabled={isAdding}
            />
            <AtSign className="absolute right-3 top-3 h-4 w-4 text-muted-foreground/50" />
            
            <MentionSuggestions
              users={users}
              isLoading={mentionsLoading}
              selectedIndex={selectedIndex}
              onSelect={handleSelectMention}
              onHover={setSelectedIndex}
              show={showSuggestions}
            />
          </div>
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
        <p className="text-xs text-muted-foreground mt-1">
          Use <kbd className="px-1 py-0.5 bg-muted rounded text-xs">@</kbd> para mencionar • <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+Enter</kbd> para enviar
        </p>
      </div>
    </div>
  );
}

export default CommentSectionWithMentions;
