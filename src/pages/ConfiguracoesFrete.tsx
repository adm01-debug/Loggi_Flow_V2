/* eslint-disable max-lines */
import { useState } from "react";
import { sanitizarUrlSupabase } from "@/lib/supabaseEnv";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";
import {
  Settings,
  Map,
  Key,
  MessageSquare,
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
  TrendingUp,
  Target,
  Clock,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogBody,
  DialogClose,
} from "@/components/ui/dialog";
import {
  NormalizationMapping,
  type NormalizationConfig,
} from "@/components/transportadoras/NormalizationMapping";
import { Slider } from "@/components/ui/slider";

interface CarrierConfig {
  id: string;
  nome_fantasia: string;
  credentials: Record<string, string> | null;
  regioes_atendidas: string[];
  non_api_config: Record<string, unknown> | null;
  coverage_details?: Record<string, unknown> | null;
}

interface FreightRule {
  id?: string;
  event_type: string;
  max_sla_days: number;
  price_weight: number;
  time_weight: number;
  performance_weight: number;
  is_active: boolean;
  is_default: boolean;
}

interface FreightMapping {
  id: string;
  transportadora_id?: string | null;
  source_type: string;
  is_active: boolean;
  mapping_config?: {
    endpoint_url?: string | null;
  } | null;
  transportadora?: { nome_fantasia?: string } | null;
}

