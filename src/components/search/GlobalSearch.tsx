import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  Calculator,
  Calendar,
  CreditCard,
  Settings,
  Smile,
  User,
  Truck,
  Package,
  Users,
  Building2,
  AlertCircle,
  Search,
  Plus,
  Moon,
  Sun,
  Bot,
  Activity,
  LogOut,
  Map,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";

export function GlobalSearch() {
  const navigate = useNavigate();
  const { user, signOut, isAdmin } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const {
    query,
    setQuery,
    results,
    isOpen,
    setIsOpen,
    clearSearch,
  } = useGlobalSearch();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setIsOpen]);

  const handleCommand = (callback: () => void) => {
    callback();
    setIsOpen(false);
    clearSearch();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground border rounded-md hover:bg-accent transition-colors w-full max-w-[200px] md:max-w-[300px]"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Busca rápida...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <CommandInput 
          placeholder="Busque entregas, coletas ou digite um comando..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          
          {query.length > 0 && results.length > 0 && (
            <CommandGroup heading="Resultados da Busca">
              {results.map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => handleCommand(() => navigate(`${result.url}?highlight=${result.id}`))}
                >
                  {result.type === 'entrega' && <Truck className="mr-2 h-4 w-4" />}
                  {result.type === 'coleta' && <Package className="mr-2 h-4 w-4" />}
                  {result.type === 'cliente' && <Users className="mr-2 h-4 w-4" />}
                  {result.type === 'fornecedor' && <Building2 className="mr-2 h-4 w-4" />}
                  <span>{result.title}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{result.subtitle}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandGroup heading="Ações Rápidas">
            <CommandItem onSelect={() => handleCommand(() => navigate("/despachos"))}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Novo Despacho</span>
              <CommandShortcut>⌘N</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => handleCommand(() => navigate("/coletas"))}>
              <Package className="mr-2 h-4 w-4" />
              <span>Nova Coleta</span>
            </CommandItem>
            <CommandItem onSelect={() => handleCommand(() => navigate("/rastreamento"))}>
              <Map className="mr-2 h-4 w-4" />
              <span>Central de Rastreamento</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Configurações e Ferramentas">
            <CommandItem onSelect={() => handleCommand(() => setTheme(theme === "dark" ? "light" : "dark"))}>
              {theme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
              <span>Alternar Tema ({theme === "dark" ? "Claro" : "Escuro"})</span>
            </CommandItem>
            <CommandItem onSelect={() => handleCommand(() => navigate("/profile"))}>
              <User className="mr-2 h-4 w-4" />
              <span>Meu Perfil</span>
              <CommandShortcut>⌘P</CommandShortcut>
            </CommandItem>
            {isAdmin && (
              <CommandItem onSelect={() => handleCommand(() => navigate("/admin/telemetria"))}>
                <Activity className="mr-2 h-4 w-4" />
                <span>Telemetria do Sistema</span>
              </CommandItem>
            )}
            <CommandItem onSelect={() => handleCommand(() => {
              signOut();
              toast({ title: "Sessão encerrada" });
            })}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair do Sistema</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
