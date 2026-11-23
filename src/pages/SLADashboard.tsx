import { useState, useCallback } from "react";
import { EmptyState } from "@/components/common/EmptyState";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Target,
  Loader2,
  RefreshCw,
  Truck,
} from "lucide-react";
import { useSLAMetrics } from "@/hooks/logistics/useSLAMetrics";
import { DateRangePicker } from "@/components/common/DateRangePicker";
import { useRealtime } from "@/hooks/data/useRealtime";
import { cn } from "@/lib/utils";
import { subDays } from "date-fns";
import { DateRange } from "react-day-picker";

interface PerformanceTransportadora {
  nome: string;
  totalEntregas: number;
  taxaOTIF: number;
}

interface TendenciaSemanal {
  data: string;
  total: number;
  taxaOTIF: number;
}

export default function SLADashboard() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const { data: metrics, isLoading, isError, error, refetch } = useSLAMetrics();

  // Referencia estavel (contrato em src/hooks/data/useRealtime.tsx).
  const onEntregaChange = useCallback(() => {
    refetch();
  }, [refetch]);

  useRealtime({
    table: "entregas",
    onInsert: onEntregaChange,
    onUpdate: onEntregaChange,
  });

  const stats = metrics || {
    totalEntregas: 0,
    entregasNoPrazo: 0,
    entregasAtrasadas: 0,
    tempoMedioEntrega: 0,
    taxaOTIF: 0,
    performancePorTransportadora: [],
  };
  const slaRate = stats.taxaOTIF ? Math.round(stats.taxaOTIF) : 0;

  const slaBadgeVariant = (
    rate: number,
  ): "default" | "secondary" | "destructive" => {
    if (rate >= 95) return "default";
    if (rate >= 80) return "secondary";
    return "destructive";
  };
  const slaLabel = (rate: number) => {
    if (rate >= 95) return "Excelente";
    if (rate >= 80) return "Bom";
    return "Crítico";
  };
  const slaProgressClass = (rate: number) => {
    if (rate >= 95) return "[&>div]:bg-success";
    if (rate >= 80) return "[&>div]:bg-warning";
    return "[&>div]:bg-destructive";
  };
  const slaBgClass = (rate: number) => {
    if (rate >= 95) return "bg-success/15 text-success";
    if (rate >= 80) return "bg-warning/15 text-warning";
    return "bg-destructive/15 text-destructive";
  };
  const slaTextClass = (rate: number) => {
    if (rate >= 95) return "text-success";
    if (rate >= 80) return "text-warning";
    return "text-destructive";
  };

  const handleDateChange = (range: DateRange | undefined) => {
    if (range) setDateRange(range);
  };

  if (isError) {
    return (
      <MainLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <EmptyState
            variant="error"
            title="Erro ao carregar métricas de SLA"
            description={
              error?.message ||
              "Não foi possível carregar as métricas de SLA. Tente novamente."
            }
            action={{
              label: "Tentar novamente",
              onClick: () => window.location.reload(),
            }}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1 min-w-0 animate-in slide-in-from-left-6 duration-700 ease-out-expo">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-foreground flex items-center gap-3 sm:gap-4 tracking-tighter">
              <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-success via-success/80 to-success/40 shadow-xl shadow-success/20 group cursor-pointer transition-transform hover:rotate-6">
                <Target className="w-6 h-6 sm:w-9 sm:h-9 text-white animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="truncate drop-shadow-sm">Dashboard SLA</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-success uppercase tracking-[0.2em]">
                    Service Level Agreement Nexus
                  </span>
                </div>
              </div>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-2xl font-medium">
              Monitoramento em tempo real de conformidade, prazos e eficiência
              de rede.
            </p>
          </div>
          <div className="flex gap-3 animate-in slide-in-from-right-6 duration-700 ease-out-expo">
            <DateRangePicker
              value={dateRange}
              onChange={handleDateChange}
              className="shrink-0"
            />
            <Button
              variant="outline"
              size="lg"
              onClick={() => refetch()}
              className="h-12 px-6 rounded-xl border-2 font-bold uppercase tracking-widest text-[11px] gap-2 hover:bg-success/5 transition-all shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-1000 delay-200">
          <div className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-card to-card/90 shadow-xl border-none transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 rounded-2xl bg-success/10 text-success group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-3xl font-black tracking-tighter tabular-nums text-success">
                {stats.entregasNoPrazo}
              </p>
            </div>
            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
              No Prazo
            </p>
          </div>
          <div className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-card to-card/90 shadow-xl border-none transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 rounded-2xl bg-destructive/10 text-destructive group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-3xl font-black tracking-tighter tabular-nums text-destructive">
                {stats.entregasAtrasadas}
              </p>
            </div>
            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
              Atrasados
            </p>
          </div>
          <div className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-card to-card/90 shadow-xl border-none transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 rounded-2xl bg-info/10 text-info group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-3xl font-black tracking-tighter tabular-nums text-info">
                {stats.tempoMedioEntrega
                  ? stats.tempoMedioEntrega.toFixed(1)
                  : 0}
                h
              </p>
            </div>
            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
              Tempo Médio
            </p>
          </div>
          <div className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-card to-card/90 shadow-xl border-none transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary group-hover:rotate-12 transition-transform duration-500 shadow-inner">
                <Target className="w-6 h-6" />
              </div>
              <p className="text-3xl font-black tracking-tighter tabular-nums text-primary">
                {slaRate}%
              </p>
            </div>
            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
              Taxa SLA
            </p>
          </div>
        </div>
        <div className="card-base p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Taxa de Cumprimento SLA</h3>
            <Badge variant={slaBadgeVariant(slaRate)}>
              {slaLabel(slaRate)}
            </Badge>
          </div>
          <Progress
            value={slaRate}
            className={cn("h-4", slaProgressClass(slaRate))}
          />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>Meta: 95%</span>
            <span>Atual: {slaRate}%</span>
          </div>
        </div>
        <Tabs defaultValue="carriers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-auto p-1.5 bg-sidebar-accent/50 rounded-2xl border border-white/5 mb-4">
            <TabsTrigger
              value="carriers"
              className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all"
            >
              Por Transportadora
            </TabsTrigger>
            <TabsTrigger
              value="trends"
              className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px] gap-2 transition-all"
            >
              Tendências
            </TabsTrigger>
          </TabsList>
          <TabsContent value="carriers" className="space-y-3">
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            ) : (
              (stats.performancePorTransportadora || []).map(
                (
                  c: {
                    nome: string;
                    totalEntregas: number | null;
                    taxaOTIF: number;
                  },
                  i: number,
                ) => (
                  <div
                    key={i}
                    className="group relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-card to-card/95 border-none shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-5">
                      <div
                        className={cn(
                          "p-4 rounded-2xl transition-all shadow-inner group-hover:scale-110 duration-500",
                          slaBgClass(c.taxaOTIF),
                        )}
                      >
                        <Truck className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-black text-xl tracking-tighter uppercase italic">
                          {c.nome}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-0.5">
                          {c.totalEntregas} ENTREGAS_NODE
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          "text-xl font-bold",
                          slaTextClass(c.taxaOTIF),
                        )}
                      >
                        {c.taxaOTIF.toFixed(0)}%
                      </p>
                      <Progress value={c.taxaOTIF} className="w-24 h-2" />
                    </div>
                  </div>
                ),
              )
            )}
          </TabsContent>
          <TabsContent value="trends" className="space-y-3">
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            ) : (
              (metrics?.tendenciaSemanal || []).map(
                (t: TendenciaSemanal, i: number) => (
                  <div
                    key={i}
                    className="card-interactive flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold">{t.data}</p>
                      <p className="text-sm text-muted-foreground">
                        {t.total} entregas
                      </p>
                    </div>
                    <div className="text-right">
                      {(() => {
                        let cls = "text-destructive";
                        if (t.taxaOTIF >= 95) cls = "text-success";
                        else if (t.taxaOTIF >= 80) cls = "text-warning";
                        return (
                          <p className={cn("text-xl font-bold", cls)}>
                            {t.taxaOTIF.toFixed(0)}%
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                ),
              )
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
