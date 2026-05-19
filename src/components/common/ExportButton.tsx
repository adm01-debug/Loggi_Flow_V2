import { useState } from "react";
import { Download, FileSpreadsheet, FileText, FileJson, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useExport } from "@/hooks";

interface ExportButtonProps {
  data: Record<string, unknown>[];
  filename: string;
  disabled?: boolean;
}

export function ExportButton({ data, filename, disabled }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { exportToCSV, exportToExcel, exportToPDF, exportToJSON } = useExport();

  const handleExport = async (format: "csv" | "excel" | "pdf" | "json") => {
    if (data.length === 0) return;
    
    setIsExporting(true);
    try {
      switch (format) {
        case "csv":
          exportToCSV(data, { filename });
          break;
        case "excel":
          await exportToExcel(data, { filename });
          break;
        case "pdf":
          await exportToPDF(data, { filename, title: filename.charAt(0).toUpperCase() + filename.slice(1) });
          break;
        case "json":
          exportToJSON(data, { filename });
          break;
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled || data.length === 0 || isExporting} className="gap-2">
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("excel")} className="gap-2">
          <FileSpreadsheet className="h-4 w-4 text-success" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("csv")} className="gap-2">
          <FileText className="h-4 w-4 text-info" />
          CSV (.csv)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("pdf")} className="gap-2">
          <FileText className="h-4 w-4 text-destructive" />
          PDF (.pdf)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("json")} className="gap-2">
          <FileJson className="h-4 w-4 text-warning" />
          JSON (.json)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