export default function FreightConfig() {
  const queryClient = useQueryClient();
  const [selectedCarrierId, setSelectedCarrierId] = useState<string>("");
  const [carrierFilter, setCarrierFilter] = useState("");
  const [novaRegiao, setNovaRegiao] = useState("");
  const [novaRegiaoModal, setNovaRegiaoModal] = useState(false);
  const [novoGatewayModal, setNovoGatewayModal] = useState(false);
  const [novoGatewayTransp, setNovoGatewayTransp] = useState("");
  const [novoGatewayUrl, setNovoGatewayUrl] = useState("");
  const [parserCarrierId, setParserCarrierId] = useState("");
  const [autoRetries, setAutoRetries] = useState(true);
  const [autoOcr, setAutoOcr] = useState(true);

  // 1. Selection Rules
  const { data: rules = [], refetch: refetchRules } = useQuery({
    queryKey: ["freight-selection-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("freight_selection_rules")
        .select("*");
      if (error) throw error;
      return (data ?? []) as unknown as FreightRule[];
    },
  });

  const [editingRule, setEditRule] = useState<FreightRule | null>(null);

  const saveRule = useMutation({
    mutationFn: async (rule: FreightRule) => {
      const { data, error } = await supabase
        .from("freight_selection_rules")
        .upsert(rule);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["freight-selection-rules"] });
      refetchRules();
      toast.success("Regra de seleção salva!");
      setEditRule(null);
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("freight_selection_rules")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["freight-selection-rules"] });
      refetchRules();
      toast.success("Regra excluída");
    },
  });

  // 2. Integration Mappings
  const { data: mappings = [] } = useQuery({
    queryKey: ["freight-integration-mappings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("freight_integration_mappings")
        .select("*, transportadora:transportadoras(nome_fantasia)");
      if (error) throw error;
      return (data ?? []) as unknown as FreightMapping[];
    },
  });

  // 3. Carrier Credentials & Non-API Config
  const { data: carriers = [] } = useQuery({
    queryKey: ["carriers-config"],
    queryFn: async (): Promise<CarrierConfig[]> => {
      const { data, error } = await supabase
        .from("transportadoras")
        .select("*")
        .is("deleted_at", null)
        .order("nome_fantasia")
        .limit(200);
      if (error) throw error;
      return (data || []) as CarrierConfig[];
    },
  });

  const updateCarrier = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: TablesUpdate<"transportadoras"> & { id: string }) => {
      const { error } = await supabase
        .from("transportadoras")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["carriers-config"] });
      toast.success("Configuração da transportadora atualizada!");
    },
  });

  const loadedCarrier = carriers.find((c) => c.id === selectedCarrierId);
  const selectedCarrier = loadedCarrier;

  const toggleMapping = useMutation({
    mutationFn: async (m: FreightMapping) => {
      const { error } = await supabase
        .from("freight_integration_mappings")
        .update({ is_active: !m.is_active })
        .eq("id", m.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["freight-integration-mappings"],
      });
      toast.success("Gateway atualizado!");
    },
    onError: (e) => {
      toast.error(`Não foi possível atualizar o gateway: ${e.message}`);
    },
  });

  const addMapping = useMutation({
    mutationFn: async () => {
      if (!novoGatewayTransp) throw new Error("Selecione uma transportadora");
      const { data, error } = await supabase
        .from("freight_integration_mappings")
        .insert({
          transportadora_id: novoGatewayTransp,
          source_type: "webhook",
          mapping_config: {
            endpoint_url:
              novoGatewayUrl || "/functions/v1/nexus-webhook-receiver",
          },
          is_active: true,
        })
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Gateway criado!");
      setNovoGatewayModal(false);
      setNovoGatewayTransp("");
      setNovoGatewayUrl("");
      queryClient.invalidateQueries({
        queryKey: ["freight-integration-mappings"],
      });
    },
    onError: (e) => {
      toast.error(
        `Falha ao criar gateway (permissão de admin necessária): ${e.message}`,
      );
    },
  });

  const zonasMalha = [
    "SP - Capital",
    "RJ - Metropolitana",
    "MG - BH",
    "Curitiba - PR",
    "Porto Alegre - RS",
    "Campinas - SP",
  ];

  const toggleZona = (zona: string) => {
    if (!selectedCarrier) return;
    const atuais = selectedCarrier.regioes_atendidas ?? [];
    const next = atuais.includes(zona)
      ? atuais.filter((r: string) => r !== zona)
      : [...atuais, zona];
    updateCarrier.mutate({ id: selectedCarrier.id, regioes_atendidas: next });
  };

  const persistirCobertura = (coverageType: string) => {
    if (!selectedCarrier) return;
    updateCarrier.mutate({
      id: selectedCarrier.id,
      coverage_details: {
        ...(selectedCarrier.coverage_details as
          Record<string, unknown> | undefined),
        coverage_type: coverageType,
      },
    });
  };

  const addRegiao = () => {
    if (!selectedCarrier || !novaRegiao.trim()) return;
    const atual = selectedCarrier.regioes_atendidas ?? [];
    const next = Array.from(new Set([...atual, novaRegiao.trim()]));
    updateCarrier.mutate({ id: selectedCarrier.id, regioes_atendidas: next });
    setNovaRegiao("");
    setNovaRegiaoModal(false);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1 min-w-0 animate-in slide-in-from-left-6 duration-700 ease-out-expo">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-foreground flex items-center gap-3 sm:gap-4 tracking-tighter">
              <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/40 shadow-xl shadow-primary/20 group cursor-pointer transition-transform hover:rotate-6">
                <Settings className="w-6 h-6 sm:w-9 sm:h-9 text-white animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="truncate drop-shadow-sm">
                  Nexus Freight Config
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-primary uppercase tracking-[0.2em]">
                    Parametrização Tática de Malha
                  </span>
                </div>
              </div>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-2xl font-medium">
              Gestão de credenciais, regras de decisão automatizada e otimização
              de praça.
            </p>
          </div>
        </div>

        <Tabs defaultValue="transportadoras" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1.5 bg-sidebar-accent/50 rounded-2xl border border-white/5 mb-8">
            <TabsTrigger
              value="transportadoras"
              className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all"
            >
              Transportadoras
            </TabsTrigger>
            <TabsTrigger
              value="regras"
              className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all"
            >
              Regras de Seleção
            </TabsTrigger>
            <TabsTrigger
              value="integracoes"
              className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all"
            >
              Integrações
            </TabsTrigger>
            <TabsTrigger
              value="automacao"
              className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all"
            >
              Automação RPA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transportadoras" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-1 group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-card to-card/95 border-none shadow-lg">
                <CardHeader className="border-b border-white/5">
                  <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                    Selecionar Transportadora
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar..."
                      className="pl-8"
                      value={carrierFilter}
                      onChange={(e) => setCarrierFilter(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    {carriers
                      .filter((c) =>
                        c.nome_fantasia
                          .toLowerCase()
                          .includes(carrierFilter.toLowerCase()),
                      )
                      .map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCarrierId(c.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedCarrierId === c.id
                              ? "bg-primary text-white font-black uppercase tracking-widest text-[10px] italic shadow-lg shadow-primary/20"
                              : "hover:bg-muted font-bold text-muted-foreground"
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
                          <TabsTrigger
                            value="credenciais"
                            className="rounded-lg py-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[9px] gap-1.5 transition-all"
                          >
                            <Key className="h-3.5 w-3.5" />
                            API / Login
                          </TabsTrigger>
                          <TabsTrigger
                            value="malha"
                            className="rounded-lg py-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[9px] gap-1.5 transition-all"
                          >
                            <Map className="h-3.5 w-3.5" />
                            Malha / Praça
                          </TabsTrigger>
                          <TabsTrigger
                            value="non-api"
                            className="rounded-lg py-2 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[9px] gap-1.5 transition-all"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            WhatsApp/Email
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="credenciais" className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>API Key / Token</Label>
                              <Input
                                type="password"
                                value={
                                  (
                                    selectedCarrier.credentials as Record<
                                      string,
                                      string
                                    >
                                  )?.api_key || ""
                                }
                                onChange={(e) => {
                                  const creds = {
                                    ...(selectedCarrier.credentials as Record<
                                      string,
                                      string
                                    >),
                                    api_key: e.target.value,
                                  };
                                  updateCarrier.mutate({
                                    id: selectedCarrier.id,
                                    credentials: creds,
                                  });
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Endpoint URL</Label>
                              <Input
                                placeholder="https://api..."
                                value={
                                  (
                                    selectedCarrier.credentials as Record<
                                      string,
                                      string
                                    >
                                  )?.endpoint || ""
                                }
                                onChange={(e) => {
                                  const creds = {
                                    ...(selectedCarrier.credentials as Record<
                                      string,
                                      string
                                    >),
                                    endpoint: e.target.value,
                                  };
                                  updateCarrier.mutate({
                                    id: selectedCarrier.id,
                                    credentials: creds,
                                  });
                                }}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Usuário Portal</Label>
                              <Input
                                value={
                                  (
                                    selectedCarrier.credentials as Record<
                                      string,
                                      string
                                    >
                                  )?.username || ""
                                }
                                onChange={(e) => {
                                  const creds = {
                                    ...(selectedCarrier.credentials as Record<
                                      string,
                                      string
                                    >),
                                    username: e.target.value,
                                  };
                                  updateCarrier.mutate({
                                    id: selectedCarrier.id,
                                    credentials: creds,
                                  });
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Senha Portal</Label>
                              <Input
                                type="password"
                                value={
                                  (
                                    selectedCarrier.credentials as Record<
                                      string,
                                      string
                                    >
                                  )?.password || ""
                                }
                                onChange={(e) => {
                                  const creds = {
                                    ...(selectedCarrier.credentials as Record<
                                      string,
                                      string
                                    >),
                                    password: e.target.value,
                                  };
                                  updateCarrier.mutate({
                                    id: selectedCarrier.id,
                                    credentials: creds,
                                  });
                                }}
                              />
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="malha" className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label>Cobertura de Regiões e Malha Tática</Label>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setNovaRegiaoModal(true)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Nova Região
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[10px] uppercase font-bold">
                                Tipo de Cobertura
                              </Label>
                              <Select
                                value={
                                  ((
                                    selectedCarrier.coverage_details as Record<
                                      string,
                                      unknown
                                    > | null
                                  )?.coverage_type as string) ?? "regional"
                                }
                                onValueChange={persistirCobertura}
                              >
                                <SelectTrigger className="h-8 text-xs font-black uppercase">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="nacional">
                                    Nacional (Brasil)
                                  </SelectItem>
                                  <SelectItem value="regional">
                                    Regional (Específico)
                                  </SelectItem>
                                  <SelectItem value="lastmile">
                                    Last Mile (Cidade)
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] uppercase font-bold">
                                Regiões na Malha
                              </Label>
                              <div className="h-8 flex items-center gap-2 bg-muted/40 px-3 rounded">
                                <Zap className="h-3 w-3 text-warning" />
                                <span className="text-xs font-black">
                                  {selectedCarrier.regioes_atendidas?.length ??
                                    0}{" "}
                                  regiões configuradas
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold">
                              Zonas de Atuação
                            </Label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {Array.from(
                                new Set([
                                  ...zonasMalha,
                                  ...(selectedCarrier.regioes_atendidas ?? []),
                                ]),
                              ).map((r) => (
                                <div
                                  key={r}
                                  className="flex items-center justify-between p-2 border rounded-xl bg-muted/20 hover:border-primary/40 transition-all group/region"
                                >
                                  <span className="text-[10px] font-black uppercase tracking-tighter truncate">
                                    {r}
                                  </span>
                                  <Switch
                                    checked={
                                      selectedCarrier.regioes_atendidas?.includes(
                                        r,
                                      ) ?? false
                                    }
                                    onCheckedChange={() => toggleZona(r)}
                                    className="scale-75"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="p-4 border-2 border-dashed rounded-xl bg-muted/10">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold text-center italic">
                              Integração de Malha: O Nexus prioriza estas rotas
                              para este parceiro.
                            </p>
                          </div>
                        </TabsContent>

                        <TabsContent value="non-api" className="space-y-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>
                                  Template de Mensagem (WhatsApp/Email)
                                </Label>
                                <Textarea
                                  className="font-mono text-xs h-32"
                                  placeholder="Olá {{carrier}}, solicito cotação para o trecho {{origem}} -> {{destino}}..."
                                  value={
                                    ((
                                      selectedCarrier.non_api_config as Record<
                                        string,
                                        unknown
                                      > | null
                                    )?.whatsapp_template as string) || ""
                                  }
                                  onChange={(e) => {
                                    const cfg = {
                                      ...(selectedCarrier.non_api_config as Record<
                                        string,
                                        unknown
                                      >),
                                      whatsapp_template: e.target.value,
                                    };
                                    updateCarrier.mutate({
                                      id: selectedCarrier.id,
                                      non_api_config: cfg,
                                    });
                                  }}
                                />
                                <p className="text-[10px] text-muted-foreground">
                                  O Nexus disparará esta mensagem
                                  automaticamente quando necessário.
                                </p>
                              </div>
                            </div>

                            <div className="border-l pl-8">
                              <NormalizationMapping
                                carrierId={selectedCarrier.id}
                                initialConfig={
                                  (
                                    selectedCarrier.non_api_config as Record<
                                      string,
                                      unknown
                                    > | null
                                  )?.normalization as
                                    NormalizationConfig | undefined
                                }
                                onSave={(normConfig) => {
                                  const cfg = {
                                    ...(selectedCarrier.non_api_config as Record<
                                      string,
                                      unknown
                                    >),
                                    normalization: normConfig,
                                  };
                                  updateCarrier.mutate({
                                    id: selectedCarrier.id,
                                    non_api_config: cfg,
                                  });
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
                  <CardTitle className="font-black text-2xl tracking-tighter uppercase italic text-white">
                    Configuração de Melhor Frete
                  </CardTitle>
                  <CardDescription className="text-xs font-black uppercase tracking-[0.2em] text-primary/70 mt-1">
                    Defina pesos e limites de SLA por tipo de carga ou evento
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => (window.location.href = "/automacao-regras")}
                    className="h-12 px-6 rounded-xl border-2 font-bold uppercase tracking-widest text-[10px] gap-2 hover:bg-primary/5 transition-all"
                  >
                    <Zap className="h-4 w-4" />
                    Regras
                  </Button>
                  <Button
                    size="lg"
                    onClick={() =>
                      setEditRule({
                        event_type: "Novo Evento",
                        price_weight: 0.5,
                        time_weight: 0.3,
                        performance_weight: 0.2,
                        max_sla_days: 10,
                        is_active: true,
                        is_default: false,
                      })
                    }
                    className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 bg-gradient-to-r from-primary via-primary/90 to-primary/80 shadow-xl shadow-primary/20 hover:scale-[1.03] transition-all"
                  >
                    <Plus className="h-5 w-5" />
                    Add Regra
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {rules.length === 0 && !editingRule && (
                    <p className="text-center py-8 text-muted-foreground italic">
                      Nenhuma regra personalizada. Usando padrões do sistema.
                    </p>
                  )}

                  {editingRule && (
                    <div className="p-8 border-2 border-primary/30 rounded-[2rem] bg-primary/5 mb-8 shadow-2xl relative overflow-hidden group/form animate-in zoom-in-95 duration-500">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-primary flex items-center gap-2 text-lg">
                          <Brain className="h-5 w-5" />
                          {editingRule.id
                            ? "Editar Estratégia"
                            : "Nova Estratégia Nexus"}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditRule(null)}
                        >
                          Cancelar
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <Label>Nome do Evento / Tipo</Label>
                          <Input
                            placeholder="Ex: Black Friday, Urgente"
                            value={editingRule.event_type}
                            onChange={(e) =>
                              setEditRule({
                                ...editingRule,
                                event_type: e.target.value,
                              })
                            }
                          />
                          <p className="text-[10px] text-muted-foreground mt-1">
                            O nome deve corresponder à 'Urgência' na seleção ou
                            ao tipo de evento.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label>SLA Máximo Permitido (Dias)</Label>
                          <Input
                            type="number"
                            value={editingRule.max_sla_days}
                            onChange={(e) =>
                              setEditRule({
                                ...editingRule,
                                max_sla_days: parseInt(e.target.value),
                              })
                            }
                          />
                        </div>
                        <div className="flex items-end gap-2 pb-1">
                          <Switch
                            checked={editingRule.is_default}
                            onCheckedChange={(checked) =>
                              setEditRule({
                                ...editingRule,
                                is_default: checked,
                              })
                            }
                          />
                          <Label>Regra Padrão (Fallback)</Label>
                        </div>
                      </div>

                      <div className="space-y-8 pt-4">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <Label className="flex items-center gap-2">
                              <Target className="h-4 w-4" /> Peso de Preço (
                              {(editingRule.price_weight * 100).toFixed(0)}%)
                            </Label>
                          </div>
                          <Slider
                            value={[editingRule.price_weight * 100]}
                            onValueChange={(val) =>
                              setEditRule({
                                ...editingRule,
                                price_weight: val[0] / 100,
                              })
                            }
                            max={100}
                            step={5}
                          />
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <Label className="flex items-center gap-2">
                              <Clock className="h-4 w-4" /> Peso de Prazo (
                              {(editingRule.time_weight * 100).toFixed(0)}%)
                            </Label>
                          </div>
                          <Slider
                            value={[editingRule.time_weight * 100]}
                            onValueChange={(val) =>
                              setEditRule({
                                ...editingRule,
                                time_weight: val[0] / 100,
                              })
                            }
                            max={100}
                            step={5}
                          />
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <Label className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4" /> Peso de
                              Performance/Score (
                              {(editingRule.performance_weight * 100).toFixed(
                                0,
                              )}
                              %)
                            </Label>
                          </div>
                          <Slider
                            value={[editingRule.performance_weight * 100]}
                            onValueChange={(val) =>
                              setEditRule({
                                ...editingRule,
                                performance_weight: val[0] / 100,
                              })
                            }
                            max={100}
                            step={5}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">
                          <strong>Nota:</strong> A soma dos pesos deve
                          idealmente ser 1.0 (100%) para um score normalizado.
                          Atual:{" "}
                          {(
                            (editingRule.price_weight +
                              editingRule.time_weight +
                              editingRule.performance_weight) *
                            100
                          ).toFixed(0)}
                          %
                        </p>
                        <Button
                          onClick={() => saveRule.mutate(editingRule)}
                          disabled={saveRule.isPending}
                        >
                          {saveRule.isPending ? (
                            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Publicar Estratégia
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-4">
                    {rules.map((rule: FreightRule) => (
                      <div
                        key={rule.id}
                        className="p-4 border rounded-xl space-y-4 bg-muted/20 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Zap className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-bold flex items-center gap-2">
                                {rule.event_type}
                                {rule.is_default && (
                                  <Badge variant="secondary">Padrão</Badge>
                                )}
                                {!rule.is_active && (
                                  <Badge variant="outline">Inativa</Badge>
                                )}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                SLA Máximo: {rule.max_sla_days} dias
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditRule(rule)}
                            >
                              Configurar
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() =>
                                rule.id && deleteRule.mutate(rule.id)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2 bg-background rounded-lg border">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">
                              Custo
                            </p>
                            <p className="text-sm font-black">
                              {(rule.price_weight * 100).toFixed(0)}%
                            </p>
                          </div>
                          <div className="text-center p-2 bg-background rounded-lg border">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">
                              Prazo
                            </p>
                            <p className="text-sm font-black">
                              {(rule.time_weight * 100).toFixed(0)}%
                            </p>
                          </div>
                          <div className="text-center p-2 bg-background rounded-lg border">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">
                              Confiança
                            </p>
                            <p className="text-sm font-black">
                              {(rule.performance_weight * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {rules.length > 0 && (
                    <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest mt-4">
                      O sistema usará estas regras para classificar o "Melhor
                      Custo-Benefício"
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
                  <CardDescription>
                    Consolidação automática de respostas via Webhooks ou API
                    externa
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mappings
                    .filter((m: FreightMapping) => m.source_type === "webhook")
                    .map((m: FreightMapping) => (
                      <div
                        key={m.id}
                        className="p-4 border-2 border-primary/20 rounded-xl bg-primary/5 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-black uppercase italic tracking-tighter">
                              {m.transportadora?.nome_fantasia ??
                                "Gateway genérico"}
                            </p>
                            <p className="text-[10px] font-mono text-muted-foreground">
                              NX-WH-{m.id.slice(0, 8)}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                const url =
                                  m.mapping_config?.endpoint_url ??
                                  "/functions/v1/nexus-webhook-receiver";
                                navigator.clipboard.writeText(
                                  `${sanitizarUrlSupabase(import.meta.env.VITE_SUPABASE_URL) ?? ""}${url}`,
                                );
                                toast.success("URL do Gateway Copiada");
                              }}
                              title="Copiar URL"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Switch
                              checked={m.is_active}
                              onCheckedChange={() => toggleMapping.mutate(m)}
                            />
                          </div>
                        </div>
                        <div className="bg-black/40 p-2 rounded border border-white/10 flex items-center justify-between">
                          <code className="text-[10px] text-primary truncate mr-2">
                            {m.mapping_config?.endpoint_url ??
                              "/functions/v1/nexus-webhook-receiver"}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[8px] uppercase font-black"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${sanitizarUrlSupabase(import.meta.env.VITE_SUPABASE_URL) ?? ""}${m.mapping_config?.endpoint_url ?? "/functions/v1/nexus-webhook-receiver"}`,
                              );
                              toast.success("URL do Nexus Receiver Copiada");
                            }}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                    ))}
                  <Button
                    className="w-full h-12 border-dashed border-2 rounded-xl"
                    variant="outline"
                    onClick={() => setNovoGatewayModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Gateway de Resposta
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileJson className="h-5 w-5 text-primary" />
                    Normalização de Campos (Parser)
                  </CardTitle>
                  <CardDescription>
                    Mapeie chaves do JSON externo para normalização Nexus
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold">
                      Transportadora (para configurar o parser)
                    </Label>
                    <Select
                      value={parserCarrierId}
                      onValueChange={(v) => setParserCarrierId(v)}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Selecione uma transportadora..." />
                      </SelectTrigger>
                      <SelectContent>
                        {carriers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nome_fantasia}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {parserCarrierId && (
                    <NormalizationMapping
                      carrierId={parserCarrierId}
                      initialConfig={
                        (
                          carriers.find((c) => c.id === parserCarrierId)
                            ?.non_api_config as Record<string, unknown> | null
                        )?.normalization as NormalizationConfig | undefined
                      }
                      onSave={(normConfig) => {
                        const carrier = carriers.find(
                          (c) => c.id === parserCarrierId,
                        );
                        if (!carrier) return;
                        const cfg = {
                          ...(carrier.non_api_config as Record<
                            string,
                            unknown
                          >),
                          normalization: normConfig,
                        };
                        updateCarrier.mutate({
                          id: carrier.id,
                          non_api_config: cfg,
                        });
                      }}
                    />
                  )}
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
                <CardDescription>
                  Gatilhos inteligentes e processamento automático de respostas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="p-4 bg-white border-2 border-success/30 rounded-xl flex items-center justify-between group/auto transition-all">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-success/10 rounded-full text-success">
                          <RefreshCw className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-black text-xs uppercase tracking-widest">
                            Retentativas Automáticas
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">
                            Fallback em falhas de disparo
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={autoRetries}
                        onCheckedChange={setAutoRetries}
                      />
                    </div>
                    <div className="p-4 bg-white border-2 border-primary/30 rounded-xl flex items-center justify-between group/auto transition-all">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-full text-primary">
                          <Search className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-black text-xs uppercase tracking-widest">
                            OCR & Resposta Inteligente
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">
                            Captura automática de PDF/Print
                          </p>
                        </div>
                      </div>
                      <Switch checked={autoOcr} onCheckedChange={setAutoOcr} />
                    </div>
                  </div>

                  <div className="flex-1 p-6 bg-black border border-white/10 rounded-2xl relative overflow-hidden group/logs">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-primary animate-scan opacity-40" />
                    <h5 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">
                      Nexus RPA Status
                    </h5>
                    <p className="text-[8px] text-muted-foreground uppercase font-bold mb-3">
                      Simulação de exemplo — consulte o monitor real em
                      "Operação & Telemetria" para execuções ao vivo
                    </p>
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
                  <div className="p-4 bg-white border rounded-xl text-center">
                    <p className="text-2xl font-black text-primary">3</p>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">
                      Max Retries
                    </p>
                  </div>
                  <div className="p-4 bg-white border rounded-xl text-center">
                    <p className="text-2xl font-black text-primary">15m</p>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">
                      Intervalo
                    </p>
                  </div>
                  <div className="p-4 bg-white border rounded-xl text-center">
                    <p className="text-2xl font-black text-primary">60m</p>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">
                      Timeout Resposta
                    </p>
                  </div>
                </div>
                <p className="text-[9px] text-muted-foreground uppercase font-bold text-center tracking-widest">
                  Valores de referência da política de retry padrão do produto
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={novaRegiaoModal} onOpenChange={setNovaRegiaoModal}>
          <DialogContent>
            <DialogHeader icon={<Map className="h-5 w-5" />}>
              <DialogTitle>Nova Região na Malha</DialogTitle>
              <DialogDescription>
                Adiciona uma região atendida por{" "}
                {selectedCarrier?.nome_fantasia ?? "esta transportadora"}. O
                Nexus passa a priorizar esta rota.
              </DialogDescription>
            </DialogHeader>
            <DialogBody>
              <Label className="text-[10px] uppercase font-bold">
                Nome da Região
              </Label>
              <Input
                value={novaRegiao}
                onChange={(e) => setNovaRegiao(e.target.value)}
                placeholder="ex.: Salvador - BA"
                onKeyDown={(e) => {
                  if (e.key === "Enter") addRegiao();
                }}
                className="mt-2"
              />
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" size="sm">
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                size="sm"
                onClick={addRegiao}
                disabled={!novaRegiao.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Região
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={novoGatewayModal} onOpenChange={setNovoGatewayModal}>
          <DialogContent>
            <DialogHeader icon={<Globe className="h-5 w-5" />}>
              <DialogTitle>Novo Gateway de Resposta</DialogTitle>
              <DialogDescription>
                Cria um mapping de webhook para receber respostas de uma
                transportadora via API externa.
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold">
                  Transportadora
                </Label>
                <Select
                  value={novoGatewayTransp}
                  onValueChange={setNovoGatewayTransp}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {carriers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome_fantasia}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold">
                  URL do Webhook (opcional)
                </Label>
                <Input
                  value={novoGatewayUrl}
                  onChange={(e) => setNovoGatewayUrl(e.target.value)}
                  placeholder="/functions/v1/nexus-webhook-receiver"
                  className="font-mono text-xs"
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" size="sm">
                  Cancelar
                </Button>
              </DialogClose>
              <Button
                size="sm"
                onClick={() => addMapping.mutate()}
                disabled={!novoGatewayTransp || addMapping.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Gateway
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
