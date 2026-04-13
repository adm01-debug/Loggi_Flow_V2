import { useState, createContext, useContext, useCallback, ReactNode, useRef } from "react";
import { AlertTriangle, Trash2, CheckCircle, XCircle, Loader2, Info, AlertOctagon } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type ConfirmType = "danger" | "warning" | "info" | "success" | "critical";

interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
  requireTyping?: string;
  countdown?: number;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => void;
  confirmDelete: (itemName: string, onConfirm: () => void | Promise<void>) => void;
  confirmCritical: (action: string, typingText: string, onConfirm: () => void | Promise<void>) => void;
  confirmQuick: (message: string, onConfirm: () => void | Promise<void>) => void;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export const typeConfig = {
  danger: { icon: Trash2, iconClass: "text-destructive", buttonClass: "bg-destructive hover:bg-destructive/90", bgClass: "bg-destructive/10", borderClass: "border-destructive/20", pulseClass: "animate-pulse-destructive" },
  warning: { icon: AlertTriangle, iconClass: "text-warning", buttonClass: "bg-warning hover:bg-warning/90 text-warning-foreground", bgClass: "bg-warning/10", borderClass: "border-warning/20", pulseClass: "" },
  info: { icon: Info, iconClass: "text-info", buttonClass: "bg-info hover:bg-info/90", bgClass: "bg-info/10", borderClass: "border-info/20", pulseClass: "" },
  success: { icon: CheckCircle, iconClass: "text-success", buttonClass: "bg-success hover:bg-success/90", bgClass: "bg-success/10", borderClass: "border-success/20", pulseClass: "" },
  critical: { icon: AlertOctagon, iconClass: "text-destructive", buttonClass: "bg-destructive hover:bg-destructive/90", bgClass: "bg-destructive/15", borderClass: "border-destructive/30", pulseClass: "animate-pulse" },
};

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [typedValue, setTypedValue] = useState("");
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const resetState = useCallback(() => {
    setTypedValue("");
    setCountdown(0);
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
  }, []);

  const confirm = useCallback((opts: ConfirmOptions) => {
    resetState();
    setOptions(opts);
    setIsOpen(true);
    if (opts.countdown && opts.countdown > 0) {
      setCountdown(opts.countdown);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => { if (prev <= 1) { if (countdownRef.current) clearInterval(countdownRef.current); return 0; } return prev - 1; });
      }, 1000);
    }
  }, [resetState]);

  const confirmDelete = useCallback((itemName: string, onConfirm: () => void | Promise<void>) => {
    confirm({ title: "Confirmar exclusão", description: `Tem certeza que deseja excluir "${itemName}"? Esta ação não pode ser desfeita.`, confirmText: "Excluir", cancelText: "Cancelar", type: "danger", onConfirm });
  }, [confirm]);

  const confirmCritical = useCallback((action: string, typingText: string, onConfirm: () => void | Promise<void>) => {
    confirm({ title: "⚠️ Ação Crítica", description: `Você está prestes a ${action}. Esta é uma ação IRREVERSÍVEL. Para confirmar, digite "${typingText}" abaixo:`, confirmText: "Confirmar Permanentemente", cancelText: "Cancelar", type: "critical", requireTyping: typingText, countdown: 3, onConfirm });
  }, [confirm]);

  const confirmQuick = useCallback((message: string, onConfirm: () => void | Promise<void>) => {
    confirm({ title: "Confirmar", description: message, confirmText: "Sim", cancelText: "Não", type: "info", onConfirm });
  }, [confirm]);

  const handleConfirm = async () => {
    if (!options) return;
    if (options.requireTyping && typedValue !== options.requireTyping) return;
    if (countdown > 0) return;
    setIsLoading(true);
    try { await options.onConfirm(); setIsOpen(false); resetState(); } finally { setIsLoading(false); }
  };

  const handleCancel = () => { options?.onCancel?.(); setIsOpen(false); resetState(); };

  const config = options ? typeConfig[options.type || "warning"] : typeConfig.warning;
  const Icon = config.icon;
  const canConfirm = (!options?.requireTyping || typedValue === options.requireTyping) && countdown === 0;

  return (
    <ConfirmContext.Provider value={{ confirm, confirmDelete, confirmCritical, confirmQuick }}>
      {children}
      <AlertDialog open={isOpen} onOpenChange={(open) => { if (!open) handleCancel(); else setIsOpen(open); }}>
        <AlertDialogContent className="overflow-hidden">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-3">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 25 }} className={cn("p-2 rounded-full", config.bgClass)}>
                  <Icon className={cn("w-5 h-5", config.iconClass, config.pulseClass)} />
                </motion.div>
                <span>{options?.title}</span>
              </AlertDialogTitle>
              <AlertDialogDescription className="pt-2">{options?.description}</AlertDialogDescription>
            </AlertDialogHeader>

            {options?.requireTyping && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="my-4">
                <Input value={typedValue} onChange={(e) => setTypedValue(e.target.value)} placeholder={`Digite "${options.requireTyping}" para confirmar`} className={cn("font-mono", typedValue === options.requireTyping && "border-success focus:ring-success")} />
                {typedValue && typedValue !== options.requireTyping && <p className="text-xs text-destructive mt-1">O texto não corresponde. Digite exatamente "{options.requireTyping}"</p>}
              </motion.div>
            )}

            <AlertDialogFooter className="gap-2 sm:gap-2">
              <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>{options?.cancelText || "Cancelar"}</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirm} disabled={isLoading || !canConfirm} className={cn(config.buttonClass, "min-w-[120px]")}>
                <AnimatePresence mode="wait">
                  {isLoading ? <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Processando...</motion.span>
                    : countdown > 0 ? <motion.span key="countdown" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">Aguarde ({countdown}s)</motion.span>
                    : <motion.span key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{options?.confirmText || "Confirmar"}</motion.span>}
                </AnimatePresence>
              </AlertDialogAction>
            </AlertDialogFooter>
          </motion.div>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error("useConfirm must be used within a ConfirmProvider");
  return context;
}
