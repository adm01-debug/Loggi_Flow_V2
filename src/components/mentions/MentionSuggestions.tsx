import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, User, AtSign } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { MentionUser } from "@/hooks/useMentions";

interface MentionSuggestionsProps {
  users: MentionUser[];
  isLoading: boolean;
  selectedIndex: number;
  onSelect: (user: MentionUser) => void;
  onHover: (index: number) => void;
  show: boolean;
  position?: { top: number; left: number };
}

export function MentionSuggestions({
  users,
  isLoading,
  selectedIndex,
  onSelect,
  onHover,
  show,
  position,
}: MentionSuggestionsProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  const getInitials = (email: string, name?: string | null) => {
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

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="absolute z-50 w-64 bg-popover border rounded-lg shadow-lg overflow-hidden"
          style={position ? { top: position.top, left: position.left } : { bottom: "100%", left: 0, marginBottom: 8 }}
        >
          <div className="px-3 py-2 border-b bg-muted/50 flex items-center gap-2">
            <AtSign className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Mencionar usuário</span>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-4 px-3 text-center text-sm text-muted-foreground">
              Nenhum usuário encontrado
            </div>
          ) : (
            <div ref={listRef} className="max-h-48 overflow-y-auto">
              {users.map((user, index) => (
                <button
                  key={user.id}
                  onClick={() => onSelect(user)}
                  onMouseEnter={() => onHover(index)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                    index === selectedIndex
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted"
                  )}
                >
                  <Avatar className="h-7 w-7">
                    {user.avatar_url && <AvatarImage src={user.avatar_url} />}
                    <AvatarFallback className="text-xs">
                      {getInitials(user.email, user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.full_name || user.email}
                    </p>
                    {user.full_name && (
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
