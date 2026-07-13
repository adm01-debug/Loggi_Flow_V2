import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { Conciliacao, ItemImportado } from "@/hooks";
import { TIPOS_CONCILIACAO } from "./ConciliacaoList";

interface ConciliacaoStats {
  total: number;
  conciliados: number;
  divergencias: number;
  pendentes: number;
  diferenca: number;
}

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  conciliado: "Conciliado",
  divergencia: "Divergência",
};
const statusLabel = (s: string | null | undefined) => STATUS_LABELS[s ?? ""] ?? "Ignorado";


export function exportToPDF(
  conciliacao: Conciliacao,
  itens: ItemImportado[],
  stats: ConciliacaoStats
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(18);
  doc.text("Relatório de Conciliação", pageWidth / 2, 20, { align: "center" });
  doc.setFontSize(12);
  doc.text(conciliacao.nome, pageWidth / 2, 28, { align: "center" });

  doc.setFontSize(10);
  doc.text(`Tipo: ${TIPOS_CONCILIACAO.find(t => t.value === conciliacao.tipo)?.label || conciliacao.tipo}`, 14, 40);
  doc.text(`Data: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 14, 46);
  doc.text(`Status: ${conciliacao.status}`, 14, 52);

  doc.setFontSize(12);
  doc.text("Resumo", 14, 64);
  doc.setFontSize(10);
  doc.text(`Total Importados: ${stats.total}`, 14, 72);
  doc.text(`Conciliados: ${stats.conciliados}`, 14, 78);
  doc.text(`Divergências: ${stats.divergencias}`, 14, 84);
  doc.text(`Pendentes: ${stats.pendentes}`, 14, 90);
  doc.text(`Diferença Total: ${formatCurrency(stats.diferenca)}`, 14, 96);

  const tableData = itens.map(item => [
    item.linha_arquivo?.toString() || "-",
    item.referencia_externa || "-",
    (item.descricao || "-").substring(0, 30),
    item.data_documento ? formatDate(item.data_documento) : "-",
    item.transportadora_nome || "-",
    formatCurrency(item.valor),
    item.diferenca_valor !== null ? formatCurrency(item.diferenca_valor) : "-",
    item.status === "pendente" ? "Pendente" :
      item.status === "conciliado" ? "Conciliado" :
      item.status === "divergencia" ? "Divergência" : "Ignorado"
  ]);

  autoTable(doc, {
    head: [["Linha", "Referência", "Descrição", "Data", "Transportadora", "Valor", "Diferença", "Status"]],
    body: tableData,
    startY: 106,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  const divergencias = itens.filter(i => i.status === "divergencia");
  if (divergencias.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text("Detalhamento de Divergências", 14, 20);

    const divTableData = divergencias.map(item => [
      item.linha_arquivo?.toString() || "-",
      item.referencia_externa || "-",
      (item.descricao || "-").substring(0, 40),
      formatCurrency(item.valor),
      item.diferenca_valor !== null ? formatCurrency(item.diferenca_valor) : "-",
      item.observacoes || "-"
    ]);

    autoTable(doc, {
      head: [["Linha", "Referência", "Descrição", "Valor", "Diferença", "Observações"]],
      body: divTableData,
      startY: 30,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [234, 179, 8] },
    });
  }

  doc.save(`conciliacao-${conciliacao.nome.replace(/\s+/g, "-").toLowerCase()}.pdf`);
  toast.success("PDF exportado com sucesso!");
}

export function exportToExcel(
  conciliacao: Conciliacao,
  itens: ItemImportado[],
  stats: ConciliacaoStats
) {
  const summaryData = [
    ["Relatório de Conciliação"],
    [],
    ["Nome", conciliacao.nome],
    ["Tipo", TIPOS_CONCILIACAO.find(t => t.value === conciliacao.tipo)?.label || conciliacao.tipo],
    ["Status", conciliacao.status],
    ["Data Exportação", format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })],
    [],
    ["Resumo"],
    ["Total Importados", stats.total],
    ["Conciliados", stats.conciliados],
    ["Divergências", stats.divergencias],
    ["Pendentes", stats.pendentes],
    ["Diferença Total", stats.diferenca],
  ];

  const itemsData = [
    ["Linha", "Referência", "Descrição", "Data", "Transportadora", "Valor", "Diferença", "Status", "Observações"],
    ...itens.map(item => [
      item.linha_arquivo || "",
      item.referencia_externa || "",
      item.descricao || "",
      item.data_documento ? formatDate(item.data_documento) : "",
      item.transportadora_nome || "",
      item.valor,
      item.diferenca_valor ?? "",
      item.status === "pendente" ? "Pendente" :
        item.status === "conciliado" ? "Conciliado" :
        item.status === "divergencia" ? "Divergência" : "Ignorado",
      item.observacoes || ""
    ])
  ];

  const divergencias = itens.filter(i => i.status === "divergencia");
  const divData = [
    ["Linha", "Referência", "Descrição", "Valor", "Diferença", "Observações"],
    ...divergencias.map(item => [
      item.linha_arquivo || "",
      item.referencia_externa || "",
      item.descricao || "",
      item.valor,
      item.diferenca_valor ?? "",
      item.observacoes || ""
    ])
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), "Resumo");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(itemsData), "Todos os Itens");
  if (divergencias.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(divData), "Divergências");
  }

  XLSX.writeFile(wb, `conciliacao-${conciliacao.nome.replace(/\s+/g, "-").toLowerCase()}.xlsx`);
  toast.success("Excel exportado com sucesso!");
}
