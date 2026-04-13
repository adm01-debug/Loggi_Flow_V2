import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/common/EmptyState';
import { StatsCard } from '@/components/common/StatsCard';
import { Clock, CheckCircle2, AlertTriangle, Truck, MessageCircle, Mail, Globe, Timer, FileText, TrendingDown, RefreshCw, Zap, AlertCircle, Award, Send } from 'lucide-react';
import { useCotacoesMulticanal, type CotacaoMulticanal } from '@/hooks/useCotacoesMulticanal';
import { isPast, differenceInHours, differenceInMinutes } from 'date-fns';
import { useState as useStateReact, useEffect } from 'react';
import { TrechoComparativo } from './dashboard-cotacoes/TrechoComparativo';

function TimeRemaining({ expiresAt }: { expiresAt: string }) {
  const [now, setNow] = useStateReact(Date.now());
  useEffect(() => { const interval = setInterval(() => setNow(Date.now()), 60_000); return () => clearInterval(interval); }, []);
  const expDate = new Date(expiresAt);
  const expired = isPast(expDate);
  const hoursLeft = differenceInHours(expDate, now);
  const minutesLeft = differenceInMinutes(expDate, now) % 60;
  if (expired) return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" />Expirado</Badge>;
  const isUrgent = hoursLeft < 2;
  return <Badge variant={isUrgent ? 'destructive' : 'secondary'} className="gap-1 font-mono"><Timer className="w-3 h-3" />{hoursLeft}h {minutesLeft}m</Badge>;
}

function CanalBadge({ canal }: { canal: string }) {
  switch (canal) {
    case 'api': return <Badge className="bg-success/10 text-success border-success/20 gap-1"><Globe className="w-3 h-3" />API</Badge>;
    case 'whatsapp': return <Badge className="bg-success/10 text-success border-success/20 gap-1"><MessageCircle className="w-3 h-3" />WhatsApp</Badge>;
    case 'email': return <Badge className="bg-primary/10 text-primary border-primary/20 gap-1"><Mail className="w-3 h-3" />Email</Badge>;
    default: return null;
  }
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'respondido': return <Badge className="bg-success/10 text-success border-success/20 gap-1"><CheckCircle2 className="w-3 h-3" />Respondido</Badge>;
    case 'pendente': return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" />Pendente</Badge>;
    case 'expirado': return <Badge variant="destructive" className="gap-1"><AlertCircle className="w-3 h-3" />Expirado</Badge>;
    case 'selecionado': return <Badge className="bg-primary/10 text-primary border-primary/20 gap-1"><Award className="w-3 h-3" />Selecionado</Badge>;
    default: return null;
  }
}

