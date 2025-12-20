import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Search, Package, Truck, Users, AlertTriangle, FileText, Settings, BarChart3, Trophy, Building2 } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
}

const navigationItems: SearchResult[] = [
  { id: "dashboard", title: "Dashboard", url: "/", icon: BarChart3, category: "Navegação" },
  { id: "coletas", title: "Coletas", url: "/coletas", icon: Package, category: "Navegação" },
  { id: "envios", title: "Envios/Entregas", url: "/envios", icon: Truck, category: "Navegação" },
  { id: "clientes", title: "Clientes", url: "/clientes", icon: Users, category: "Navegação" },
  { id: "fornecedores", title: "Fornecedores", url: "/fornecedores", icon: Building2, category: "Navegação" },
  { id: "transportadoras", title: "Transportadoras", url: "/transportadoras", icon: Truck, category: "Navegação" },
  { id: "ocorrencias", title: "Ocorrências", url: "/ocorrencias", icon: AlertTriangle, category: "Navegação" },
  { id: "relatorios", title: "Relatórios", url: "/relatorios", icon: FileText, category: "Navegação" },
  { id: "ranking", title: "Ranking", url: "/ranking", icon: Trophy, category: "Gamificação" },
  { id: "conquistas", title: "Conquistas", url: "/conquistas", icon: Trophy, category: "Gamificação" },
  { id: "configuracoes", title: "Configurações", url: "/configuracoes", icon: Settings, category: "Sistema" },
];

export function SearchCommand() {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

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
  };

  const groupedItems = navigationItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:inline">Buscar...</span>
        <kbd className="hidden md:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar páginas, ações..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          
          {Object.entries(groupedItems).map(([category, items], index) => (
            <React.Fragment key={category}>
              {index > 0 && <CommandSeparator />}
              <CommandGroup heading={category}>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.title}
                    onSelect={() => handleSelect(item.url)}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                    {item.description && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </React.Fragment>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}

export default SearchCommand;
