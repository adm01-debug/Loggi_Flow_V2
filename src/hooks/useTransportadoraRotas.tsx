import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TransportadoraRota {
  id: string;
  transportadora_id: string;
  origem_estado: string;
  origem_cidade: string | null;
  origem_cep_inicio: string | null;
  origem_cep_fim: string | null;
  destino_estado: string;
  destino_cidade: string | null;
  destino_cep_inicio: string | null;
  destino_cep_fim: string | null;
  prazo_dias: number;
  preco_por_kg: number;
  taxa_fixa: number;
  ativo: boolean;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  transportadora?: {
    id: string;
    nome_fantasia: string;
    razao_social: string;
    score_performance: number;
    homologada: boolean;
  };
}

export interface RotaFilter {
  origem_estado?: string;
  origem_cidade?: string;
  destino_estado?: string;
  destino_cidade?: string;
  cep_origem?: string;
  cep_destino?: string;
  transportadora_id?: string;
  apenas_ativas?: boolean;
}

export interface RotaFormData {
  transportadora_id: string;
  origem_estado: string;
  origem_cidade?: string;
  origem_cep_inicio?: string;
  origem_cep_fim?: string;
  destino_estado: string;
  destino_cidade?: string;
  destino_cep_inicio?: string;
  destino_cep_fim?: string;
  prazo_dias?: number;
  preco_por_kg?: number;
  taxa_fixa?: number;
  ativo?: boolean;
  observacoes?: string;
}

export const useTransportadoraRotas = (filters?: RotaFilter) => {
  const queryClient = useQueryClient();

  // Fetch routes with optional filters
  const { data: rotas, isLoading, error, refetch } = useQuery({
    queryKey: ['transportadora-rotas', filters],
    queryFn: async () => {
      let query = supabase
        .from('transportadora_rotas')
        .select(`
          *,
          transportadora:transportadoras (
            id,
            nome_fantasia,
            razao_social,
            score_performance,
            homologada
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.origem_estado) {
        query = query.eq('origem_estado', filters.origem_estado);
      }
      if (filters?.origem_cidade) {
        query = query.ilike('origem_cidade', `%${filters.origem_cidade}%`);
      }
      if (filters?.destino_estado) {
        query = query.eq('destino_estado', filters.destino_estado);
      }
      if (filters?.destino_cidade) {
        query = query.ilike('destino_cidade', `%${filters.destino_cidade}%`);
      }
      if (filters?.transportadora_id) {
        query = query.eq('transportadora_id', filters.transportadora_id);
      }
      if (filters?.apenas_ativas) {
        query = query.eq('ativo', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by CEP ranges if provided
      let result = data as TransportadoraRota[];

      if (filters?.cep_origem) {
        const cepNum = parseInt(filters.cep_origem.replace(/\D/g, ''));
        result = result.filter(rota => {
          if (!rota.origem_cep_inicio || !rota.origem_cep_fim) return true;
          const inicio = parseInt(rota.origem_cep_inicio.replace(/\D/g, ''));
          const fim = parseInt(rota.origem_cep_fim.replace(/\D/g, ''));
          return cepNum >= inicio && cepNum <= fim;
        });
      }

      if (filters?.cep_destino) {
        const cepNum = parseInt(filters.cep_destino.replace(/\D/g, ''));
        result = result.filter(rota => {
          if (!rota.destino_cep_inicio || !rota.destino_cep_fim) return true;
          const inicio = parseInt(rota.destino_cep_inicio.replace(/\D/g, ''));
          const fim = parseInt(rota.destino_cep_fim.replace(/\D/g, ''));
          return cepNum >= inicio && cepNum <= fim;
        });
      }

      return result;
    },
  });

  // Search routes by origin-destination
  const searchRoutes = async (
    origemEstado: string,
    destinoEstado: string,
    origemCidade?: string,
    destinoCidade?: string
  ) => {
    let query = supabase
      .from('transportadora_rotas')
      .select(`
        *,
        transportadora:transportadoras (
          id,
          nome_fantasia,
          razao_social,
          score_performance,
          homologada,
          email_comercial,
          contato_comercial
        )
      `)
      .eq('origem_estado', origemEstado)
      .eq('destino_estado', destinoEstado)
      .eq('ativo', true);

    if (origemCidade) {
      query = query.ilike('origem_cidade', `%${origemCidade}%`);
    }
    if (destinoCidade) {
      query = query.ilike('destino_cidade', `%${destinoCidade}%`);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Sort by score_performance descending
    return (data as TransportadoraRota[]).sort((a, b) => 
      (b.transportadora?.score_performance || 0) - (a.transportadora?.score_performance || 0)
    );
  };

  // Add new route
  const addRota = useMutation({
    mutationFn: async (formData: RotaFormData) => {
      const { data, error } = await supabase
        .from('transportadora_rotas')
        .insert([formData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transportadora-rotas'] });
      toast.success('Rota adicionada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao adicionar rota');
    },
  });

  // Update route
  const updateRota = useMutation({
    mutationFn: async ({ id, ...formData }: RotaFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('transportadora_rotas')
        .update(formData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transportadora-rotas'] });
      toast.success('Rota atualizada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar rota');
    },
  });

  // Delete route
  const deleteRota = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transportadora_rotas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transportadora-rotas'] });
      toast.success('Rota removida com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao remover rota');
    },
  });

  // Get unique cities from routes
  const { data: cidades } = useQuery({
    queryKey: ['transportadora-rotas-cidades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transportadora_rotas')
        .select('origem_cidade, destino_cidade')
        .eq('ativo', true);

      if (error) throw error;

      const cidadesSet = new Set<string>();
      data.forEach(rota => {
        if (rota.origem_cidade) cidadesSet.add(rota.origem_cidade);
        if (rota.destino_cidade) cidadesSet.add(rota.destino_cidade);
      });

      return Array.from(cidadesSet).sort();
    },
  });

  return {
    rotas: rotas || [],
    cidades: cidades || [],
    isLoading,
    error,
    refetch,
    searchRoutes,
    addRota,
    updateRota,
    deleteRota,
  };
};
