/**
 * Componente de Indicador de Auto-Save
 * 
 * @module components/common/AutoSaveIndicator
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Cloud, CloudOff, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AutoSaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'restored' | 'error';
  lastSavedAt?: Date | null;
  hasSavedData?: boolean;
  onRestore?: () => void;
  onClear?: () => void;
  className?: string;
  showRestorePrompt?: boolean;
}

const statusConfig: Record<string, {
  icon: typeof Cloud;
  text: string;
  color: string;
  bgColor: string;
  animate?: boolean;
}> = {
  idle: {
    icon: Cloud,
    text: 'Auto-save ativo',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
  },
  saving: {
    icon: RefreshCw,
    text: 'Salvando...',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    animate: true,
  },
  saved: {
    icon: Check,
    text: 'Salvo',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  restored: {
    icon: Check,
    text: 'Restaurado',
    color: 'text-info',
    bgColor: 'bg-info/10',
  },
  error: {
    icon: AlertCircle,
    text: 'Erro ao salvar',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
  },
};

export function AutoSaveIndicator({
  status,
  lastSavedAt,
  hasSavedData,
  onRestore,
  onClear,
  className,
  showRestorePrompt = false,
}: AutoSaveIndicatorProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Status Indicator */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
          config.bgColor,
          config.color
        )}
      >
        <Icon 
          className={cn(
            'h-3 w-3',
            config.animate && 'animate-spin'
          )} 
        />
        <span>{config.text}</span>
        {lastSavedAt && status === 'saved' && (
          <span className="text-muted-foreground ml-1">
            {format(lastSavedAt, "HH:mm", { locale: ptBR })}
          </span>
        )}
      </motion.div>

      {/* Restore Prompt */}
      <AnimatePresence>
        {showRestorePrompt && hasSavedData && onRestore && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-info/10 border border-info/20 rounded-lg"
          >
            <CloudOff className="h-4 w-4 text-info" />
            <span className="text-xs text-info">Dados não salvos encontrados</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-info hover:text-info hover:bg-info/20"
              onClick={onRestore}
            >
              Restaurar
            </Button>
            {onClear && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
                onClick={onClear}
              >
                Descartar
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AutoSaveIndicator;
