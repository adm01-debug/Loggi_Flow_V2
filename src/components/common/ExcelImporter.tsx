import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Download } from 'lucide-react';
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
    } catch (error) { console.error('Erro ao ler Excel:', error); }
  };

  const processSheet = async (f: File, sheet: string) => {
    setIsImporting(true); setProgress(10);
    try {
      const importResult = await importExcel(f, schema, sheet);
      setResult(importResult); setProgress(50);
    } catch (error) { console.error('Erro:', error); }
    finally { setIsImporting(false); }
  };

  const handleSheetChange = async (sheet: string) => { setSelectedSheet(sheet); if (file) await processSheet(file, sheet); };

  const handleConfirmImport = async () => {
    if (!result || result.success.length === 0) return;
    setIsImporting(true); setProgress(60);
    try { await onImport(result.success); setProgress(100); setTimeout(() => { setFile(null); setResult(null); setSheets([]); setProgress(0); }, 2000); }
    catch (error) { console.error('Erro:', error); }
    finally { setIsImporting(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <label className="flex-1"><Input type="file" accept=".xlsx,.xls" onChange={handleFileChange} disabled={isImporting} className="cursor-pointer" /></label>
      </div>
      {sheets.length > 1 && (
        <Select value={selectedSheet} onValueChange={handleSheetChange}><SelectTrigger><SelectValue placeholder="Selecione a planilha" /></SelectTrigger><SelectContent>{sheets.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
      )}
      {isImporting && <Progress value={progress} />}
      {result && (
        <>
          <Alert variant={result.errors.length > 0 ? 'destructive' : 'default'}>
            {result.errors.length === 0 ? (<><CheckCircle2 className="h-4 w-4" /><AlertDescription>{result.success.length} registros válidos</AlertDescription></>) : (<><AlertCircle className="h-4 w-4" /><AlertDescription>{result.success.length} válidos, {result.errors.length} erros</AlertDescription></>)}
          </Alert>
          {result.errors.length > 0 && (<div className="max-h-40 overflow-y-auto border rounded p-2 text-sm">{result.errors.slice(0, 10).map((err, i) => (<div key={i} className="text-destructive">Linha {err.row}, "{err.field}": {err.error}</div>))}{result.errors.length > 10 && <div className="text-muted-foreground mt-2">+ {result.errors.length - 10} erros...</div>}</div>)}
          {result.success.length > 0 && (<Button onClick={handleConfirmImport} disabled={isImporting} className="w-full">{isImporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}Importar {result.success.length} Registros</Button>)}
        </>
      )}
    </div>
  );
}
