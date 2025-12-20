import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
}

/**
 * Hook para registrar atalhos de teclado
 */
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

/**
 * Hook com atalhos globais pré-configurados
 */
export function useGlobalShortcuts() {
  const navigate = useNavigate();

  useKeyboardShortcut("k", () => {
    const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
    searchInput?.focus();
  }, { ctrl: true });

  useKeyboardShortcut("d", () => navigate("/"), { alt: true });
  useKeyboardShortcut("c", () => navigate("/coletas"), { alt: true });
  useKeyboardShortcut("e", () => navigate("/envios"), { alt: true });
  useKeyboardShortcut("r", () => navigate("/relatorios"), { alt: true });
  useKeyboardShortcut("s", () => navigate("/configuracoes"), { alt: true });

  useKeyboardShortcut("Escape", () => {
    const closeButton = document.querySelector('[data-dialog-close]') as HTMLButtonElement;
    closeButton?.click();
  });
}

export const shortcutsList: ShortcutConfig[] = [
  { key: "k", ctrl: true, description: "Abrir busca global" },
  { key: "d", alt: true, description: "Ir para Dashboard" },
  { key: "c", alt: true, description: "Ir para Coletas" },
  { key: "e", alt: true, description: "Ir para Entregas" },
  { key: "r", alt: true, description: "Ir para Relatórios" },
  { key: "s", alt: true, description: "Ir para Configurações" },
  { key: "Escape", description: "Fechar modal/popup" },
];

export function formatShortcut(shortcut: ShortcutConfig): string {
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
