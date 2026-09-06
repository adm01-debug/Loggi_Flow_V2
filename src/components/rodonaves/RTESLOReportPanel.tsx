import { useMemo, useState } from "react";
import { CalendarRange, Download } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  buildSLOReport,
  sloReportToCSV,
  type SLOReportSample,
} from "@/lib/rodonaves/sloReport";
import type { GatewaySLOTarget, SLOStatus } from "@/lib/rodonaves/gatewaySLO";

const STATUS_TONE: Record<SLOStatus, string> = {
  ok: "bg-primary/10 text-primary border-primary/20",
  atencao: "bg-muted text-muted-foreground border-border",
  violado: "bg-destructive/10 text-destructive border-destructive/20",
};

const STATUS_LABEL: Record<SLOStatus, string> = {
  ok: "OK",
  atencao: "Atenção",
  violado: "Violado",
};

export interface RTESLOReportPanelProps {
  /** Histórico bruto de verificações de saúde dos gateways. */
  samples: SLOReportSample[];
  /** Metas vigentes usadas na avaliação de cada dia. */
  target?: Partial<GatewaySLOTarget>;
  labels?: Record<string, string>;
  className?: string;
}

/**
 * Relatório diário de conformidade de SLO por gateway, com exportação CSV.
 *
 * A avaliação usa as metas vigentes — alterá-las recalcula o histórico
 * imediatamente, permitindo simular o impacto de metas mais rígidas.
 */
export function RTESLOReportPanel({
  samples,
  target,
  labels = {},
  className,
}: RTESLOReportPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const report = useMemo(
    () => buildSLOReport(samples, target),
    [samples, target],
  );

  const visibleRows = expanded ? report.rows : report.rows.slice(-12);

  const handleExport = () => {
    const csv = sloReportToCSV(report.rows);
    const blob = new Blob([`\ufeff${csv}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `slo-gateways-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  let description: string;
  if (report.summary.rows > 0) {
    const worst = report.summary.worstGateway
      ? ` · pior: ${labels[report.summary.worstGateway] ?? report.summary.worstGateway}`
      : "";
    description = `${report.summary.days} dia(s) · ${report.summary.compliancePct.toFixed(1)}% em conformidade · uptime médio ${report.summary.avgUptimePct.toFixed(1)}%${worst}`;
  } else {
    description = "Sem histórico suficiente para gerar o relatório.";
  }

  return (
    <Card className={cn("card-flat", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarRange className="h-4 w-4 text-primary" aria-hidden />
            Conformidade diária de SLO
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={report.rows.length === 0}
        >
          <Download className="mr-2 h-4 w-4" aria-hidden />
          CSV
        </Button>
      </CardHeader>

      <CardContent className="space-y-2">
        {report.rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Execute verificações de saúde para acumular histórico diário.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-muted-foreground">
                  <tr>
                    <th scope="col" className="py-2 pr-3 font-medium">
                      Dia
                    </th>
                    <th scope="col" className="py-2 pr-3 font-medium">
                      Gateway
                    </th>
                    <th scope="col" className="py-2 pr-3 font-medium">
                      Uptime
                    </th>
                    <th scope="col" className="py-2 pr-3 font-medium">
                      P95
                    </th>
                    <th scope="col" className="py-2 pr-3 font-medium">
                      Budget
                    </th>
                    <th scope="col" className="py-2 font-medium">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => (
                    <tr
                      key={`${row.day}-${row.gateway}`}
                      className="border-t border-border"
                    >
                      <td className="py-2 pr-3 text-foreground">{row.day}</td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {labels[row.gateway] ?? row.gateway}
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {row.uptimePct.toFixed(1)}%
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {row.p95LatencyMs}ms
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {row.errorBudgetUsedPct.toFixed(1)}%
                      </td>
                      <td className="py-2">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px]", STATUS_TONE[row.status])}
                        >
                          {STATUS_LABEL[row.status]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {report.rows.length > 12 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setExpanded((value) => !value)}
              >
                {expanded
                  ? "Mostrar menos"
                  : `Ver todos os ${report.rows.length} registros`}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
