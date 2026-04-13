import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "./ConfirmDialog";

interface DeleteButtonProps {
  itemName: string;
  onDelete: () => void | Promise<void>;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "ghost";
  showConfirmation?: boolean;
}

export function DeleteButton({ itemName, onDelete, size = "icon", variant = "ghost", showConfirmation = true }: DeleteButtonProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try { await onDelete(); setOpen(false); } finally { setIsLoading(false); }
  };

  const handleClick = () => {
    if (showConfirmation) setOpen(true);
    else handleDelete();
  };

  return (
    <>
      <Button variant={variant} size={size} onClick={handleClick} disabled={isLoading} className="text-destructive hover:text-destructive hover:bg-destructive/10">
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      </Button>
      <ConfirmDialog open={open} onOpenChange={setOpen} title="Confirmar exclusão" description={`Tem certeza que deseja excluir "${itemName}"? Esta ação não pode ser desfeita.`} confirmText="Excluir" type="danger" onConfirm={handleDelete} isLoading={isLoading} />
    </>
  );
}
