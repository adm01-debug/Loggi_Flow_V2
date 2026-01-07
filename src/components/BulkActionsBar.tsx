/**
 * Componente de Barra de Ações em Massa
 * 
 * @module components/BulkActionsBar
 */

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { X, Loader2, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface BulkAction<T> {
  id: string;
  label: string;
  icon?: LucideIcon | ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  confirm?: {
    title: string;
    description: string;
  };
}

export interface BulkActionsBarProps<T> {
  selectionCount: number;
  actions: BulkAction<T>[];
  onAction?: (actionId: string) => Promise<void>;
  onClear?: () => void;
  onClearSelection?: () => void;
  isExecuting?: boolean;
  className?: string;
}

function isLucideIcon(icon: unknown): icon is LucideIcon {
  return typeof icon === 'function';
}

export function BulkActionsBar<T>({
  selectionCount,
  actions,
  onAction,
  onClear,
  onClearSelection,
  isExecuting = false,
  className,
}: BulkActionsBarProps<T>) {
  if (selectionCount === 0) return null;

  const handleClear = onClear || onClearSelection;
  const handleAction = async (actionId: string) => {
    if (onAction) {
      await onAction(actionId);
    } else {
      const action = actions.find(a => a.id === actionId);
      if (action && 'onClick' in action && typeof (action as any).onClick === 'function') {
        (action as any).onClick();
      }
    }
  };

  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-lg border bg-background p-2 shadow-lg',
        className
      )}
    >
      <div className="flex items-center gap-2 px-2">
        <span className="text-sm font-medium">
          {selectionCount} selecionado{selectionCount > 1 ? 's' : ''}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleClear}
          disabled={isExecuting}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Limpar seleção</span>
        </Button>
      </div>

      <div className="h-6 w-px bg-border" />

      <div className="flex items-center gap-1">
        {actions.map((action) => {
          const renderIcon = () => {
            if (!action.icon) return null;
            if (isLucideIcon(action.icon)) {
              const IconComponent = action.icon;
              return <IconComponent className="h-4 w-4" />;
            }
            return action.icon as ReactNode;
          };

          const ActionButton = (
            <Button
              key={action.id}
              variant={action.variant ?? 'outline'}
              size="sm"
              disabled={isExecuting}
              onClick={action.confirm ? undefined : () => handleAction(action.id)}
              className="gap-2"
            >
              {isExecuting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                renderIcon()
              )}
              {action.label}
            </Button>
          );

          if (action.confirm) {
            return (
              <AlertDialog key={action.id}>
                <AlertDialogTrigger asChild>{ActionButton}</AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{action.confirm.title}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {action.confirm.description}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleAction(action.id)}
                      className={
                        action.variant === 'destructive'
                          ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                          : ''
                      }
                    >
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            );
          }

          return ActionButton;
        })}
      </div>
    </div>
  );
}

export default BulkActionsBar;
