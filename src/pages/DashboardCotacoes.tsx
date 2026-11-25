/* eslint-disable max-lines */
import { useState, useMemo, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/common/EmptyState";
import { StatsCard } from "@/components/common/StatsCard";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Truck,
  MessageCircle,
  Mail,
  Globe,
  Timer,
  FileText,
  TrendingDown,
  RefreshCw,
  Zap,
  AlertCircle,
  Award,
  Send,
  History,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { useCotacoesMulticanal } from "@/hooks/logistics/useCotacoesMulticanal";
import { type CotacaoMulticanal } from "@/hooks";
import { isPast, differenceInHours, differenceInMinutes } from "date-fns";
import { TrechoComparativo } from "./dashboard-cotacoes/TrechoComparativo";
import { ResponseConsole } from "@/components/freight/ResponseConsole";

function TimeRemaining({ expiresAt }: { expiresAt: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);
  const expDate = new Date(expiresAt);
  const expired = isPast(expDate);
  const hoursLeft = differenceInHours(expDate, now);
  const minutesLeft = differenceInMinutes(expDate, now) % 60;
  if (expired)
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertCircle className="w-3 h-3" />
        Expirado
      </Badge>
    );
  const isUrgent = hoursLeft < 2;
  return (
    <Badge
      variant={isUrgent ? "destructive" : "secondary"}
      className="gap-1 font-mono"
    >
      <Timer className="w-3 h-3" />
      {hoursLeft}h {minutesLeft}m
    </Badge>
  );
}

function CanalBadge({ canal }: { canal: string }) {
  switch (canal) {
    case "api":
      return (
        <Badge className="bg-success/10 text-success border-success/20 gap-1">
          <Globe className="w-3 h-3" />
          API
        </Badge>
      );
    case "whatsapp":
      return (
        <Badge className="bg-success/10 text-success border-success/20 gap-1">
          <MessageCircle className="w-3 h-3" />
          WhatsApp
        </Badge>
      );
    case "email":
      return (
        <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
          <Mail className="w-3 h-3" />
          Email
        </Badge>
      );
    default:
      return null;
  }
}

function StatusBadge({
  status,
  retryCount,
}: {
  status: string;
  retryCount?: number;
}) {
  switch (status) {
    case "respondido":
      return (
        <Badge className="bg-success/10 text-success border-success/20 gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Respondido
        </Badge>
      );
    case "pendente":
      return (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Clock className="w-3 h-3" />
            Pendente
          </Badge>
          {retryCount && retryCount > 0 && (
            <span className="text-[10px] text-muted-foreground font-bold">
              Try: {retryCount}
            </span>
          )}
        </div>
      );
    case "expirado":
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="w-3 h-3" />
          Expirado
        </Badge>
      );
    case "selecionado":
      return (
        <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
          <Award className="w-3 h-3" />
          Selecionado
        </Badge>
      );
    case "falhou":
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="w-3 h-3" />
          Falhou
        </Badge>
      );
    default:
      return null;
  }
}

