import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useExport } from '@/hooks/useExport';
import { exportToExcel } from '@/lib/excelImporter';

interface DataExporterProps<T> { data: T[]; filename: string; columns?: { key: keyof T; label: string }[]; }

export function DataExporter<T extends Record<string, unknown>>({ data, filename, columns }: DataExporterProps<T>) {
  const [isExporting, setIsExporting] = useState(false);
  const { exportToCSV, exportToJSON } = useExport();

  const formatData = () => {
    if (!columns) return data;
    return data.map(item => columns.reduce((acc, col) => ({ ...acc, [col.label]: item[col.key] }), {}));
  };

  const handleExportCSV = () => { setIsExporting(true); try { exportToCSV(formatData(), { filename }); } finally { setIsExporting(false); } };
  const handleExportExcel = () => { setIsExporting(true); try { exportToExcel(formatData(), filename); } finally { setIsExporting(false); } };
  const handleExportJSON = () => { setIsExporting(true); try { exportToJSON(data, { filename }); } finally { setIsExporting(false); } };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isExporting || data.length === 0}>
          {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          Exportar ({data.length})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportCSV}><FileText className="h-4 w-4 mr-2" />CSV</DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportExcel}><FileSpreadsheet className="h-4 w-4 mr-2" />Excel (.xlsx)</DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportJSON}><FileText className="h-4 w-4 mr-2" />JSON</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
