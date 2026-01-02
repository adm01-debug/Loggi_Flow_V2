import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, FileText, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Download } from 'lucide-react';
import { importCSV, ImportResult, generateCSVTemplate, downloadCSV } from '@/lib/csvImporter';
import { importExcel, getSheetNames } from '@/lib/excelImporter';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { z } from 'zod';

interface DataImporterProps<T> { schema: z.ZodSchema<T>; onImport: (data: T[]) => Promise<void>; columns?: { key: string; label: string; example?: string }[]; trigger?: React.ReactNode; }

export function DataImporter<T>({ schema, onImport, columns, trigger }: DataImporterProps<T>) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'csv' | 'excel'>('csv');
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [result, setResult] = useState<ImportResult<T> | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const reset = () => { setFile(null); setResult(null); setSheets([]); setSelectedSheet(''); setProgress(0); };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'csv' | 'excel') => {
    const f = e.target.files?.[0]; if (!f) return;
    setFile(f); setFileType(type); setResult(null); setIsImporting(true); setProgress(10);
    try {
      if (type === 'excel') {
        const names = await getSheetNames(f); setSheets(names);
        if (names.length === 1) { setSelectedSheet(names[0]); const r = await importExcel(f, schema, names[0]); setResult(r); }
      } else { const r = await importCSV(f, schema); setResult(r); }
      setProgress(50);
    } catch (err) { console.error(err); } finally { setIsImporting(false); }
  };

  const handleSheetChange = async (sheet: string) => {
    setSelectedSheet(sheet); if (!file) return;
    setIsImporting(true); try { const r = await importExcel(file, schema, sheet); setResult(r); } finally { setIsImporting(false); }
  };

  const handleConfirmImport = async () => {
    if (!result || result.success.length === 0) return;
    setIsImporting(true); setProgress(60);
    try { await onImport(result.success); setProgress(100); setTimeout(() => { reset(); setOpen(false); }, 1500); }
    catch (err) { console.error(err); } finally { setIsImporting(false); }
  };

  const handleDownloadTemplate = () => { if (columns) downloadCSV(generateCSVTemplate(columns), 'template'); };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>{trigger || <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-2" />Importar</Button>}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Importar Dados</DialogTitle></DialogHeader>
        <Tabs defaultValue="csv">
          <TabsList className="w-full"><TabsTrigger value="csv" className="flex-1"><FileText className="h-4 w-4 mr-2" />CSV</TabsTrigger><TabsTrigger value="excel" className="flex-1"><FileSpreadsheet className="h-4 w-4 mr-2" />Excel</TabsTrigger></TabsList>
          <TabsContent value="csv" className="space-y-4">
            <div className="flex gap-2"><Input type="file" accept=".csv" onChange={(e) => handleFileChange(e, 'csv')} disabled={isImporting} />{columns && <Button variant="outline" onClick={handleDownloadTemplate}><Download className="h-4 w-4" /></Button>}</div>
          </TabsContent>
          <TabsContent value="excel" className="space-y-4">
            <Input type="file" accept=".xlsx,.xls" onChange={(e) => handleFileChange(e, 'excel')} disabled={isImporting} />
            {sheets.length > 1 && <Select value={selectedSheet} onValueChange={handleSheetChange}><SelectTrigger><SelectValue placeholder="Planilha" /></SelectTrigger><SelectContent>{sheets.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>}
          </TabsContent>
        </Tabs>
        {isImporting && <Progress value={progress} />}
        {result && (
          <>
            <Alert variant={result.errors.length > 0 ? 'destructive' : 'default'}>{result.errors.length === 0 ? <><CheckCircle2 className="h-4 w-4" /><AlertDescription>{result.success.length} válidos</AlertDescription></> : <><AlertCircle className="h-4 w-4" /><AlertDescription>{result.success.length} válidos, {result.errors.length} erros</AlertDescription></>}</Alert>
            {result.errors.length > 0 && <div className="max-h-32 overflow-y-auto border rounded p-2 text-xs">{result.errors.slice(0, 5).map((e, i) => <div key={i} className="text-destructive">L{e.row}: {e.error}</div>)}</div>}
            {result.success.length > 0 && <Button onClick={handleConfirmImport} disabled={isImporting} className="w-full">{isImporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}Importar {result.success.length}</Button>}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
