import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MentionUser {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface MentionResult {
  userId: string;
  displayName: string;
  startIndex: number;
  endIndex: number;
}

export function useMentions() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["mention-users", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 1) return [];
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url")
        .or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(5);
      
      if (error) throw error;
      return data as MentionUser[];
    },
    enabled: searchQuery.length >= 1 && showSuggestions,
  });

  const detectMention = useCallback((text: string, cursorPosition: number) => {
    // Find the last @ before cursor
    const textBeforeCursor = text.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    
    if (lastAtIndex === -1) {
      setShowSuggestions(false);
      setMentionStartIndex(null);
      setSearchQuery("");
      return;
    }

    // Check if @ is at start or after whitespace
    const charBeforeAt = lastAtIndex > 0 ? text[lastAtIndex - 1] : " ";
    if (!/\s/.test(charBeforeAt) && lastAtIndex !== 0) {
      setShowSuggestions(false);
      setMentionStartIndex(null);
      setSearchQuery("");
      return;
    }

    // Get the text after @
    const mentionText = textBeforeCursor.slice(lastAtIndex + 1);
    
    // Check if there's a space in the mention text (mention complete or cancelled)
    if (mentionText.includes(" ")) {
      setShowSuggestions(false);
      setMentionStartIndex(null);
      setSearchQuery("");
      return;
    }

    setMentionStartIndex(lastAtIndex);
    setSearchQuery(mentionText);
    setShowSuggestions(true);
    setSelectedIndex(0);
  }, []);

  const insertMention = useCallback((
    text: string,
    user: MentionUser,
    cursorPosition: number
  ): { newText: string; newCursorPosition: number } => {
    if (mentionStartIndex === null) {
      return { newText: text, newCursorPosition: cursorPosition };
    }

    const displayName = user.full_name || user.email;
    const beforeMention = text.slice(0, mentionStartIndex);
    const afterCursor = text.slice(cursorPosition);
    const mentionTag = `@${displayName} `;
    
    const newText = beforeMention + mentionTag + afterCursor;
    const newCursorPosition = mentionStartIndex + mentionTag.length;

    setShowSuggestions(false);
    setMentionStartIndex(null);
    setSearchQuery("");

    return { newText, newCursorPosition };
  }, [mentionStartIndex]);

  const extractMentions = useCallback((text: string): MentionResult[] => {
    const mentionRegex = /@([^\s@]+(?:\s+[^\s@]+)?)/g;
    const mentions: MentionResult[] = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push({
        userId: "", // Would need to resolve this from display name
        displayName: match[1],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }

    return mentions;
  }, []);

  const handleKeyDown = useCallback((
    e: React.KeyboardEvent,
    onSelect: (user: MentionUser) => void
  ) => {
    if (!showSuggestions || users.length === 0) return false;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % users.length);
        return true;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + users.length) % users.length);
        return true;
      case "Enter":
      case "Tab":
        e.preventDefault();
        onSelect(users[selectedIndex]);
        return true;
      case "Escape":
        e.preventDefault();
        setShowSuggestions(false);
        return true;
      default:
        return false;
    }
  }, [showSuggestions, users, selectedIndex]);

  const closeSuggestions = useCallback(() => {
    setShowSuggestions(false);
    setMentionStartIndex(null);
    setSearchQuery("");
  }, []);

  return {
    users,
    isLoading,
    showSuggestions,
    selectedIndex,
    searchQuery,
    detectMention,
    insertMention,
    extractMentions,
    handleKeyDown,
    closeSuggestions,
    setSelectedIndex,
  };
}
