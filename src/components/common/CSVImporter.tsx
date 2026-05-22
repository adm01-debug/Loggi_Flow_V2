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
import { cn } from '@/lib/utils';

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
    } catch (err: any) {
      toast.error("Erro na Importação", {
        description: err?.message || "Falha ao processar os dados no servidor.",
      });
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
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label htmlFor="csv-upload" className="sr-only">Selecione o arquivo para importação</label>
          <div className="relative group/input">
            <div className="absolute inset-0 bg-primary/10 rounded-2xl blur-lg opacity-0 group-hover/input:opacity-100 transition-opacity" />
            <Input 
              id="csv-upload"
              type="file" 
              accept=".csv,.xlsx,.xls" 
              onChange={handleFileChange} 
              disabled={isImporting} 
              className="relative cursor-pointer h-16 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border-dashed border-2 border-white/20 group-hover/input:border-primary/50 flex items-center pt-5 pl-4 font-black uppercase tracking-widest text-[10px]"
              aria-describedby="csv-instructions"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none p-2 rounded-xl bg-primary/10">
              <Upload className="w-5 h-5 text-primary animate-bounce" />
            </div>
          </div>
        </div>
        {columns && (
          <Button variant="outline" size="lg" onClick={handleDownloadTemplate} className="h-16 px-8 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px] gap-2 hover:bg-primary/5 transition-all">
            <Download className="w-4 h-4" /> <span className="hidden sm:inline">Template_NODE</span>
          </Button>
        )}
      </div>

      <div id="csv-instructions" className="text-[10px] font-bold text-white/40 bg-sidebar-accent/30 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
        <p className="font-black text-primary uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
          <div className="w-1 h-3 bg-primary rounded-full" />
          Protocolo_Importação Nexus
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <li className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5 uppercase tracking-tighter italic">✓ Formatos .CSV ou .XLSX</li>
          <li className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5 uppercase tracking-tighter italic">✓ Colunas Mandatórias Ativas</li>
          <li className="flex items-center gap-2 bg-black/40 p-2 rounded-xl border border-white/5 uppercase tracking-tighter italic">✓ Datas ISO AAAA-MM-DD</li>
        </ul>
      </div>

      {isImporting && (
        <div className="space-y-3 p-6 rounded-3xl bg-black/40 border border-primary/20 shadow-inner">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            <span className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Sincronizando Buffer_Node
            </span>
            <span className="tabular-nums italic">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-primary/10 [&>div]:bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]" />
        </div>
      )}

      {result && (
        <div className="animate-in zoom-in-95 duration-300 space-y-3">
          <Alert variant={result.errors.length > 0 ? 'destructive' : 'default'} className={cn(
            "border-2 rounded-[1.5rem] sm:rounded-[2rem] p-6 shadow-2xl overflow-hidden relative",
            result.errors.length === 0 ? "bg-success/10 border-success/30" : "bg-destructive/10 border-destructive/30"
          )}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="relative z-10 flex items-center gap-5">
              {result.errors.length === 0 ? (
                <div className="p-3 rounded-2xl bg-success/20">
                  <CheckCircle2 className="h-8 w-8 text-success animate-bounce" />
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-destructive/20">
                  <AlertCircle className="h-8 w-8 text-destructive animate-pulse" />
                </div>
              )}
              <div>
                <AlertDescription className={cn(
                  "font-black text-xl tracking-tighter uppercase italic leading-none mb-1",
                  result.errors.length === 0 ? "text-success" : "text-destructive"
                )}>
                  {result.errors.length === 0 ? "Registros_Sync OK" : "Inconsistência Detectada"}
                </AlertDescription>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">
                  {result.success.length} Válidos • {result.errors.length} Falhas de Protocolo
                </p>
              </div>
            </div>
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
            <Button onClick={handleConfirmImport} disabled={isImporting} size="lg" className="w-full h-16 rounded-[1.5rem] sm:rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs bg-primary text-white shadow-2xl shadow-primary/30 hover:scale-[1.02] transition-all group/finish">
              {isImporting ? <Loader2 className="h-6 w-6 mr-3 animate-spin" /> : <Upload className="h-6 w-6 mr-3 group-hover/finish:scale-110 transition-transform" />}
              AUTORIZAR_INJEÇÃO_DE_{result.success.length}_ITENS
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
