import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useDebouncedValue } from '@/hooks/useDebounce';

interface FulltextSearchOptions {
  minLength?: number;
  debounceMs?: number;
}

export function useFulltextSearch<T>(
  table: string,
  searchTerm: string,
  searchColumns: string[],
  options: FulltextSearchOptions = {}
) {
  const { minLength = 2, debounceMs = 300 } = options;
  const debouncedTerm = useDebouncedValue(searchTerm, debounceMs);

  return useQuery({
    queryKey: ['fulltext-search', table, debouncedTerm],
    queryFn: async () => {
      if (!debouncedTerm || debouncedTerm.length < minLength) return [];

      const orConditions = searchColumns
        .map(col => `${col}.ilike.%${debouncedTerm}%`)
        .join(',');

      const { data, error } = await supabase
        .from(table)
        .select('*')
        .or(orConditions)
        .limit(50);

      if (error) throw error;
      return data as T[];
    },
    enabled: debouncedTerm.length >= minLength,
    staleTime: 30000,
  });
}

// Hook para busca em múltiplas tabelas
export function useGlobalSearch(searchTerm: string) {
  const debouncedTerm = useDebouncedValue(searchTerm, 300);

  return useQuery({
    queryKey: ['global-search', debouncedTerm],
    queryFn: async () => {
      if (!debouncedTerm || debouncedTerm.length < 2) return { clientes: [], entregas: [], coletas: [], fornecedores: [] };

      const [clientes, entregas, coletas, fornecedores] = await Promise.all([
        supabase.from('clientes').select('id, nome, email').ilike('nome', `%${debouncedTerm}%`).limit(5),
        supabase.from('entregas').select('id, numero_nf, cliente_nome').or(`numero_nf.ilike.%${debouncedTerm}%,cliente_nome.ilike.%${debouncedTerm}%`).limit(5),
        supabase.from('coletas').select('id, numero_nf, cliente_nome').or(`numero_nf.ilike.%${debouncedTerm}%,cliente_nome.ilike.%${debouncedTerm}%`).limit(5),
        supabase.from('fornecedores').select('id, razao_social, nome_fantasia').or(`razao_social.ilike.%${debouncedTerm}%,nome_fantasia.ilike.%${debouncedTerm}%`).limit(5),
      ]);

      return {
        clientes: clientes.data || [],
        entregas: entregas.data || [],
        coletas: coletas.data || [],
        fornecedores: fornecedores.data || [],
      };
    },
    enabled: debouncedTerm.length >= 2,
  });
}
