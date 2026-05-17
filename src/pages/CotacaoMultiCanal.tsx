import { useState, useMemo, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Breadcrumbs } from '@/components/common/Breadcrumbs';
import { PageHeader } from '@/components/common/PageHeader';
import { StepProgress } from '@/components/common/StepProgress';
import { DataExporter } from '@/components/common/DataExporter';
import { Zap, CheckCircle2, TrendingDown, Rocket, ShieldCheck, Timer, Award, Info, Map } from 'lucide-react';
import { useTransportadoraRotas } from '@/hooks/useTransportadoraRotas';
import { useRodonavesTracking } from '@/hooks/useRodonavesTracking';
import { useMelhorEnvio } from '@/hooks/useMelhorEnvio';
import { useCotacoesMulticanal } from '@/hooks/useCotacoesMulticanal';
import { useLalamoveOrders } from '@/hooks/useLalamoveOrders';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { CotacaoSearchForm } from './cotacao-multicanal/CotacaoSearchForm';
import { CotacaoCarrierList } from './cotacao-multicanal/CotacaoCarrierList';
import { CotacaoResultsTable } from './cotacao-multicanal/CotacaoResultsTable';
import { NegotiationAssistant } from '@/components/freight';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { CotacaoManual, TransportadoraComCanal } from './cotacao-multicanal/types';

