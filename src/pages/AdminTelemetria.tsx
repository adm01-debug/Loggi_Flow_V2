import { useState } from "react";
import { format } from "date-fns";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Activity, RefreshCw, Trash2, Download, FileText, CalendarIcon, Bug, Info, Rocket, ShieldAlert, HeartPulse } from "lucide-react";
import { TelemetryCharts } from "@/components/admin/telemetry/TelemetryCharts";
import { DORAMetrics } from "@/components/admin/DORAMetrics";
import { PostMortemDashboard } from "@/features/incidents/components/PostMortemDashboard";
import { TelemetryStatsCards } from "./admin-telemetria/TelemetryStatsCards";
import { TelemetryTopOffenders } from "./admin-telemetria/TelemetryTopOffenders";
import { TelemetryTable, type TelemetryRow } from "./admin-telemetria/TelemetryTable";
import { TelemetryViewer } from "@/components/admin/TelemetryViewer";
import { BioSyncConfig } from "@/components/admin/telemetry/BioSyncConfig";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SeverityFilter = "all" | "slow" | "very_slow" | "error";
type TimeFilter = "1h" | "6h" | "24h" | "7d" | "custom";

export default function AdminTelemetriaPage() {
  
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");

  const [timeFilter, setTimeFilter] = useState<TimeFilter>("24h");
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();

  const getTimeThreshold = (): { from: string; to: string } => {
    const now = new Date();
    const to = now.toISOString();
    if (timeFilter === "custom" && customDateFrom) {
      const fromDate = new Date(customDateFrom); fromDate.setHours(0, 0, 0, 0);
      const toDate = customDateTo ? new Date(customDateTo) : new Date(); toDate.setHours(23, 59, 59, 999);
      return { from: fromDate.toISOString(), to: toDate.toISOString() };
    }
    const msMap: Record<string, number> = { "1h": 3600000, "6h": 21600000, "24h": 86400000, "7d": 604800000 };
    const ms = msMap[timeFilter] || 86400000;
    return { from: new Date(now.getTime() - ms).toISOString(), to };
  };

  const { data: rows = [], isLoading, refetch, isRefetching } = useQuery<TelemetryRow[]>({
    queryKey: ["query-telemetry", severityFilter, timeFilter, customDateFrom?.toISOString(), customDateTo?.toISOString()],
    queryFn: async () => {
      const { from, to } = getTimeThreshold();
      let query = supabase.from("query_telemetry").select("*").gte("created_at", from).lte("created_at", to).order("created_at", { ascending: false }).limit(500);
      if (severityFilter !== "all") query = query.eq("severity", severityFilter);
      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as TelemetryRow[]) || [];
    },
    refetchInterval: 30000, staleTime: 10000,
  });

  const handleCleanup = async () => {
    const threshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from("query_telemetry").delete().lt("created_at", threshold);
    if (error) toast.error("Erro ao limpar dados antigos"); else { toast.success("Dados com mais de 7 dias removidos"); refetch(); }
  };

  const handleExportCSV = () => {
    if (rows.length === 0) { toast.error("Nenhum dado para exportar"); return; }
    const headers = ["Data/Hora", "Operação", "Tabela/RPC", "Duração (ms)", "Severidade", "Registros", "Limit", "Offset", "Count Mode", "Erro"];
    const csvRows = rows.map(r => [new Date(r.created_at).toLocaleString("pt-BR"), r.operation, r.rpc_name || r.table_name || "-", r.duration_ms, r.severity, r.record_count ?? "-", r.query_limit ?? "-", r.query_offset ?? "-", r.count_mode ?? "-", `"${(r.error_message || "").replace(/"/g, '""')}"`]);
    const csvContent = [headers.join(";"), ...csvRows.map(r => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a"); link.href = url; link.download = `telemetria_${format(new Date(), "yyyy-MM-dd")}_${timeFilter}.csv`; link.click();
    URL.revokeObjectURL(url); toast.success("CSV exportado!");
  };

  const handleExportPDF = async () => {
    if (rows.length === 0) { toast.error("Nenhum dado"); return; }
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      doc.setFontSize(16); doc.text("Telemetria de Queries", 14, 15);
      doc.setFontSize(9); doc.text(`${rows.length} registros`, 14, 22);
      autoTable(doc, { head: [["Data", "Op", "Tabela", "Duração", "Sev", "Records", "Limit", "Offset", "Count", "Erro"]], body: rows.map(r => [new Date(r.created_at).toLocaleString("pt-BR"), r.operation, r.rpc_name || r.table_name || "-", `${r.duration_ms}ms`, r.severity, String(r.record_count ?? "-"), String(r.query_limit ?? "-"), String(r.query_offset ?? "-"), r.count_mode ?? "-", (r.error_message || "-").substring(0, 60)]), startY: 28, styles: { fontSize: 7, cellPadding: 1.5 }, headStyles: { fillColor: [41, 37, 36] } });
      doc.save(`telemetria_${format(new Date(), "yyyy-MM-dd")}_${timeFilter}.pdf`); toast.success("PDF exportado!");
    } catch { toast.error("Erro ao gerar PDF"); }
  };

  const verySlow = rows.filter(r => r.severity === "very_slow").length;
  const slow = rows.filter(r => r.severity === "slow").length;
  const errors = rows.filter(r => r.severity === "error").length;
  const avgDuration = rows.length > 0 ? Math.round(rows.reduce((s, r) => s + r.duration_ms, 0) / rows.length) : 0;

  const tableStats = new Map<string, { count: number; totalMs: number; maxMs: number }>();
  for (const r of rows) {
    const key = r.rpc_name || r.table_name || "unknown";
    const prev = tableStats.get(key) || { count: 0, totalMs: 0, maxMs: 0 };
    tableStats.set(key, { count: prev.count + 1, totalMs: prev.totalMs + r.duration_ms, maxMs: Math.max(prev.maxMs, r.duration_ms) });
  }
  const topOffenders = [...tableStats.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 8);

  return (
    <MainLayout>
      <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between px-2">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white flex items-center gap-4 tracking-tighter uppercase italic">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black border border-white/10 shadow-2xl transition-transform hover:scale-110">
                  <Activity className="w-8 h-8 sm:w-10 sm:h-10 text-primary animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="drop-shadow-2xl">Telemetria Nexus</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                    <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">System_Pulse_Active</span>
                  </div>
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">REAL-TIME • DORA • OBSERVABILITY</span>
                </div>
              </div>
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="lg" onClick={handleExportCSV} disabled={rows.length === 0} className="h-14 px-6 rounded-2xl border-white/10 bg-black/40 backdrop-blur-xl font-black uppercase tracking-widest text-[10px] gap-2 hover:bg-white/5 transition-all">
              <Download className="h-4 w-4 text-primary" />
              CSV
            </Button>
            <Button variant="outline" size="lg" onClick={handleExportPDF} disabled={rows.length === 0} className="h-14 px-6 rounded-2xl border-white/10 bg-black/40 backdrop-blur-xl font-black uppercase tracking-widest text-[10px] gap-2 hover:bg-white/5 transition-all">
              <FileText className="h-4 w-4 text-primary" />
              PDF
            </Button>
            <Button variant="outline" size="lg" onClick={handleCleanup} className="h-14 px-6 rounded-2xl border-white/10 bg-black/40 backdrop-blur-xl font-black uppercase tracking-widest text-[10px] gap-2 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all text-rose-500">
              <Trash2 className="h-4 w-4" />
              Limpar +7d
            </Button>
            <Button variant="outline" size="lg" onClick={() => refetch()} disabled={isRefetching} className="h-14 px-6 rounded-2xl border-white/10 bg-black/40 backdrop-blur-xl font-black uppercase tracking-widest text-[10px] gap-2 hover:bg-white/5 transition-all">
              <RefreshCw className={cn("h-4 w-4 text-primary", isRefetching && "animate-spin")} />
              Sync
            </Button>
          </div>
        </div>

        <Tabs defaultValue="database" className="space-y-4">
          <TabsList className="bg-background border">
            <TabsTrigger value="database" className="gap-2">
              <Activity className="h-4 w-4" />
              Banco de Dados
            </TabsTrigger>
            <TabsTrigger value="biosync" className="gap-2">
              <HeartPulse className="h-4 w-4" />
              Bio_Sync
            </TabsTrigger>
            <TabsTrigger value="application" className="gap-2">
              <Bug className="h-4 w-4" />
              Aplicação & Erros
            </TabsTrigger>
            <TabsTrigger value="devops" className="gap-2">
              <Rocket className="h-4 w-4" />
              DevOps (DORA)
            </TabsTrigger>
            <TabsTrigger value="incidents" className="gap-2">
              <ShieldAlert className="h-4 w-4" />
              Incidentes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="database" className="space-y-6">
            <TelemetryStatsCards verySlow={verySlow} slow={slow} errors={errors} avgDuration={avgDuration} />
            <TelemetryTopOffenders topOffenders={topOffenders} />
            <TelemetryCharts rows={rows} timeFilter={timeFilter} />

            <div className="flex flex-wrap items-center gap-3">
              <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as SeverityFilter)}>
                <SelectTrigger className="w-44"><SelectValue placeholder="Severidade" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="slow">🟡 Lentas</SelectItem>
                  <SelectItem value="very_slow">🔴 Muito Lentas</SelectItem>
                  <SelectItem value="error">❌ Erros</SelectItem>
                </SelectContent>
              </Select>
              <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
                <SelectTrigger className="w-44"><SelectValue placeholder="Período" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Última hora</SelectItem>
                  <SelectItem value="6h">Últimas 6h</SelectItem>
                  <SelectItem value="24h">Últimas 24h</SelectItem>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="custom">📅 Personalizado</SelectItem>
                </SelectContent>
              </Select>
              {timeFilter === "custom" && (
                <div className="flex items-center gap-2">
                  <Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="text-xs"><CalendarIcon className="h-3.5 w-3.5 mr-1.5" />{customDateFrom ? format(customDateFrom, "dd/MM/yyyy") : "De"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={customDateFrom} onSelect={setCustomDateFrom} /></PopoverContent></Popover>
                  <span className="text-xs text-muted-foreground">até</span>
                  <Popover><PopoverTrigger asChild><Button variant="outline" size="sm" className="text-xs"><CalendarIcon className="h-3.5 w-3.5 mr-1.5" />{customDateTo ? format(customDateTo, "dd/MM/yyyy") : "Até"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={customDateTo} onSelect={setCustomDateTo} /></PopoverContent></Popover>
                </div>
              )}
              <span className="text-xs text-muted-foreground ml-auto">{rows.length} registros · auto-refresh 30s</span>
            </div>

            <TelemetryTable rows={rows} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="biosync" className="space-y-6">
            <BioSyncConfig />
          </TabsContent>

          <TabsContent value="application" className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-lg bg-info/5 border border-info/20 text-sm text-muted-foreground">
                <p className="flex items-center gap-2 font-medium text-foreground mb-1">
                  <Info className="h-4 w-4" />
                  Logs de Telemetria da Aplicação
                </p>
                Rastreamento proativo de erros no frontend, exceções de integração e eventos críticos do sistema capturados em tempo real.
              </div>
              <TelemetryViewer />
            </div>
          </TabsContent>
          <TabsContent value="devops" className="space-y-6">
            <DORAMetrics />
          </TabsContent>
          <TabsContent value="incidents" className="space-y-6">
            <PostMortemDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
