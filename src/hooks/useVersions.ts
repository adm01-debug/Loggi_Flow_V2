import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Version {
  id: string;
  version_number: number;
  data: Record<string, any>;
  changed_by: string;
  changed_at: string;
  change_summary: string;
  user?: { full_name: string; email: string };
}

export function useVersions(entityType: string, entityId: string | null) {
  const queryClient = useQueryClient();

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['versions', entityType, entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entity_versions')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('version_number', { ascending: false });
      
      if (error) throw error;
      return data as Version[];
    },
    enabled: !!entityId,
  });

  const createVersionMutation = useMutation({
    mutationFn: async ({ entityId, data, summary }: { entityId: string; data: Record<string, any>; summary?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const nextVersion = versions.length > 0 ? versions[0].version_number + 1 : 1;
      
      const { error } = await supabase.from('entity_versions').insert({
        entity_type: entityType,
        entity_id: entityId,
        version_number: nextVersion,
        data,
        changed_by: user?.id,
        change_summary: summary || `Versão ${nextVersion}`,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['versions', entityType, entityId] });
      toast.success('Versão salva');
    },
  });

  const restoreVersionMutation = useMutation({
    mutationFn: async (versionId: string) => {
      const version = versions.find(v => v.id === versionId);
      if (!version) throw new Error('Versão não encontrada');
      return version.data;
    },
    onSuccess: () => toast.success('Versão restaurada'),
  });

  return {
    versions,
    isLoading,
    latestVersion: versions[0],
    createVersion: createVersionMutation.mutate,
    restoreVersion: restoreVersionMutation.mutateAsync,
  };
}
