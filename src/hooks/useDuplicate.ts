import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DuplicateOptions {
  excludeFields?: string[];
  modifyFields?: Record<string, any>;
  onSuccess?: (newId: string) => void;
}

export function useDuplicate<T extends { id: string }>(table: string, queryKey: string[]) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ original, options }: { original: T; options?: DuplicateOptions }) => {
      const { excludeFields = ['id', 'created_at', 'updated_at'], modifyFields = {} } = options || {};
      
      const duplicatedData = Object.entries(original).reduce((acc, [key, value]) => {
        if (!excludeFields.includes(key)) {
          acc[key] = modifyFields[key] !== undefined ? modifyFields[key] : value;
        }
        return acc;
      }, {} as Record<string, any>);

      // Adicionar sufixo "(Cópia)" em campos de nome/título
      const nameFields = ['nome', 'name', 'titulo', 'title', 'descricao'];
      nameFields.forEach(field => {
        if (duplicatedData[field] && typeof duplicatedData[field] === 'string') {
          duplicatedData[field] = `${duplicatedData[field]} (Cópia)`;
        }
      });

      const { data, error } = await supabase.from(table).insert(duplicatedData).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data, { options }) => {
      queryClient.invalidateQueries({ queryKey });
      toast.success('Registro duplicado com sucesso!');
      options?.onSuccess?.(data.id);
    },
    onError: () => toast.error('Erro ao duplicar registro'),
  });
}
