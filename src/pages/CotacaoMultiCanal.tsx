import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, Truck, MapPin, Loader2, MessageCircle, Mail, Zap, 
  Phone, Globe, CheckCircle2, Clock, DollarSign, Send, Plus,
  ArrowRight, Star, AlertCircle
} from 'lucide-react';
import { useTransportadoraRotas, type TransportadoraRota } from '@/hooks/useTransportadoraRotas';
import { useRodonavesTracking } from '@/hooks/useRodonavesTracking';
import { useMelhorEnvio } from '@/hooks/useMelhorEnvio';
import { useCotacoesMulticanal } from '@/hooks/useCotacoesMulticanal';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

const ESTADOS_BRASIL = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

interface CotacaoManual {
  id: string;
  transportadora_id: string;
  transportadora_nome: string;
  canal: 'api' | 'whatsapp' | 'email';
  valor: number | null;
  prazo_dias: number | null;
  status: 'pendente' | 'respondido' | 'expirado';
  observacoes: string;
  created_at: string;
}

interface TransportadoraComCanal extends TransportadoraRota {
  canal_cotacao: 'api' | 'whatsapp' | 'email';
  whatsapp?: string | null;
  email?: string | null;
  api_disponivel?: boolean;
}

export default function CotacaoMultiCanal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { searchRoutes } = useTransportadoraRotas();
  const rodonaves = useRodonavesTracking();
  const { createCotacao } = useCotacoesMulticanal();
  
  const [origemEstado, setOrigemEstado] = useState('');
  const [destinoEstado, setDestinoEstado] = useState('');
  const [origemCidade, setOrigemCidade] = useState('');
  const [destinoCidade, setDestinoCidade] = useState('');
  const [pesoKg, setPesoKg] = useState('');
  const [volumes, setVolumes] = useState('1');
  const [valorMercadoria, setValorMercadoria] = useState('');
  
  const [carriers, setCarriers] = useState<TransportadoraComCanal[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Manual quotation dialog
  const [manualDialog, setManualDialog] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<TransportadoraComCanal | null>(null);
  const [manualValor, setManualValor] = useState('');
  const [manualPrazo, setManualPrazo] = useState('');
  const [manualObs, setManualObs] = useState('');
  
  // Cotações registradas para esta busca
  const [cotacoes, setCotacoes] = useState<CotacaoManual[]>([]);

  const handleSearch = async () => {
    if (!origemEstado || !destinoEstado) {
      toast.error('Selecione os estados de origem e destino');
      return;
    }
    
    setIsSearching(true);
    setHasSearched(true);
    setCotacoes([]);
    
    try {
      const results = await searchRoutes(
        origemEstado, 
        destinoEstado, 
        origemCidade || undefined, 
        destinoCidade || undefined
      );
      
      // Enrich with channel info from transportadora
      const enriched: TransportadoraComCanal[] = results.map(rota => {
        const t = rota.transportadora as any;
        const hasApi = t?.api_disponivel === true;
        const hasWhatsapp = !!t?.whatsapp_operacional;
        const hasEmail = !!t?.email_comercial;
        
        let canal: 'api' | 'whatsapp' | 'email' = 'email';
        if (hasApi) canal = 'api';
        else if (hasWhatsapp) canal = 'whatsapp';
        
        return {
          ...rota,
          canal_cotacao: canal,
          whatsapp: t?.whatsapp_operacional,
          email: t?.email_comercial,
          api_disponivel: hasApi,
        };
      });
      
      setCarriers(enriched);
      
      if (enriched.length === 0) {
        toast.info('Nenhuma transportadora encontrada para este trecho');
      } else {
        toast.success(`${enriched.length} transportadora(s) encontrada(s)`);
      }
    } catch (error) {
      toast.error('Erro ao buscar transportadoras');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCotarAPI = async (carrier: TransportadoraComCanal) => {
    if (!pesoKg) {
      toast.error('Informe o peso para cotar via API');
      return;
    }
    
    toast.info(`Cotando via API para ${carrier.transportadora?.nome_fantasia}...`);
    
    try {
      const valorCalculado = carrier.taxa_fixa + (carrier.preco_por_kg * parseFloat(pesoKg));
      
      // Persist to DB
      await createCotacao.mutateAsync({
        transportadora_id: carrier.transportadora_id,
        canal: 'api',
        origem_estado: origemEstado,
        origem_cidade: origemCidade || undefined,
        destino_estado: destinoEstado,
        destino_cidade: destinoCidade || undefined,
        peso_kg: parseFloat(pesoKg),
        volumes: parseInt(volumes),
        valor_mercadoria: valorMercadoria ? parseFloat(valorMercadoria) : undefined,
        valor_cotado: valorCalculado,
        prazo_dias: carrier.prazo_dias,
        observacoes: 'Cotação via tabela de frete cadastrada',
        status: 'respondido',
      });
      
      // Also add to local state for immediate UI
      const newCotacao: CotacaoManual = {
        id: crypto.randomUUID(),
        transportadora_id: carrier.transportadora_id,
        transportadora_nome: carrier.transportadora?.nome_fantasia || 'N/A',
        canal: 'api',
        valor: valorCalculado,
        prazo_dias: carrier.prazo_dias,
        status: 'respondido',
        observacoes: 'Cotação via tabela de frete cadastrada',
        created_at: new Date().toISOString(),
      };
      setCotacoes(prev => [...prev, newCotacao]);
      toast.success(`Cotação API recebida: R$ ${valorCalculado.toFixed(2)}`);
    } catch {
      toast.error('Erro na cotação via API');
    }
  };

  const handleCotarWhatsApp = (carrier: TransportadoraComCanal) => {
    const peso = pesoKg || '(não informado)';
    const msg = encodeURIComponent(
      `Olá! Gostaria de cotar um frete:\n\n` +
      `📍 Origem: ${origemEstado}${origemCidade ? ' - ' + origemCidade : ''}\n` +
      `📍 Destino: ${destinoEstado}${destinoCidade ? ' - ' + destinoCidade : ''}\n` +
      `📦 Peso: ${peso} kg\n` +
      `📦 Volumes: ${volumes}\n` +
      `💰 Valor Mercadoria: R$ ${valorMercadoria || '(não informado)'}\n\n` +
      `Aguardo retorno com valor e prazo. Obrigado!`
    );
    
    const phone = carrier.whatsapp?.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    
    // Register as pending
    const newCotacao: CotacaoManual = {
      id: crypto.randomUUID(),
      transportadora_id: carrier.transportadora_id,
      transportadora_nome: carrier.transportadora?.nome_fantasia || 'N/A',
      canal: 'whatsapp',
      valor: null,
      prazo_dias: null,
      status: 'pendente',
      observacoes: 'Mensagem enviada via WhatsApp',
      created_at: new Date().toISOString(),
    };
    setCotacoes(prev => [...prev, newCotacao]);
    toast.success('Mensagem WhatsApp aberta! Registre a resposta quando receber.');
  };

  const handleCotarEmail = (carrier: TransportadoraComCanal) => {
    const peso = pesoKg || '(não informado)';
    const subject = encodeURIComponent(`Cotação de Frete - ${origemEstado} → ${destinoEstado}`);
    const body = encodeURIComponent(
      `Prezados,\n\n` +
      `Solicito cotação de frete conforme dados abaixo:\n\n` +
      `Origem: ${origemEstado}${origemCidade ? ' - ' + origemCidade : ''}\n` +
      `Destino: ${destinoEstado}${destinoCidade ? ' - ' + destinoCidade : ''}\n` +
      `Peso: ${peso} kg\n` +
      `Volumes: ${volumes}\n` +
      `Valor Mercadoria: R$ ${valorMercadoria || '(não informado)'}\n\n` +
      `Favor informar valor e prazo de entrega.\n\n` +
      `Atenciosamente.`
    );
    
    window.open(`mailto:${carrier.email}?subject=${subject}&body=${body}`, '_blank');
    
    const newCotacao: CotacaoManual = {
      id: crypto.randomUUID(),
      transportadora_id: carrier.transportadora_id,
      transportadora_nome: carrier.transportadora?.nome_fantasia || 'N/A',
      canal: 'email',
      valor: null,
      prazo_dias: null,
      status: 'pendente',
      observacoes: 'Email enviado',
      created_at: new Date().toISOString(),
    };
    setCotacoes(prev => [...prev, newCotacao]);
    toast.success('Email aberto! Registre a resposta quando receber.');
  };

  const handleRegistrarResposta = () => {
    if (!selectedCarrier || !manualValor) {
      toast.error('Informe pelo menos o valor');
      return;
    }
    
    setCotacoes(prev => prev.map(c => 
      c.transportadora_id === selectedCarrier.transportadora_id && c.status === 'pendente'
        ? { ...c, valor: parseFloat(manualValor), prazo_dias: manualPrazo ? parseInt(manualPrazo) : null, status: 'respondido' as const, observacoes: manualObs || c.observacoes }
        : c
    ));
    
    toast.success('Resposta registrada com sucesso!');
    setManualDialog(false);
    setManualValor('');
    setManualPrazo('');
    setManualObs('');
    setSelectedCarrier(null);
  };

  const canalIcon = (canal: string) => {
    switch (canal) {
      case 'api': return <Globe className="w-4 h-4" />;
      case 'whatsapp': return <MessageCircle className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      default: return null;
    }
  };

  const canalBadge = (canal: string) => {
    switch (canal) {
      case 'api': return <Badge className="bg-green-500/10 text-green-600 border-green-200"><Globe className="w-3 h-3 mr-1" />API</Badge>;
      case 'whatsapp': return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200"><MessageCircle className="w-3 h-3 mr-1" />WhatsApp</Badge>;
      case 'email': return <Badge className="bg-blue-500/10 text-blue-600 border-blue-200"><Mail className="w-3 h-3 mr-1" />Email</Badge>;
      default: return null;
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'respondido': return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Respondido</Badge>;
      case 'pendente': return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'expirado': return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Expirado</Badge>;
      default: return null;
    }
  };

  const respondidas = cotacoes.filter(c => c.status === 'respondido' && c.valor !== null);
  const melhorCotacao = respondidas.length > 0 ? respondidas.reduce((a, b) => (a.valor! < b.valor! ? a : b)) : null;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-display flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            Cotação Multi-Canal
          </h1>
          <p className="text-muted-foreground">
            Busque transportadoras por trecho e cote via API, WhatsApp ou Email
          </p>
        </div>

        {/* Search Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="w-5 h-5 text-primary" />
              Buscar Transportadoras por Trecho
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Origem */}
              <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <MapPin className="w-4 h-4 text-green-500" />
                  ORIGEM
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Estado</Label>
                    <Select value={origemEstado} onValueChange={setOrigemEstado}>
                      <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                      <SelectContent>{ESTADOS_BRASIL.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Cidade (opcional)</Label>
                    <Input value={origemCidade} onChange={e => setOrigemCidade(e.target.value)} placeholder="Ex: São Paulo" />
                  </div>
                </div>
              </div>

              {/* Destino */}
              <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <MapPin className="w-4 h-4 text-red-500" />
                  DESTINO
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Estado</Label>
                    <Select value={destinoEstado} onValueChange={setDestinoEstado}>
                      <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                      <SelectContent>{ESTADOS_BRASIL.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Cidade (opcional)</Label>
                    <Input value={destinoCidade} onChange={e => setDestinoCidade(e.target.value)} placeholder="Ex: Recife" />
                  </div>
                </div>
              </div>
            </div>

            {/* Dados da carga */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Peso (kg)</Label>
                <Input type="number" value={pesoKg} onChange={e => setPesoKg(e.target.value)} placeholder="Ex: 15" />
              </div>
              <div>
                <Label>Volumes</Label>
                <Input type="number" value={volumes} onChange={e => setVolumes(e.target.value)} placeholder="1" />
              </div>
              <div>
                <Label>Valor Mercadoria (R$)</Label>
                <Input type="number" value={valorMercadoria} onChange={e => setValorMercadoria(e.target.value)} placeholder="1000" />
              </div>
            </div>

            <Button onClick={handleSearch} disabled={isSearching} size="lg" className="w-full md:w-auto">
              {isSearching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
              Buscar Transportadoras
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <AnimatePresence>
          {hasSearched && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Carriers Found */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-base">
                      <Truck className="w-5 h-5" />
                      Transportadoras no Trecho ({carriers.length})
                    </span>
                    <div className="flex gap-2 text-xs">
                      <Badge variant="outline" className="font-normal">
                        <Globe className="w-3 h-3 mr-1" /> API: {carriers.filter(c => c.canal_cotacao === 'api').length}
                      </Badge>
                      <Badge variant="outline" className="font-normal">
                        <MessageCircle className="w-3 h-3 mr-1" /> WhatsApp: {carriers.filter(c => c.canal_cotacao === 'whatsapp').length}
                      </Badge>
                      <Badge variant="outline" className="font-normal">
                        <Mail className="w-3 h-3 mr-1" /> Email: {carriers.filter(c => c.canal_cotacao === 'email').length}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {carriers.length === 0 ? (
                    <div className="text-center py-12">
                      <Truck className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-muted-foreground">Nenhuma transportadora cadastrada para este trecho</p>
                      <p className="text-xs text-muted-foreground mt-1">Cadastre rotas em Rede Logística → Rotas</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {carriers.map((carrier, idx) => (
                        <motion.div
                          key={carrier.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center gap-4 p-4 rounded-lg border hover:border-primary/30 transition-colors bg-card"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold truncate">{carrier.transportadora?.nome_fantasia}</p>
                              {canalBadge(carrier.canal_cotacao)}
                              {carrier.transportadora?.score_performance && carrier.transportadora.score_performance > 80 && (
                                <Badge variant="outline" className="text-amber-500 border-amber-200">
                                  <Star className="w-3 h-3 mr-1" />{carrier.transportadora.score_performance}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {carrier.prazo_dias} dias
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" /> R$ {carrier.preco_por_kg?.toFixed(2)}/kg
                              </span>
                              {carrier.whatsapp && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> {carrier.whatsapp}
                                </span>
                              )}
                              {carrier.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" /> {carrier.email}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 shrink-0">
                            {carrier.canal_cotacao === 'api' ? (
                              <Button size="sm" onClick={() => handleCotarAPI(carrier)}>
                                <Globe className="w-4 h-4 mr-1" />Cotar API
                              </Button>
                            ) : (
                              <>
                                {carrier.whatsapp && (
                                  <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleCotarWhatsApp(carrier)}>
                                    <MessageCircle className="w-4 h-4 mr-1" />WhatsApp
                                  </Button>
                                )}
                                {carrier.email && (
                                  <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => handleCotarEmail(carrier)}>
                                    <Mail className="w-4 h-4 mr-1" />Email
                                  </Button>
                                )}
                              </>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => { setSelectedCarrier(carrier); setManualDialog(true); }}>
                              <Plus className="w-4 h-4 mr-1" />Registrar
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quotation Results */}
              {cotacoes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <DollarSign className="w-5 h-5 text-green-500" />
                      Cotações Recebidas ({cotacoes.length})
                    </CardTitle>
                    {melhorCotacao && (
                      <CardDescription>
                        🏆 Melhor cotação: <strong>{melhorCotacao.transportadora_nome}</strong> — R$ {melhorCotacao.valor?.toFixed(2)}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Transportadora</TableHead>
                          <TableHead>Canal</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Prazo</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Obs</TableHead>
                          <TableHead className="w-10" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cotacoes.sort((a, b) => {
                          if (a.valor === null) return 1;
                          if (b.valor === null) return -1;
                          return a.valor - b.valor;
                        }).map((cot) => (
                          <TableRow key={cot.id} className={melhorCotacao?.id === cot.id ? 'bg-green-50/50' : ''}>
                            <TableCell className="font-medium">
                              {melhorCotacao?.id === cot.id && <Star className="w-4 h-4 text-amber-500 inline mr-1" />}
                              {cot.transportadora_nome}
                            </TableCell>
                            <TableCell>{canalBadge(cot.canal)}</TableCell>
                            <TableCell className="font-semibold">
                              {cot.valor !== null ? `R$ ${cot.valor.toFixed(2)}` : '-'}
                            </TableCell>
                            <TableCell>
                              {cot.prazo_dias !== null ? `${cot.prazo_dias} dias` : '-'}
                            </TableCell>
                            <TableCell>{statusBadge(cot.status)}</TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{cot.observacoes}</TableCell>
                            <TableCell>
                              {cot.status === 'pendente' && (
                                <Button size="sm" variant="outline" onClick={() => {
                                  const carrier = carriers.find(c => c.transportadora_id === cot.transportadora_id);
                                  if (carrier) { setSelectedCarrier(carrier); setManualDialog(true); }
                                }}>
                                  Registrar
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Manual Registration Dialog */}
        <Dialog open={manualDialog} onOpenChange={setManualDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Cotação - {selectedCarrier?.transportadora?.nome_fantasia}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Valor do Frete (R$)</Label>
                <Input type="number" value={manualValor} onChange={e => setManualValor(e.target.value)} placeholder="Ex: 150.00" />
              </div>
              <div>
                <Label>Prazo (dias)</Label>
                <Input type="number" value={manualPrazo} onChange={e => setManualPrazo(e.target.value)} placeholder="Ex: 5" />
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea value={manualObs} onChange={e => setManualObs(e.target.value)} placeholder="Notas sobre a cotação..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setManualDialog(false)}>Cancelar</Button>
              <Button onClick={handleRegistrarResposta}>
                <CheckCircle2 className="w-4 h-4 mr-2" />Registrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
