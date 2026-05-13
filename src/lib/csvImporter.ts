import Papa from 'papaparse';
import { z } from 'zod';

export interface ImportError {
  row: number;
  field: string;
  error: string;
}

export interface ImportResult<T> {
  success: T[];
  errors: ImportError[];
  total: number;
}

export async function importCSV<T>(
  file: File,
  schema: z.ZodSchema<T>,
  options?: { skipFirstRow?: boolean; delimiter?: string }
): Promise<ImportResult<T>> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: options?.delimiter ?? ',',
      transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
      complete: (results) => {
        const success: T[] = [];
        const errors: ImportError[] = [];
        
        results.data.forEach((row: any, index: number) => {
          try {
            // Attempt to parse/validate the row
            const validated = schema.parse(row);
            success.push(validated);
          } catch (error) {
            if (error instanceof z.ZodError) {
              error.errors.forEach((err) => {
                errors.push({ 
                  row: index + 2, 
                  field: err.path.join('.') || 'row', 
                  error: err.message 
                });
              });
            } else {
              errors.push({ 
                row: index + 2, 
                field: 'row', 
                error: error instanceof Error ? error.message : 'Unknown error' 
              });
            }
          }
        });

        resolve({ success, errors, total: results.data.length });
      },
    });
  });
}

export function generateCSVTemplate(columns: { key: string; label: string; example?: string }[]): string {
  const headers = columns.map(c => c.label).join(',');
  const examples = columns.map(c => c.example || '').join(',');
  return `${headers}\n${examples}`;
}

export function downloadCSV(data: string, filename: string) {
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
}
