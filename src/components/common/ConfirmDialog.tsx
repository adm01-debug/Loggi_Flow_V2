import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { typeConfig } from "./ConfirmProvider";

export type ConfirmType =
  | "danger"
  | "warning"
  | "info"
  | "success"
  | "critical";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  requireTyping?: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "warning",
  onConfirm,
  isLoading = false,
  requireTyping,
}: ConfirmDialogProps) {
  const [typedValue, setTypedValue] = useState("");
  const config = typeConfig[type];

  useEffect(() => {
    if (!open) setTypedValue("");
  }, [open]);
  const Icon = config.icon;
  const canConfirm = !requireTyping || typedValue === requireTyping;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3">
              <div className={cn("p-2 rounded-full", config.bgClass)}>
                <Icon className={cn("w-5 h-5", config.iconClass)} />
              </div>
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          {requireTyping && (
            <div className="my-4">
              <Input
                value={typedValue}
                onChange={(e) => setTypedValue(e.target.value)}
                placeholder={`Digite "${requireTyping}" para confirmar`}
                className="font-mono"
              />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              {cancelText}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirm}
              disabled={isLoading || !canConfirm}
              className={config.buttonClass}
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Re-export sub-components for backward compatibility
// eslint-disable-next-line react-refresh/only-export-components
export { ConfirmProvider, useConfirm } from "./ConfirmProvider";
export { DeleteButton } from "./DeleteButton";
export { InlineConfirm } from "./InlineConfirm";
