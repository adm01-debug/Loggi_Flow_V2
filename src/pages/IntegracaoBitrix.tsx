/* eslint-disable max-lines */
import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Building2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Settings2,
  History,
  ExternalLink,
  ShieldCheck,
  Zap,
  Activity,
  ArrowRightLeft,
  Database,
  CloudLightning,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const SPA_KEYS = [
  {
    key: "bitrix_spa_coletas_id",
    label: "Coletas",
    description: "ID SPA de Compras no Bitrix24",
  },
  {
    key: "bitrix_spa_entregas_id",
    label: "Entregas",
    description: "ID SPA de Entregas no Bitrix24",
  },
  {
    key: "bitrix_spa_ocorrencias_id",
    label: "Ocorrencias",
    description: "ID SPA de Ocorrencias no Bitrix24",
  },
] as const;

// A edge function explica a causa no corpo (ex.: credencial ausente); o supabase-js so
// expoe "Edge Function returned a non-2xx status code" em error.message. Sem ler o
// corpo, o painel mostrava erro generico e a causa ficava invisivel para o operador.
async function mensagemDaFuncao(
  error: unknown,
  alternativa: string,
): Promise<string> {
  const contexto = (
    error as { context?: { json?: () => Promise<unknown> } } | null
  )?.context;
  try {
    const corpo = (await contexto?.json?.()) as { error?: string } | undefined;
    if (corpo?.error) return corpo.error;
  } catch {
    // Corpo sem JSON: fica a mensagem alternativa.
  }
  return alternativa;
}

