import { useCallback } from 'react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ExportOptions {
  filename?: string;
  sheetName?: string;
}

// Helper to convert data to CSV
function arrayToCSV(data: Record<string, unknown>[], columns?: string[]): string {
  if (!data.length) return '';
  
  const headers = columns || Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return String(value);
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

// Helper to format date for export
function formatDateForExport(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

// Helper to format value for display
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
    return formatDateForExport(value);
  }
  if (typeof value === 'number') {
    return value.toLocaleString('pt-BR');
  }
  if (typeof value === 'boolean') {
    return value ? 'Sim' : 'Não';
  }
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return String(value);
}

export function useExport() {
  // Export to CSV
  const exportToCSV = useCallback((
    data: Record<string, unknown>[],
    options: ExportOptions = {}
  ) => {
    try {
      const { filename = 'export' } = options;
      const csv = arrayToCSV(data);
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Exportado para CSV com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar: ' + (error as Error).message);
    }
  }, []);

  // Export to Excel (real .xlsx file)
  const exportToExcel = useCallback((
    data: Record<string, unknown>[],
    options: ExportOptions = {}
  ) => {
    try {
      const { filename = 'export', sheetName = 'Dados' } = options;
      
      if (!data.length) {
        toast.error('Nenhum dado para exportar');
        return;
      }

      // Format data for Excel
      const formattedData = data.map(row => {
        const formattedRow: Record<string, string> = {};
        for (const [key, value] of Object.entries(row)) {
          formattedRow[key] = formatValue(value);
        }
        return formattedRow;
      });

      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      
      // Auto-size columns
      const headers = Object.keys(data[0]);
      const colWidths = headers.map(header => {
        const maxLength = Math.max(
          header.length,
          ...formattedData.map(row => (row[header] || '').toString().length)
        );
        return { wch: Math.min(maxLength + 2, 50) };
      });
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      // Generate buffer and download
      XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success('Exportado para Excel com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar: ' + (error as Error).message);
    }
  }, []);

  // Export to PDF (real PDF with jsPDF)
  const exportToPDF = useCallback((
    data: Record<string, unknown>[],
    options: ExportOptions & { title?: string; subtitle?: string } = {}
  ) => {
    try {
      const { filename = 'export', title = 'Relatório', subtitle } = options;
      
      if (!data.length) {
        toast.error('Nenhum dado para exportar');
        return;
      }

      // Create PDF document
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Add title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(title, pageWidth / 2, 20, { align: 'center' });
      
      // Add subtitle/date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const dateText = subtitle || `Gerado em: ${new Date().toLocaleString('pt-BR')}`;
      doc.text(dateText, pageWidth / 2, 28, { align: 'center' });

      // Prepare table data
      const headers = Object.keys(data[0]);
      const tableData = data.map(row => 
        headers.map(header => formatValue(row[header]))
      );

      // Add table using autoTable
      autoTable(doc, {
        head: [headers.map(h => h.replace(/_/g, ' ').toUpperCase())],
        body: tableData,
        startY: 35,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak',
          halign: 'left'
        },
        headStyles: {
          fillColor: [59, 130, 246], // Blue-500
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250]
        },
        margin: { top: 35, left: 10, right: 10 },
        didDrawPage: (hookData) => {
          // Add page number footer
          const pageNumber = doc.getNumberOfPages();
          doc.setFontSize(8);
          doc.text(
            `Página ${hookData.pageNumber} de ${pageNumber}`,
            pageWidth / 2,
            doc.internal.pageSize.getHeight() - 10,
            { align: 'center' }
          );
        }
      });

      // Add total records footer on last page
      const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 35;
      if (finalY < doc.internal.pageSize.getHeight() - 30) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        doc.text(`Total de registros: ${data.length}`, 10, finalY + 10);
      }

      // Save the PDF
      doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Exportado para PDF com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar: ' + (error as Error).message);
    }
  }, []);

  // Export to JSON
  const exportToJSON = useCallback((
    data: Record<string, unknown>[],
    options: ExportOptions = {}
  ) => {
    try {
      const { filename = 'export' } = options;
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Exportado para JSON!');
    } catch (error) {
      toast.error('Erro ao exportar: ' + (error as Error).message);
    }
  }, []);

  return {
    exportToCSV,
    exportToExcel,
    exportToPDF,
    exportToJSON,
  };
}

// Predefined export configurations for common entities
export const exportConfigs = {
  coletas: {
    columns: ['numero_coleta', 'status', 'fornecedor', 'endereco', 'created_at', 'data_coleta_efetiva'],
    labels: {
      numero_coleta: 'Número',
      status: 'Status',
      fornecedor: 'Fornecedor',
      endereco: 'Endereço',
      created_at: 'Criado em',
      data_coleta_efetiva: 'Data Coleta',
    },
  },
  entregas: {
    columns: ['numero_entrega', 'status', 'cliente', 'endereco_entrega', 'transportadora', 'created_at'],
    labels: {
      numero_entrega: 'Número',
      status: 'Status',
      cliente: 'Cliente',
      endereco_entrega: 'Endereço',
      transportadora: 'Transportadora',
      created_at: 'Criado em',
    },
  },
  fornecedores: {
    columns: ['razao_social', 'nome_fantasia', 'cnpj', 'cidade', 'estado', 'contato_telefone'],
    labels: {
      razao_social: 'Razão Social',
      nome_fantasia: 'Nome Fantasia',
      cnpj: 'CNPJ',
      cidade: 'Cidade',
      estado: 'UF',
      contato_telefone: 'Telefone',
    },
  },
  clientes: {
    columns: ['razao_social', 'nome_fantasia', 'cnpj', 'cidade', 'estado', 'contato_telefone'],
    labels: {
      razao_social: 'Razão Social',
      nome_fantasia: 'Nome Fantasia',
      cnpj: 'CNPJ',
      cidade: 'Cidade',
      estado: 'UF',
      contato_telefone: 'Telefone',
    },
  },
};
