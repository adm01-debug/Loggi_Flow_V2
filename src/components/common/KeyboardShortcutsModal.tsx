/**
 * Modal de Atalhos de Teclado Premium
 * 
 * @module components/common/KeyboardShortcutsModal
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Keyboard, Search, Navigation, Edit3, Eye, 
  Settings, Zap, Command, ArrowUp, ArrowDown
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
  global?: boolean;
}

interface ShortcutCategory {
  id: string;
  name: string;
  icon: typeof Keyboard;
  shortcuts: Shortcut[];
}

// ============================================
// Shortcut Data
// ============================================

const shortcutCategories: ShortcutCategory[] = [
  {
    id: 'navigation',
    name: 'Navegação',
    icon: Navigation,
    shortcuts: [
      { keys: ['Ctrl', 'K'], description: 'Abrir busca global', category: 'navigation', global: true },
      { keys: ['Ctrl', 'B'], description: 'Toggle sidebar', category: 'navigation', global: true },
      { keys: ['Ctrl', '/'], description: 'Mostrar atalhos', category: 'navigation', global: true },
      { keys: ['Esc'], description: 'Fechar modais/menus', category: 'navigation', global: true },
      { keys: ['↑', '↓'], description: 'Navegar na lista', category: 'navigation' },
      { keys: ['Enter'], description: 'Selecionar item', category: 'navigation' },
      { keys: ['Tab'], description: 'Próximo campo', category: 'navigation' },
      { keys: ['Shift', 'Tab'], description: 'Campo anterior', category: 'navigation' },
      { keys: ['Home'], description: 'Ir ao início', category: 'navigation' },
      { keys: ['End'], description: 'Ir ao final', category: 'navigation' },
    ],
  },
  {
    id: 'actions',
    name: 'Ações',
    icon: Zap,
    shortcuts: [
      { keys: ['Ctrl', 'N'], description: 'Novo registro', category: 'actions' },
      { keys: ['Ctrl', 'S'], description: 'Salvar', category: 'actions' },
      { keys: ['Ctrl', 'Enter'], description: 'Salvar e fechar', category: 'actions' },
      { keys: ['Ctrl', 'E'], description: 'Exportar dados', category: 'actions' },
      { keys: ['Ctrl', 'P'], description: 'Imprimir', category: 'actions' },
      { keys: ['Ctrl', 'D'], description: 'Duplicar item', category: 'actions' },
      { keys: ['Delete'], description: 'Excluir selecionados', category: 'actions' },
      { keys: ['Ctrl', 'Z'], description: 'Desfazer', category: 'actions' },
      { keys: ['Ctrl', 'Shift', 'Z'], description: 'Refazer', category: 'actions' },
    ],
  },
  {
    id: 'selection',
    name: 'Seleção',
    icon: Edit3,
    shortcuts: [
      { keys: ['Space'], description: 'Toggle seleção', category: 'selection' },
      { keys: ['Ctrl', 'A'], description: 'Selecionar todos', category: 'selection' },
      { keys: ['Ctrl', 'Click'], description: 'Adicionar à seleção', category: 'selection' },
      { keys: ['Shift', 'Click'], description: 'Selecionar intervalo', category: 'selection' },
      { keys: ['Ctrl', 'Shift', 'A'], description: 'Limpar seleção', category: 'selection' },
    ],
  },
  {
    id: 'view',
    name: 'Visualização',
    icon: Eye,
    shortcuts: [
      { keys: ['Ctrl', '+'], description: 'Aumentar zoom', category: 'view' },
      { keys: ['Ctrl', '-'], description: 'Diminuir zoom', category: 'view' },
      { keys: ['Ctrl', '0'], description: 'Resetar zoom', category: 'view' },
      { keys: ['F11'], description: 'Tela cheia', category: 'view' },
      { keys: ['Ctrl', 'H'], description: 'Toggle alto contraste', category: 'view' },
    ],
  },
];

// ============================================
// Key Badge Component
// ============================================

function KeyBadge({ keyName }: { keyName: string }) {
  const specialKeys: Record<string, string> = {
    'Ctrl': '⌘',
    'Alt': '⌥',
    'Shift': '⇧',
    'Enter': '↵',
    'Esc': '⎋',
    'Space': '␣',
    'Tab': '⇥',
    'Delete': '⌫',
    'Home': '⇱',
    'End': '⇲',
    '↑': '↑',
    '↓': '↓',
    '←': '←',
    '→': '→',
  };

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const displayKey = isMac && specialKeys[keyName] ? specialKeys[keyName] : keyName;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-mono text-xs px-2 py-0.5 bg-muted/50",
        "border-border/50 shadow-sm",
        keyName.length === 1 && "min-w-[24px] text-center"
      )}
    >
      {displayKey}
    </Badge>
  );
}

// ============================================
// Shortcut Row Component
// ============================================

function ShortcutRow({ shortcut, index }: { shortcut: Shortcut; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.02 }}
      className={cn(
        "flex items-center justify-between py-2.5 px-3 rounded-lg",
        "hover:bg-muted/50 transition-colors",
        shortcut.global && "bg-primary/5"
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm">{shortcut.description}</span>
        {shortcut.global && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            Global
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-1">
        {shortcut.keys.map((key, i) => (
          <span key={i} className="flex items-center gap-1">
            <KeyBadge keyName={key} />
            {i < shortcut.keys.length - 1 && (
              <span className="text-muted-foreground text-xs">+</span>
            )}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

// ============================================
// Category Section
// ============================================

function CategorySection({ category }: { category: ShortcutCategory }) {
  const Icon = category.icon;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-3 py-2 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">{category.name}</h3>
        <Badge variant="secondary" className="ml-auto text-xs">
          {category.shortcuts.length}
        </Badge>
      </div>
      <div className="space-y-1">
        {category.shortcuts.map((shortcut, i) => (
          <ShortcutRow key={i} shortcut={shortcut} index={i} />
        ))}
      </div>
    </div>
  );
}

// ============================================
// Main Modal Component
// ============================================

interface KeyboardShortcutsModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function KeyboardShortcutsModal({ 
  open: controlledOpen, 
  onOpenChange: controlledOnOpenChange 
}: KeyboardShortcutsModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  // Global keyboard shortcut to open modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  // Filter shortcuts based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return shortcutCategories;
    
    const query = searchQuery.toLowerCase();
    return shortcutCategories
      .map(category => ({
        ...category,
        shortcuts: category.shortcuts.filter(
          s => s.description.toLowerCase().includes(query) ||
               s.keys.some(k => k.toLowerCase().includes(query))
        ),
      }))
      .filter(category => category.shortcuts.length > 0);
  }, [searchQuery]);

  const allShortcuts = useMemo(() => 
    shortcutCategories.flatMap(c => c.shortcuts),
    []
  );

  const globalShortcuts = useMemo(() =>
    allShortcuts.filter(s => s.global),
    [allShortcuts]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Keyboard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Atalhos de Teclado</DialogTitle>
              <DialogDescription>
                Use atalhos para navegar e agir mais rapidamente
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Search */}
        <div className="px-6 py-3 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar atalhos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="px-6 py-2 border-b">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="all" className="gap-2">
                <Command className="w-3.5 h-3.5" />
                Todos
              </TabsTrigger>
              <TabsTrigger value="global" className="gap-2">
                <Zap className="w-3.5 h-3.5" />
                Globais
              </TabsTrigger>
              {shortcutCategories.map(cat => (
                <TabsTrigger key={cat.id} value={cat.id} className="gap-2">
                  <cat.icon className="w-3.5 h-3.5" />
                  {cat.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="px-6 py-4">
              <TabsContent value="all" className="mt-0 space-y-6">
                {filteredCategories.map(category => (
                  <CategorySection key={category.id} category={category} />
                ))}
                {filteredCategories.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Keyboard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nenhum atalho encontrado para "{searchQuery}"</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="global" className="mt-0 space-y-1">
                {globalShortcuts.map((shortcut, i) => (
                  <ShortcutRow key={i} shortcut={shortcut} index={i} />
                ))}
              </TabsContent>

              {shortcutCategories.map(category => (
                <TabsContent key={category.id} value={category.id} className="mt-0 space-y-1">
                  {category.shortcuts.map((shortcut, i) => (
                    <ShortcutRow key={i} shortcut={shortcut} index={i} />
                  ))}
                </TabsContent>
              ))}
            </div>
          </ScrollArea>
        </Tabs>

        {/* Footer */}
        <div className="px-6 py-3 border-t bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-2">
            Pressione
            <KeyBadge keyName="Ctrl" />
            <span>+</span>
            <KeyBadge keyName="/" />
            para abrir/fechar este menu
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Hook for managing keyboard shortcuts modal
// ============================================

export function useKeyboardShortcutsModal() {
  const [open, setOpen] = useState(false);
  
  const toggle = () => setOpen(prev => !prev);
  const show = () => setOpen(true);
  const hide = () => setOpen(false);

  return {
    open,
    setOpen,
    toggle,
    show,
    hide,
    Modal: () => <KeyboardShortcutsModal open={open} onOpenChange={setOpen} />,
  };
}

export default KeyboardShortcutsModal;
