import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Settings, 
  Map, 
  Key, 
  MessageSquare, 
  Mail, 
  Globe, 
  Plus, 
  Trash2, 
  Save, 
  Search,
  Code,
  FileJson,
  Zap,
  RefreshCw
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/common/PageHeader';

export default function FreightConfig() {
  const queryClient = useQueryClient();
  const [selectedCarrierId, setSelectedCarrierId] = useState<string>('');

  // 1. Selection Rules
  const { data: rules = [] } = useQuery({
    queryKey: ['freight-selection-rules'],
    queryFn: async () => {
      const { data, error } = await supabase.from('freight_selection_rules').select('*');
      if (error) throw error;
      return data;
    }
  });

  const saveRule = useMutation({
    mutationFn: async (rule: any) => {
      const { data, error } = await supabase.from('freight_selection_rules').upsert(rule);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freight-selection-rules'] });
      toast.success('Regra de seleção salva!');
    }
  });

  // 2. Integration Mappings
  const { data: mappings = [] } = useQuery({
    queryKey: ['freight-integration-mappings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('freight_integration_mappings').select('*, transportadora:transportadoras(nome_fantasia)');
      if (error) throw error;
      return data;
    }
  });

  // 3. Carrier Credentials & Non-API Config
  const { data: carriers = [] } = useQuery({
    queryKey: ['carriers-config'],
    queryFn: async () => {
      const { data, error } = await supabase.from('transportadoras').select('*').order('nome_fantasia');
      if (error) throw error;
      return data;
    }
  });

  const updateCarrier = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase.from('transportadoras').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carriers-config'] });
      toast.success('Configuração da transportadora atualizada!');
    }
  });

  const selectedCarrier = carriers.find(c => c.id === selectedCarrierId);

  return (
    <MainLayout>
      <div className="space-y-6">
        <PageHeader 
          title="Nexus Freight Config" 
          description="Parametrização avançada de malha, credenciais e regras de decisão" 
          icon={Settings} 
        />

        <Tabs defaultValue="transportadoras" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="transportadoras">Transportadoras</TabsTrigger>
            <TabsTrigger value="regras">Regras de Seleção</TabsTrigger>
            <TabsTrigger value="integracoes">Integrações</TabsTrigger>
            <TabsTrigger value="automacao">Automação RPA</TabsTrigger>
          </TabsList>

          <TabsContent value="transportadoras" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-sm">Selecionar Transportadora</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar..." className="pl-8" />
                  </div>
                  <div className="space-y-1">
                    {carriers.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCarrierId(c.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedCarrierId === c.id ? 'bg-primary text-white font-bold' : 'hover:bg-muted'
                        }`}
                      >
                        {c.nome_fantasia}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                {selectedCarrier ? (
                  <>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" />
                        Configurar: {selectedCarrier.nome_fantasia}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="credenciais">
                        <TabsList className="mb-4">
                          <TabsTrigger value="credenciais"><Key className="h-4 w-4 mr-2" />API / Login</TabsTrigger>
                          <TabsTrigger value="malha"><Map className="h-4 w-4 mr-2" />Malha / Praça</TabsTrigger>
                          <TabsTrigger value="non-api"><MessageSquare className="h-4 w-4 mr-2" />WhatsApp/Email</TabsTrigger>
                        </TabsList>

                        <TabsContent value="credenciais" className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>API Key / Token</Label>
                              <Input 
                                type="password" 
                                value={selectedCarrier.credentials?.api_key || ''} 
                                onChange={e => {
                                  const creds = { ...selectedCarrier.credentials, api_key: e.target.value };
                                  updateCarrier.mutate({ id: selectedCarrier.id, credentials: creds });
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Endpoint URL</Label>
                              <Input 
                                placeholder="https://api..." 
                                value={selectedCarrier.credentials?.endpoint || ''}
                                onChange={e => {
                                  const creds = { ...selectedCarrier.credentials, endpoint: e.target.value };
                                  updateCarrier.mutate({ id: selectedCarrier.id, credentials: creds });
                                }}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Usuário Portal</Label>
                              <Input 
                                value={selectedCarrier.credentials?.username || ''}
                                onChange={e => {
                                  const creds = { ...selectedCarrier.credentials, username: e.target.value };
                                  updateCarrier.mutate({ id: selectedCarrier.id, credentials: creds });
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Senha Portal</Label>
                              <Input 
                                type="password" 
                                value={selectedCarrier.credentials?.password || ''}
                                onChange={e => {
                                  const creds = { ...selectedCarrier.credentials, password: e.target.value };
                                  updateCarrier.mutate({ id: selectedCarrier.id, credentials: creds });
                                }}
                              />
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="malha" className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label>Cobertura de Regiões</Label>
                            <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-2" />Add Praça</Button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {['SP - Capital', 'RJ - Metropolitana', 'MG - BH', 'Sul', 'Nordeste'].map(r => (
                              <div key={r} className="flex items-center gap-2 p-2 border rounded-lg">
                                <Switch checked={selectedCarrier.regioes_atendidas?.includes(r)} />
                                <span className="text-xs font-medium">{r}</span>
                              </div>
                            ))}
                          </div>
                        </TabsContent>

                        <TabsContent value="non-api" className="space-y-4">
                          <div className="space-y-2">
                            <Label>Template de Mensagem (WhatsApp)</Label>
                            <Textarea 
                              className="font-mono text-xs h-32"
                              placeholder="Olá {{carrier}}, solicito cotação para o trecho {{origem}} -> {{destino}}..."
                              value={selectedCarrier.non_api_config?.whatsapp_template || ''}
                              onChange={e => {
                                const cfg = { ...selectedCarrier.non_api_config, whatsapp_template: e.target.value };
                                updateCarrier.mutate({ id: selectedCarrier.id, non_api_config: cfg });
                              }}
                            />
                          </div>
                        </CardContent>
                      </Tabs>
                    </CardContent>
                  </>
                ) : (
                  <div className="h-96 flex items-center justify-center text-muted-foreground italic">
                    Selecione uma transportadora para configurar
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="regras" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuração de Melhor Frete</CardTitle>
                <CardDescription>Defina pesos e limites de SLA por tipo de carga ou evento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {['Normal', 'Urgente', 'Evento Crítico'].map(type => (
                    <div key={type} className="p-4 border rounded-xl space-y-4 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-primary">{type}</h4>
                        <Switch checked />
                      </div>
                      <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label>Peso Preço (%)</Label>
                          <Input type="number" defaultValue={type === 'Urgente' ? 30 : 70} />
                        </div>
                        <div className="space-y-2">
                          <Label>Peso Prazo (%)</Label>
                          <Input type="number" defaultValue={type === 'Urgente' ? 70 : 30} />
                        </div>
                        <div className="space-y-2">
                          <Label>Limite SLA (Dias)</Label>
                          <Input type="number" defaultValue={type === 'Normal' ? 10 : 3} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integracoes" className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5 text-primary" />
                      Incoming Webhooks
                    </CardTitle>
                    <CardDescription>Mapeamento de respostas automáticas de parceiros</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {mappings.filter(m => m.source_type === 'webhook').map(m => (
                      <div key={m.id} className="p-3 border rounded-lg flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold">{m.transportadora?.nome_fantasia}</p>
                          <p className="text-xs text-muted-foreground">Endpoint: /hooks/carrier/{m.id}</p>
                        </div>
                        <Button size="sm" variant="ghost"><Settings className="h-4 w-4" /></Button>
                      </div>
                    ))}
                    <Button className="w-full" variant="outline"><Plus className="h-4 w-4 mr-2" />Novo Webhook</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileJson className="h-5 w-5 text-primary" />
                      Normalização de Campos
                    </CardTitle>
                    <CardDescription>Mapeie campos externos para o padrão Nexus</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold uppercase text-muted-foreground px-2">
                      <span>Campo Externo</span>
                      <span>Campo Nexus</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { ext: 'valor_total', int: 'valor_cotado' },
                        { ext: 'delivery_days', int: 'prazo_dias' },
                        { ext: 'obs', int: 'observacoes' }
                      ].map((m, i) => (
                        <div key={i} className="grid grid-cols-2 gap-2">
                          <Input defaultValue={m.ext} className="h-8 text-xs" />
                          <Input defaultValue={m.int} className="h-8 text-xs bg-muted" readOnly />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
             </div>
          </TabsContent>

          <TabsContent value="automacao">
             <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Fluxo Nexus RPA
                  </CardTitle>
                  <CardDescription>Configuração de gatilhos automáticos para cotações manuais</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-white border rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-success/10 rounded-full"><RefreshCw className="h-6 w-6 text-success" /></div>
                      <div>
                        <p className="font-bold">Retentativas Automáticas</p>
                        <p className="text-xs text-muted-foreground">Tentar novamente se falhar no envio do WhatsApp/Email</p>
                      </div>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                     <div className="p-4 bg-white border rounded-xl text-center">
                        <p className="text-2xl font-black text-primary">3</p>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Max Retries</p>
                     </div>
                     <div className="p-4 bg-white border rounded-xl text-center">
                        <p className="text-2xl font-black text-primary">15m</p>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Intervalo</p>
                     </div>
                     <div className="p-4 bg-white border rounded-xl text-center">
                        <p className="text-2xl font-black text-primary">60m</p>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground">Timeout Resposta</p>
                     </div>
                  </div>
                </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
