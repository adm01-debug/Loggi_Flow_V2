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

  const normalizeRow = (row: Record<string, unknown>): Record<string, unknown> => {
    const normalizedRow: Record<string, unknown> = {};
    Object.keys(row).forEach(key => {
      const normKey = key.trim().toLowerCase().replace(/\s+/g, '_');
      normalizedRow[normKey] = row[key];
    });
    return normalizedRow;
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
          
          const success: T[] = [];
          const errors: { row: number; field: string; error: string }[] = [];

          jsonData.forEach((row, index) => {
            try {
              const validated = schema.parse(normalizeRow(row));
              success.push(validated);
            } catch (err) {
              if (err instanceof z.ZodError) {
                const rowErrors = err.errors.map(zErr => ({
                  row: index + 2,
                  field: zErr.path.join('.'),
                  error: zErr.message
                }));
                errors.push(...rowErrors);
              }
            }
          });

          resolve({ success, errors, total: jsonData.length });
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <label htmlFor="csv-upload" className="sr-only">Selecione o arquivo para importação</label>
          <Input 
            id="csv-upload"
            type="file" 
            accept=".csv,.xlsx,.xls" 
            onChange={handleFileChange} 
            disabled={isImporting} 
            className="cursor-pointer"
            aria-describedby="csv-instructions"
          />
        </div>
        {columns && (
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4 mr-2" />Template
          </Button>
        )}
      </div>
      {isImporting && <Progress value={progress} />}
      {result && (
        <>
          <Alert variant={result.errors.length > 0 ? 'destructive' : 'default'}>
            {result.errors.length === 0 ? (
              <><CheckCircle2 className="h-4 w-4" /><AlertDescription>{result.success.length} registros válidos</AlertDescription></>
            ) : (
              <><AlertCircle className="h-4 w-4" /><AlertDescription>{result.success.length} válidos, {result.errors.length} erros</AlertDescription></>
            )}
          </Alert>
          {result.errors.length > 0 && (
            <div className="max-h-40 overflow-y-auto border rounded p-2 text-sm">
              {result.errors.slice(0, 10).map((err, i) => (
                <div key={i} className="text-destructive">Linha {err.row}, "{err.field}": {err.error}</div>
              ))}
              {result.errors.length > 10 && <div className="text-muted-foreground mt-2">+ {result.errors.length - 10} erros...</div>}
            </div>
          )}
          {result.success.length > 0 && (
            <Button onClick={handleConfirmImport} disabled={isImporting} className="w-full">
              {isImporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Importar {result.success.length} Registros
            </Button>
          )}
        </>
      )}
    </div>
  );
}
