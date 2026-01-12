/**
 * Componente de Input de Busca com Histórico
 * 
 * @module components/common/SearchInputWithHistory
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Loader2, Clock, Trash2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface SearchInputWithHistoryProps {
  value?: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  debounceMs?: number;
  className?: string;
  showClear?: boolean;
  autoFocus?: boolean;
  historyKey?: string;
  maxHistoryItems?: number;
  showSuggestions?: boolean;
  suggestions?: string[];
}

export function SearchInputWithHistory({
  value: externalValue,
  onChange,
  onSearch,
  placeholder = 'Buscar...',
  isLoading = false,
  debounceMs = 300,
  className,
  showClear = true,
  autoFocus = false,
  historyKey = 'search_history',
  maxHistoryItems = 10,
  showSuggestions = true,
  suggestions = [],
}: SearchInputWithHistoryProps) {
  const [internalValue, setInternalValue] = useState(externalValue ?? '');
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useLocalStorage<string[]>(historyKey, []);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincronizar valor externo
  useEffect(() => {
    if (externalValue !== undefined) {
      setInternalValue(externalValue);
    }
  }, [externalValue]);

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (internalValue !== externalValue) {
        onChange(internalValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [internalValue, debounceMs, onChange, externalValue]);

  // Adicionar ao histórico
  const addToHistory = useCallback((term: string) => {
    if (!term.trim()) return;
    
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== term.toLowerCase());
      return [term, ...filtered].slice(0, maxHistoryItems);
    });
  }, [setHistory, maxHistoryItems]);

  // Remover do histórico
  const removeFromHistory = useCallback((term: string) => {
    setHistory((prev) => prev.filter((item) => item !== term));
  }, [setHistory]);

  // Limpar histórico
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, [setHistory]);

  // Selecionar item do histórico
  const selectHistoryItem = useCallback((term: string) => {
    setInternalValue(term);
    onChange(term);
    onSearch?.(term);
    addToHistory(term);
    setIsOpen(false);
  }, [onChange, onSearch, addToHistory]);

  // Limpar busca
  const handleClear = () => {
    setInternalValue('');
    onChange('');
    inputRef.current?.focus();
  };

  // Submeter busca
  const handleSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && internalValue.trim()) {
      addToHistory(internalValue.trim());
      onSearch?.(internalValue.trim());
      setIsOpen(false);
    }
  };

  // Filtrar histórico baseado no valor atual
  const filteredHistory = internalValue
    ? history.filter((item) => 
        item.toLowerCase().includes(internalValue.toLowerCase()) &&
        item.toLowerCase() !== internalValue.toLowerCase()
      )
    : history;

  // Filtrar sugestões
  const filteredSuggestions = internalValue
    ? suggestions.filter((item) =>
        item.toLowerCase().includes(internalValue.toLowerCase()) &&
        item.toLowerCase() !== internalValue.toLowerCase()
      )
    : [];

  const hasContent = filteredHistory.length > 0 || filteredSuggestions.length > 0;

  return (
    <Popover open={isOpen && hasContent} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className={cn('relative', className)}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={internalValue}
            onChange={(e) => {
              setInternalValue(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleSubmit}
            placeholder={placeholder}
            className="pl-10 pr-10"
            autoFocus={autoFocus}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {showClear && internalValue && !isLoading && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Limpar busca</span>
              </Button>
            )}
          </div>
        </div>
      </PopoverTrigger>

      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] p-0" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-[300px] overflow-y-auto">
          {/* Histórico de Buscas */}
          {filteredHistory.length > 0 && (
            <div className="p-2">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Buscas recentes
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                  onClick={clearHistory}
                >
                  Limpar
                </Button>
              </div>
              
              <div className="space-y-0.5">
                <AnimatePresence>
                  {filteredHistory.map((item, index) => (
                    <motion.div
                      key={item}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 group cursor-pointer"
                      onClick={() => selectHistoryItem(item)}
                    >
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="flex-1 text-sm truncate">{item}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromHistory(item);
                        }}
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Separador */}
          {filteredHistory.length > 0 && filteredSuggestions.length > 0 && (
            <div className="border-t border-border" />
          )}

          {/* Sugestões */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="p-2">
              <span className="text-xs font-medium text-muted-foreground px-2 py-1 flex items-center gap-1">
                <Search className="h-3 w-3" />
                Sugestões
              </span>
              
              <div className="space-y-0.5">
                {filteredSuggestions.slice(0, 5).map((item, index) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer"
                    onClick={() => selectHistoryItem(item)}
                  >
                    <ArrowRight className="h-3.5 w-3.5 text-primary" />
                    <span className="flex-1 text-sm truncate">{item}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default SearchInputWithHistory;
