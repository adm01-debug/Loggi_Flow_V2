import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
  Target,
  Clock
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
        <div className="flex-1 min-w-0 animate-in slide-in-from-left-6 duration-700 ease-out-expo">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-foreground flex items-center gap-3 sm:gap-4 tracking-tighter">
            <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/40 shadow-xl shadow-primary/20 group cursor-pointer transition-transform hover:rotate-6">
              <Settings className="w-6 h-6 sm:w-9 sm:h-9 text-white animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="truncate drop-shadow-sm">Nexus Freight Config</span>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-primary uppercase tracking-[0.2em]">Parametrização Tática de Malha</span>
              </div>
            </div>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-2xl font-medium">Gestão de credenciais, regras de decisão automatizada e otimização de praça.</p>
        </div>

        <Tabs defaultValue="transportadoras" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1.5 bg-sidebar-accent/50 rounded-2xl border border-white/5 mb-8">
            <TabsTrigger value="transportadoras" className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all">Transportadoras</TabsTrigger>
            <TabsTrigger value="regras" className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all">Regras de Seleção</TabsTrigger>
            <TabsTrigger value="integracoes" className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all">Integrações</TabsTrigger>
            <TabsTrigger value="automacao" className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all">Automação RPA</TabsTrigger>
          </TabsList>

          <TabsContent value="transportadoras" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-1 group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-card to-card/95 border-none shadow-lg">
                <CardHeader className="border-b border-white/5">
                  <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-primary">Selecionar Transportadora</CardTitle>
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
                          selectedCarrierId === c.id ? 'bg-primary text-white font-black uppercase tracking-widest text-[10px] italic shadow-lg shadow-primary/20' : 'hover:bg-muted font-bold text-muted-foreground'
                        }`}
                      >
                        {c.nome_fantasia}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2 group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-card to-card/95 border-none shadow-lg">
                {selectedCarrier ? (
                  <>
                    <CardHeader className="border-b border-white/5">
                      <CardTitle className="flex items-center gap-3 font-black text-2xl tracking-tighter uppercase italic text-white">
                        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                          <Globe className="h-6 w-6 text-primary animate-pulse" />
                        </div>
                        Configurar: {selectedCarrier.nome_fantasia}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="credenciais">
                        <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-sidebar-accent/50 rounded-xl border border-white/5 mb-6">
                          <TabsTrigger value="credenciais" className="rounded-lg py-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[9px] gap-1.5 transition-all"><Key className="h-3.5 w-3.5" />API / Login</TabsTrigger>
                          <TabsTrigger value="malha" className="rounded-lg py-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[9px] gap-1.5 transition-all"><Map className="h-3.5 w-3.5" />Malha / Praça</TabsTrigger>
                          <TabsTrigger value="non-api" className="rounded-lg py-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[9px] gap-1.5 transition-all"><MessageSquare className="h-3.5 w-3.5" />WhatsApp/Email</TabsTrigger>
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

                        <TabsContent value="non-api" className="space-y-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Template de Mensagem (WhatsApp/Email)</Label>
                                <Textarea 
                                  className="font-mono text-xs h-32"
                                  placeholder="Olá {{carrier}}, solicito cotação para o trecho {{origem}} -> {{destino}}..."
                                  value={(selectedCarrier.non_api_config as any)?.whatsapp_template || ''}
                                  onChange={e => {
                                    const cfg = { ...(selectedCarrier.non_api_config as any), whatsapp_template: e.target.value };
                                    updateCarrier.mutate({ id: selectedCarrier.id, non_api_config: cfg });
                                  }}
                                />
                                <p className="text-[10px] text-muted-foreground">O Nexus disparará esta mensagem automaticamente quando necessário.</p>
                              </div>
                            </div>
                            
                            <div className="border-l pl-8">
                               <NormalizationMapping 
                                 carrierId={selectedCarrier.id} 
                                 initialConfig={(selectedCarrier.non_api_config as any)?.normalization}
                                 onSave={(normConfig) => {
                                   const cfg = { ...(selectedCarrier.non_api_config as any), normalization: normConfig };
                                   updateCarrier.mutate({ id: selectedCarrier.id, non_api_config: cfg });
                                 }}
                               />
                            </div>
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
            <Card className="group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-card to-card/95 border-none shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 p-8">
                <div>
                  <CardTitle className="font-black text-2xl tracking-tighter uppercase italic text-white">Configuração de Melhor Frete</CardTitle>
                  <CardDescription className="text-xs font-black uppercase tracking-[0.2em] text-primary/70 mt-1">Defina pesos e limites de SLA por tipo de carga ou evento</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button size="lg" variant="outline" onClick={() => window.location.href='/automacao-regras'} className="h-12 px-6 rounded-xl border-2 font-bold uppercase tracking-widest text-[10px] gap-2 hover:bg-primary/5 transition-all"><Zap className="h-4 w-4" />Regras</Button>
                  <Button size="lg" onClick={() => setEditRule({ event_type: 'Novo Evento', price_weight: 0.5, time_weight: 0.3, performance_weight: 0.2, max_sla_days: 10, is_active: true, is_default: false })} className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 bg-gradient-to-r from-primary via-primary/90 to-primary/80 shadow-xl shadow-primary/20 hover:scale-[1.03] transition-all"><Plus className="h-5 w-5" />Add Regra</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {rules.length === 0 && !editingRule && <p className="text-center py-8 text-muted-foreground italic">Nenhuma regra personalizada. Usando padrões do sistema.</p>}
                  
                  {editingRule && (
                    <div className="p-8 border-2 border-primary/30 rounded-[2rem] bg-primary/5 mb-8 shadow-2xl relative overflow-hidden group/form animate-in zoom-in-95 duration-500">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
                       <div className="flex items-center justify-between">
                         <h4 className="font-bold text-primary flex items-center gap-2 text-lg">
                           <Brain className="h-5 w-5" />
                           {editingRule.id ? 'Editar Estratégia' : 'Nova Estratégia Nexus'}
                         </h4>
                         <Button variant="ghost" size="sm" onClick={() => setEditRule(null)}>Cancelar</Button>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="space-y-2">
                             <Label>Nome do Evento / Tipo</Label>
                             <Input placeholder="Ex: Black Friday, Urgente" value={editingRule.event_type} onChange={e => setEditRule({...editingRule, event_type: e.target.value})} />
                             <p className="text-[10px] text-muted-foreground mt-1">O nome deve corresponder à 'Urgência' na seleção ou ao tipo de evento.</p>
                          </div>
                          <div className="space-y-2">
                             <Label>SLA Máximo Permitido (Dias)</Label>
                             <Input type="number" value={editingRule.max_sla_days} onChange={e => setEditRule({...editingRule, max_sla_days: parseInt(e.target.value)})} />
                          </div>
                          <div className="flex items-end gap-2 pb-1">
                             <Switch 
                               checked={editingRule.is_default} 
                               onCheckedChange={checked => setEditRule({...editingRule, is_default: checked})} 
                             />
                             <Label>Regra Padrão (Fallback)</Label>
                          </div>
                       </div>

                       <div className="space-y-8 pt-4">
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <Label className="flex items-center gap-2"><Target className="h-4 w-4" /> Peso de Preço ({(editingRule.price_weight * 100).toFixed(0)}%)</Label>
                            </div>
                            <Slider 
                              value={[editingRule.price_weight * 100]} 
                              onValueChange={(val) => setEditRule({...editingRule, price_weight: val[0]/100})} 
                              max={100} step={5} 
                            />
                          </div>

                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <Label className="flex items-center gap-2"><Clock className="h-4 w-4" /> Peso de Prazo ({(editingRule.time_weight * 100).toFixed(0)}%)</Label>
                            </div>
                            <Slider 
                              value={[editingRule.time_weight * 100]} 
                              onValueChange={(val) => setEditRule({...editingRule, time_weight: val[0]/100})} 
                              max={100} step={5} 
                            />
                          </div>

                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <Label className="flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Peso de Performance/Score ({(editingRule.performance_weight * 100).toFixed(0)}%)</Label>
                            </div>
                            <Slider 
                              value={[editingRule.performance_weight * 100]} 
                              onValueChange={(val) => setEditRule({...editingRule, performance_weight: val[0]/100})} 
                              max={100} step={5} 
                            />
                          </div>
                       </div>

                       <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                          <p className="text-xs text-muted-foreground">
                            <strong>Nota:</strong> A soma dos pesos deve idealmente ser 1.0 (100%) para um score normalizado. 
                            Atual: {((editingRule.price_weight + editingRule.time_weight + editingRule.performance_weight) * 100).toFixed(0)}%
                          </p>
                          <Button onClick={() => saveRule.mutate(editingRule)} disabled={saveRule.isPending}>
                            {saveRule.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Publicar Estratégia
                          </Button>
                       </div>
                    </div>
                  )}

                  <div className="grid gap-4">
                    {rules.map((rule: any) => (
                      <div key={rule.id} className="p-4 border rounded-xl space-y-4 bg-muted/20 hover:border-primary/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                             <div className="p-2 bg-primary/10 rounded-lg"><Zap className="h-4 w-4 text-primary" /></div>
                             <div>
                                <h4 className="font-bold flex items-center gap-2">
                                  {rule.event_type}
                                  {rule.is_default && <Badge variant="secondary">Padrão</Badge>}
                                  {!rule.is_active && <Badge variant="outline">Inativa</Badge>}
                                </h4>
                                <p className="text-xs text-muted-foreground">SLA Máximo: {rule.max_sla_days} dias</p>
                             </div>
                          </div>
                          <div className="flex gap-2">
                             <Button size="sm" variant="outline" onClick={() => setEditRule(rule)}>Configurar</Button>
                             <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteRule.mutate(rule.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                           <div className="text-center p-2 bg-background rounded-lg border">
                             <p className="text-[10px] text-muted-foreground uppercase font-bold">Custo</p>
                             <p className="text-sm font-black">{(rule.price_weight * 100).toFixed(0)}%</p>
                           </div>
                           <div className="text-center p-2 bg-background rounded-lg border">
                             <p className="text-[10px] text-muted-foreground uppercase font-bold">Prazo</p>
                             <p className="text-sm font-black">{(rule.time_weight * 100).toFixed(0)}%</p>
                           </div>
                           <div className="text-center p-2 bg-background rounded-lg border">
                             <p className="text-[10px] text-muted-foreground uppercase font-bold">Confiança</p>
                             <p className="text-sm font-black">{(rule.performance_weight * 100).toFixed(0)}%</p>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>

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
                           <code className="text-[10px] text-primary truncate mr-2">/functions/v1/nexus-webhook-receiver</code>
                           <Button variant="ghost" size="sm" className="h-6 px-2 text-[8px] uppercase font-black" onClick={() => {navigator.clipboard.writeText(`https://hgicfqjayrjurivtygqf.supabase.co/functions/v1/nexus-webhook-receiver`); toast.success('URL do Nexus Receiver Copiada');}}>Copy</Button>
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
