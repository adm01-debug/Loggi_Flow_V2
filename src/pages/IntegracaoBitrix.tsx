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
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function IntegracaoBitrix() {
  const qc = useQueryClient();
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");

  const { data: logs = [], isLoading: isLoadingLogs } = useQuery({
    queryKey: ["bitrix-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .or("table_name.eq.bitrix24_sync,table_name.eq.bitrix24_webhook")
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
      toast.success(`Sincronização concluída: ${data.coletas_synced} coletas, ${data.entregas_synced} entregas e ${data.ocorrencias_synced || 0} ocorrências.`);
    },
    onError: (err) => {
      toast.error(`Erro na sincronização: ${err.message}`);
    }
  });

  const lastSync = logs.find(l => l.action === "SYNC");

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
                <Badge variant="success" className="h-5">Conectado</Badge>
              </div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">Status da API</p>
              <h3 className="text-2xl font-black">Saudável</h3>
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
                {lastSync ? format(new Date(lastSync.created_at), "HH:mm:ss", { locale: ptBR }) : "Nenhuma"}
              </h3>
              <p className="text-xs text-muted-foreground mt-2">Próxima em: ~15 min</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-warning/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-warning/20">
                  <Zap className="w-5 h-5 text-warning" />
                </div>
                <Badge variant="warning" className="h-5">Webhook</Badge>
              </div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">Eventos Processados</p>
              <h3 className="text-2xl font-black">1.2k</h3>
              <p className="text-xs text-muted-foreground mt-2">Últimas 24 horas</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-muted/50 p-1 mb-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="logs">Log de Eventos</TabsTrigger>
            <TabsTrigger value="mapping">Mapeamento de Campos</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Entidades Sincronizadas</CardTitle>
                  <CardDescription>SPAs (Processos Inteligentes) vinculados ao LogiFlow</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-lg bg-[#2fc6f6]/10 flex items-center justify-center text-[#2fc6f6] font-bold">1186</div>
                       <div>
                         <p className="font-bold">Gestão Compras</p>
                         <p className="text-xs text-muted-foreground">Mapped to: Coletas</p>
                       </div>
                    </div>
                    <Badge variant="success">Ativo</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-lg bg-[#2fc6f6]/10 flex items-center justify-center text-[#2fc6f6] font-bold">1234</div>
                       <div>
                         <p className="font-bold">Entregas Log</p>
                         <p className="text-xs text-muted-foreground">Mapped to: Entregas</p>
                       </div>
                    </div>
                    <Badge variant="success">Ativo</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-lg bg-[#2fc6f6]/10 flex items-center justify-center text-[#2fc6f6] font-bold">1050</div>
                       <div>
                         <p className="font-bold">Ocorrências Log</p>
                         <p className="text-xs text-muted-foreground">Mapped to: Ocorrências</p>
                       </div>
                    </div>
                    <Badge variant="success">Ativo</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estado dos Webhooks</CardTitle>
                  <CardDescription>Escuta ativa de alterações em tempo real</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { event: "ONCRMDEALUPDATE", status: "Ativo", icon: CheckCircle2 },
                    { event: "ONCRMDEALADD", status: "Ativo", icon: CheckCircle2 },
                    { event: "ONCRMSPAITEMUPDATE", status: "Ativo", icon: CheckCircle2 },
                    { event: "ONCRMACTIVITYADD", status: "Aguardando", icon: Clock },
                  ].map((e, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0 border-border/50">
                      <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">{e.event}</code>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{e.status}</span>
                        <e.icon className={cn("w-4 h-4", e.status === "Ativo" ? "text-success" : "text-muted-foreground")} />
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
                          log.action === "SYNC" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"
                        )}>
                          {log.action === "SYNC" ? <RefreshCw className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold uppercase tracking-tight">{log.action}</p>
                          <p className="text-[10px] text-muted-foreground">{format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}</p>
                        </div>
                      </div>
                      <div className="text-right">
                         <p className="text-xs font-mono">{log.table_name}</p>
                         <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{JSON.stringify(log.new_data)}</p>
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
                <CardDescription>Configure as chaves e URLs para integração com o Bitrix24</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>URL de Webhook (Inbound)</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="https://seu-dominio.bitrix24.com.br/rest/1/webhook-key/" 
                      type="password"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                    />
                    <Button>Salvar</Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">Esta chave é gerada dentro do Bitrix24 em 'Aplicações - Webhooks'.</p>
                </div>

                <div className="p-4 rounded-xl border border-warning/20 bg-warning/5 space-y-3">
                  <div className="flex items-center gap-2 text-warning">
                    <ShieldCheck className="w-5 h-5" />
                    <p className="font-bold">Segurança da Integração</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    A conexão utiliza uma Service Role Key para persistência de dados. Certifique-se de que o webhook no Bitrix24 tenha permissões de leitura/escrita para 'CRM' e 'SPA'.
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