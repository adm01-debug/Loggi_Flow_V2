import { useState, useCallback } from "react";
import { toast } from "sonner";

interface UseClipboardOptions {
  timeout?: number;
  successMessage?: string;
  errorMessage?: string;
}

/**
 * Hook para copiar texto para a área de transferência
 */
export function useClipboard(options: UseClipboardOptions = {}) {
  const { 
    timeout = 2000, 
    successMessage = "Copiado!", 
    errorMessage = "Erro ao copiar" 
  } = options;
  
  const [hasCopied, setHasCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    if (!navigator.clipboard) {
      // Fallback for older browsers
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        textArea.remove();
        setHasCopied(true);
        toast.success(successMessage);
      } catch {
        toast.error(errorMessage);
        return false;
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        setHasCopied(true);
        toast.success(successMessage);
      } catch {
        toast.error(errorMessage);
        return false;
      }
    }

    setTimeout(() => setHasCopied(false), timeout);
    return true;
  }, [timeout, successMessage, errorMessage]);

  const reset = useCallback(() => {
    setHasCopied(false);
  }, []);

  return { copy, hasCopied, reset };
}

/**
 * Hook para ler da área de transferência
 */
export function useClipboardRead() {
  const [value, setValue] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const read = useCallback(async () => {
    if (!navigator.clipboard) {
      toast.error("Clipboard não suportado");
      return null;
    }

    setIsLoading(true);
    try {
      const text = await navigator.clipboard.readText();
      setValue(text);
      return text;
    } catch {
      toast.error("Erro ao ler clipboard");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { value, read, isLoading };
}

/**
 * Helper para copiar com feedback visual
 */
export async function copyToClipboard(text: string, message?: string): Promise<boolean> {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
    }
    toast.success(message || "Copiado!");
    return true;
  } catch {
    toast.error("Erro ao copiar");
    return false;
  }
}

/**
 * Componente CopyButton para uso inline
 */
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "secondary" | "outline" | "ghost";
}

export function CopyButton({ text, className, size = "icon", variant = "ghost" }: CopyButtonProps) {
  const { copy, hasCopied } = useClipboard();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => copy(text)}
      className={cn("transition-colors", className)}
    >
      {hasCopied ? (
        <Check className="h-4 w-4 text-success" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}

/**
 * Componente para exibir texto com botão de copiar
 */
interface CopyableTextProps {
  text: string;
  className?: string;
  truncate?: boolean;
}

export function CopyableText({ text, className, truncate = true }: CopyableTextProps) {
  const { copy, hasCopied } = useClipboard();

  return (
    <div className={cn("flex items-center gap-2 group", className)}>
      <span className={cn("font-mono text-sm", truncate && "truncate")}>{text}</span>
      <button
        onClick={() => copy(text)}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {hasCopied ? (
          <Check className="h-3.5 w-3.5 text-success" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
        )}
      </button>
    </div>
  );
}
