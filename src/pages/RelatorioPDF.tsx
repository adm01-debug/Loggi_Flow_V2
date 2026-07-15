import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatsCard } from "@/components/common/StatsCard";
import {
  FileText,
  Download,
  Loader2,
  Truck,
  Package,
  DollarSign,
  CheckCircle2,
  FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/auth/useAuth";
import { toast } from "sonner";
import type jsPDF from "jspdf";

type PdfDoc = InstanceType<typeof jsPDF>;
type AutoTableFn = (doc: PdfDoc, opts: Record<string, unknown>) => void;

// Lazy import heavy PDF libs - only loaded when user generates a report
const loadPdfLibs = () =>
  Promise.all([import("jspdf"), import("jspdf-autotable")]).then(
    ([jspdfMod, autoTableMod]) => ({
      jsPDF: jspdfMod.default,
      autoTable: autoTableMod.default as AutoTableFn,
    }),
  );
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

type ReportType =
  | "entregas"
  | "transportadoras"
  | "custos"
  | "sla"
  | "auditoria_diaria";

const REPORT_TYPES = [
  { value: "entregas", label: "Relatório de Entregas", icon: Package },
  {
    value: "transportadoras",
    label: "Performance de Transportadoras",
    icon: Truck,
  },
  { value: "custos", label: "Relatório de Custos", icon: DollarSign },
  { value: "sla", label: "Relatório SLA/OTIF", icon: CheckCircle2 },
  { value: "auditoria_diaria", label: "Auditoria Diária", icon: FileCheck },
];

const PERIODS = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "month", label: "Mês atual" },
];