export default function DashboardCotacoes() {
  const {
    cotacoes,
    ativas,
    pendentes,
    respondidas,
    expiradas,
    isLoading,
    error,
    refetch,
    updateCotacao,
    selectCotacao,
  } = useCotacoesMulticanal();
  const [tab, setTab] = useState("ativas");
  const [filterCanal, setFilterCanal] = useState<string>("all");
  const [respondDialog, setRespondDialog] = useState(false);
  const [logsDialog, setLogsDialog] = useState(false);
  const [selectedCotacao, setSelectedCotacao] =
    useState<CotacaoMulticanal | null>(null);
  const [respValor, setRespValor] = useState("");
  const [respPrazo, setRespPrazo] = useState("");
  const [respObs, setRespObs] = useState("");

  const filtered = useMemo(() => {
    let list: CotacaoMulticanal[] = [];
    switch (tab) {
      case "ativas":
        list = ativas;
        break;
      case "pendentes":
        list = pendentes;
        break;
      case "respondidas":
        list = respondidas;
        break;
      default:
        list = cotacoes;
    }
    return filterCanal !== "all"
      ? list.filter((c) => c.canal === filterCanal)
      : list;
  }, [tab, filterCanal, ativas, pendentes, respondidas, cotacoes]);

  const trechoGroups = useMemo(() => {
    const groups: Record<string, CotacaoMulticanal[]> = {};
    respondidas.forEach((c) => {
      const key = `${c.origem_estado}-${c.destino_estado}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(c);
    });
    return groups;
  }, [respondidas]);

  const handleRespond = () => {
    if (!selectedCotacao || !respValor) return;
    updateCotacao.mutate({
      id: selectedCotacao.id,
      valor_cotado: parseFloat(respValor),
      prazo_dias: respPrazo ? parseInt(respPrazo) : undefined,
      observacoes: respObs || undefined,
      status: "respondido",
    });
    setRespondDialog(false);
    setSelectedCotacao(null);
    setRespValor("");
    setRespPrazo("");
    setRespObs("");
  };

  const savings = useMemo(() => {
    let totalSaved = 0;
    Object.values(trechoGroups).forEach((group) => {
      if (group.length < 2) return;
      const values = group
        .filter((c) => c.valor_cotado)
        .map((c) => c.valor_cotado!);
      if (values.length < 2) return;
      totalSaved += Math.max(...values) - Math.min(...values);
    });
    return totalSaved;
  }, [trechoGroups]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center gap-4 min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-sm font-black uppercase tracking-[0.3em] text-white/60">
            Carregando cotações...
          </p>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="px-2">
          <EmptyState
            variant="error"
            icon={AlertTriangle}
            title="Erro ao carregar cotações"
            description={String(error.message)}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-display flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              Dashboard de Cotações
            </h1>
            <p className="text-muted-foreground mt-1">
              Acompanhe todas as cotações em andamento e compare preços
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => (window.location.href = "/cotacao-multicanal")}
              size="sm"
              className="gap-2"
            >
              <Zap className="w-4 h-4" /> Nova cotação
            </Button>
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Atualizar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatsCard
            title="Ativas"
            value={ativas.length}
            icon={Zap}
            color="primary"
          />
          <StatsCard
            title="Pendentes"
            value={pendentes.length}
            icon={Clock}
            color="warning"
          />
          <StatsCard
            title="Respondidas"
            value={respondidas.length}
            icon={CheckCircle2}
            color="success"
          />
          <StatsCard
            title="Expiradas"
            value={expiradas.length}
            icon={AlertTriangle}
            color="destructive"
          />
          <StatsCard
            title="Economia"
            value={`R$ ${savings.toFixed(0)}`}
            icon={TrendingDown}
            color="success"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <TrechoComparativo
              trechoGroups={trechoGroups}
              onSelect={(id) => selectCotacao.mutate(id)}
            />
          </div>
          <div className="lg:col-span-1">
            <ResponseConsole />
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="w-5 h-5" />
                Cotações
              </CardTitle>
              <Select value={filterCanal} onValueChange={setFilterCanal}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
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
                <TabsTrigger value="ativas">
                  Ativas ({ativas.length})
                </TabsTrigger>
                <TabsTrigger value="pendentes">
                  Pendentes ({pendentes.length})
                </TabsTrigger>
                <TabsTrigger value="respondidas">
                  Respondidas ({respondidas.length})
                </TabsTrigger>
                <TabsTrigger value="todas">
                  Todas ({cotacoes.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Nenhuma cotação encontrada"
                description="Crie cotações na página Cotação Multi-Canal"
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transportadora</TableHead>
                      <TableHead>Trecho</TableHead>
                      <TableHead>Canal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Expira em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((cotacao) => (
                      <TableRow key={cotacao.id} className="group">
                        <TableCell className="font-medium">
                          {cotacao.transportadora?.nome_fantasia || "N/A"}
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs">
                            {cotacao.origem_estado} → {cotacao.destino_estado}
                          </span>
                        </TableCell>
                        <TableCell>
                          <CanalBadge canal={cotacao.canal} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={cotacao.status}
                            retryCount={cotacao.retry_count}
                          />
                        </TableCell>
                        <TableCell>
                          {cotacao.valor_cotado ? (
                            <span className="font-semibold">
                              R$ {cotacao.valor_cotado.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {cotacao.prazo_dias ? `${cotacao.prazo_dias}d` : "—"}
                        </TableCell>
                        <TableCell>
                          <TimeRemaining expiresAt={cotacao.expires_at} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              title="Ver Logs"
                              onClick={() => {
                                setSelectedCotacao(cotacao);
                                setLogsDialog(true);
                              }}
                            >
                              <History className="w-3.5 h-3.5" />
                            </Button>
                            {cotacao.status === "pendente" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1"
                                onClick={() => {
                                  setSelectedCotacao(cotacao);
                                  setRespondDialog(true);
                                }}
                              >
                                <Send className="w-3 h-3" /> Registrar
                              </Button>
                            )}
                            {cotacao.status === "respondido" && (
                              <Button
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={() => selectCotacao.mutate(cotacao.id)}
                              >
                                <Award className="w-3 h-3" /> Selecionar
                              </Button>
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
            <DialogHeader>
              <DialogTitle>Registrar Resposta da Cotação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <strong>
                  {selectedCotacao?.transportadora?.nome_fantasia}
                </strong>
                <span className="ml-2 text-muted-foreground">
                  {selectedCotacao?.origem_estado} →{" "}
                  {selectedCotacao?.destino_estado}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valor (R$) *</Label>
                  <Input
                    type="number"
                    value={respValor}
                    onChange={(e) => setRespValor(e.target.value)}
                    placeholder="150.00"
                  />
                </div>
                <div>
                  <Label>Prazo (dias)</Label>
                  <Input
                    type="number"
                    value={respPrazo}
                    onChange={(e) => setRespPrazo(e.target.value)}
                    placeholder="5"
                  />
                </div>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={respObs}
                  onChange={(e) => setRespObs(e.target.value)}
                  placeholder="Detalhes adicionais..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRespondDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleRespond} disabled={!respValor}>
                Registrar Resposta
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={logsDialog} onOpenChange={setLogsDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" /> Histórico &
                Auditoria
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-xs font-bold uppercase text-muted-foreground">
                  Status Atual
                </span>
                <StatusBadge
                  status={selectedCotacao?.status || ""}
                  retryCount={selectedCotacao?.retry_count}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-black text-muted-foreground">
                  Workflow Logs
                </Label>
                <div className="border rounded-lg divide-y bg-black/5">
                  {selectedCotacao?.workflow_logs &&
                  selectedCotacao.workflow_logs.length > 0 ? (
                    (
                      selectedCotacao.workflow_logs as Array<{
                        action?: string;
                        timestamp?: string;
                        details?: string;
                      }>
                    ).map((log, i) => (
                      <div
                        key={i}
                        className="p-3 text-xs flex items-start gap-3"
                      >
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary" />
                        <div>
                          <p className="font-bold text-foreground">
                            {log.action}
                          </p>
                          <p className="text-muted-foreground">
                            {log.timestamp}
                          </p>
                          {log.details && (
                            <p className="mt-1 text-[10px] font-mono opacity-70">
                              {log.details}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground italic text-xs">
                      Cotação registrada via {selectedCotacao?.canal}.
                      Aguardando resposta da transportadora.
                    </div>
                  )}
                </div>
              </div>
              {selectedCotacao?.normalization_data && (
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground">
                    Dados de Normalização (IA/Regex)
                  </Label>
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <pre className="text-[10px] font-mono whitespace-pre-wrap">
                      {JSON.stringify(
                        selectedCotacao.normalization_data,
                        null,
                        2,
                      )}
                    </pre>
                  </div>
                </div>
              )}
              {selectedCotacao?.status === "pendente" && (
                <Button
                  variant="outline"
                  className="w-full gap-2 text-xs"
                  onClick={() => {
                    if (!selectedCotacao) return;
                    updateCotacao.mutate({
                      id: selectedCotacao.id,
                      retry_count: (selectedCotacao.retry_count ?? 0) + 1,
                      workflow_logs: [
                        ...(selectedCotacao.workflow_logs ?? []),
                        {
                          action: "retentativa_manual",
                          timestamp: new Date().toISOString(),
                          details:
                            "Retentativa disparada manualmente pelo usuário",
                        },
                      ],
                    });
                  }}
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Forçar Retentativa
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
