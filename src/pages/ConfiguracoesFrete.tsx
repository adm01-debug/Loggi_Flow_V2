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
  RefreshCw,
  Brain,
  Scale,
  TrendingUp,
  Target
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/common/PageHeader';
import { NormalizationMapping } from '@/components/transportadoras/NormalizationMapping';
import { Slider } from '@/components/ui/slider';

interface CarrierConfig {
  id: string;
  nome_fantasia: string;
  credentials: any;
  regioes_atendidas: string[];
  non_api_config: any;
  coverage_details?: any;
}

export default function FreightConfig() {
  const queryClient = useQueryClient();
  const [selectedCarrierId, setSelectedCarrierId] = useState<string>('');

  // 1. Selection Rules
  const { data: rules = [], refetch: refetchRules } = useQuery({
    queryKey: ['freight-selection-rules'],
    queryFn: async () => {
      const { data, error } = await supabase.from('freight_selection_rules').select('*');
      if (error) throw error;
      return data;
    }
  });

  const [editingRule, setEditRule] = useState<any>(null);

  const saveRule = useMutation({
    mutationFn: async (rule: any) => {
      const { data, error } = await supabase.from('freight_selection_rules').upsert(rule);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freight-selection-rules'] });
      refetchRules();
      toast.success('Regra de seleção salva!');
      setEditRule(null);
    }
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('freight_selection_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['freight-selection-rules'] });
      refetchRules();
      toast.success('Regra excluída');
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
    queryFn: async (): Promise<CarrierConfig[]> => {
      const { data, error } = await supabase.from('transportadoras').select('*').order('nome_fantasia');
      if (error) throw error;
      return (data || []) as any;
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
                                value={(selectedCarrier.credentials as any)?.api_key || ''} 
                                onChange={e => {
                                  const creds = { ...(selectedCarrier.credentials as any), api_key: e.target.value };
                                  updateCarrier.mutate({ id: selectedCarrier.id, credentials: creds });
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Endpoint URL</Label>
                              <Input 
                                placeholder="https://api..." 
                                value={(selectedCarrier.credentials as any)?.endpoint || ''}
                                onChange={e => {
                                  const creds = { ...(selectedCarrier.credentials as any), endpoint: e.target.value };
                                  updateCarrier.mutate({ id: selectedCarrier.id, credentials: creds });
                                }}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Usuário Portal</Label>
                              <Input 
                                value={(selectedCarrier.credentials as any)?.username || ''}
                                onChange={e => {
                                  const creds = { ...(selectedCarrier.credentials as any), username: e.target.value };
                                  updateCarrier.mutate({ id: selectedCarrier.id, credentials: creds });
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Senha Portal</Label>
                              <Input 
                                type="password" 
                                value={(selectedCarrier.credentials as any)?.password || ''}
                                onChange={e => {
                                  const creds = { ...(selectedCarrier.credentials as any), password: e.target.value };
                                  updateCarrier.mutate({ id: selectedCarrier.id, credentials: creds });
                                }}
                              />
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="malha" className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label>Cobertura de Regiões e Malha Tática</Label>
                            <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-2" />Nova Região</Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold">Tipo de Cobertura</Label>
                                <Select defaultValue="regional">
                                   <SelectTrigger className="h-8 text-xs font-black uppercase"><SelectValue /></SelectTrigger>
                                   <SelectContent>
                                      <SelectItem value="nacional">Nacional (Brasil)</SelectItem>
                                      <SelectItem value="regional">Regional (Específico)</SelectItem>
                                      <SelectItem value="lastmile">Last Mile (Cidade)</SelectItem>
                                   </SelectContent>
                                </Select>
                             </div>
                             <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold">Eficiência Malha</Label>
                                <div className="h-8 flex items-center gap-2 bg-muted/40 px-3 rounded">
                                   <Zap className="h-3 w-3 text-warning" />
                                   <span className="text-xs font-black">94.8% OPTIMIZED</span>
                                </div>
                             </div>
                          </div>

                          <div className="space-y-2">
                             <Label className="text-[10px] uppercase font-bold">Zonas de Atuação</Label>
                             <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {['SP - Capital', 'RJ - Metropolitana', 'MG - BH', 'Curitiba - PR', 'Porto Alegre - RS', 'Campinas - SP'].map(r => (
                                  <div key={r} className="flex items-center justify-between p-2 border rounded-xl bg-muted/20 hover:border-primary/40 transition-all group/region">
                                    <span className="text-[10px] font-black uppercase tracking-tighter truncate">{r}</span>
                                    <Switch checked={selectedCarrier.regioes_atendidas?.includes(r)} className="scale-75" />
                                  </div>
                                ))}
                             </div>
                          </div>

                          <div className="p-4 border-2 border-dashed rounded-xl bg-muted/10">
                             <p className="text-[10px] text-muted-foreground uppercase font-bold text-center italic">
                               Integração de Malha: O Nexus prioriza estas rotas para este parceiro.
                             </p>
                          </div>
                        </TabsContent>

                        <TabsContent value="non-api" className="space-y-4">
                          <div className="space-y-2">
                            <Label>Template de Mensagem (WhatsApp)</Label>
                            <Textarea 
                              className="font-mono text-xs h-32"
                              placeholder="Olá {{carrier}}, solicito cotação para o trecho {{origem}} -> {{destino}}..."
                              value={(selectedCarrier.non_api_config as any)?.whatsapp_template || ''}
                              onChange={e => {
                                const cfg = { ...(selectedCarrier.non_api_config as any), whatsapp_template: e.target.value };
                                updateCarrier.mutate({ id: selectedCarrier.id, non_api_config: cfg });
                              }}
                            />
                          </div>
                        </TabsContent>
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
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Configuração de Melhor Frete</CardTitle>
                  <CardDescription>Defina pesos e limites de SLA por tipo de carga ou evento</CardDescription>
                </div>
                <Button size="sm" onClick={() => setEditRule({ event_type: 'Novo Evento', price_weight: 50, time_weight: 50, max_sla_days: 10, is_active: true })}><Plus className="h-4 w-4 mr-2" />Add Regra</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {rules.length === 0 && !editingRule && <p className="text-center py-8 text-muted-foreground italic">Nenhuma regra personalizada. Usando padrões do sistema.</p>}
                  
                  {editingRule && (
                    <div className="p-6 border-2 border-primary rounded-xl space-y-4 bg-primary/5 mb-8">
                       <h4 className="font-bold text-primary flex items-center justify-between">
                         Editando Regra: {editingRule.event_type}
                         <Button variant="ghost" size="sm" onClick={() => setEditRule(null)}>Cancelar</Button>
                       </h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <Label>Tipo de Evento</Label>
                             <Input value={editingRule.event_type} onChange={e => setEditRule({...editingRule, event_type: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                             <Label>SLA Máximo (Dias)</Label>
                             <Input type="number" value={editingRule.max_sla_days} onChange={e => setEditRule({...editingRule, max_sla_days: parseInt(e.target.value)})} />
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <Label>Peso Preço (%)</Label>
                             <Input type="number" value={editingRule.price_weight} onChange={e => {
                               const val = parseInt(e.target.value);
                               setEditRule({...editingRule, price_weight: val, time_weight: 100 - val});
                             }} />
                          </div>
                          <div className="space-y-2">
                             <Label>Peso Prazo (%)</Label>
                             <Input type="number" value={editingRule.time_weight} onChange={e => {
                               const val = parseInt(e.target.value);
                               setEditRule({...editingRule, time_weight: val, price_weight: 100 - val});
                             }} />
                          </div>
                       </div>
                       <Button className="w-full mt-4" onClick={() => saveRule.mutate(editingRule)} disabled={saveRule.isPending}>
                         {saveRule.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                         Salvar Regra
                       </Button>
                    </div>
                  )}

                  {rules.map((rule: any) => (
                    <div key={rule.id} className="p-4 border rounded-xl space-y-4 bg-muted/20 hover:border-primary/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-primary/10 rounded-lg"><Zap className="h-4 w-4 text-primary" /></div>
                           <h4 className="font-bold text-foreground">{rule.event_type}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                           <Button variant="ghost" size="icon" onClick={() => setEditRule(rule)}><Settings className="h-4 w-4" /></Button>
                           <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteRule.mutate(rule.id)}><Trash2 className="h-4 w-4" /></Button>
                           <Switch checked={rule.is_active} onCheckedChange={(v) => saveRule.mutate({...rule, is_active: v})} />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase text-muted-foreground">Preço</Label>
                          <p className="font-black">{rule.price_weight}%</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase text-muted-foreground">Prazo</Label>
                          <p className="font-black">{rule.time_weight}%</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase text-muted-foreground">Limite SLA</Label>
                          <p className="font-black">{rule.max_sla_days}d</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Default Fallback info */}
                  {rules.length > 0 && (
                    <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest mt-4">
                      O sistema usará estas regras para classificar o "Melhor Custo-Benefício"
                    </p>
                  )}
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
                      Incoming Webhooks / API
                    </CardTitle>
                    <CardDescription>Consolidação automática de respostas via Webhooks ou API externa</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {mappings.filter((m: any) => m.source_type === 'webhook').map((m: any) => (
                      <div key={m.id} className="p-4 border-2 border-primary/20 rounded-xl bg-primary/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-black uppercase italic tracking-tighter">{m.transportadora?.nome_fantasia}</p>
                            <p className="text-[10px] font-mono text-muted-foreground">NX-WH-{m.id.slice(0,8)}</p>
                          </div>
                          <div className="flex gap-1">
                             <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><Settings className="h-4 w-4" /></Button>
                             <Switch checked={m.is_active} />
                          </div>
                        </div>
                        <div className="bg-black/40 p-2 rounded border border-white/10 flex items-center justify-between">
                           <code className="text-[10px] text-primary truncate mr-2">/api/hooks/freight/{m.id}</code>
                           <Button variant="ghost" size="sm" className="h-6 px-2 text-[8px] uppercase font-black" onClick={() => {navigator.clipboard.writeText(`https://nexus-api.lovable.app/api/hooks/freight/${m.id}`); toast.success('URL Copiada');}}>Copy</Button>
                        </div>
                      </div>
                    ))}
                    <Button className="w-full h-12 border-dashed border-2 rounded-xl" variant="outline"><Plus className="h-4 w-4 mr-2" />Novo Gateway de Resposta</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileJson className="h-5 w-5 text-primary" />
                      Normalização de Campos (Parser)
                    </CardTitle>
                    <CardDescription>Mapeie chaves do JSON externo para normalização Nexus</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-[9px] font-black uppercase text-muted-foreground px-2">
                      <span>CHAVE EXTERNA (PARTNER)</span>
                      <span>CHAVE INTERNA (NEXUS)</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { ext: 'shipping_cost', int: 'valor_cotado', type: 'decimal' },
                        { ext: 'estimated_days', int: 'prazo_dias', type: 'integer' },
                        { ext: 'partner_notes', int: 'observacoes', type: 'text' },
                        { ext: 'tracking_id', int: 'codigo_rastreio', type: 'text' }
                      ].map((m, i) => (
                        <div key={i} className="grid grid-cols-2 gap-2 p-1 border border-white/5 rounded bg-muted/10">
                          <Input defaultValue={m.ext} className="h-8 text-xs font-mono bg-transparent border-none" />
                          <div className="flex items-center gap-2 px-2 bg-muted/40 rounded">
                             <span className="text-xs font-bold text-primary italic">→</span>
                             <span className="text-[10px] font-black text-foreground uppercase">{m.int}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 border-t border-white/5 mt-4">
                       <p className="text-[9px] text-muted-foreground leading-relaxed uppercase font-bold">
                         A normalização garante que o sistema consolide preço e prazo automaticamente, independente do formato enviado pelo parceiro.
                       </p>
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
                    Fluxo Nexus RPA & Automação Inteligente
                  </CardTitle>
                  <CardDescription>Gatilhos inteligentes e processamento automático de respostas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                     <div className="flex-1 space-y-4">
                        <div className="p-4 bg-white border-2 border-success/30 rounded-xl flex items-center justify-between group/auto transition-all">
                           <div className="flex items-center gap-4">
                              <div className="p-3 bg-success/10 rounded-full text-success"><RefreshCw className="h-6 w-6" /></div>
                              <div>
                                 <p className="font-black text-xs uppercase tracking-widest">Retentativas Automáticas</p>
                                 <p className="text-[10px] text-muted-foreground uppercase font-bold">Fallback em falhas de disparo</p>
                              </div>
                           </div>
                           <Switch defaultChecked />
                        </div>
                        <div className="p-4 bg-white border-2 border-primary/30 rounded-xl flex items-center justify-between group/auto transition-all">
                           <div className="flex items-center gap-4">
                              <div className="p-3 bg-primary/10 rounded-full text-primary"><Search className="h-6 w-6" /></div>
                              <div>
                                 <p className="font-black text-xs uppercase tracking-widest">OCR & Resposta Inteligente</p>
                                 <p className="text-[10px] text-muted-foreground uppercase font-bold">Captura automática de PDF/Print</p>
                              </div>
                           </div>
                           <Switch defaultChecked />
                        </div>
                     </div>

                     <div className="flex-1 p-6 bg-black border border-white/10 rounded-2xl relative overflow-hidden group/logs">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-primary animate-scan opacity-40" />
                        <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Nexus RPA Status</h5>
                        <div className="space-y-3 font-mono text-[9px]">
                           <div className="flex gap-2 text-success">
                              <span className="opacity-50">[12:45]</span>
                              <span>GATEWAY: DISPARO WHATSAPP OK</span>
                           </div>
                           <div className="flex gap-2 text-white/40">
                              <span className="opacity-50">[12:46]</span>
                              <span>PENDING: AGUARDANDO RESPOSTA LOGÍSTICA</span>
                           </div>
                           <div className="flex gap-2 text-primary">
                              <span className="opacity-50">[12:48]</span>
                              <span>HOOK: RESPOSTA RECEBIDA (R$ 145.00)</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
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
