/* eslint-disable max-lines */
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { differenceInHours, parseISO, isPast, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertTriangle,
  Clock,
  Package,
  Truck,
  Target,
  Settings2,
  CheckCircle2,
} from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/auth/useAuth";
import { useSLAMetas, type SLAMetas } from "@/hooks/sla/useSLAMetas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { CarrierAccuracyPanel } from "@/components/predictions/CarrierAccuracyPanel";
import { PredictionAccuracyTimeline } from "@/components/predictions/PredictionAccuracyTimeline";
import { AccuracyMetaCycleWidget } from "@/components/predictions/AccuracyMetaCycleWidget";
import { AccuracyMetaAuditPanel } from "@/components/predictions/AccuracyMetaAuditPanel";
import { ChannelHealthPanel } from "@/components/predictions/ChannelHealthPanel";
import { DigestPreviewPanel } from "@/components/predictions/DigestPreviewPanel";
import { RootCausePanel } from "@/components/predictions/RootCausePanel";
import { MitigationHistoryPanel } from "@/components/predictions/MitigationHistoryPanel";
import { MitigationROIPanel } from "@/components/predictions/MitigationROIPanel";

type Risco = "critico" | "alto" | "medio" | "ok";

interface SLAItem {
  id: string;
  numero: string;
  tipo: "entrega" | "coleta";
  status: string;
  previsao: string | null;
  horasRestantes: number;
  atrasado: boolean;
  risco: Risco;
  parceiro: string;
  referencia: string;
}

function classificar(horas: number, atrasado: boolean, metas: SLAMetas): Risco {
  if (atrasado) return "critico";
  if (horas <= metas.criticoHoras) return "critico";
  if (horas <= metas.altoHoras) return "alto";
  if (horas <= metas.medioHoras) return "medio";
  return "ok";
}

const RISCO_STYLES: Record<
  Risco,
  { label: string; className: string; icon: typeof AlertTriangle }
> = {
  critico: {
    label: "CRÍTICO",
    className: "bg-destructive/15 text-destructive border-destructive/30",
    icon: AlertTriangle,
  },
  alto: {
    label: "ALTO",
    className: "bg-warning/15 text-warning border-warning/30",
    icon: Clock,
  },
  medio: {
    label: "MÉDIO",
    className: "bg-primary/10 text-primary border-primary/30",
    icon: Clock,
  },
  ok: {
    label: "NO PRAZO",
    className: "bg-success/10 text-success border-success/30",
    icon: CheckCircle2,
  },
};

