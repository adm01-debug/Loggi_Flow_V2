import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  LayoutDashboard, Truck, Package, Building2, Send, BarChart3, Settings,
  Trophy, Zap, Box, PackageSearch, History, Shield, Target, CalendarDays,
  Calculator, DollarSign, AlertTriangle, Map, Navigation, Users, Bell, 
  FileCheck, Route, Bot, Cog, KeyRound, Award, Upload, Webhook, TrendingUp,
  Activity, Search, List, Smartphone, Info
} from "lucide-react";


interface SearchResult {
  id: string;
  type: 'entrega' | 'coleta' | 'cliente' | 'fornecedor' | 'transportadora' | 'ocorrencia' | 'page';
  title: string;
  subtitle: string;
  status?: string;
  url: string;
  icon?: React.ElementType;
}


interface UseGlobalSearchOptions {
  minQueryLength?: number;
  debounceMs?: number;
}

export function useGlobalSearch(options: UseGlobalSearchOptions = {}) {
  const { minQueryLength = 2 } = options;
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const searchQuery = query.trim().toLowerCase();
  const shouldSearch = searchQuery.length >= minQueryLength;

  // Search entregas
  const { data: entregas = [] } = useQuery({
    queryKey: ['search-entregas', searchQuery],
    queryFn: async () => {
      const { data } = await supabase
        .from('entregas')
        .select('id, numero_entrega, endereco_entrega, status, codigo_rastreamento')
        .or(`numero_entrega.ilike.%${searchQuery}%,endereco_entrega.ilike.%${searchQuery}%,codigo_rastreamento.ilike.%${searchQuery}%`)
        .limit(5);
      return data || [];
    },
    enabled: shouldSearch,
  });

  // Search coletas
  const { data: coletas = [] } = useQuery({
    queryKey: ['search-coletas', searchQuery],
    queryFn: async () => {
      const { data } = await supabase
        .from('coletas')
        .select('id, numero_coleta, endereco_coleta, status, codigo_rastreamento')
        .or(`numero_coleta.ilike.%${searchQuery}%,endereco_coleta.ilike.%${searchQuery}%,codigo_rastreamento.ilike.%${searchQuery}%`)
        .limit(5);
      return data || [];
    },
    enabled: shouldSearch,
  });

  // Search clientes
  const { data: clientes = [] } = useQuery({
    queryKey: ['search-clientes', searchQuery],
    queryFn: async () => {
      const { data } = await supabase
        .from('clientes')
        .select('id, razao_social, nome_fantasia, cnpj, cidade, estado')
        .or(`razao_social.ilike.%${searchQuery}%,nome_fantasia.ilike.%${searchQuery}%,cnpj.ilike.%${searchQuery}%`)
        .limit(5);
      return data || [];
    },
    enabled: shouldSearch,
  });

  // Search fornecedores
  const { data: fornecedores = [] } = useQuery({
    queryKey: ['search-fornecedores', searchQuery],
    queryFn: async () => {
      const { data } = await supabase
        .from('fornecedores')
        .select('id, razao_social, nome_fantasia, cnpj, cidade, estado')
        .or(`razao_social.ilike.%${searchQuery}%,nome_fantasia.ilike.%${searchQuery}%,cnpj.ilike.%${searchQuery}%`)
        .limit(5);
      return data || [];
    },
    enabled: shouldSearch,
  });

  // Search transportadoras
  const { data: transportadoras = [] } = useQuery({
    queryKey: ['search-transportadoras', searchQuery],
    queryFn: async () => {
      const { data } = await supabase
        .from('transportadoras')
        .select('id, razao_social, nome_fantasia, cnpj')
        .or(`razao_social.ilike.%${searchQuery}%,nome_fantasia.ilike.%${searchQuery}%,cnpj.ilike.%${searchQuery}%`)
        .limit(5);
      return data || [];
    },
    enabled: shouldSearch,
  });

  // Combine and format results
  const results = useMemo((): SearchResult[] => {
    const allResults: SearchResult[] = [];

    // Add entregas
    entregas.forEach((e) => {
      allResults.push({
        id: e.id,
        type: 'entrega',
        title: e.numero_entrega,
        subtitle: e.endereco_entrega,
        status: e.status,
        url: '/envios',
      });
    });

    // Add coletas
    coletas.forEach((c) => {
      allResults.push({
        id: c.id,
        type: 'coleta',
        title: c.numero_coleta,
        subtitle: c.endereco_coleta,
        status: c.status,
        url: '/coletas',
      });
    });

    // Add clientes
    clientes.forEach((c) => {
      allResults.push({
        id: c.id,
        type: 'cliente',
        title: c.nome_fantasia || c.razao_social,
        subtitle: `${c.cidade || ''}${c.estado ? `, ${c.estado}` : ''}`,
        url: '/clientes',
      });
    });

    // Add fornecedores
    fornecedores.forEach((f) => {
      allResults.push({
        id: f.id,
        type: 'fornecedor',
        title: f.nome_fantasia || f.razao_social,
        subtitle: `${f.cidade || ''}${f.estado ? `, ${f.estado}` : ''}`,
        url: '/fornecedores',
      });
    });

    // Add transportadoras
    transportadoras.forEach((t) => {
      allResults.push({
        id: t.id,
        type: 'transportadora',
        title: t.nome_fantasia,
        subtitle: t.razao_social,
        url: '/transportadoras',
      });
    });

    return allResults;
  }, [entregas, coletas, clientes, fornecedores, transportadoras]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setIsOpen(false);
  }, []);

  const totalResults = results.length;
  const hasResults = totalResults > 0;
  const isSearching = shouldSearch;

  return {
    query,
    setQuery,
    results,
    totalResults,
    hasResults,
    isSearching,
    isOpen,
    setIsOpen,
    clearSearch,
  };
}

// Helper to get type label in Portuguese
export function getSearchTypeLabel(type: SearchResult['type']): string {
  const labels: Record<SearchResult['type'], string> = {
    entrega: 'Entrega',
    coleta: 'Coleta',
    cliente: 'Cliente',
    fornecedor: 'Fornecedor',
    transportadora: 'Transportadora',
    ocorrencia: 'Ocorrência',
  };
  return labels[type] || type;
}

// Helper to get type color
export function getSearchTypeColor(type: SearchResult['type']): string {
  const colors: Record<SearchResult['type'], string> = {
    entrega: 'bg-success/10 text-success',
    coleta: 'bg-info/10 text-info',
    cliente: 'bg-primary/10 text-primary',
    fornecedor: 'bg-warning/10 text-warning',
    transportadora: 'bg-accent text-accent-foreground',
    ocorrencia: 'bg-destructive/10 text-destructive',
  };
  return colors[type] || 'bg-muted text-muted-foreground';
}
