import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Keyboard } from "lucide-react";

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  { keys: ["Alt", "←"], description: "Voltar para tela anterior", category: "Navegação" },
  { keys: ["Ctrl", "K"], description: "Abrir busca global", category: "Navegação" },
  { keys: ["Ctrl", "B"], description: "Toggle sidebar", category: "Navegação" },
  { keys: ["Ctrl", "/"], description: "Mostrar atalhos", category: "Ajuda" },
  { keys: ["Esc"], description: "Fechar modais", category: "Geral" },
  { keys: ["Ctrl", "N"], description: "Novo registro", category: "Ações" },
  { keys: ["Ctrl", "S"], description: "Salvar", category: "Ações" },
  { keys: ["Ctrl", "E"], description: "Exportar dados", category: "Ações" },
  { keys: ["↑", "↓"], description: "Navegar na lista", category: "Navegação" },
  { keys: ["Enter"], description: "Selecionar item", category: "Navegação" },
  { keys: ["Space"], description: "Toggle seleção", category: "Seleção" },
  { keys: ["Ctrl", "A"], description: "Selecionar todos", category: "Seleção" },
  { keys: ["Delete"], description: "Excluir selecionados", category: "Ações" },
];

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const categories = [...new Set(shortcuts.map(s => s.category))];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Atalhos de Teclado
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {categories.map(category => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">{category}</h3>
              <div className="space-y-2">
                {shortcuts.filter(s => s.category === category).map((shortcut, i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, j) => (
                        <span key={j}>
                          <Badge variant="outline" className="font-mono text-xs px-2">{key}</Badge>
                          {j < shortcut.keys.length - 1 && <span className="mx-0.5 text-muted-foreground">+</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">Pressione <Badge variant="outline" className="font-mono text-xs mx-1">Ctrl</Badge>+<Badge variant="outline" className="font-mono text-xs mx-1">/</Badge> para mostrar/esconder</p>
      </DialogContent>
    </Dialog>
  );
}
