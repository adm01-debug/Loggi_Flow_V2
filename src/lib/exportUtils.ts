import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";

type ExportRow = Record<string, unknown>;

export const exportToCSV = (data: ExportRow[], filename: string) => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToPDF = (data: ExportRow[], columns: string[], filename: string) => {
  const doc = new jsPDF();
  autoTable(doc, {
    head: [columns],
    body: data.map((item) => columns.map((col) => String(item[col] ?? ""))),
  });
  doc.save(`${filename}.pdf`);
};
