import { useEffect, useCallback, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
}

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: { ctrl?: boolean; shift?: boolean; alt?: boolean; enabled?: boolean } = {}
) {
  const { ctrl = false, shift = false, alt = false, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      const keyMatch = event.key.toLowerCase() === key.toLowerCase();
      const ctrlMatch = ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
      const shiftMatch = shift ? event.shiftKey : !event.shiftKey;
      const altMatch = alt ? event.altKey : !event.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [key, ctrl, shift, alt, callback, enabled]);
}

export function useGlobalShortcuts() {
  const navigate = useNavigate();
  const lastKeyRef = useRef<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Power User Sequence: "G" then another key
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

      if (event.key.toLowerCase() === 'g') {
        lastKeyRef.current = 'g';
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => { lastKeyRef.current = null; }, 1000);
        return;
      }

      if (lastKeyRef.current === 'g') {
        const routes: Record<string, string> = {
          'd': '/',
          'c': '/coletas',
          'e': '/envios',
          't': '/transportadoras',
          'a': '/analytics',
          's': '/seguranca',
          'k': '/kanban-entregas',
          'b': '/gestao-box',
          'p': '/perfil'
        };

        const targetRoute = routes[event.key.toLowerCase()];
        if (targetRoute) {
          event.preventDefault();
          navigate(targetRoute);
          lastKeyRef.current = null;
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  useKeyboardShortcut("k", () => {
    window.dispatchEvent(new CustomEvent('logiflow:focus-search'));
  }, { ctrl: true });

  useKeyboardShortcut("Escape", () => {
    window.dispatchEvent(new CustomEvent('logiflow:close-dialog'));
  });
}

export const shortcutsList: ShortcutConfig[] = [
  { key: "k", ctrl: true, description: "Abrir busca global" },
  { key: "g + d", description: "Ir para Dashboard" },
  { key: "g + c", description: "Ir para Coletas" },
  { key: "g + e", description: "Ir para Entregas" },
  { key: "g + t", description: "Ir para Transportadoras" },
  { key: "g + k", description: "Ir para Kanban" },
  { key: "g + b", description: "Ir para Gestão de BOX" },
  { key: "g + s", description: "Ir para Segurança" },
  { key: "?", shift: true, description: "Mostrar atalhos de teclado" },
  { key: "Escape", description: "Fechar modal/popup" },
];

export function formatShortcut(shortcut: ShortcutConfig): string {
  if (shortcut.key.includes(" + ")) return shortcut.key.toUpperCase();
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push("Ctrl");
  if (shortcut.alt) parts.push("Alt");
  if (shortcut.shift) parts.push("Shift");
  parts.push(shortcut.key.toUpperCase());
  return parts.join(" + ");
}

export function useShortcutsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  useKeyboardShortcut("?", () => setIsOpen(true), { shift: true });
  return { isOpen, setIsOpen, shortcuts: shortcutsList };
}
