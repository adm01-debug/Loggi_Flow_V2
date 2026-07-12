import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Row = Record<string, unknown>;

const toCsv = (title: string, rows: Row[]): string => {
  if (rows.length === 0) return `# ${title}\n(sem dados)\n`;
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = rows
    .map((r) => headers.map((h) => escape(r[h])).join(","))
    .join("\n");
  return `# ${title}\n${headers.join(",")}\n${body}\n`;
};

const download = (filename: string, content: string): void => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export function ExportHealthReportButton() {
  const handleExport = async (): Promise<void> => {
    try {
      toast.loading("Gerando relatório…", { id: "export-health" });
      const since30d = new Date(Date.now() - 30 * 86_400_000).toISOString();

      const rpc = supabase.rpc as unknown as (
        fn: string,
        args?: Record<string, unknown>,
      ) => Promise<{ data: unknown; error: unknown }>;

      const [snapshotsRes, sloRes, anomaliesRes, suggestionsRes, forecastRes] =
        await Promise.all([
          supabase
            .from("db_health_snapshots" as never)
            .select("created_at,active_connections,total_connections,db_size_bytes,cache_hit_ratio,deadlocks,wal_size_bytes")
            .gte("created_at", since30d)
            .order("created_at", { ascending: true })
            .limit(2000),
          supabase
            .from("db_slo_daily" as never)
            .select("day,samples,connection_slo_pct,cache_slo_pct,deadlock_free_pct,overall_slo_pct")
            .order("day", { ascending: true }),
          rpc("get_health_anomalies_fast"),
          rpc("get_remediation_suggestions_fast"),
          rpc("get_capacity_forecast_fast", { p_hours_ahead: 168 }),
        ]);

      const parts: string[] = [
        `# LogiFlow — Relatório de Saúde do Banco`,
        `# Gerado em ${new Date().toISOString()}`,
        ``,
        toCsv("Snapshots (30d)", (snapshotsRes.data as Row[] | null) ?? []),
        toCsv("SLO Diário", (sloRes.data as Row[] | null) ?? []),
        toCsv("Anomalias (z-score 7d)", (anomaliesRes.data as Row[] | null) ?? []),
        toCsv("Forecast de Capacidade (7d à frente)", (forecastRes.data as Row[] | null) ?? []),
        toCsv("Sugestões de Remediação", (suggestionsRes.data as Row[] | null) ?? []),
      ];

      const filename = `db-health-report-${new Date().toISOString().slice(0, 10)}.csv`;
      download(filename, parts.join("\n"));
      toast.success("Relatório exportado com sucesso", { id: "export-health" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Falha ao exportar: ${msg}`, { id: "export-health" });
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
      <Download className="h-4 w-4" />
      Exportar CSV
    </Button>
  );
}
