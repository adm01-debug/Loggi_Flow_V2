import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Route, Plus, Truck, Upload } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RotaSearchFilter } from '@/components/transportadoras/RotaSearchFilter';
import { RotaResultsList } from '@/components/transportadoras/RotaResultsList';
import { RotaFormDialog } from '@/components/transportadoras/RotaFormDialog';
import { BulkRouteImport } from '@/components/transportadoras/BulkRouteImport';
import { useTransportadoraRotas, RotaFilter, TransportadoraRota } from '@/hooks/useTransportadoraRotas';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function RotasTransportadoras() {
  const [activeFilters, setActiveFilters] = useState<RotaFilter>({ apenas_ativas: true });
  const [searchResults, setSearchResults] = useState<TransportadoraRota[] | null>(null);
  
  const { rotas, isLoading, addRota, deleteRota } = useTransportadoraRotas(activeFilters);

  // Fetch transportadoras for the form
  const { data: transportadoras = [] } = useQuery({
    queryKey: ['transportadoras-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transportadoras')
        .select('id, nome_fantasia')
        .eq('homologada', true)
        .order('nome_fantasia');
      
      if (error) throw error;
      return data;
    },
  });

  const handleSearch = (filters: RotaFilter) => {
    setActiveFilters(filters);
    setSearchResults(null); // Use main query results
  };

  const handleClear = () => {
    setActiveFilters({ apenas_ativas: true });
    setSearchResults(null);
  };

  const handleSelectRota = (rota: TransportadoraRota) => {
    toast.success(`Transportadora ${rota.transportadora?.nome_fantasia} selecionada!`);
    // Here you could emit an event or call a callback to use this carrier
  };

  const displayedRotas = searchResults || rotas;

  return (
    <MainLayout>
      <PageHeader
        title="Rotas de Transportadoras"
        description="Busque e gerencie as rotas e praças atendidas por cada transportadora"
        icon={Route}
        actions={
          <RotaFormDialog
            transportadoras={transportadoras}
            onSubmit={(data) => addRota.mutate(data)}
            isLoading={addRota.isPending}
          />
        }
      />

      <Tabs defaultValue="buscar" className="space-y-6">
        <TabsList>
          <TabsTrigger value="buscar" className="gap-2">
            <Route className="h-4 w-4" />
            Buscar Rotas
          </TabsTrigger>
          <TabsTrigger value="gerenciar" className="gap-2">
            <Truck className="h-4 w-4" />
            Gerenciar Rotas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buscar" className="space-y-6">
          <RotaSearchFilter
            onSearch={handleSearch}
            onClear={handleClear}
            isLoading={isLoading}
          />

          <RotaResultsList
            rotas={displayedRotas}
            isLoading={isLoading}
            onSelectRota={handleSelectRota}
          />
        </TabsContent>

        <TabsContent value="gerenciar" className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {rotas.length} rota(s) cadastrada(s)
            </p>
            <RotaFormDialog
              transportadoras={transportadoras}
              onSubmit={(data) => addRota.mutate(data)}
              isLoading={addRota.isPending}
            />
          </div>

          <RotaResultsList
            rotas={rotas}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
