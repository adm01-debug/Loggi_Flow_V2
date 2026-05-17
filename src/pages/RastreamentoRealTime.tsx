import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Truck, Package, MapPin, Clock, CheckCircle2, AlertTriangle, 
  ArrowLeft, RefreshCw, User, Calendar, History, Navigation,
  ChevronRight, MoreVertical, ExternalLink
} from 'lucide-react';
import { useUnifiedTracking, UnifiedShipment } from '@/hooks/useUnifiedTracking';
import { useRecordHistory } from '@/hooks/useAuditLogs';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

function formatDate(date: string | null): string {
  if (!date) return '—';
  try {
    return format(parseISO(date), 'dd/MM/yy HH:mm', { locale: ptBR });
  } catch {
    return date;
  }
}

export default function RastreamentoRealTime() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { allShipments, isLoading, refetch, getStatusColor } = useUnifiedTracking();
  
  const shipment = useMemo(() => 
    allShipments.find(s => s.id === id), 
    [allShipments, id]
  );

  const { data: history, isLoading: loadingHistory } = useRecordHistory(
    id || '', 
    shipment?.tipo === 'entrega' ? 'entregas' : 'coletas'
  );

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <RefreshCw className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando dados do frete...</p>
        </div>
      </MainLayout>
    );
  }

  if (!shipment) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <AlertTriangle className="w-16 h-16 text-warning mb-4" />
          <h2 className="text-2xl font-bold">Frete não encontrado</h2>
          <p className="text-muted-foreground mb-6">O código informado não corresponde a nenhum frete ativo.</p>
          <Button onClick={() => navigate('/central-rastreamento')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Central
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header com Navegação */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">
                  {shipment.numero}
                </h1>
                <Badge 
                  style={{ backgroundColor: shipment.statusColor + '20', color: shipment.statusColor, borderColor: shipment.statusColor + '40' }}
                  className="px-3 py-1"
                >
                  {shipment.statusLabel}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm flex items-center gap-2">
                {shipment.tipo === 'entrega' ? <Package className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                {shipment.tipo === 'entrega' ? 'Entrega' : 'Coleta'} unificada • {shipment.transportadora}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {shipment.codigoRastreamento && (
              <Button variant="outline" size="sm" onClick={() => window.open(shipment.codigoRastreamento || '', '_blank')}>
                <ExternalLink className="w-4 h-4 mr-2" /> Rastreamento Externo
              </Button>
            )}
            <Button variant="default" size="sm" onClick={refetch}>
              <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline de Eventos Principais */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-primary" />
                  Status em Tempo Real
                </CardTitle>
                <Badge variant="outline" className="text-[10px] animate-pulse">
                  <div className="w-1.5 h-1.5 rounded-full bg-success mr-1.5" />
                  Live
                </Badge>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="relative pb-4">
                  {/* Linha vertical da timeline */}
                  <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-muted-foreground/20" />
                  
                  <div className="space-y-8 relative">
                    {/* Evento Atual */}
                    <div className="flex gap-4">
                      <div className="z-10 flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 ring-4 ring-background">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-lg">{shipment.statusLabel}</h4>
                          <span className="text-xs font-medium text-muted-foreground">{formatDate(new Date().toISOString())}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Última atualização registrada no sistema Nexus.
                        </p>
                      </div>
                    </div>

                    {/* Origem e Destino */}
                    <div className="flex gap-4">
                      <div className="z-10 flex items-center justify-center w-12 h-12 rounded-full bg-muted text-muted-foreground ring-4 ring-background">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-3 rounded-lg bg-muted/30 border">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Origem</span>
                            <p className="text-sm font-medium">{shipment.origem}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-1">Destino Final</span>
                            <p className="text-sm font-medium">{shipment.destino}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Previsão */}
                    <div className="flex gap-4">
                      <div className="z-10 flex items-center justify-center w-12 h-12 rounded-full bg-muted text-muted-foreground ring-4 ring-background">
                        <Clock className="w-6 h-6" />
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold">Entrega Prevista</h4>
                          <Badge variant={shipment.atrasado ? "destructive" : "secondary"}>
                            {formatDate(shipment.previsao)}
                          </Badge>
                        </div>
                        {shipment.atrasado && (
                          <div className="mt-2 p-2 rounded bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-xs text-destructive">
                            <AlertTriangle className="w-3 h-3" />
                            Atraso detectado de {shipment.diasAtraso} dia(s).
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Histórico Detalhado (Audit Logs) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Histórico de Eventos & Responsáveis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingHistory ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !history || history.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhum histórico detalhado disponível para este frete.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((log, idx) => (
                      <div key={log.id} className="group relative">
                        {idx !== history.length - 1 && (
                          <div className="absolute left-[19px] top-10 bottom-[-16px] w-0.5 bg-muted" />
                        )}
                        <div className="flex gap-4">
                          <div className="mt-1.5 z-10 w-10 h-10 rounded-full bg-muted flex items-center justify-center border-2 border-background group-hover:bg-primary/10 transition-colors">
                            <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors" />
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-bold">
                                {log.action === 'INSERT' ? 'Registro Inicial' : 'Atualização de Sistema'}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {formatDate(log.created_at)}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-2">
                              {log.changed_fields && log.changed_fields.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {log.changed_fields.map(field => (
                                    <Badge key={field} variant="outline" className="text-[9px] font-normal py-0">
                                      {field}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-muted/50 text-[10px] border">
                                  <User className="w-3 h-3" />
                                  {log.user_name || log.user_email || 'Sistema Nexus'}
                                </div>
                                {log.ip_address && (
                                  <span className="text-[9px] font-mono opacity-50">IP: {log.ip_address}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar de Informações */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Detalhes da Carga</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground">Cliente / Fornecedor</label>
                  <p className="font-bold text-sm">{shipment.cliente || 'Não informado'}</p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Transportadora</label>
                    <p className="font-bold text-sm">{shipment.transportadora}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">NF Remessa</label>
                    <p className="font-bold text-sm font-mono">{shipment.nfRemessa || '—'}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <label className="text-xs text-muted-foreground">Valor do Frete</label>
                  <p className="font-bold text-sm text-primary">
                    {shipment.valorFrete 
                      ? `R$ ${shipment.valorFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                      : 'Sob consulta'}
                  </p>
                </div>
                {shipment.codigoRastreamento && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-xs text-muted-foreground">Código Tracking</label>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-mono text-xs bg-muted p-1 rounded border flex-1 truncate">
                          {shipment.codigoRastreamento}
                        </p>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                          navigator.clipboard.writeText(shipment.codigoRastreamento || '');
                        }}>
                          <History className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Equipe Responsável
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold">Gestor Logístico</p>
                    <p className="text-[10px] text-muted-foreground">Promobrindes SP - Matriz</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Truck className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold">{shipment.transportadora}</p>
                    <p className="text-[10px] text-muted-foreground">Transportador Homologado</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full text-xs" size="sm">
                  Acionar Suporte Nexus
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
