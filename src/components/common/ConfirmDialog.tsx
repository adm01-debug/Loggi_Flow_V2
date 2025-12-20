import { useState, createContext, useContext, useCallback, ReactNode } from "react";
import { AlertTriangle, Trash2, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type ConfirmType = "danger" | "warning" | "info" | "success";

interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => void;
  confirmDelete: (itemName: string, onConfirm: () => void | Promise<void>) => void;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

const typeConfig = {
  danger: { icon: Trash2, iconClass: "text-destructive", buttonClass: "bg-destructive hover:bg-destructive/90" },
  warning: { icon: AlertTriangle, iconClass: "text-warning", buttonClass: "bg-warning hover:bg-warning/90 text-warning-foreground" },
  info: { icon: CheckCircle, iconClass: "text-info", buttonClass: "bg-info hover:bg-info/90" },
  success: { icon: CheckCircle, iconClass: "text-success", buttonClass: "bg-success hover:bg-success/90" },
};

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const confirmDelete = useCallback((itemName: string, onConfirm: () => void | Promise<void>) => {
    confirm({
      title: "Confirmar exclusão",
      description: `Tem certeza que deseja excluir "${itemName}"? Esta ação não pode ser desfeita.`,
      confirmText: "Excluir",
      cancelText: "Cancelar",
      type: "danger",
      onConfirm,
    });
  }, [confirm]);

  const handleConfirm = async () => {
    if (!options) return;
    
    setIsLoading(true);
    try {
      await options.onConfirm();
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    options?.onCancel?.();
    setIsOpen(false);
  };

  const config = options ? typeConfig[options.type || "warning"] : typeConfig.warning;
  const Icon = config.icon;

  return (
    <ConfirmContext.Provider value={{ confirm, confirmDelete }}>
      {children}
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Icon className={`w-5 h-5 ${config.iconClass}`} />
              {options?.title}
            </AlertDialogTitle>
            <AlertDialogDescription>{options?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
              {options?.cancelText || "Cancelar"}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isLoading} className={config.buttonClass}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {options?.confirmText || "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}

// Standalone component for simpler use cases
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
}: ConfirmDialogProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${config.iconClass}`} />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading} className={config.buttonClass}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Delete confirmation button with built-in dialog
interface DeleteButtonProps {
  itemName: string;
  onDelete: () => void | Promise<void>;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "ghost";
}

export function DeleteButton({ itemName, onDelete, size = "icon", variant = "ghost" }: DeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete();
      setOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)} className="text-destructive hover:text-destructive">
        <Trash2 className="w-4 h-4" />
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Confirmar exclusão"
        description={`Tem certeza que deseja excluir "${itemName}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        type="danger"
        onConfirm={handleDelete}
        isLoading={isLoading}
      />
    </>
  );
}
