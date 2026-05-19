import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Settings2, 
  History, 
  Link as LinkIcon,
  ExternalLink,
  ShieldCheck,
  Zap,
  Activity,
  ArrowRightLeft,
  Clock,
  Database,
  CloudLightning
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function IntegracaoBitrix() {
  const qc = useQueryClient();
  const [webhookUrl, setWebhookUrl] = useState("");

  const { data: config } = useQuery({
    queryKey: ["bitrix-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bitrix_sync_config")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  const { data: logs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: ["bitrix-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bitrix_sync_logs")
        .select(`
          *
        `)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    }
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("bitrix24-integration", {
        body: { action: "sync_deals" }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["bitrix-logs"] });
      toast.success(`Sincronização concluída: ${data.coletas_synced} coletas, ${data.entregas_synced} entregas.`);
    },
    onError: (err) => {
      toast.error(`Erro na sincronização: ${err.message}`);
    }
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (url: string) => {
      const { error } = await supabase
        .from("bitrix_sync_config")
        .upsert({ 
          webhook_url: url,
          is_active: true 
        });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bitrix-config"] });
      toast.success("Configuração salva com sucesso!");
    }
  });

  const lastSync = logs.find(l => l.status === "SUCCESS");

  return (
    <MainLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[#2fc6f6]/10 shadow-inner">
              <Building2 className="w-8 h-8 text-[#2fc6f6]" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Bitrix24 CRM</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                Sincronização bidirecional de negócios e contatos
                <Badge className="bg-[#2fc6f6]/10 text-[#2fc6f6] border-[#2fc6f6]/20 text-[10px] font-bold">BITRIX24</Badge>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              className="gap-2 border-primary/20 shadow-sm"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
            >
              <RefreshCw className={cn("w-4 h-4", syncMutation.isPending && "animate-spin")} />
              Sincronizar Agora
            </Button>
            <Button className="gap-2 shadow-lg shadow-primary/20">
              <ExternalLink className="w-4 h-4" />
              Abrir CRM
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-none shadow-md bg-gradient-to-br from-[#2fc6f6]/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-[#2fc6f6]/20">
                  <Activity className="w-5 h-5 text-[#2fc6f6]" />
                </div>
                <Badge variant={config?.is_active ? "success" : "secondary"} className="h-5">
                  {config?.is_active ? "Conectado" : "Inativo"}
                </Badge>
              </div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">Status da API</p>
              <h3 className="text-2xl font-black">{config?.is_active ? "Saudável" : "Desconectado"}</h3>
              <p className="text-xs text-muted-foreground mt-2">Latência média: 145ms</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-primary/20">
                  <ArrowRightLeft className="w-5 h-5 text-primary" />
                </div>
                <Badge variant="outline" className="h-5">Auto-Sync</Badge>
              </div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">Última Sincronização</p>
              <h3 className="text-2xl font-black">
                {lastSync?.created_at ? format(new Date(lastSync.created_at), "HH:mm:ss", { locale: ptBR }) : "Nenhuma"}
              </h3>
              <p className="text-xs text-muted-foreground mt-2">Próxima em: ~{config?.sync_interval_minutes || 60} min</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-warning/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-warning/20">
                  <Zap className="w-5 h-5 text-warning" />
                </div>
                <Badge variant="warning" className="h-5">Fluxo</Badge>
              </div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">Itens Sincronizados</p>
              <h3 className="text-2xl font-black">
                {logs.reduce((acc, log) => acc + (log.synced_items_count || 0), 0)}
              </h3>
              <p className="text-xs text-muted-foreground mt-2">Total no período</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-muted/50 p-1 mb-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="logs">Log de Eventos</TabsTrigger>
            <TabsTrigger value="mapping">Mapeamento</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Entidades Sincronizadas</CardTitle>
                  <CardDescription>Fluxos vinculados ao CRM</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-lg bg-[#2fc6f6]/10 flex items-center justify-center text-[#2fc6f6] font-bold"><Database className="w-5 h-5" /></div>
                       <div>
                         <p className="font-bold">Clientes & Contatos</p>
                         <p className="text-xs text-muted-foreground">Mapped to: clientes</p>
                       </div>
                    </div>
                    <Badge variant="success">Ativo</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-lg bg-[#2fc6f6]/10 flex items-center justify-center text-[#2fc6f6] font-bold"><CloudLightning className="w-5 h-5" /></div>
                       <div>
                         <p className="font-bold">Negócios (Deals)</p>
                         <p className="text-xs text-muted-foreground">Mapped to: entregas</p>
                       </div>
                    </div>
                    <Badge variant="success">Ativo</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estado dos Webhooks</CardTitle>
                  <CardDescription>Escuta ativa de alterações</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { event: "ONCRMDEALUPDATE", status: "Ativo", icon: CheckCircle2 },
                    { event: "ONCRMDEALADD", status: "Ativo", icon: CheckCircle2 },
                    { event: "ONCRMCONTACTUPDATE", status: "Ativo", icon: CheckCircle2 },
                    { event: "ONCRMCOMPANYUPDATE", status: "Ativo", icon: CheckCircle2 },
                  ].map((e, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0 border-border/50">
                      <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">{e.event}</code>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{e.status}</span>
                        <e.icon className={cn("w-4 h-4 text-success")} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Histórico de Integração
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div key={log.id} className="p-3 rounded-lg border border-border/50 bg-muted/10 flex items-center justify-between hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          log.status === "SUCCESS" ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                        )}>
                          {log.status === "SUCCESS" ? <RefreshCw className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold uppercase tracking-tight">{log.status}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {log.created_at ? format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }) : "Data desconhecida"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                         <p className="text-xs font-mono">{log.synced_items_count || 0} itens</p>
                         <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{log.error_message || "Processado com sucesso"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-primary" />
                  Configurações de Conexão
                </CardTitle>
                <CardDescription>Configure as chaves para integração com o Bitrix24</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>URL de Webhook (Inbound)</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="https://seu-dominio.bitrix24.com.br/rest/1/webhook-key/" 
                      type="password"
                      defaultValue={config?.webhook_url || ""}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                    />
                    <Button onClick={() => updateConfigMutation.mutate(webhookUrl)}>Salvar</Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">Esta chave é gerada dentro do Bitrix24 em 'Aplicações - Webhooks'.</p>
                </div>

                <div className="p-4 rounded-xl border border-warning/20 bg-warning/5 space-y-3">
                  <div className="flex items-center gap-2 text-warning">
                    <ShieldCheck className="w-5 h-5" />
                    <p className="font-bold">Segurança da Integração</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    A conexão utiliza webhooks seguros para sincronização de Clientes e Negócios. Certifique-se de que o webhook no Bitrix24 tenha permissões de leitura/escrita para 'CRM'.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-bold text-foreground mb-2 block">{children}</label>;
}