export default function DashboardCotacoes() {
  const { cotacoes, ativas, pendentes, respondidas, expiradas, selecionadas, isLoading, refetch, updateCotacao, selectCotacao } = useCotacoesMulticanal();
  const [tab, setTab] = useState('ativas');
  const [filterCanal, setFilterCanal] = useState<string>('all');
  const [respondDialog, setRespondDialog] = useState(false);
  const [selectedCotacao, setSelectedCotacao] = useState<CotacaoMulticanal | null>(null);
  const [respValor, setRespValor] = useState('');
  const [respPrazo, setRespPrazo] = useState('');
  const [respObs, setRespObs] = useState('');

  const filtered = useMemo(() => {
    let list: CotacaoMulticanal[] = [];
    switch (tab) { case 'ativas': list = ativas; break; case 'pendentes': list = pendentes; break; case 'respondidas': list = respondidas; break; default: list = cotacoes; }
    return filterCanal !== 'all' ? list.filter(c => c.canal === filterCanal) : list;
  }, [tab, filterCanal, ativas, pendentes, respondidas, cotacoes]);

  const trechoGroups = useMemo(() => {
    const groups: Record<string, CotacaoMulticanal[]> = {};
    respondidas.forEach(c => { const key = `${c.origem_estado}-${c.destino_estado}`; if (!groups[key]) groups[key] = []; groups[key].push(c); });
    return groups;
  }, [respondidas]);

  const handleRespond = () => {
    if (!selectedCotacao || !respValor) return;
    updateCotacao.mutate({ id: selectedCotacao.id, valor_cotado: parseFloat(respValor), prazo_dias: respPrazo ? parseInt(respPrazo) : undefined, observacoes: respObs || undefined, status: 'respondido' });
    setRespondDialog(false); setSelectedCotacao(null); setRespValor(''); setRespPrazo(''); setRespObs('');
  };

  const savings = useMemo(() => {
    let totalSaved = 0;
    Object.values(trechoGroups).forEach(group => {
      if (group.length < 2) return;
      const values = group.filter(c => c.valor_cotado).map(c => c.valor_cotado!);
      if (values.length < 2) return;
      totalSaved += Math.max(...values) - Math.min(...values);
    });
    return totalSaved;
  }, [trechoGroups]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-display flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5"><FileText className="w-6 h-6 text-primary" /></div>
              Dashboard de Cotações
            </h1>
            <p className="text-muted-foreground mt-1">Acompanhe todas as cotações em andamento e compare preços</p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-2"><RefreshCw className="w-4 h-4" /> Atualizar</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatsCard title="Ativas" value={ativas.length} icon={Zap} color="primary" />
          <StatsCard title="Pendentes" value={pendentes.length} icon={Clock} color="warning" />
          <StatsCard title="Respondidas" value={respondidas.length} icon={CheckCircle2} color="success" />
          <StatsCard title="Expiradas" value={expiradas.length} icon={AlertTriangle} color="destructive" />
          <StatsCard title="Economia" value={`R$ ${savings.toFixed(0)}`} icon={TrendingDown} color="success" />
        </div>

        <TrechoComparativo trechoGroups={trechoGroups} onSelect={(id) => selectCotacao.mutate(id)} />

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base"><Truck className="w-5 h-5" />Cotações</CardTitle>
              <Select value={filterCanal} onValueChange={setFilterCanal}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos canais</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid grid-cols-4 w-full max-w-md">
                <TabsTrigger value="ativas">Ativas ({ativas.length})</TabsTrigger>
                <TabsTrigger value="pendentes">Pendentes ({pendentes.length})</TabsTrigger>
                <TabsTrigger value="respondidas">Respondidas ({respondidas.length})</TabsTrigger>
                <TabsTrigger value="todas">Todas ({cotacoes.length})</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <EmptyState icon={FileText} title="Nenhuma cotação encontrada" description="Crie cotações na página Cotação Multi-Canal" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transportadora</TableHead><TableHead>Trecho</TableHead><TableHead>Canal</TableHead><TableHead>Status</TableHead><TableHead>Valor</TableHead><TableHead>Prazo</TableHead><TableHead>Expira em</TableHead><TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((cotacao) => (
                      <TableRow key={cotacao.id} className="group">
                        <TableCell className="font-medium">{cotacao.transportadora?.nome_fantasia || 'N/A'}</TableCell>
                        <TableCell><span className="font-mono text-xs">{cotacao.origem_estado} → {cotacao.destino_estado}</span></TableCell>
                        <TableCell><CanalBadge canal={cotacao.canal} /></TableCell>
                        <TableCell><StatusBadge status={cotacao.status} /></TableCell>
                        <TableCell>{cotacao.valor_cotado ? <span className="font-semibold">R$ {cotacao.valor_cotado.toFixed(2)}</span> : <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell>{cotacao.prazo_dias ? `${cotacao.prazo_dias}d` : '—'}</TableCell>
                        <TableCell><TimeRemaining expiresAt={cotacao.expires_at} /></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {cotacao.status === 'pendente' && (
                              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => { setSelectedCotacao(cotacao); setRespondDialog(true); }}><Send className="w-3 h-3" /> Registrar</Button>
                            )}
                            {cotacao.status === 'respondido' && (
                              <Button size="sm" className="h-7 text-xs gap-1" onClick={() => selectCotacao.mutate(cotacao.id)}><Award className="w-3 h-3" /> Selecionar</Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={respondDialog} onOpenChange={setRespondDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar Resposta da Cotação</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 text-sm"><strong>{selectedCotacao?.transportadora?.nome_fantasia}</strong><span className="ml-2 text-muted-foreground">{selectedCotacao?.origem_estado} → {selectedCotacao?.destino_estado}</span></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Valor (R$) *</Label><Input type="number" value={respValor} onChange={e => setRespValor(e.target.value)} placeholder="150.00" /></div>
                <div><Label>Prazo (dias)</Label><Input type="number" value={respPrazo} onChange={e => setRespPrazo(e.target.value)} placeholder="5" /></div>
              </div>
              <div><Label>Observações</Label><Textarea value={respObs} onChange={e => setRespObs(e.target.value)} placeholder="Detalhes adicionais..." /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRespondDialog(false)}>Cancelar</Button>
              <Button onClick={handleRespond} disabled={!respValor}>Registrar Resposta</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
