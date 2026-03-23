import { useState } from 'react';
import { Truck, MapPin, Clock, DollarSign, Star, ChevronDown, ChevronUp, Phone, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { TransportadoraRota } from '@/hooks/useTransportadoraRotas';
import { formatCurrency } from '@/lib/formatters';

interface RotaResultsListProps {
  rotas: TransportadoraRota[];
  isLoading?: boolean;
  onSelectRota?: (rota: TransportadoraRota) => void;
}

export function RotaResultsList({ rotas, isLoading, onSelectRota }: RotaResultsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-6 bg-muted rounded w-1/3 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (rotas.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium mb-1">Nenhuma rota encontrada</h3>
          <p className="text-sm text-muted-foreground">
            Tente ajustar os filtros de busca ou cadastre novas rotas para as transportadoras.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group routes by transportadora
  const groupedByTransportadora = rotas.reduce((acc, rota) => {
    const key = rota.transportadora_id;
    if (!acc[key]) {
      acc[key] = {
        transportadora: rota.transportadora,
        rotas: [],
      };
    }
    acc[key].rotas.push(rota);
    return acc;
  }, {} as Record<string, { transportadora: TransportadoraRota['transportadora']; rotas: TransportadoraRota[] }>);

  const sortedGroups = Object.values(groupedByTransportadora).sort((a, b) => 
    (b.transportadora?.score_performance || 0) - (a.transportadora?.score_performance || 0)
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {rotas.length} rota(s) encontrada(s) em {sortedGroups.length} transportadora(s)
        </p>
      </div>

      {sortedGroups.map((group, index) => {
        const isExpanded = expandedId === group.transportadora?.id;
        const score = group.transportadora?.score_performance || 0;
        const bestRota = group.rotas[0];

        return (
          <Card 
            key={group.transportadora?.id} 
            className={`transition-all ${index === 0 ? 'border-primary/50 bg-primary/5' : ''}`}
          >
            <Collapsible open={isExpanded} onOpenChange={() => setExpandedId(isExpanded ? null : group.transportadora?.id || null)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {index === 0 && (
                      <Badge className="bg-warning text-warning-foreground">
                        <Star className="h-3 w-3 mr-1" />
                        Melhor opção
                      </Badge>
                    )}
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Truck className="h-5 w-5" />
                        {group.transportadora?.nome_fantasia || 'Transportadora'}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {group.transportadora?.razao_social}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Performance Score */}
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <Star className={`h-4 w-4 ${score >= 80 ? 'text-yellow-500' : score >= 50 ? 'text-blue-500' : 'text-muted-foreground'}`} />
                        <span className="font-bold">{score}</span>
                        <span className="text-xs text-muted-foreground">pts</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Performance</p>
                    </div>

                    {/* Expand button */}
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>

                {/* Quick info */}
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {bestRota.origem_cidade || bestRota.origem_estado} → {bestRota.destino_cidade || bestRota.destino_estado}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{bestRota.prazo_dias} dias</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {formatCurrency(bestRota.taxa_fixa)} + {formatCurrency(bestRota.preco_por_kg)}/kg
                    </span>
                  </div>
                  <Badge variant={group.transportadora?.homologada ? 'default' : 'secondary'}>
                    {group.transportadora?.homologada ? 'Homologada' : 'Não homologada'}
                  </Badge>
                </div>
              </CardHeader>

              <CollapsibleContent>
                <CardContent className="pt-0">
                  {/* All routes for this carrier */}
                  {group.rotas.length > 1 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Todas as rotas ({group.rotas.length})</h4>
                      <div className="space-y-2">
                        {group.rotas.map((rota) => (
                          <div 
                            key={rota.id} 
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-center gap-4">
                              <div className="text-sm">
                                <span className="font-medium">
                                  {rota.origem_cidade || rota.origem_estado}
                                </span>
                                <span className="mx-2">→</span>
                                <span className="font-medium">
                                  {rota.destino_cidade || rota.destino_estado}
                                </span>
                              </div>
                              {rota.origem_cep_inicio && rota.destino_cep_inicio && (
                                <span className="text-xs text-muted-foreground">
                                  CEP: {rota.origem_cep_inicio}-{rota.origem_cep_fim} → {rota.destino_cep_inicio}-{rota.destino_cep_fim}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span>{rota.prazo_dias}d</span>
                              <span>{formatCurrency(rota.taxa_fixa)} + {formatCurrency(rota.preco_por_kg)}/kg</span>
                              {onSelectRota && (
                                <Button size="sm" variant="outline" onClick={() => onSelectRota(rota)}>
                                  Selecionar
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact info - placeholder since we don't have email/phone in joined data */}
                  <div className="mt-4 pt-4 border-t flex items-center gap-4">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Phone className="h-4 w-4" />
                      Contato
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Button>
                    {onSelectRota && (
                      <Button size="sm" className="ml-auto" onClick={() => onSelectRota(bestRota)}>
                        Selecionar esta transportadora
                      </Button>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
}