export default function IntegracaoBitrix() {
  const qc = useQueryClient();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [spaIds, setSpaIds] = useState<Record<string, string>>({});

  const { data: config } = useQuery({
    queryKey: ["bitrix-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bitrix_sync_config")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: logs = [] } = useQuery({
    queryKey: ["bitrix-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bitrix_sync_logs")
        .select(
          `
          *
        `,
        )
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        "bitrix24-integration",
        {
          body: { action: "sync_deals" },
        },
      );
      if (error) throw new Error(await mensagemDaFuncao(error, error.message));
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["bitrix-logs"] });
      toast.success(
        `Sincronização concluída: ${data.coletas_synced} coletas, ${data.entregas_synced} entregas.`,
      );
    },
    onError: (err) => {
      toast.error(`Erro na sincronização: ${err.message}`);
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (url: string) => {
      const { error } = await supabase.from("bitrix_sync_config").upsert({
        webhook_url: url,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bitrix-config"] });
      toast.success("Configuração salva com sucesso!");
    },
  });

  const { data: spaConfig = [] } = useQuery({
    queryKey: ["bitrix-spa-ids"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_rules_config")
        .select("key, value")
        .in(
          "key",
          SPA_KEYS.map((spa) => spa.key),
        )
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  const spaConfigMap = new Map(
    spaConfig.map((row) => [row.key, String(row.value ?? "")]),
  );

  const saveSpaIdsMutation = useMutation({
    mutationFn: async () => {
      const rows = SPA_KEYS.map((spa) => {
        const raw = (spaIds[spa.key] ?? spaConfigMap.get(spa.key) ?? "").trim();
        const id = Number(raw);
        if (!Number.isInteger(id) || id <= 0) {
          throw new Error(`Informe um ID numerico para ${spa.label}.`);
        }
        return {
          key: spa.key,
          value: String(id),
          description: spa.description,
        };
      });
      const { error } = await supabase
        .from("business_rules_config")
        .upsert(rows, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bitrix-spa-ids"] });
      toast.success("IDs das SPAs salvos.");
    },
    onError: (err) => {
      toast.error(`Nao foi possivel salvar os IDs: ${err.message}`);
    },
  });

  const lastSync = logs.find((l) => l.status === "SUCCESS");

  return (
    <MainLayout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between px-2">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white flex items-center gap-4 tracking-tighter uppercase italic">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#2fc6f6] to-[#2fc6f6]/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black border border-white/10 shadow-2xl transition-transform hover:scale-110">
                  <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-[#2fc6f6] animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="drop-shadow-2xl">Bitrix24 CRM</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2fc6f6]/10 border border-[#2fc6f6]/20">
                    <div className="w-2 h-2 rounded-full bg-[#2fc6f6] animate-ping" />
                    <span className="text-[10px] font-black text-[#2fc6f6] uppercase tracking-[0.3em]">
                      Omnichannel_Sync
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">
                    PIPELINE • DEALS • REAL-TIME
                  </span>
                </div>
              </div>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2 border-primary/20 shadow-sm"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
            >
              <RefreshCw
                className={cn(
                  "w-4 h-4",
                  syncMutation.isPending && "animate-spin",
                )}
              />
              Sincronizar Agora
            </Button>
            <Button
              className="gap-2 shadow-lg shadow-primary/20"
              onClick={() => {
                const clean = webhookUrl
                  .trim()
                  .replace(/^https?:\/\//, "")
                  .split("/")[0];
                if (!clean) {
                  toast.info(
                    "Configure a URL do webhook do Bitrix24 para abrir o CRM.",
                  );
                  return;
                }
                window.open(
                  `https://${clean}`,
                  "_blank",
                  "noopener,noreferrer",
                );
              }}
            >
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
                <Badge
                  variant={config?.is_active ? "success" : "secondary"}
                  className="h-5"
                >
                  {config?.is_active ? "Conectado" : "Inativo"}
                </Badge>
              </div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">
                Status da API
              </p>
              <h3 className="text-2xl font-black">
                {config?.is_active ? "Saudável" : "Desconectado"}
              </h3>
              <p className="text-xs text-muted-foreground mt-2">
                {logs.length > 0 && logs[0].created_at
                  ? `Último log: ${format(new Date(logs[0].created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })} (${logs[0].status})`
                  : "Nenhuma sincronização registrada ainda"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-primary/20">
                  <ArrowRightLeft className="w-5 h-5 text-primary" />
                </div>
                <Badge variant="outline" className="h-5">
                  Auto-Sync
                </Badge>
              </div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">
                Última Sincronização
              </p>
              <h3 className="text-2xl font-black">
                {lastSync?.created_at
                  ? format(new Date(lastSync.created_at), "HH:mm:ss", {
                      locale: ptBR,
                    })
                  : "Nenhuma"}
              </h3>
              <p className="text-xs text-muted-foreground mt-2">
                Próxima em: ~{config?.sync_interval_minutes || 60} min
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-warning/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-warning/20">
                  <Zap className="w-5 h-5 text-warning" />
                </div>
                <Badge variant="warning" className="h-5">
                  Fluxo
                </Badge>
              </div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">
                Itens Sincronizados
              </p>
              <h3 className="text-2xl font-black">
                {logs.reduce(
                  (acc, log) => acc + (log.synced_items_count || 0),
                  0,
                )}
              </h3>
              <p className="text-xs text-muted-foreground mt-2">
                Total no período
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-muted/50 p-1 mb-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="logs">Log de Eventos</TabsTrigger>
            <TabsTrigger value="mapping">Mapeamento</TabsTrigger>
            <TabsTrigger value="alerts">Alertas Táticos</TabsTrigger>
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
                      <div className="w-10 h-10 rounded-lg bg-[#2fc6f6]/10 flex items-center justify-center text-[#2fc6f6] font-bold">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold">Clientes & Contatos</p>
                        <p className="text-xs text-muted-foreground">
                          Mapped to: clientes
                        </p>
                      </div>
                    </div>
                    <Badge variant="success">Ativo</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#2fc6f6]/10 flex items-center justify-center text-[#2fc6f6] font-bold">
                        <CloudLightning className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold">Negócios (Deals)</p>
                        <p className="text-xs text-muted-foreground">
                          Mapped to: entregas
                        </p>
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
                    {
                      event: "ONCRMDEALUPDATE",
                      status: "Ativo",
                      icon: CheckCircle2,
                    },
                    {
                      event: "ONCRMDEALADD",
                      status: "Ativo",
                      icon: CheckCircle2,
                    },
                    {
                      event: "ONCRMCONTACTUPDATE",
                      status: "Ativo",
                      icon: CheckCircle2,
                    },
                    {
                      event: "ONCRMCOMPANYUPDATE",
                      status: "Ativo",
                      icon: CheckCircle2,
                    },
                  ].map((e, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b last:border-0 border-border/50"
                    >
                      <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">
                        {e.event}
                      </code>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {e.status}
                        </span>
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
                    <div
                      key={log.id}
                      className="p-3 rounded-lg border border-border/50 bg-muted/10 flex items-center justify-between hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center",
                            log.status === "SUCCESS"
                              ? "bg-primary/10 text-primary"
                              : "bg-destructive/10 text-destructive",
                          )}
                        >
                          {log.status === "SUCCESS" ? (
                            <RefreshCw className="w-4 h-4" />
                          ) : (
                            <AlertTriangle className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold uppercase tracking-tight">
                            {log.status}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {log.created_at
                              ? format(
                                  new Date(log.created_at),
                                  "dd/MM/yyyy HH:mm:ss",
                                  { locale: ptBR },
                                )
                              : "Data desconhecida"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-mono">
                          {log.synced_items_count || 0} itens
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                          {log.error_message || "Processado com sucesso"}
                        </p>
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
                <CardDescription>
                  Configure as chaves para integração com o Bitrix24
                </CardDescription>
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
                    <Button
                      onClick={() => updateConfigMutation.mutate(webhookUrl)}
                    >
                      Salvar
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">
                    Esta chave é gerada dentro do Bitrix24 em 'Aplicações -
                    Webhooks'.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-warning/20 bg-warning/5 space-y-3">
                  <div className="flex items-center gap-2 text-warning">
                    <ShieldCheck className="w-5 h-5" />
                    <p className="font-bold">Segurança da Integração</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    A conexão utiliza webhooks seguros para sincronização de
                    Clientes e Negócios. Certifique-se de que o webhook no
                    Bitrix24 tenha permissões de leitura/escrita para 'CRM'.
                  </p>
                </div>
                <div className="pt-6 border-t space-y-4">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    <p className="font-bold">IDs das SPAs no CRM</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Cada funil do Bitrix24 tem um numero de SPA. A sincronizacao
                    usa estes numeros para buscar coletas, entregas e
                    ocorrencias.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {SPA_KEYS.map((spa) => (
                      <div key={spa.key} className="space-y-2">
                        <Label htmlFor={spa.key}>{spa.label}</Label>
                        <Input
                          id={spa.key}
                          type="number"
                          min={1}
                          value={
                            spaIds[spa.key] ?? spaConfigMap.get(spa.key) ?? ""
                          }
                          onChange={(e) =>
                            setSpaIds({ ...spaIds, [spa.key]: e.target.value })
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={() => saveSpaIdsMutation.mutate()}
                    disabled={saveSpaIdsMutation.isPending}
                  >
                    {saveSpaIdsMutation.isPending
                      ? "Salvando..."
                      : "Salvar IDs"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