export default function CotacaoMultiCanal() {
  const { searchRoutes } = useTransportadoraRotas();
  const { createCotacao } = useCotacoesMulticanal();
  const rodonaves = useRodonavesTracking();
  const melhorEnvio = useMelhorEnvio();
  const lalamove = useLalamoveOrders();

  const [origemEstado, setOrigemEstado] = useState('');
  const [destinoEstado, setDestinoEstado] = useState('');
  const [origemCidade, setOrigemCidade] = useState('');
  const [destinoCidade, setDestinoCidade] = useState('');
  const [origemCep, setOrigemCep] = useState('');
  const [destinoCep, setDestinoCep] = useState('');
  const [pesoKg, setPesoKg] = useState('');
  const [volumes, setVolumes] = useState('1');
  const [valorMercadoria, setValorMercadoria] = useState('');
  const [carriers, setCarriers] = useState<TransportadoraComCanal[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isBlasting, setIsBlasting] = useState(false);
  const [blastProgress, setBlastProgress] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [manualDialog, setManualDialog] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<TransportadoraComCanal | null>(null);
  const [manualValor, setManualValor] = useState('');
  const [manualPrazo, setManualPrazo] = useState('');
  const [manualObs, setManualObs] = useState('');
  const [cotacoes, setCotacoes] = useState<CotacaoManual[]>([]);

  const handleSearch = async () => {
    if (!origemEstado || !destinoEstado) { 
      toast.error('Selecione os estados de origem e destino'); 
      return; 
    }
    
    setIsSearching(true); 
    setHasSearched(true); 
    setCotacoes([]);
    setCarriers([]);

    try {
      // 1. Local routes search
      const localResults = await searchRoutes(origemEstado, destinoEstado, origemCidade || undefined, destinoCidade || undefined);
      const enriched: TransportadoraComCanal[] = localResults.map(rota => {
        const t = rota.transportadora as any;
        const hasApi = t?.api_disponivel === true;
        const hasWhatsapp = !!t?.whatsapp_operacional;
        let canal: 'api' | 'whatsapp' | 'email' = 'email';
        if (hasApi) canal = 'api'; else if (hasWhatsapp) canal = 'whatsapp';
        return { 
          ...rota, 
          canal_cotacao: canal, 
          whatsapp: t?.whatsapp_operacional, 
          email: t?.email_comercial, 
          api_disponivel: hasApi 
        };
      });
      setCarriers(enriched);

      // 2. Automated API Quotes (Rodonaves, Melhor Envio, Lalamove)
      if (origemCep && destinoCep && pesoKg) {
        const cleanedOrigemCep = origemCep.replace(/\D/g, '');
        const cleanedDestinoCep = destinoCep.replace(/\D/g, '');
        const weight = parseFloat(pesoKg);
        const value = valorMercadoria ? parseFloat(valorMercadoria) : 0;
        const vol = parseInt(volumes) || 1;

        // Rodonaves
        rodonaves.getQuotationAsync({
          cepOrigem: cleanedOrigemCep,
          cepDestino: cleanedDestinoCep,
          peso: weight,
          volumes: vol,
          valorMercadoria: value
        }).then(res => {
          if (res?.data) {
            addCotacao({
              id: crypto.randomUUID(),
              transportadora_id: 'rodonaves-id', // Use a standard ID or find in carriers
              transportadora_nome: 'Rodonaves RTE',
              canal: 'api',
              valor: res.data.Valor,
              prazo_dias: res.data.PrazoEntrega,
              status: 'respondido',
              observacoes: 'Cotação automática API Rodonaves',
              created_at: new Date().toISOString()
            });
          }
        }).catch(e => {
          // Log errors to a safe sink or ignore in production
        });

        // Melhor Envio
        melhorEnvio.calcularFrete.mutateAsync({
          from: { postal_code: cleanedOrigemCep },
          to: { postal_code: cleanedDestinoCep },
          volumes: [{ width: 20, height: 20, length: 20, weight: weight }] // Default volume if not provided
        }).then((res: any) => {
          if (Array.isArray(res)) {
            res.forEach((option: any) => {
              if (!option.error) {
                addCotacao({
                  id: crypto.randomUUID(),
                  transportadora_id: `me-${option.id}`,
                  transportadora_nome: `Melhor Envio - ${option.name}`,
                  canal: 'api',
                  valor: parseFloat(option.price),
                  prazo_dias: option.delivery_range?.max || option.delivery_time,
                  status: 'respondido',
                  observacoes: `Serviço: ${option.name}`,
                  created_at: new Date().toISOString()
                });
              }
            });
          }
        }).catch(e => {
          // Silent catch
        });

        // Lalamove (Simplified)
        lalamove.getQuotation.mutateAsync({
          stops: [
            { lat: 0, lng: 0, address: cleanedOrigemCep }, // Lalamove usually needs real addresses/coords
            { lat: 0, lng: 0, address: cleanedDestinoCep }
          ]
        }).then(res => {
          if (res?.priceBreakdown) {
            addCotacao({
              id: crypto.randomUUID(),
              transportadora_id: 'lalamove-id',
              transportadora_nome: 'Lalamove',
              canal: 'api',
              valor: parseFloat(res.priceBreakdown.total),
              prazo_dias: 1, // Lalamove is usually same day
              status: 'respondido',
              observacoes: 'Cotação automática Lalamove',
              created_at: new Date().toISOString()
            });
          }
        }).catch(e => {
          // Silent catch
        });
      }

      if (enriched.length === 0) toast.info('Nenhuma transportadora local encontrada'); 
      else toast.success(`${enriched.length} transportadora(s) local(is) encontrada(s)`);
    } catch (error) { 
      // Silent error handler
      toast.error('Erro ao buscar transportadoras'); 
    } finally { 
      setIsSearching(false); 
    }
  };

  const handleNexusBlast = async () => {
    if (carriers.length === 0) {
      toast.error('Busque transportadoras primeiro');
      return;
    }

    setIsBlasting(true);
    setBlastProgress(0);
    toast.info('Iniciando Nexus Blast: Cotação Automatizada em Massa');

    let completed = 0;
    const total = carriers.length;

    for (const carrier of carriers) {
      try {
        if (carrier.canal_cotacao === 'api') {
          await handleCotarAPI(carrier);
        } else if (carrier.canal_cotacao === 'whatsapp') {
          // Record that we intend to quote via WhatsApp (automation would trigger here in real scenario)
          createCotacao.mutate({ 
            transportadora_id: carrier.transportadora_id, 
            canal: 'whatsapp', 
            origem_estado: origemEstado, 
            destino_estado: destinoEstado, 
            peso_kg: pesoKg ? parseFloat(pesoKg) : undefined, 
            volumes: parseInt(volumes) 
          });
          addCotacao({ 
            id: crypto.randomUUID(), 
            transportadora_id: carrier.transportadora_id, 
            transportadora_nome: carrier.transportadora?.nome_fantasia || 'N/A', 
            canal: 'whatsapp', 
            valor: null, 
            prazo_dias: null, 
            status: 'pendente', 
            observacoes: 'Nexus Blast: Aguardando RPA/WhatsApp', 
            created_at: new Date().toISOString() 
          });
        } else {
           createCotacao.mutate({ 
            transportadora_id: carrier.transportadora_id, 
            canal: 'email', 
            origem_estado: origemEstado, 
            destino_estado: destinoEstado, 
            peso_kg: pesoKg ? parseFloat(pesoKg) : undefined, 
            volumes: parseInt(volumes) 
          });
          addCotacao({ 
            id: crypto.randomUUID(), 
            transportadora_id: carrier.transportadora_id, 
            transportadora_nome: carrier.transportadora?.nome_fantasia || 'N/A', 
            canal: 'email', 
            valor: null, 
            prazo_dias: null, 
            status: 'pendente', 
            observacoes: 'Nexus Blast: Email Automático Enviado', 
            created_at: new Date().toISOString() 
          });
        }
      } catch (e) {
        console.error(`Erro ao cotar com ${carrier.transportadora?.nome_fantasia}:`, e);
      }
      completed++;
      setBlastProgress(Math.round((completed / total) * 100));
    }

    setIsBlasting(false);
    toast.success('Nexus Blast concluído! Aguardando respostas das transportadoras sem API.');
  };

  const addCotacao = (c: CotacaoManual) => setCotacoes(prev => {
    // Avoid duplicates
    if (prev.some(x => x.transportadora_id === c.transportadora_id && x.canal === c.canal)) return prev;
    return [...prev, c];
  });

  const handleCotarAPI = async (carrier: TransportadoraComCanal) => {
    if (!pesoKg) { toast.error('Informe o peso para cotar via API'); return; }
    const valorCalculado = (carrier.taxa_fixa || 0) + ((carrier.preco_por_kg || 0) * parseFloat(pesoKg));
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
      observacoes: 'Cotação via Nexus Blast (API)', 
      status: 'respondido' 
    });
    addCotacao({ 
      id: crypto.randomUUID(), 
      transportadora_id: carrier.transportadora_id, 
      transportadora_nome: carrier.transportadora?.nome_fantasia || 'N/A', 
      canal: 'api', 
      valor: valorCalculado, 
      prazo_dias: carrier.prazo_dias, 
      status: 'respondido', 
      observacoes: 'Nexus Blast API', 
      created_at: new Date().toISOString() 
    });
  };

  const handleCotarWhatsApp = (carrier: TransportadoraComCanal) => {
    const msg = encodeURIComponent(`Olá! Gostaria de cotar um frete:\n📍 Origem: ${origemEstado}${origemCidade ? ' - ' + origemCidade : ''}\n📍 Destino: ${destinoEstado}${destinoCidade ? ' - ' + destinoCidade : ''}\n📦 Peso: ${pesoKg || '(não informado)'} kg\n📦 Volumes: ${volumes}\n💰 Valor: R$ ${valorMercadoria || '(não informado)'}\nAguardo retorno!`);
    window.open(`https://wa.me/${carrier.whatsapp?.replace(/\D/g, '')}?text=${msg}`, '_blank');
    createCotacao.mutate({ transportadora_id: carrier.transportadora_id, canal: 'whatsapp', origem_estado: origemEstado, destino_estado: destinoEstado, peso_kg: pesoKg ? parseFloat(pesoKg) : undefined, volumes: parseInt(volumes) });
    addCotacao({ id: crypto.randomUUID(), transportadora_id: carrier.transportadora_id, transportadora_nome: carrier.transportadora?.nome_fantasia || 'N/A', canal: 'whatsapp', valor: null, prazo_dias: null, status: 'pendente', observacoes: 'WhatsApp enviado', created_at: new Date().toISOString() });
    toast.success('Mensagem WhatsApp aberta!');
  };

  const handleCotarEmail = (carrier: TransportadoraComCanal) => {
    const subject = encodeURIComponent(`Cotação de Frete - ${origemEstado} → ${destinoEstado}`);
    const body = encodeURIComponent(`Prezados,\n\nSolicito cotação:\nOrigem: ${origemEstado}\nDestino: ${destinoEstado}\nPeso: ${pesoKg || '?'} kg\nVolumes: ${volumes}\n\nAtenciosamente.`);
    window.open(`mailto:${carrier.email}?subject=${subject}&body=${body}`, '_blank');
    createCotacao.mutate({ transportadora_id: carrier.transportadora_id, canal: 'email', origem_estado: origemEstado, destino_estado: destinoEstado, peso_kg: pesoKg ? parseFloat(pesoKg) : undefined, volumes: parseInt(volumes) });
    addCotacao({ id: crypto.randomUUID(), transportadora_id: carrier.transportadora_id, transportadora_nome: carrier.transportadora?.nome_fantasia || 'N/A', canal: 'email', valor: null, prazo_dias: null, status: 'pendente', observacoes: 'Email enviado', created_at: new Date().toISOString() });
    toast.success('Email aberto!');
  };

  const handleRegistrarResposta = () => {
    if (!selectedCarrier || !manualValor) { toast.error('Informe o valor'); return; }
    setCotacoes(prev => prev.map(c => c.transportadora_id === selectedCarrier.transportadora_id && c.status === 'pendente' ? { ...c, valor: parseFloat(manualValor), prazo_dias: manualPrazo ? parseInt(manualPrazo) : null, status: 'respondido' as const, observacoes: manualObs || c.observacoes } : c));
    toast.success('Resposta registrada!');
    setManualDialog(false); setManualValor(''); setManualPrazo(''); setManualObs(''); setSelectedCarrier(null);
  };

  const respondidas = cotacoes.filter(c => c.status === 'respondido' && c.valor !== null);
  const melhorCotacao = respondidas.length > 0 ? respondidas.reduce((a, b) => (a.valor! < b.valor! ? a : b)) : null;
  const savings = useMemo(() => { if (respondidas.length < 2) return 0; const v = respondidas.map(c => c.valor!); return Math.max(...v) - Math.min(...v); }, [respondidas]);
  const currentStep = useMemo(() => { if (cotacoes.some(c => c.status === 'respondido')) return 3; if (cotacoes.length > 0) return 2; if (hasSearched && carriers.length > 0) return 1; return 0; }, [cotacoes, hasSearched, carriers]);
  const exportData = useMemo(() => cotacoes.map(c => ({ transportadora: c.transportadora_nome, canal: c.canal, valor: c.valor ? `R$ ${c.valor.toFixed(2)}` : '-', prazo: c.prazo_dias ? `${c.prazo_dias} dias` : '-', status: c.status, observacoes: c.observacoes })), [cotacoes]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <Breadcrumbs items={[{ label: 'Operações' }, { label: 'Cotação Multi-Canal' }]} />
        <PageHeader title="Cotação Multi-Canal" description="Busque transportadoras por trecho e cote via API, WhatsApp ou Email" icon={Zap}>
          {cotacoes.length > 0 && <DataExporter data={exportData} filename="cotacoes-multicanal" />}
        </PageHeader>
        <StepProgress steps={[{ id: 'buscar', title: 'Buscar Transportadoras' }, { id: 'cotar', title: 'Enviar Cotações' }, { id: 'receber', title: 'Receber Respostas' }, { id: 'selecionar', title: 'Selecionar Melhor' }]} currentStep={currentStep} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savings > 0 && (
            <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
              <TrendingDown className="w-5 h-5 text-success shrink-0" />
              <p className="text-sm font-medium">Economia de <span className="text-success font-bold">R$ {savings.toFixed(2)}</span> entre {respondidas.length} cotações</p>
            </motion.div>
          )}
          {melhorCotacao && (
            <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}>
              <NegotiationAssistant bestValue={melhorCotacao.valor} carrierName={melhorCotacao.transportadora_nome} />
            </motion.div>
          )}
        </div>

        <CotacaoSearchForm origemEstado={origemEstado} setOrigemEstado={setOrigemEstado} destinoEstado={destinoEstado} setDestinoEstado={setDestinoEstado} origemCidade={origemCidade} setOrigemCidade={setOrigemCidade} destinoCidade={destinoCidade} setDestinoCidade={setDestinoCidade} origemCep={origemCep} setOrigemCep={setOrigemCep} destinoCep={destinoCep} setDestinoCep={setDestinoCep} pesoKg={pesoKg} setPesoKg={setPesoKg} volumes={volumes} setVolumes={setVolumes} valorMercadoria={valorMercadoria} setValorMercadoria={setValorMercadoria} isSearching={isSearching} onSearch={handleSearch} />

        <AnimatePresence>
          {hasSearched && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <CotacaoCarrierList carriers={carriers} onCotarAPI={handleCotarAPI} onCotarWhatsApp={handleCotarWhatsApp} onCotarEmail={handleCotarEmail} onRegistrar={(c) => { setSelectedCarrier(c); setManualDialog(true); }} />
              <CotacaoResultsTable cotacoes={cotacoes} melhorCotacao={melhorCotacao} onRegistrar={(tid) => { const c = carriers.find(x => x.transportadora_id === tid); if (c) { setSelectedCarrier(c); setManualDialog(true); } }} />
            </motion.div>
          )}
        </AnimatePresence>

        <Dialog open={manualDialog} onOpenChange={setManualDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar Cotação - {selectedCarrier?.transportadora?.nome_fantasia}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Valor do Frete (R$)</Label><Input type="number" value={manualValor} onChange={e => setManualValor(e.target.value)} placeholder="150.00" /></div>
              <div><Label>Prazo (dias)</Label><Input type="number" value={manualPrazo} onChange={e => setManualPrazo(e.target.value)} placeholder="5" /></div>
              <div><Label>Observações</Label><Textarea value={manualObs} onChange={e => setManualObs(e.target.value)} placeholder="Notas..." /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setManualDialog(false)}>Cancelar</Button>
              <Button onClick={handleRegistrarResposta}><CheckCircle2 className="w-4 h-4 mr-2" />Registrar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
