import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, AlertCircle, CheckCircle2, Loader2, Download } from 'lucide-react';
import { importCSV, ImportResult, generateCSVTemplate, downloadCSV } from '@/lib/csvImporter';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { z } from 'zod';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface CSVImporterProps<T> {
  schema: z.ZodSchema<T>;
  onImport: (data: T[]) => Promise<void>;
  columns?: { key: string; label: string; example?: string }[];
  templateName?: string;
}

export function CSVImporter<T>({ schema, onImport, columns, templateName = 'template' }: CSVImporterProps<T>) {
  const [result, setResult] = useState<ImportResult<T> | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const normalizeRow = (row: Record<string, unknown>): Record<string, unknown> => {
    const normalizedRow: Record<string, unknown> = {};
    Object.keys(row).forEach(key => {
      const normKey = key.trim().toLowerCase().replace(/\s+/g, '_');
      normalizedRow[normKey] = row[key];
    });
    return normalizedRow;
  };

  const processJsonData = (jsonData: Record<string, unknown>[]): ImportResult<T> => {
    const success: T[] = [];
    const errors: { row: number; field: string; error: string }[] = [];

    jsonData.forEach((row, index) => {
      try {
        const validated = schema.parse(normalizeRow(row));
        success.push(validated);
      } catch (err) {
        if (err instanceof z.ZodError) {
          err.errors.forEach(zErr => {
            errors.push({
              row: index + 2,
              field: zErr.path.join('.'),
              error: zErr.message
            });
          });
        }
      }
    });

    return { success, errors, total: jsonData.length };
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setIsImporting(true);
    setProgress(10);
    try {
      const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');
      let importResult: ImportResult<T>;

      if (isExcel) {
        importResult = await processExcel(selectedFile);
      } else {
        importResult = await importCSV(selectedFile, schema);
      }

      setResult(importResult);
      setProgress(50);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(`Erro ao ler arquivo: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const processExcel = async (file: File): Promise<ImportResult<T>> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];
          
          resolve(processJsonData(jsonData));
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleConfirmImport = async () => {
    if (!result || result.success.length === 0) return;
    setIsImporting(true);
    setProgress(60);
    try {
      await onImport(result.success);
      setProgress(100);
      setTimeout(() => { setResult(null); setProgress(0); }, 2000);
    } catch {
      // Silent fail on import error
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    if (!columns) return;
    const csv = generateCSVTemplate(columns);
    downloadCSV(csv, templateName);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label htmlFor="csv-upload" className="sr-only">Selecione o arquivo para importação</label>
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-primary/0 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <Input 
              id="csv-upload"
              type="file" 
              accept=".csv,.xlsx,.xls" 
              onChange={handleFileChange} 
              disabled={isImporting} 
              className="relative cursor-pointer bg-card/50 hover:bg-card transition-colors border-dashed border-2"
              aria-describedby="csv-instructions"
            />
          </div>
        </div>
        {columns && (
          <Button variant="outline" onClick={handleDownloadTemplate} className="hover-lift-sm">
            <Download className="h-4 w-4 mr-2" />Template
          </Button>
        )}
      </div>

      <div id="csv-instructions" className="text-[10px] text-muted-foreground bg-muted/30 p-2 rounded border border-border/50">
        <p className="font-semibold uppercase tracking-wider mb-1">Dicas de Importação:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Use formatos .CSV ou .XLSX (Excel)</li>
          <li>Garanta que as colunas obrigatórias estão preenchidas</li>
          <li>Datas devem seguir o padrão AAAA-MM-DD</li>
        </ul>
      </div>

      {isImporting && (
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold uppercase text-primary">
            <span>Processando arquivo</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {result && (
        <div className="animate-in zoom-in-95 duration-300 space-y-3">
          <Alert variant={result.errors.length > 0 ? 'destructive' : 'default'} className={cn(
            "border-2",
            result.errors.length === 0 ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20"
          )}>
            {result.errors.length === 0 ? (
              <><CheckCircle2 className="h-4 w-4 text-success" /><AlertDescription className="text-success font-medium">{result.success.length} registros válidos e prontos para importação</AlertDescription></>
            ) : (
              <><AlertCircle className="h-4 w-4" /><AlertDescription className="font-medium">{result.success.length} válidos, {result.errors.length} erros detectados</AlertDescription></>
            )}
          </Alert>
          
          {result.errors.length > 0 && (
            <div className="max-h-40 overflow-y-auto border-2 rounded-lg p-3 text-xs bg-muted/20 font-mono">
              <p className="font-bold text-destructive mb-2 uppercase tracking-tight">Relatório de Erros:</p>
              {result.errors.slice(0, 10).map((err, i) => (
                <div key={i} className="text-destructive border-b border-destructive/10 py-1 last:border-0">
                  <span className="font-bold">Linha {err.row}:</span> Campo <code className="bg-destructive/10 px-1 rounded">"{err.field}"</code> {err.error}
                </div>
              ))}
              {result.errors.length > 10 && <div className="text-muted-foreground mt-2 font-sans italic">+ {result.errors.length - 10} erros ocultos...</div>}
            </div>
          )}
          
          {result.success.length > 0 && (
            <Button onClick={handleConfirmImport} disabled={isImporting} variant="premium" className="w-full h-12">
              {isImporting ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Upload className="h-5 w-5 mr-2" />}
              Finalizar Importação de {result.success.length} Itens
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
