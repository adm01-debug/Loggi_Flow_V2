import * as React from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, Package, Truck, Users, AlertTriangle, FileText, Settings, 
  BarChart3, Trophy, Building2, PackageSearch, Command as CommandIcon,
  Loader2, ArrowRight
} from "lucide-react";
import { 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList, 
  CommandSeparator,
  CommandShortcut
} from "@/components/ui/command";
import { useGlobalSearch, getSearchTypeLabel, getSearchTypeColor } from "@/hooks/useGlobalSearch";
import { Badge } from "@/components/ui/badge";

export function SearchCommand() {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const { 
    query, 
    setQuery, 
    results, 
    isSearching, 
    totalResults,
    hasResults 
  } = useGlobalSearch({ minQueryLength: 2 });

  // Atalho Ctrl+K para abrir
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (url: string) => {
    setOpen(false);
    navigate(url);
    setQuery(""); // Clear for next time
  };

  const groupedResults = React.useMemo(() => {
    return results.reduce((acc, result) => {
      const typeLabel = getSearchTypeLabel(result.type);
      if (!acc[typeLabel]) {
        acc[typeLabel] = [];
      }
      acc[typeLabel].push(result);
      return acc;
    }, {} as Record<string, typeof results>);
  }, [results]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group relative flex h-10 w-full items-center justify-start rounded-[0.5rem] border border-input bg-background px-4 py-2 text-sm font-normal text-muted-foreground shadow-sm transition-all hover:bg-accent hover:text-accent-foreground sm:pr-12 md:w-40 lg:w-64"
      >
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <span className="inline-flex">Buscar...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-7 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <CommandInput 
            placeholder="Busque entregas, clientes, páginas..." 
            value={query}
            onValueChange={setQuery}
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
          {isSearching && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground opacity-50" />
          )}
        </div>
        <CommandList className="max-h-[450px]">
          <CommandEmpty>
            {query.length < 2 ? (
              <div className="py-6 text-center">
                <CommandIcon className="mx-auto h-8 w-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Digite pelo menos 2 caracteres para pesquisar em todo o LogiFlow.
                </p>
              </div>
            ) : (
              "Nenhum resultado encontrado."
            )}
          </CommandEmpty>

          {Object.entries(groupedResults).map(([category, items]) => (
            <CommandGroup key={category} heading={category}>
              {items.map((result) => {
                const Icon = result.icon || Package;
                return (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    value={result.title}
                    onSelect={() => handleSelect(result.url)}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${getSearchTypeColor(result.type)}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{result.title}</span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {result.subtitle}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.status && (
                        <Badge variant="outline" className="text-[10px] uppercase font-bold px-1.5 py-0">
                          {result.status}
                        </Badge>
                      )}
                      <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-aria-selected:opacity-100 transition-opacity" />
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
          
          <CommandSeparator />
          <CommandGroup heading="Atalhos">
            <CommandItem onSelect={() => handleSelect("/")}>
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Dashboard Principal</span>
              <CommandShortcut>G D</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/perfil")}>
              <Users className="mr-2 h-4 w-4" />
              <span>Meu Perfil</span>
              <CommandShortcut>G P</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => handleSelect("/configuracoes")}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configurações</span>
              <CommandShortcut>G S</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
        <div className="flex items-center justify-between border-t px-4 py-3 text-[10px] text-muted-foreground">
          <div className="flex gap-4">
            <span><kbd className="rounded border bg-muted px-1">↑↓</kbd> Navegar</span>
            <span><kbd className="rounded border bg-muted px-1">↵</kbd> Selecionar</span>
            <span><kbd className="rounded border bg-muted px-1">esc</kbd> Fechar</span>
          </div>
          {hasResults && (
            <span>{totalResults} resultados encontrados</span>
          )}
        </div>
      </CommandDialog>
    </>
  );
}

export default SearchCommand;
