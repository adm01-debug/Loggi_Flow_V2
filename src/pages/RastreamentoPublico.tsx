import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Package, 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Search,
  ArrowRight,
  Phone,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface TrackingResult {
  tipo: 'entrega' | 'coleta';
  numero: string;
  status: string;
  endereco: string;
  previsao: string | null;
  transportadora: string | null;
  contato: string | null;
  cliente: string | null;
  dataDespacho: string | null;
  dataEntrega: string | null;
  recebedor: string | null;
  codigoRastreamento: string | null;
  linkRastreamento: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  aguardando_producao: { label: 'Aguardando Produção', color: 'bg-gray-100 text-gray-700', icon: Clock },
  pronto_despacho: { label: 'Pronto para Despacho', color: 'bg-blue-100 text-blue-700', icon: Package },
  cotacao_frete: { label: 'Em Cotação', color: 'bg-purple-100 text-purple-700', icon: Building2 },
  nf_emitida: { label: 'NF Emitida', color: 'bg-indigo-100 text-indigo-700', icon: Package },
  despachado: { label: 'Despachado', color: 'bg-cyan-100 text-cyan-700', icon: Truck },
  em_transito: { label: 'Em Trânsito', color: 'bg-amber-100 text-amber-700', icon: Truck },
  saiu_entrega: { label: 'Saiu para Entrega', color: 'bg-orange-100 text-orange-700', icon: Truck },
  entregue: { label: 'Entregue', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  ocorrencia: { label: 'Ocorrência', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  finalizado: { label: 'Finalizado', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  aguardando_liberacao: { label: 'Aguardando Liberação', color: 'bg-gray-100 text-gray-700', icon: Clock },
  solicitada: { label: 'Solicitada', color: 'bg-blue-100 text-blue-700', icon: Package },
  chegou_expedicao: { label: 'Chegou na Expedição', color: 'bg-teal-100 text-teal-700', icon: Building2 },
  conferencia_ok: { label: 'Conferência OK', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  divergencia: { label: 'Divergência', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  finalizada: { label: 'Finalizada', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
};

const timelineSteps = {
  entrega: [
    { status: 'aguardando_producao', label: 'Produção' },
    { status: 'pronto_despacho', label: 'Pronto' },
    { status: 'despachado', label: 'Despachado' },
    { status: 'em_transito', label: 'Em Trânsito' },
    { status: 'saiu_entrega', label: 'Saiu Entrega' },
    { status: 'entregue', label: 'Entregue' },
  ],
  coleta: [
    { status: 'aguardando_liberacao', label: 'Liberação' },
    { status: 'solicitada', label: 'Solicitada' },
    { status: 'em_transito', label: 'Em Trânsito' },
    { status: 'chegou_expedicao', label: 'Expedição' },
    { status: 'conferencia_ok', label: 'Conferida' },
    { status: 'finalizada', label: 'Finalizada' },
  ],
};

export default function RastreamentoPublico() {
  const [searchCode, setSearchCode] = useState('');
  const [submittedCode, setSubmittedCode] = useState('');

  const { data: result, isLoading, error } = useQuery({
    queryKey: ['public-tracking', submittedCode],
    queryFn: async (): Promise<TrackingResult | null> => {
      if (!submittedCode) return null;

      // Try to find in entregas first
      const { data: entrega } = await supabase
        .from('entregas')
        .select(`
          numero_entrega,
          status,
          endereco_entrega,
          previsao_entrega,
          contato_cliente,
          data_despacho,
          data_entrega_efetiva,
          recebedor,
          codigo_rastreamento,
          link_rastreamento,
          transportadoras (nome_fantasia),
          clientes (razao_social)
        `)
        .or(`numero_entrega.ilike.%${submittedCode}%,codigo_rastreamento.ilike.%${submittedCode}%`)
        .limit(1)
        .single();

      if (entrega) {
        return {
          tipo: 'entrega',
          numero: entrega.numero_entrega,
          status: entrega.status,
          endereco: entrega.endereco_entrega,
          previsao: entrega.previsao_entrega,
          transportadora: (entrega.transportadoras as any)?.nome_fantasia || null,
          contato: entrega.contato_cliente,
          cliente: (entrega.clientes as any)?.razao_social || null,
          dataDespacho: entrega.data_despacho,
          dataEntrega: entrega.data_entrega_efetiva,
          recebedor: entrega.recebedor,
          codigoRastreamento: entrega.codigo_rastreamento,
          linkRastreamento: entrega.link_rastreamento,
        };
      }

      // Try coletas
      const { data: coleta } = await supabase
        .from('coletas')
        .select(`
          numero_coleta,
          status,
          endereco_coleta,
          data_prevista_coleta,
          contato_coleta,
          data_efetiva_coleta,
          codigo_rastreamento,
          link_rastreamento,
          transportadoras (nome_fantasia),
          fornecedores (razao_social)
        `)
        .or(`numero_coleta.ilike.%${submittedCode}%,codigo_rastreamento.ilike.%${submittedCode}%`)
        .limit(1)
        .single();

      if (coleta) {
        return {
          tipo: 'coleta',
          numero: coleta.numero_coleta,
          status: coleta.status,
          endereco: coleta.endereco_coleta,
          previsao: coleta.data_prevista_coleta,
          transportadora: (coleta.transportadoras as any)?.nome_fantasia || null,
          contato: coleta.contato_coleta,
          cliente: (coleta.fornecedores as any)?.razao_social || null,
          dataDespacho: coleta.data_efetiva_coleta,
          dataEntrega: null,
          recebedor: null,
          codigoRastreamento: coleta.codigo_rastreamento,
          linkRastreamento: coleta.link_rastreamento,
        };
      }

      return null;
    },
    enabled: !!submittedCode,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCode.trim()) {
      setSubmittedCode(searchCode.trim());
    }
  };

  const getStatusIndex = (result: TrackingResult) => {
    const steps = timelineSteps[result.tipo];
    const index = steps.findIndex(s => s.status === result.status);
    return index >= 0 ? index : 0;
  };

  const statusInfo = result ? statusConfig[result.status] : null;
  const StatusIcon = statusInfo?.icon || Package;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Truck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Rastreamento de Entregas</h1>
              <p className="text-sm text-muted-foreground">Acompanhe sua encomenda em tempo real</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Rastrear Encomenda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-3">
              <Input
                placeholder="Digite o número da entrega ou código de rastreamento..."
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !searchCode.trim()}>
                {isLoading ? 'Buscando...' : 'Rastrear'}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">
              Ex: ENT-2024-001 ou código de rastreamento da transportadora
            </p>
          </CardContent>
        </Card>

        {/* Result */}
        {submittedCode && !isLoading && !result && (
          <Card className="border-destructive/50">
            <CardContent className="py-8 text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Encomenda não encontrada</h3>
              <p className="text-muted-foreground">
                Verifique o código digitado e tente novamente.
              </p>
            </CardContent>
          </Card>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Status Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <Badge variant="outline" className="mb-2">
                      {result.tipo === 'entrega' ? 'Entrega' : 'Coleta'}
                    </Badge>
                    <h2 className="text-2xl font-bold">{result.numero}</h2>
                    {result.cliente && (
                      <p className="text-muted-foreground">{result.cliente}</p>
                    )}
                  </div>
                  <Badge className={statusInfo?.color}>
                    <StatusIcon className="h-4 w-4 mr-1" />
                    {statusInfo?.label}
                  </Badge>
                </div>

                {/* Timeline */}
                <div className="mb-6">
                  <div className="flex items-center justify-between relative">
                    {timelineSteps[result.tipo].map((step, index) => {
                      const currentIndex = getStatusIndex(result);
                      const isCompleted = index <= currentIndex;
                      const isCurrent = index === currentIndex;
                      
                      return (
                        <div key={step.status} className="flex flex-col items-center z-10">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                              isCompleted
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'bg-background border-muted-foreground/30 text-muted-foreground'
                            } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <span className="text-xs">{index + 1}</span>
                            )}
                          </div>
                          <span className={`text-xs mt-2 text-center ${isCompleted ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                    {/* Progress line */}
                    <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted-foreground/20 -z-0">
                      <div 
                        className="h-full bg-primary transition-all"
                        style={{ width: `${(getStatusIndex(result) / (timelineSteps[result.tipo].length - 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Details */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Endereço de {result.tipo === 'entrega' ? 'Entrega' : 'Coleta'}</p>
                      <p className="text-sm text-muted-foreground">{result.endereco}</p>
                    </div>
                  </div>

                  {result.previsao && (
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Previsão</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(result.previsao), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  )}

                  {result.transportadora && (
                    <div className="flex items-start gap-3">
                      <Truck className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Transportadora</p>
                        <p className="text-sm text-muted-foreground">{result.transportadora}</p>
                      </div>
                    </div>
                  )}

                  {result.contato && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Contato</p>
                        <p className="text-sm text-muted-foreground">{result.contato}</p>
                      </div>
                    </div>
                  )}

                  {result.dataEntrega && (
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Entregue em</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(result.dataEntrega), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                        {result.recebedor && (
                          <p className="text-xs text-muted-foreground">Recebedor: {result.recebedor}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* External tracking link */}
                {result.linkRastreamento && (
                  <>
                    <Separator className="my-6" />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Rastreamento da Transportadora</p>
                        {result.codigoRastreamento && (
                          <p className="text-xs text-muted-foreground">Código: {result.codigoRastreamento}</p>
                        )}
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <a href={result.linkRastreamento} target="_blank" rel="noopener noreferrer">
                          Ver no site <ArrowRight className="h-4 w-4 ml-1" />
                        </a>
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Sistema de Gestão Logística © {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
