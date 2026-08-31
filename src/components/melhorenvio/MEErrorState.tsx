import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MEErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function MEErrorState({ message = 'Erro ao carregar dados. Tente novamente.', onRetry }: MEErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
      <div className="p-3 rounded-full bg-destructive/10">
        <AlertTriangle className="w-6 h-6 text-destructive" />
      </div>
      <p className="text-sm text-muted-foreground max-w-sm">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-1" /> Tentar novamente
        </Button>
      )}
    </div>
  );
}
