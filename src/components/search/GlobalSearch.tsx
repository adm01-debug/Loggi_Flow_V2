import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Package, Truck, Users, Building2, AlertCircle, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useGlobalSearch, getSearchTypeLabel, getSearchTypeColor } from '@/hooks/useGlobalSearch';
import { motion, AnimatePresence } from 'framer-motion';

const typeIcons = {
  entrega: Truck,
  coleta: Package,
  cliente: Users,
  fornecedor: Building2,
  transportadora: Truck,
  ocorrencia: AlertCircle,
  page: Search,
};


export function GlobalSearch() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    query,
    setQuery,
    results,
    hasResults,
    isSearching,
    isOpen,
    setIsOpen,
    clearSearch,
  } = useGlobalSearch();

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (event.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setIsOpen]);

  const handleResultClick = (url: string, id: string) => {
    navigate(`${url}?highlight=${id}`);
    clearSearch();
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, typeof results>);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Buscar entregas, coletas, clientes... (⌘K)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10 bg-background/50 border-border/50 focus:bg-background transition-colors"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={clearSearch}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && isSearching && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50"
          >
            {hasResults ? (
              <ScrollArea className="max-h-[400px]">
                <div className="p-2">
                  {Object.entries(groupedResults).map(([type, items], groupIndex) => {
                    const SectionIcon = typeIcons[type as keyof typeof typeIcons] || Package;
                    return (
                      <div key={type}>
                        {groupIndex > 0 && <Separator className="my-2" />}
                        <div className="px-2 py-1 mb-1">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                            <SectionIcon className="w-3 h-3" />
                            {getSearchTypeLabel(type as keyof typeof typeIcons)}s ({items.length})
                          </span>
                        </div>
                        {items.map((result) => (
                          <button
                            key={result.id}
                            onClick={() => handleResultClick(result.url, result.id)}
                            className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors text-left group"
                          >
                            <Badge variant="secondary" className={`shrink-0 ${getSearchTypeColor(result.type)}`}>
                              {getSearchTypeLabel(result.type).slice(0, 3)}
                            </Badge>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {result.title}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {result.subtitle}
                              </p>
                            </div>
                            {result.status && (
                              <Badge variant="outline" className="text-xs shrink-0">
                                {result.status.replace(/_/g, ' ')}
                              </Badge>
                            )}
                            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="p-6 text-center">
                <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum resultado para "{query}"
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tente buscar por número, endereço ou nome
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
