import { useState } from 'react';
import { Search, MapPin, ArrowRight, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { RotaFilter } from '@/hooks/useTransportadoraRotas';

const ESTADOS_BRASIL = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
];

interface RotaSearchFilterProps {
  onSearch: (filters: RotaFilter) => void;
  onClear: () => void;
  isLoading?: boolean;
}

export function RotaSearchFilter({ onSearch, onClear, isLoading }: RotaSearchFilterProps) {
  const [filters, setFilters] = useState<RotaFilter>({
    apenas_ativas: true,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleClear = () => {
    setFilters({ apenas_ativas: true });
    onClear();
  };

  const hasFilters = filters.origem_estado || filters.destino_estado || 
    filters.origem_cidade || filters.destino_cidade ||
    filters.cep_origem || filters.cep_destino;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Search className="h-5 w-5" />
          Buscar Rotas de Transportadoras
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main search: Origin to Destination */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-end">
          {/* Origin */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-green-500" />
              Origem
            </Label>
            <Select
              value={filters.origem_estado || ''}
              onValueChange={(value) => setFilters({ ...filters, origem_estado: value || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado de origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os estados</SelectItem>
                {ESTADOS_BRASIL.map((estado) => (
                  <SelectItem key={estado.sigla} value={estado.sigla}>
                    {estado.sigla} - {estado.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Arrow */}
          <div className="hidden md:flex items-center justify-center pb-2">
            <ArrowRight className="h-6 w-6 text-muted-foreground" />
          </div>

          {/* Destination */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-red-500" />
              Destino
            </Label>
            <Select
              value={filters.destino_estado || ''}
              onValueChange={(value) => setFilters({ ...filters, destino_estado: value || undefined })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado de destino" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os estados</SelectItem>
                {ESTADOS_BRASIL.map((estado) => (
                  <SelectItem key={estado.sigla} value={estado.sigla}>
                    {estado.sigla} - {estado.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced filters */}
        <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              {showAdvanced ? 'Ocultar' : 'Mostrar'} filtros avançados
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Origin city */}
              <div className="space-y-2">
                <Label>Cidade de Origem</Label>
                <Input
                  value={filters.origem_cidade || ''}
                  onChange={(e) => setFilters({ ...filters, origem_cidade: e.target.value || undefined })}
                  placeholder="Ex: Curitiba"
                />
              </div>

              {/* Destination city */}
              <div className="space-y-2">
                <Label>Cidade de Destino</Label>
                <Input
                  value={filters.destino_cidade || ''}
                  onChange={(e) => setFilters({ ...filters, destino_cidade: e.target.value || undefined })}
                  placeholder="Ex: São Paulo"
                />
              </div>

              {/* Origin CEP */}
              <div className="space-y-2">
                <Label>CEP de Origem</Label>
                <Input
                  value={filters.cep_origem || ''}
                  onChange={(e) => setFilters({ ...filters, cep_origem: e.target.value || undefined })}
                  placeholder="Ex: 80000-000"
                  maxLength={9}
                />
              </div>

              {/* Destination CEP */}
              <div className="space-y-2">
                <Label>CEP de Destino</Label>
                <Input
                  value={filters.cep_destino || ''}
                  onChange={(e) => setFilters({ ...filters, cep_destino: e.target.value || undefined })}
                  placeholder="Ex: 01000-000"
                  maxLength={9}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleSearch} disabled={isLoading} className="gap-2">
            <Search className="h-4 w-4" />
            Buscar Transportadoras
          </Button>
          
          {hasFilters && (
            <Button variant="outline" onClick={handleClear} className="gap-2">
              <X className="h-4 w-4" />
              Limpar
            </Button>
          )}

          {hasFilters && (
            <div className="flex flex-wrap gap-1 ml-2">
              {filters.origem_estado && (
                <Badge variant="secondary">Origem: {filters.origem_estado}</Badge>
              )}
              {filters.destino_estado && (
                <Badge variant="secondary">Destino: {filters.destino_estado}</Badge>
              )}
              {filters.origem_cidade && (
                <Badge variant="secondary">Cidade origem: {filters.origem_cidade}</Badge>
              )}
              {filters.destino_cidade && (
                <Badge variant="secondary">Cidade destino: {filters.destino_cidade}</Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
