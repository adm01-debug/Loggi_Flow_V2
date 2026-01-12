import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, RotateCcw, Clock } from 'lucide-react';
import { useVersions } from '@/hooks/useVersions';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface VersionHistoryProps {
  entityType: string;
  entityId: string | null;
  onRestore?: (data: Record<string, unknown>) => void;
}

export function VersionHistory({ entityType, entityId, onRestore }: VersionHistoryProps) {
  const { versions, isLoading, restoreVersion } = useVersions(entityType, entityId);

  const handleRestore = async (versionId: string) => {
    const data = await restoreVersion(versionId);
    onRestore?.(data);
  };

  if (!entityId) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-semibold">Histórico de Versões</h3>
        <span className="text-sm text-muted-foreground">({versions.length})</span>
      </div>

      {isLoading ? (
        <div className="text-center py-4 text-muted-foreground">Carregando...</div>
      ) : versions.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">Nenhuma versão salva</div>
      ) : (
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {versions.map((version, index) => (
              <div key={version.id} className={cn("p-3 border rounded-lg", index === 0 && "bg-primary/5 border-primary/20")}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">v{version.version_number}</span>
                    {index === 0 && <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">Atual</span>}
                  </div>
                  {index > 0 && onRestore && (
                    <Button variant="ghost" size="sm" onClick={() => handleRestore(version.id)}>
                      <RotateCcw className="h-4 w-4 mr-1" />Restaurar
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{format(new Date(version.changed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                </div>
                {version.change_summary && <p className="text-sm mt-2">{version.change_summary}</p>}
              </div>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