export default function PainelSLA() {
  const { user } = useAuth();
  const { metas, saveMetas, isSaving } = useSLAMetas();
  const [draftMetas, setDraftMetas] = useState<SLAMetas>(metas);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aba, setAba] = useState<"todos" | "entregas" | "coletas">("todos");

  useEffect(() => {
    const prev = document.title;
    document.title = "Painel de SLAs — Metas e Alertas | LogiFlow";
    let meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta?.getAttribute("content") ?? "";
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute(
      "content",
      "Painel de SLAs de expedições e coletas com metas configuráveis e alertas por vencimento.",
    );
    return () => {
      document.title = prev;
      if (meta && prevDesc) meta.setAttribute("content", prevDesc);
    };
  }, []);

  const {
    data: entregas,
    isLoading: loadingEntregas,
    isError: isErrorEntregas,
    error: errorEntregas,
  } = useQuery({
    queryKey: ["painel-sla-entregas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entregas")
        .select(
          `id, numero_entrega, status, previsao_entrega,
           transportadora:transportadoras (nome_fantasia),
           cliente:clientes (razao_social)`,
        )
        .is("deleted_at", null)
        .in("status", ["despachado", "em_transito", "saiu_entrega"])
        .not("previsao_entrega", "is", null)
        .order("previsao_entrega", { ascending: true })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
    refetchInterval: 5 * 60 * 1000,
  });

  const {
    data: coletas,
    isLoading: loadingColetas,
    isError: isErrorColetas,
    error: errorColetas,
  } = useQuery({
    queryKey: ["painel-sla-coletas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coletas")
        .select(
          `id, numero_coleta, status, data_prevista_coleta,
           transportadora:transportadoras (nome_fantasia),
           fornecedor:fornecedores (razao_social, nome_fantasia)`,
        )
        .in("status", ["aguardando_liberacao", "solicitada", "em_transito"])
        .not("data_prevista_coleta", "is", null)
        .order("data_prevista_coleta", { ascending: true })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
    refetchInterval: 5 * 60 * 1000,
  });

  const items: SLAItem[] = useMemo(() => {
    const now = new Date();
    const eList: SLAItem[] = (entregas ?? []).map((e) => {
      const previsao = e.previsao_entrega ? parseISO(e.previsao_entrega) : null;
      const horas = previsao ? differenceInHours(previsao, now) : 0;
      const atrasado = previsao ? isPast(previsao) : false;
      const transp = e.transportadora as { nome_fantasia?: string } | null;
      const cli = e.cliente as { razao_social?: string } | null;
      return {
        id: e.id,
        numero: e.numero_entrega,
        tipo: "entrega",
        status: e.status,
        previsao: e.previsao_entrega,
        horasRestantes: horas,
        atrasado,
        risco: classificar(horas, atrasado, metas),
        parceiro: transp?.nome_fantasia || "—",
        referencia: cli?.razao_social || "Cliente final",
      };
    });
    const cList: SLAItem[] = (coletas ?? []).map((c) => {
      const previsao = c.data_prevista_coleta
        ? parseISO(c.data_prevista_coleta)
        : null;
      const horas = previsao ? differenceInHours(previsao, now) : 0;
      const atrasado = previsao ? isPast(previsao) : false;
      const transp = c.transportadora as { nome_fantasia?: string } | null;
      const forn = c.fornecedor as {
        razao_social?: string;
        nome_fantasia?: string;
      } | null;
      return {
        id: c.id,
        numero: c.numero_coleta,
        tipo: "coleta",
        status: c.status,
        previsao: c.data_prevista_coleta,
        horasRestantes: horas,
        atrasado,
        risco: classificar(horas, atrasado, metas),
        parceiro: transp?.nome_fantasia || "—",
        referencia: forn?.nome_fantasia || forn?.razao_social || "Fornecedor",
      };
    });
    return [...eList, ...cList].sort(
      (a, b) => a.horasRestantes - b.horasRestantes,
    );
  }, [entregas, coletas, metas]);

  const filtered = useMemo(() => {
    if (aba === "entregas") return items.filter((i) => i.tipo === "entrega");
    if (aba === "coletas") return items.filter((i) => i.tipo === "coleta");
    return items;
  }, [items, aba]);

  const stats = useMemo(() => {
    const total = items.length;
    const critico = items.filter((i) => i.risco === "critico").length;
    const alto = items.filter((i) => i.risco === "alto").length;
    const medio = items.filter((i) => i.risco === "medio").length;
    const ok = items.filter((i) => i.risco === "ok").length;
    const onTimePct =
      total > 0 ? Math.round(((ok + medio) / total) * 100) : 100;
    return { total, critico, alto, medio, ok, onTimePct };
  }, [items]);

  const salvarMetas = () => {
    saveMetas(draftMetas);
    setDialogOpen(false);
    toast.success("Metas de SLA atualizadas");
  };

  const isLoading = loadingEntregas || loadingColetas;
  const isError = isErrorEntregas || isErrorColetas;
  const errorMessage = errorEntregas?.message || errorColetas?.message;

  if (isError) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <EmptyState
          variant="error"
          title="Erro ao carregar o Painel de SLA"
          description={
            errorMessage ||
            "Não foi possível carregar os itens de SLA. Tente novamente."
          }
          action={{
            label: "Tentar novamente",
            onClick: () => window.location.reload(),
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* SEO handled via useEffect below */}

      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            Painel de SLAs
          </h1>
          <p className="text-muted-foreground mt-1">
            Metas e alertas de vencimento para cada expedição e coleta.
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(o) => {
            setDialogOpen(o);
            if (o) setDraftMetas(metas);
          }}
        >
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Settings2 className="h-4 w-4" /> Configurar metas
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Metas de SLA</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Crítico se restar ≤ (horas)</Label>
                <Input
                  type="number"
                  min={0}
                  value={draftMetas.criticoHoras}
                  onChange={(e) =>
                    setDraftMetas({
                      ...draftMetas,
                      criticoHoras: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Alto se restar ≤ (horas)</Label>
                <Input
                  type="number"
                  min={0}
                  value={draftMetas.altoHoras}
                  onChange={(e) =>
                    setDraftMetas({
                      ...draftMetas,
                      altoHoras: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Médio se restar ≤ (horas)</Label>
                <Input
                  type="number"
                  min={0}
                  value={draftMetas.medioHoras}
                  onChange={(e) =>
                    setDraftMetas({
                      ...draftMetas,
                      medioHoras: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Meta de OTIF (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={draftMetas.metaOnTimePct}
                  onChange={(e) =>
                    setDraftMetas({
                      ...draftMetas,
                      metaOnTimePct: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={salvarMetas} disabled={isSaving}>
                {isSaving ? "Salvando…" : "Salvar metas"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          label="Total monitorado"
          value={stats.total}
          icon={Target}
          tone="default"
        />
        <StatCard
          label="Críticos"
          value={stats.critico}
          icon={AlertTriangle}
          tone="destructive"
        />
        <StatCard
          label="Alto risco"
          value={stats.alto}
          icon={Clock}
          tone="warning"
        />
        <StatCard
          label="Médio risco"
          value={stats.medio}
          icon={Clock}
          tone="primary"
        />
        <StatCard
          label={`OTIF (meta ${metas.metaOnTimePct}%)`}
          value={`${stats.onTimePct}%`}
          icon={CheckCircle2}
          tone={stats.onTimePct >= metas.metaOnTimePct ? "success" : "warning"}
        />
      </section>

      <Tabs value={aba} onValueChange={(v) => setAba(v as typeof aba)}>
        <TabsList>
          <TabsTrigger value="todos">Todos ({items.length})</TabsTrigger>
          <TabsTrigger value="entregas">
            Expedições ({items.filter((i) => i.tipo === "entrega").length})
          </TabsTrigger>
          <TabsTrigger value="coletas">
            Coletas ({items.filter((i) => i.tipo === "coleta").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={aba} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Itens ordenados por vencimento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {(() => {
                if (isLoading) {
                  return (
                    <div className="p-8 text-center text-muted-foreground">
                      Carregando…
                    </div>
                  );
                }
                if (filtered.length === 0) {
                  return (
                    <div className="p-8 text-center text-muted-foreground">
                      Nenhum item em monitoramento no momento.
                    </div>
                  );
                }
                return (
                  <ul className="divide-y">
                    {filtered.map((item) => {
                      const style = RISCO_STYLES[item.risco];
                      const Icon = style.icon;
                      const TipoIcon =
                        item.tipo === "entrega" ? Truck : Package;
                      return (
                        <li
                          key={`${item.tipo}-${item.id}`}
                          className="flex flex-col md:flex-row md:items-center gap-3 p-4 hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <TipoIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold truncate">
                                {item.numero}
                                <span className="text-xs text-muted-foreground ml-2 font-normal">
                                  {item.tipo === "entrega"
                                    ? "Expedição"
                                    : "Coleta"}
                                </span>
                              </p>
                              <p className="text-sm text-muted-foreground truncate">
                                {item.referencia} • {item.parceiro}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 md:gap-6">
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                Previsão
                              </p>
                              <p className="text-sm font-medium">
                                {item.previsao
                                  ? format(
                                      parseISO(item.previsao),
                                      "dd/MM HH:mm",
                                      { locale: ptBR },
                                    )
                                  : "—"}
                              </p>
                            </div>
                            <div className="text-right min-w-[92px]">
                              <p className="text-xs text-muted-foreground">
                                {item.atrasado ? "Atraso" : "Restam"}
                              </p>
                              <p
                                className={cn(
                                  "text-sm font-semibold",
                                  item.atrasado && "text-destructive",
                                )}
                              >
                                {Math.abs(item.horasRestantes)}h
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={cn("gap-1 border", style.className)}
                            >
                              <Icon className="h-3 w-3" />
                              {style.label}
                            </Badge>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PredictionAccuracyTimeline />
      <AccuracyMetaCycleWidget />
      <ChannelHealthPanel />
      <DigestPreviewPanel />
      <AccuracyMetaAuditPanel />
      <CarrierAccuracyPanel />
      <RootCausePanel currentOtif={stats.onTimePct} />
      <MitigationHistoryPanel currentOtif={stats.onTimePct} />
      <MitigationROIPanel />
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: typeof Target;
  tone: "default" | "destructive" | "warning" | "primary" | "success";
}

function StatCard({ label, value, icon: Icon, tone }: StatCardProps) {
  const toneClasses: Record<StatCardProps["tone"], string> = {
    default: "text-foreground",
    destructive: "text-destructive",
    warning: "text-warning",
    primary: "text-primary",
    success: "text-success",
  };
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Icon className={cn("h-5 w-5", toneClasses[tone])} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p
            className={cn(
              "text-2xl font-bold leading-tight",
              toneClasses[tone],
            )}
          >
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
