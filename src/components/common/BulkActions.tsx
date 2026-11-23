import * as React from "react";
import { X, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

interface BulkAction {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: "default" | "destructive";
  onClick: (selectedIds: string[]) => void;
  confirmTitle?: string;
  confirmDescription?: string | ((count: number) => string);
  /**
   * Palavra que o usuário precisa digitar para liberar a confirmação.
   * Use nas ações destrutivas que apagam em massa (etapa 051).
   */
  confirmTyping?: string;
}

interface BulkActionsProps {
  selectedIds: string[];
  totalCount: number;
  onClearSelection: () => void;
  onSelectAll?: () => void;
  actions: BulkAction[];
  className?: string;
}

export function BulkActions({
  selectedIds,
  totalCount,
  onClearSelection,
  onSelectAll,
  actions,
  className,
}: BulkActionsProps) {
  const [pendingAction, setPendingAction] = React.useState<BulkAction | null>(null);

  if (selectedIds.length === 0) return null;

  const handleActionClick = (action: BulkAction) => {
    if (action.variant === "destructive") {
      setPendingAction(action);
    } else {
      action.onClick(selectedIds);
    }
  };

  const confirmTitle = pendingAction?.confirmTitle ?? `${pendingAction?.label ?? ""}?`;

  const resolveDescription = (action: BulkAction | null): string => {
    if (!action) return "";
    if (typeof action.confirmDescription === "function") return action.confirmDescription(selectedIds.length);
    return action.confirmDescription ?? `Confirma a ação em ${selectedIds.length} item(s)? Esta operação não pode ser desfeita.`;
  };
  const confirmDescription = resolveDescription(pendingAction);

  return (
    <>
    <ConfirmDialog
      open={pendingAction !== null}
      onOpenChange={(open) => { if (!open) setPendingAction(null); }}
      title={confirmTitle}
      description={confirmDescription}
      confirmText={pendingAction?.label ?? "Confirmar"}
      type="danger"
      requireTyping={pendingAction?.confirmTyping}
      onConfirm={() => {
        pendingAction?.onClick(selectedIds);
        setPendingAction(null);
      }}
    />
    <div
      className={cn(
        "flex items-center gap-4 p-4 bg-primary/5 border rounded-lg",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-primary" />
        <span className="font-medium text-sm">
          {selectedIds.length} de {totalCount} selecionado(s)
        </span>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {onSelectAll && selectedIds.length < totalCount && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSelectAll}
            className="text-xs"
          >
            Selecionar todos
          </Button>
        )}

        {actions.length <= 3 ? (
          actions.map((action) => (
            <Button
              key={action.id}
              variant={
                action.variant === "destructive" ? "destructive" : "outline"
              }
              size="sm"
              onClick={() => handleActionClick(action)}
              className="text-xs h-8"
            >
              {action.icon && <action.icon className="h-3.5 w-3.5 mr-1.5" />}
              {action.label}
            </Button>
          ))
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs h-8">
                Ações
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.map((action, index) => (
                <React.Fragment key={action.id}>
                  {action.variant === "destructive" && index > 0 && (
                    <DropdownMenuSeparator />
                  )}
                  <DropdownMenuItem
                    onClick={() => handleActionClick(action)}
                    className={cn(
                      "text-xs",
                      action.variant === "destructive" && "text-destructive",
                    )}
                  >
                    {action.icon && (
                      <action.icon className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    {action.label}
                  </DropdownMenuItem>
                </React.Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={onClearSelection}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
    </>
  );
}

export default BulkActions;
