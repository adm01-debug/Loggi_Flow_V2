import { useActivityLog, useRecentActivity } from '@/hooks/useActivityLog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Clock, Plus, Pencil, Trash2, RotateCcw, LucideIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const actionIcons: Record<string, LucideIcon> = { create: Plus, update: Pencil, delete: Trash2, restore: RotateCcw };
const actionColors: Record<string, string> = { create: 'bg-green-100 text-green-700', update: 'bg-blue-100 text-blue-700', delete: 'bg-red-100 text-red-700', restore: 'bg-amber-100 text-amber-700' };

interface ActivityTimelineProps { entityType?: string; entityId?: string; limit?: number; showGlobal?: boolean; }

export function ActivityTimeline({ entityType, entityId, limit = 20, showGlobal = false }: ActivityTimelineProps) {
  const entityLogs = useActivityLog(entityType || '', entityId);
  const globalLogs = useRecentActivity(limit);
  const { logs, isLoading } = showGlobal ? { logs: globalLogs.data || [], isLoading: globalLogs.isLoading } : entityLogs;

  if (isLoading) return <div className="text-center py-4 text-muted-foreground">Carregando...</div>;
  if (logs.length === 0) return <div className="text-center py-4 text-muted-foreground">Nenhuma atividade registrada</div>;

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4 pr-4">
        {logs.map((log, i) => {
          const Icon = actionIcons[log.action] || Clock;
          return (
            <div key={log.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={cn("p-2 rounded-full", actionColors[log.action] || "bg-muted")}><Icon className="h-4 w-4" /></div>
                {i < logs.length - 1 && <div className="w-0.5 flex-1 bg-border mt-2" />}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">{log.action}</Badge>
                  <span className="text-xs text-muted-foreground">{format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                </div>
                <p className="text-sm">{log.description}</p>
                {log.user_id && <p className="text-xs text-muted-foreground mt-1">User ID: {log.user_id}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
