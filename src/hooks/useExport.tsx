import { useCallback } from 'react';
import { toast } from 'sonner';

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
      toast.success('Exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar: ' + (error as Error).message);
    }
  }, []);

  // Export to Excel (using SheetJS)
  const exportToExcel = useCallback(async (
    data: Record<string, unknown>[],
    options: ExportOptions = {}
  ) => {
    try {
      const { filename = 'export', sheetName = 'Dados' } = options;
      
      // Dynamic import of xlsx
      const XLSX = await import('xlsx');
      
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      // Auto-size columns
      const colWidths = Object.keys(data[0] || {}).map((key) => ({
        wch: Math.max(
          key.length,
          ...data.map((row) => String(row[key] || '').length)
        ) + 2,
      }));
      worksheet['!cols'] = colWidths;
      
      XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Exportado para Excel!');
    } catch (error) {
      toast.error('Erro ao exportar: ' + (error as Error).message);
    }
  }, []);

  // Export to PDF (using jsPDF)
  const exportToPDF = useCallback(async (
    data: Record<string, unknown>[],
    options: ExportOptions & { title?: string; orientation?: 'portrait' | 'landscape' } = {}
  ) => {
    try {
      const { filename = 'export', title = 'Relatório' } = options;
      
      // Dynamic imports
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      
      const doc = new jsPDF({
        orientation: options.orientation || 'landscape',
        unit: 'mm',
        format: 'a4',
      });
      
      // Add title
      doc.setFontSize(16);
      doc.text(title, 14, 15);
      
      // Add date
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 22);
      
      // Prepare table data
      const headers = Object.keys(data[0] || {});
      const rows = data.map((row) => headers.map((h) => {
        const value = row[h];
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
          return formatDateForExport(value);
        }
        return String(value);
      }));
      
      // Add table
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 28,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] },
      });
      
      doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Exportado para PDF!');
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
