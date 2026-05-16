import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { importExcel, getSheetNames } from '@/lib/excelImporter';
import { ImportResult } from '@/lib/csvImporter';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { z } from 'zod';

interface ExcelImporterProps<T> { schema: z.ZodSchema<T>; onImport: (data: T[]) => Promise<void>; templateName?: string; }

export function ExcelImporter<T>({ schema, onImport, templateName = 'template' }: ExcelImporterProps<T>) {
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [result, setResult] = useState<ImportResult<T> | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setResult(null);
    try {
      const sheetNames = await getSheetNames(selectedFile);
      setSheets(sheetNames);
      if (sheetNames.length === 1) { setSelectedSheet(sheetNames[0]); await processSheet(selectedFile, sheetNames[0]); }
    } catch { /* Silent fail on Excel read error */ }
  };

  const processSheet = async (f: File, sheet: string) => {
    setIsImporting(true); setProgress(10);
    try {
      const importResult = await importExcel(f, schema, sheet);
      setResult(importResult); setProgress(50);
    } catch { /* Silent fail on processing error */ }
    finally { setIsImporting(false); }
  };

  const handleSheetChange = async (sheet: string) => { setSelectedSheet(sheet); if (file) await processSheet(file, sheet); };

  const handleConfirmImport = async () => {
    if (!result || result.success.length === 0) return;
    setIsImporting(true); setProgress(60);
    try { await onImport(result.success); setProgress(100); setTimeout(() => { setFile(null); setResult(null); setSheets([]); setProgress(0); }, 2000); }
    catch { /* Silent fail on import error */ }
    finally { setIsImporting(false); }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex gap-2">
        <label className="flex-1 sr-only">Selecione o arquivo Excel</label>
        <div className="relative group w-full">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-primary/0 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
          <Input 
            type="file" 
            accept=".xlsx,.xls" 
            onChange={handleFileChange} 
            disabled={isImporting} 
            className="relative cursor-pointer bg-card/50 hover:bg-card transition-colors border-dashed border-2" 
          />
        </div>
      </div>

      {sheets.length > 1 && (
        <div className="animate-in fade-in duration-300">
          <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1.5 ml-1">Planilhas encontradas:</p>
          <Select value={selectedSheet} onValueChange={handleSheetChange}>
            <SelectTrigger className="hover-lift-sm">
              <SelectValue placeholder="Selecione a planilha" />
            </SelectTrigger>
            <SelectContent>
              {sheets.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {isImporting && (
        <div className="space-y-2">
          <div className="flex justify-between text-[10px] font-bold uppercase text-primary">
            <span>Processando Excel</span>
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
              <><CheckCircle2 className="h-4 w-4 text-success" /><AlertDescription className="text-success font-medium">{result.success.length} registros válidos e prontos</AlertDescription></>
            ) : (
              <><AlertCircle className="h-4 w-4" /><AlertDescription className="font-medium">{result.success.length} válidos, {result.errors.length} erros detectados</AlertDescription></>
            )}
          </Alert>

          {result.errors.length > 0 && (
            <div className="max-h-40 overflow-y-auto border-2 rounded-lg p-3 text-xs bg-muted/20 font-mono">
              <p className="font-bold text-destructive mb-2 uppercase tracking-tight">Erros de Validação:</p>
              {result.errors.slice(0, 10).map((err, i) => (
                <div key={i} className="text-destructive border-b border-destructive/10 py-1 last:border-0">
                  <span className="font-bold">Linha {err.row}:</span> <code className="bg-destructive/10 px-1 rounded">{err.field}</code> {err.error}
                </div>
              ))}
              {result.errors.length > 10 && <div className="text-muted-foreground mt-2 font-sans italic">+ {result.errors.length - 10} erros ocultos...</div>}
            </div>
          )}

          {result.success.length > 0 && (
            <Button onClick={handleConfirmImport} disabled={isImporting} variant="premium" className="w-full h-12">
              {isImporting ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Upload className="h-5 w-5 mr-2" />}
              Importar {result.success.length} Registros do Excel
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
