import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export interface ShortcutOptions {
  alt?: boolean;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  disabled?: boolean;
}

export const shortcutsList = [
  { key: "K", label: "Busca Global", modifier: "Cmd/Ctrl" },
  { key: "H", label: "Início", modifier: "Alt" },
  { key: "←", label: "Voltar", modifier: "Alt" },
  { key: "→", label: "Avançar", modifier: "Alt" },
  { key: "N", label: "Novo Despacho", modifier: "Alt" },
  { key: "P", label: "Meu Perfil", modifier: "Alt" },
];

export function formatShortcut(key: string, options: ShortcutOptions) {
  const parts = [];
  if (options.meta || options.ctrl) parts.push("⌘");
  if (options.alt) parts.push("Alt");
  if (options.shift) parts.push("Shift");
  parts.push(key.toUpperCase());
  return parts.join(" + ");
}

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options: ShortcutOptions = {},
) {
  useEffect(() => {
    if (options.disabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isKeyMatch = event.key.toLowerCase() === key.toLowerCase();
      const isAltMatch = !!options.alt === event.altKey;
      const isCtrlMatch = !!options.ctrl === event.ctrlKey;
      const isMetaMatch = !!options.meta === event.metaKey;
      const isShiftMatch = !!options.shift === event.shiftKey;

      if (
        isKeyMatch &&
        isAltMatch &&
        isCtrlMatch &&
        isMetaMatch &&
        isShiftMatch
      ) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [key, callback, options]);
}

export function useGlobalShortcuts() {
  const navigate = useNavigate();

  useKeyboardShortcut(
    "ArrowLeft",
    () => {
      if (window.history.length > 2) navigate(-1);
      else navigate("/");
    },
    { alt: true },
  );

  useKeyboardShortcut("ArrowRight", () => navigate(1), { alt: true });
  useKeyboardShortcut("h", () => navigate("/"), { alt: true });
  useKeyboardShortcut("n", () => navigate("/despachos"), { alt: true });
  useKeyboardShortcut("p", () => navigate("/perfil"), { alt: true });
}

export function useShortcutsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  return { isOpen, setIsOpen };
}

export function useKeyboardShortcuts() {
  useGlobalShortcuts();
}