export default function RelatorioPDF() {
  const { user } = useAuth();
  const [reportType, setReportType] = useState<ReportType>("entregas");
  const [period, setPeriod] = useState("30");
  const [generating, setGenerating] = useState(false);

  const getDateRange = () => {
    if (period === "month") {
      return { start: startOfMonth(new Date()), end: endOfMonth(new Date()) };
    }
    return { start: subDays(new Date(), parseInt(period)), end: new Date() };
  };

  const { data: entregas } = useQuery({
    queryKey: ["report-entregas", period],
    queryFn: async () => {
      const { start } = getDateRange();
      const { data, error } = await supabase
        .from("entregas")
        .select(
          `*, transportadora:transportadoras(nome_fantasia), cliente:clientes(razao_social)`,
        )
        .is("deleted_at", null)
        .gte("created_at", start.toISOString())
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const { jsPDF: JsPDF, autoTable: autoTableFn } = await loadPdfLibs();
      const doc = new JsPDF();
      const { start, end } = getDateRange();
      const periodoLabel = `${format(start, "dd/MM/yyyy")} a ${format(end, "dd/MM/yyyy")}`;

      // Header
      doc.setFontSize(20);
      doc.setTextColor(33, 33, 33);
      doc.text("LogiFlow — Relatório", 14, 22);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`,
        14,
        30,
      );
      doc.text(`Período: ${periodoLabel}`, 14, 36);

      // Line
      doc.setDrawColor(200, 200, 200);
      doc.line(14, 40, 196, 40);

      if (reportType === "entregas" && entregas) {
        generateEntregasReport(doc, entregas, autoTableFn);
      } else if (reportType === "transportadoras" && entregas) {
        generateTransportadorasReport(doc, entregas, autoTableFn);
      } else if (reportType === "custos" && entregas) {
        generateCustosReport(doc, entregas, autoTableFn);
      } else if (reportType === "sla" && entregas) {
        generateSLAReport(doc, entregas, autoTableFn);
      } else if (reportType === "auditoria_diaria" && entregas) {
        generateAuditoriaReport(doc, entregas, autoTableFn);
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`LogiFlow — Página ${i} de ${pageCount}`, 14, 290);
      }

      doc.save(
        `relatorio_${reportType}_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`,
      );
      toast.success("PDF gerado com sucesso!");
    } catch {
      toast.error("Erro ao gerar PDF");
    } finally {
      setGenerating(false);
    }
  };
  type EntregaRow = NonNullable<typeof entregas>[number];

  const generateEntregasReport = (
    doc: PdfDoc,
    data: EntregaRow[],
    autoTableFn: AutoTableFn,
  ) => {
    doc.setFontSize(14);
    doc.text("Relatório de Entregas", 14, 50);

    const total = data.length;
    const entregues = data.filter(
      (e) => e.status === "entregue" || e.status === "finalizado",
    ).length;
    const emTransito = data.filter((e) =>
      ["despachado", "em_transito", "saiu_entrega"].includes(e.status),
    ).length;
    const custoTotal = data.reduce((s, e) => s + (e.valor_frete || 0), 0);

    doc.setFontSize(10);
    doc.text(
      `Total: ${total}  |  Entregues: ${entregues}  |  Em Trânsito: ${emTransito}  |  Custo Total: R$ ${custoTotal.toFixed(2)}`,
      14,
      58,
    );

    autoTableFn(doc, {
      startY: 65,
      head: [
        [
          "Nº Entrega",
          "Cliente",
          "Status",
          "Transportadora",
          "Valor Frete",
          "Previsão",
        ],
      ],
      body: data
        .slice(0, 100)
        .map((e) => [
          e.numero_entrega,
          e.cliente?.razao_social?.substring(0, 25) || "N/A",
          e.status,
          e.transportadora?.nome_fantasia?.substring(0, 20) || "N/A",
          e.valor_frete ? `R$ ${e.valor_frete.toFixed(2)}` : "—",
          e.previsao_entrega
            ? format(new Date(e.previsao_entrega), "dd/MM/yy")
            : "—",
        ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });
  };

  const generateTransportadorasReport = (
    doc: PdfDoc,
    data: EntregaRow[],
    autoTableFn: AutoTableFn,
  ) => {
    doc.setFontSize(14);
    doc.text("Performance de Transportadoras", 14, 50);

    const byTransp: Record<
      string,
      { name: string; total: number; entregues: number; custo: number }
    > = {};
    data.forEach((e) => {
      const name = e.transportadora?.nome_fantasia || "Sem Transportadora";
      if (!byTransp[name])
        byTransp[name] = { name, total: 0, entregues: 0, custo: 0 };
      byTransp[name].total++;
      if (e.status === "entregue" || e.status === "finalizado")
        byTransp[name].entregues++;
      byTransp[name].custo += e.valor_frete || 0;
    });

    autoTableFn(doc, {
      startY: 58,
      head: [
        [
          "Transportadora",
          "Total Entregas",
          "Entregues",
          "Taxa Conclusão",
          "Custo Total",
          "Custo Médio",
        ],
      ],
      body: Object.values(byTransp)
        .sort((a, b) => b.total - a.total)
        .map((t) => [
          t.name,
          t.total.toString(),
          t.entregues.toString(),
          `${t.total > 0 ? ((t.entregues / t.total) * 100).toFixed(1) : 0}%`,
          `R$ ${t.custo.toFixed(2)}`,
          `R$ ${t.total > 0 ? (t.custo / t.total).toFixed(2) : "0.00"}`,
        ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 185, 129] },
    });
  };

  const generateCustosReport = (
    doc: PdfDoc,
    data: EntregaRow[],
    autoTableFn: AutoTableFn,
  ) => {
    doc.setFontSize(14);
    doc.text("Relatório de Custos Logísticos", 14, 50);

    const custoTotal = data.reduce((s, e) => s + (e.valor_frete || 0), 0);
    const comFrete = data.filter((e) => e.valor_frete && e.valor_frete > 0);
    const custoMedio = comFrete.length > 0 ? custoTotal / comFrete.length : 0;
    const maiorFrete = Math.max(...comFrete.map((e) => e.valor_frete || 0), 0);

    doc.setFontSize(10);
    doc.text(
      `Custo Total: R$ ${custoTotal.toFixed(2)}  |  Médio: R$ ${custoMedio.toFixed(2)}  |  Maior: R$ ${maiorFrete.toFixed(2)}`,
      14,
      58,
    );

    autoTableFn(doc, {
      startY: 65,
      head: [
        [
          "Nº Entrega",
          "Transportadora",
          "Destino",
          "Valor Frete",
          "Tipo Frete",
        ],
      ],
      body: comFrete
        .sort((a, b) => (b.valor_frete || 0) - (a.valor_frete || 0))
        .slice(0, 80)
        .map((e) => [
          e.numero_entrega,
          e.transportadora?.nome_fantasia || "N/A",
          e.endereco_entrega?.substring(0, 30) || "",
          `R$ ${e.valor_frete?.toFixed(2)}`,
          e.tipo_frete || "N/A",
        ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [245, 158, 11] },
    });
  };

  const generateSLAReport = (
    doc: PdfDoc,
    data: EntregaRow[],
    autoTableFn: AutoTableFn,
  ) => {
    doc.setFontSize(14);
    doc.text("Relatório SLA / OTIF", 14, 50);

    const entregues = data.filter(
      (e) => e.status === "entregue" || e.status === "finalizado",
    );
    const noPrazo = entregues.filter((e) => {
      if (!e.previsao_entrega || !e.data_entrega_efetiva) return false;
      return new Date(e.data_entrega_efetiva) <= new Date(e.previsao_entrega);
    });
    const otif =
      entregues.length > 0 ? (noPrazo.length / entregues.length) * 100 : 0;

    doc.setFontSize(10);
    doc.text(
      `OTIF: ${otif.toFixed(1)}%  |  No Prazo: ${noPrazo.length}  |  Total Entregues: ${entregues.length}`,
      14,
      58,
    );

    autoTableFn(doc, {
      startY: 65,
      head: [
        [
          "Nº Entrega",
          "Transportadora",
          "Previsão",
          "Entregue em",
          "No Prazo?",
        ],
      ],
      body: entregues
        .slice(0, 80)
        .map((e) => [
          e.numero_entrega,
          e.transportadora?.nome_fantasia || "N/A",
          e.previsao_entrega
            ? format(new Date(e.previsao_entrega), "dd/MM/yy")
            : "—",
          e.data_entrega_efetiva
            ? format(new Date(e.data_entrega_efetiva), "dd/MM/yy")
            : "—",
          (() => {
            if (!e.previsao_entrega || !e.data_entrega_efetiva) return "—";
            return new Date(e.data_entrega_efetiva) <= new Date(e.previsao_entrega) ? "✅ Sim" : "❌ Não";
          })(),
        ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [34, 197, 94] },
    });
  };

  const generateAuditoriaReport = (
    doc: PdfDoc,
    data: EntregaRow[],
    autoTableFn: AutoTableFn,
  ) => {
    doc.setFontSize(14);
    doc.text("Relatório de Auditoria Diária (Compliance)", 14, 50);

    const isAtrasado = (e: EntregaRow) => {
      if (!e.previsao_entrega) return false;
      return (
        new Date(e.previsao_entrega) < new Date() &&
        !["entregue", "finalizado"].includes(e.status)
      );
    };

    const ocorrencias = data.filter((e) => e.status === "ocorrencia");
    const atrasados = data.filter(isAtrasado);
    const semTransportadora = data.filter((e) => !e.transportadora_id);

    doc.setFontSize(10);
    doc.text(
      `Alertas Críticos: ${ocorrencias.length} | Atrasos: ${atrasados.length} | Sem Transp: ${semTransportadora.length}`,
      14,
      58,
    );

    autoTableFn(doc, {
      startY: 65,
      head: [
        [
          "Nº Entrega",
          "Status",
          "Divergência/Ocorrência",
          "Transportadora",
          "Valor",
          "Data Registro",
        ],
      ],
      body: data
        .filter(
          (e) =>
            e.status === "ocorrencia" || isAtrasado(e) || !e.transportadora_id,
        )
        .slice(0, 100)
        .map((e) => [
          e.numero_entrega,
          e.status.toUpperCase(),
          (() => {
            if (isAtrasado(e)) return "ATRASO DETECTADO";
            if (e.status === "ocorrencia") return "OCORRÊNCIA ATIVA";
            return "SEM TRANSP. VÍNCULADA";
          })(),
          e.transportadora?.nome_fantasia || "N/A",
          e.valor_frete ? `R$ ${e.valor_frete.toFixed(2)}` : "R$ 0,00",
          format(new Date(e.created_at), "dd/MM/yy HH:mm"),
        ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [239, 68, 68] }, // Destructive/Red
    });
  };

  const totalEntregas = entregas?.length || 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-display flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            Relatórios PDF
          </h1>
          <p className="text-muted-foreground mt-1">
            Gere relatórios profissionais exportáveis em PDF
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard
            title="Entregas no Período"
            value={totalEntregas}
            icon={Package}
            color="primary"
          />
          <StatsCard
            title="Entregues"
            value={entregas?.filter((e) => e.status === "entregue").length || 0}
            icon={CheckCircle2}
            color="success"
          />
          <StatsCard
            title="Em Trânsito"
            value={
              entregas?.filter((e) =>
                ["em_transito", "despachado"].includes(e.status),
              ).length || 0
            }
            icon={Truck}
            color="warning"
          />
          <StatsCard
            title="Custo Total"
            value={`R$ ${(entregas?.reduce((s, e) => s + (e.valor_frete || 0), 0) || 0).toFixed(0)}`}
            icon={DollarSign}
            color="info"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Gerar Relatório
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Tipo de Relatório
                </label>
                <Select
                  value={reportType}
                  onValueChange={(v: ReportType) => setReportType(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Período
                </label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIODS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  onClick={generatePDF}
                  disabled={generating || !entregas?.length}
                  className="w-full gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Gerar PDF
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Report type cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              {REPORT_TYPES.map((t) => {
                const Icon = t.icon;
                const isSelected = reportType === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setReportType(t.value as ReportType)}
                    className={cn(
                      "p-4 rounded-lg border text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "hover:bg-muted/50",
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-6 h-6 mb-2",
                        isSelected ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                    <p className="text-sm font-medium">{t.label}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
