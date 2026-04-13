import { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface InlineConfirmProps {
  children: ReactNode;
  message: string;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function InlineConfirm({ children, message, onConfirm, confirmLabel = "Confirmar", cancelLabel = "Cancelar" }: InlineConfirmProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {!showConfirm ? (
          <motion.div key="trigger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirm(true)}>
            {children}
          </motion.div>
        ) : (
          <motion.div key="confirm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex items-center gap-2 p-2 rounded-lg bg-muted border border-border">
            <span className="text-sm text-muted-foreground">{message}</span>
            <Button size="sm" variant="ghost" onClick={() => setShowConfirm(false)}>{cancelLabel}</Button>
            <Button size="sm" variant="destructive" onClick={() => { onConfirm(); setShowConfirm(false); }}>{confirmLabel}</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
