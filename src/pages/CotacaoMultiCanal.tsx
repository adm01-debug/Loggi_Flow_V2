import { useState, useMemo } from 'react';
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
import { Zap, CheckCircle2, TrendingDown } from 'lucide-react';
import { useTransportadoraRotas } from '@/hooks/useTransportadoraRotas';
import { useRodonavesTracking } from '@/hooks/useRodonavesTracking';
import { useMelhorEnvio } from '@/hooks/useMelhorEnvio';
import { useCotacoesMulticanal } from '@/hooks/useCotacoesMulticanal';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { CotacaoSearchForm } from './cotacao-multicanal/CotacaoSearchForm';
import { CotacaoCarrierList } from './cotacao-multicanal/CotacaoCarrierList';
import { CotacaoResultsTable } from './cotacao-multicanal/CotacaoResultsTable';
import type { CotacaoManual, TransportadoraComCanal } from './cotacao-multicanal/types';

export default function CotacaoMultiCanal() {
  const { searchRoutes } = useTransportadoraRotas();
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
  const [manualDialog, setManualDialog] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<TransportadoraComCanal | null>(null);
  const [manualValor, setManualValor] = useState('');
  const [manualPrazo, setManualPrazo] = useState('');
  const [manualObs, setManualObs] = useState('');
  const [cotacoes, setCotacoes] = useState<CotacaoManual[]>([]);

  const handleSearch = async () => {
    if (!origemEstado || !destinoEstado) { toast.error('Selecione os estados de origem e destino'); return; }
    setIsSearching(true); setHasSearched(true); setCotacoes([]);
    try {
      const results = await searchRoutes(origemEstado, destinoEstado, origemCidade || undefined, destinoCidade || undefined);
      const enriched: TransportadoraComCanal[] = results.map(rota => {
        const t = rota.transportadora as Record<string, unknown>;
        const hasApi = t?.api_disponivel === true;
        const hasWhatsapp = !!t?.whatsapp_operacional;
        let canal: 'api' | 'whatsapp' | 'email' = 'email';
        if (hasApi) canal = 'api'; else if (hasWhatsapp) canal = 'whatsapp';
        return { ...rota, canal_cotacao: canal, whatsapp: t?.whatsapp_operacional as string | null, email: t?.email_comercial as string | null, api_disponivel: hasApi };
      });
      setCarriers(enriched);
      if (enriched.length === 0) toast.info('Nenhuma transportadora encontrada'); else toast.success(`${enriched.length} transportadora(s) encontrada(s)`);
    } catch { toast.error('Erro ao buscar transportadoras'); } finally { setIsSearching(false); }
  };

  const addCotacao = (c: CotacaoManual) => setCotacoes(prev => [...prev, c]);

  const handleCotarAPI = async (carrier: TransportadoraComCanal) => {
    if (!pesoKg) { toast.error('Informe o peso para cotar via API'); return; }
    const valorCalculado = carrier.taxa_fixa + (carrier.preco_por_kg * parseFloat(pesoKg));
    await createCotacao.mutateAsync({ transportadora_id: carrier.transportadora_id, canal: 'api', origem_estado: origemEstado, origem_cidade: origemCidade || undefined, destino_estado: destinoEstado, destino_cidade: destinoCidade || undefined, peso_kg: parseFloat(pesoKg), volumes: parseInt(volumes), valor_mercadoria: valorMercadoria ? parseFloat(valorMercadoria) : undefined, valor_cotado: valorCalculado, prazo_dias: carrier.prazo_dias, observacoes: 'Cotação via tabela de frete cadastrada', status: 'respondido' });
    addCotacao({ id: crypto.randomUUID(), transportadora_id: carrier.transportadora_id, transportadora_nome: carrier.transportadora?.nome_fantasia || 'N/A', canal: 'api', valor: valorCalculado, prazo_dias: carrier.prazo_dias, status: 'respondido', observacoes: 'Cotação via tabela', created_at: new Date().toISOString() });
    toast.success(`Cotação API recebida: R$ ${valorCalculado.toFixed(2)}`);
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

        {savings > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
            <TrendingDown className="w-5 h-5 text-success shrink-0" />
            <p className="text-sm font-medium">Economia de <span className="text-success font-bold">R$ {savings.toFixed(2)}</span> entre {respondidas.length} cotações</p>
          </motion.div>
        )}

        <CotacaoSearchForm origemEstado={origemEstado} setOrigemEstado={setOrigemEstado} destinoEstado={destinoEstado} setDestinoEstado={setDestinoEstado} origemCidade={origemCidade} setOrigemCidade={setOrigemCidade} destinoCidade={destinoCidade} setDestinoCidade={setDestinoCidade} pesoKg={pesoKg} setPesoKg={setPesoKg} volumes={volumes} setVolumes={setVolumes} valorMercadoria={valorMercadoria} setValorMercadoria={setValorMercadoria} isSearching={isSearching} onSearch={handleSearch} />

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
