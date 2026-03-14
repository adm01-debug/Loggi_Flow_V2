import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ExternalProduct {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  supplier_id: string | null;
  is_active: boolean;
}

interface ExternalProductsResult {
  data: ExternalProduct[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface UseExternalProductsOptions {
  search?: string;
  page?: number;
  pageSize?: number;
  enabled?: boolean;
}

export function useExternalProducts(options: UseExternalProductsOptions = {}) {
  const { search = '', page = 1, pageSize = 20, enabled = true } = options;

  const query = useQuery({
    queryKey: ['external-products', search, page, pageSize],
    queryFn: async (): Promise<ExternalProductsResult> => {
      const params = new URLSearchParams({
        action: 'list',
        page: String(page),
        pageSize: String(pageSize),
      });
      if (search) params.set('search', search);

      const { data, error } = await supabase.functions.invoke(
        'external-products?' + params.toString()
      );

      if (error) throw error;
      return data as ExternalProductsResult;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  return {
    products: query.data?.data || [],
    total: query.data?.total || 0,
    totalPages: query.data?.totalPages || 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useExternalProduct(id: string | null) {
  return useQuery({
    queryKey: ['external-product', id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        `external-products?action=get&id=${id}`
      );
      if (error) throw error;
      return data?.data as ExternalProduct;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}
