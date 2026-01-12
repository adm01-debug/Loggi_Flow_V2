import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2, Download } from 'lucide-react';
import { importCSV, ImportResult, generateCSVTemplate, downloadCSV } from '@/lib/csvImporter';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { z } from 'zod';

interface CSVImporterProps<T> {
  schema: z.ZodSchema<T>;
  onImport: (data: T[]) => Promise<void>;
  columns?: { key: string; label: string; example?: string }[];
  templateName?: string;
}

export function CSVImporter<T>({ schema, onImport, columns, templateName = 'template' }: CSVImporterProps<T>) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult<T> | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsImporting(true);
    setProgress(10);
    try {
      const importResult = await importCSV(selectedFile, schema);
      setResult(importResult);
      setProgress(50);
    } catch {
      // Silent fail on CSV read error
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!result || result.success.length === 0) return;
    setIsImporting(true);
    setProgress(60);
    try {
      await onImport(result.success);
      setProgress(100);
      setTimeout(() => { setFile(null); setResult(null); setProgress(0); }, 2000);
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
      <div className="flex gap-2">
        <label className="flex-1">
          <Input type="file" accept=".csv" onChange={handleFileChange} disabled={isImporting} className="cursor-pointer" />
        </label>
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
