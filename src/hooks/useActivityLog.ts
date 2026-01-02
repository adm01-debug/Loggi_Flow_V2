import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ActivityLog { id: string; entity_type: string; entity_id: string; action: string; description: string; old_data?: Record<string, any>; new_data?: Record<string, any>; user_id: string; created_at: string; user?: { full_name: string; email: string }; }

export function useActivityLog(entityType: string, entityId?: string) {
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['activity-logs', entityType, entityId],
    queryFn: async () => {
      let q = supabase.from('activity_logs').select('*').eq('entity_type', entityType).order('created_at', { ascending: false }).limit(100);
      if (entityId) q = q.eq('entity_id', entityId);
      const { data, error } = await q;
      if (error) throw error;
      return data as ActivityLog[];
    },
  });

  const logMutation = useMutation({
    mutationFn: async (log: { action: string; description: string; entity_id: string; old_data?: any; new_data?: any }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('activity_logs').insert({ entity_type: entityType, user_id: user?.id, ...log });
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
      const { data, error } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return data as ActivityLog[];
    },
  });
}
