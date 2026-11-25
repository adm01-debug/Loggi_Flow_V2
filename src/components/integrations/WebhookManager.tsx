import { useState } from 'react';
import { useClientWebhooks } from "@/hooks/integrations/useClientWebhooks";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Plus, Trash2, Webhook, Activity, CheckCircle, XCircle, Copy, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const AVAILABLE_EVENTS = [
  'entrega.created', 'entrega.updated', 'entrega.delivered',
  'coleta.created', 'coleta.completed',
  'ocorrencia.created', 'ocorrencia.resolved',
];

export function WebhookManager() {
  const {
    webhooks, deliveries, isLoading,
    inboundFailures, isLoadingInboundFailures, isErrorInboundFailures,
    createWebhook, toggleWebhook, deleteWebhook,
  } = useClientWebhooks();

  const [showCreate, setShowCreate] = useState(false);
  const [formUrl, setFormUrl] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formEvents, setFormEvents] = useState<string[]>([]);

  const handleCreate = () => {
    if (!formUrl) { toast.error('URL é obrigatória'); return; }
    if (formEvents.length === 0) { toast.error('Selecione ao menos um evento'); return; }
    createWebhook.mutate({ url: formUrl, description: formDesc, events: formEvents }, {
      onSuccess: () => {
        setShowCreate(false);
        setFormUrl('');
        setFormDesc('');
        setFormEvents([]);
      },
    });
  };

  const toggleEvent = (event: string) => {
    setFormEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    );
  };

  const renderInboundFailures = () => {
    if (isLoadingInboundFailures) {
      return <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
    }
    if (isErrorInboundFailures) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Não foi possível carregar as falhas</AlertTitle>
          <AlertDescription>
            Recarregue a página. Se persistir, confira a policy de leitura de webhook_inbound_failures (somente admin).
          </AlertDescription>
        </Alert>
      );
    }
    if (inboundFailures.length === 0) {
      return <p className="text-center text-muted-foreground py-4">Nenhuma falha registrada</p>;
    }
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Receptor</TableHead>
            <TableHead>Provedor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Mensagem</TableHead>
            <TableHead>Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inboundFailures.map(f => (
            <TableRow key={f.id}>
              <TableCell><Badge variant="outline" className="text-xs">{f.receiver}</Badge></TableCell>
              <TableCell className="text-xs">{f.provider ?? '-'}</TableCell>
              <TableCell><Badge variant="outline">{f.response_status}</Badge></TableCell>
              <TableCell className="text-xs text-destructive max-w-[280px] truncate">{f.error_message}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {format(new Date(f.created_at), "dd/MM HH:mm:ss", { locale: ptBR })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="webhooks">
        <TabsList>
          <TabsTrigger value="webhooks"><Webhook className="w-4 h-4 mr-1" />Webhooks</TabsTrigger>
          <TabsTrigger value="deliveries"><Activity className="w-4 h-4 mr-1" />Entregas de Log</TabsTrigger>
          <TabsTrigger value="inbound"><AlertTriangle className="w-4 h-4 mr-1" />Falhas de Entrada</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{webhooks.length} webhook(s) configurado(s)</p>
            <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-1" />Novo Webhook</Button>
          </div>

          {webhooks.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">
              <Webhook className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum webhook configurado</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {webhooks.map(wh => (
                <Card key={wh.id}>
                  <CardContent className="py-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <Webhook className="w-4 h-4 text-primary shrink-0" />
                        <code className="text-sm truncate">{wh.url}</code>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch
                          checked={wh.active}
                          onCheckedChange={(active) => toggleWebhook.mutate({ id: wh.id, active })}
                        />
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteWebhook.mutate(wh.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {wh.description && <p className="text-sm text-muted-foreground">{wh.description}</p>}
                    <div className="flex flex-wrap gap-1">
                      {wh.events.map(ev => <Badge key={ev} variant="outline" className="text-xs">{ev}</Badge>)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Secret:</span>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">{wh.secret.slice(0, 12)}...</code>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(wh.secret); toast.success('Secret copiado!'); }}>
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="deliveries" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Log de Entregas de Webhook</CardTitle>
              <CardDescription>Últimas 100 tentativas de entrega</CardDescription>
            </CardHeader>
            <CardContent>
              {deliveries.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Nenhuma entrega registrada</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Evento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Resposta</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveries.map(d => (
                      <TableRow key={d.id}>
                        <TableCell><Badge variant="outline" className="text-xs">{d.event_type}</Badge></TableCell>
                        <TableCell>
                          {d.success ? (
                            <CheckCircle className="w-4 h-4 text-success" />
                          ) : (
                            <XCircle className="w-4 h-4 text-destructive" />
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {d.response_status ? <Badge variant="outline">{d.response_status}</Badge> : '-'}
                          {d.error_message && <span className="text-xs text-destructive ml-1">{d.error_message}</span>}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(d.created_at), "dd/MM HH:mm:ss", { locale: ptBR })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="inbound" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Falhas de Webhook de Entrada</CardTitle>
              <CardDescription>
                Webhooks recebidos das transportadoras que falharam. As 50 falhas mais recentes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {renderInboundFailures()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Webhook</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div><Label>URL *</Label><Input value={formUrl} onChange={e => setFormUrl(e.target.value)} placeholder="https://..." /></div>
            <div><Label>Descrição</Label><Input value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Descrição do webhook" /></div>
            <div>
              <Label className="mb-2 block">Eventos *</Label>
              <div className="grid grid-cols-2 gap-2">
                {AVAILABLE_EVENTS.map(ev => (
                  <div key={ev} className="flex items-center gap-2">
                    <Checkbox checked={formEvents.includes(ev)} onCheckedChange={() => toggleEvent(ev)} id={ev} />
                    <Label htmlFor={ev} className="text-sm cursor-pointer">{ev}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createWebhook.isPending}>
              {createWebhook.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar Webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
