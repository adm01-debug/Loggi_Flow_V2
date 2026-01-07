import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ActivityLog { 
  id: string; 
  entity_type: string; 
  entity_id: string; 
  action: string; 
  description: string; 
  old_data?: Record<string, unknown>; 
  new_data?: Record<string, unknown>; 
  user_id: string; 
  created_at: string; 
}

export function useActivityLog(entityType: string, entityId?: string) {
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['activity-logs', entityType, entityId],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('id, table_name, record_id, action, old_data, new_data, user_id, created_at')
        .eq('table_name', entityType)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (entityId) query = query.eq('record_id', entityId);
      const { data, error } = await query;
      if (error) { console.warn('Activity logs query failed:', error.message); return []; }
      
      return (data || []).map(item => ({
        id: item.id, entity_type: item.table_name, entity_id: item.record_id, action: item.action,
        description: `${item.action} em ${item.table_name}`,
        old_data: item.old_data as Record<string, unknown> | undefined,
        new_data: item.new_data as Record<string, unknown> | undefined,
        user_id: item.user_id || '', created_at: item.created_at,
      })) as ActivityLog[];
    },
  });

  const logMutation = useMutation({
    mutationFn: async (log: { action: string; description: string; entity_id: string; old_data?: Record<string, unknown>; new_data?: Record<string, unknown> }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('audit_logs').insert([{
        table_name: entityType, 
        record_id: log.entity_id, 
        action: log.action,
        old_data: log.old_data ? JSON.parse(JSON.stringify(log.old_data)) : null,
        new_data: log.new_data ? JSON.parse(JSON.stringify(log.new_data)) : null,
        user_id: user?.id,
      }]);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activity-logs', entityType] }),
  });

  return { logs, isLoading, logActivity: logMutation.mutate };
}

export function useRecentActivity(limit = 20) {
  return useQuery({
    queryKey: ['recent-activity', limit],
    queryFn: async () => {
      const { data, error } = await supabase.from('audit_logs')
        .select('id, table_name, record_id, action, old_data, new_data, user_id, created_at')
        .order('created_at', { ascending: false }).limit(limit);
      if (error) { console.warn('Recent activity query failed:', error.message); return []; }
      return (data || []).map(item => ({
        id: item.id, entity_type: item.table_name, entity_id: item.record_id, action: item.action,
        description: `${item.action} em ${item.table_name}`,
        old_data: item.old_data as Record<string, unknown> | undefined,
        new_data: item.new_data as Record<string, unknown> | undefined,
        user_id: item.user_id || '', created_at: item.created_at,
      })) as ActivityLog[];
    },
  });
}
