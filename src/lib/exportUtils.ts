import { jsPDF } from "jspdf";
import "jspdf-autotable";
import Papa from "papaparse";

export const exportToCSV = (data: any[], filename: string) => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (data: any[], columns: string[], filename: string) => {
  const doc = new jsPDF();
  (doc as any).autoTable({
    head: [columns],
    body: data.map(item => columns.map(col => item[col] || "")),
  });
  doc.save(`${filename}.pdf`);
};
