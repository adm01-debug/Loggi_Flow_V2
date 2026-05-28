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

function collectRowErrors(error: unknown, rowNumber: number): ImportError[] {
  if (error instanceof z.ZodError) {
    return error.errors.map((err) => ({
      row: rowNumber,
      field: err.path.join('.') || 'row',
      error: err.message,
    }));
  }
  return [{
    row: rowNumber,
    field: 'row',
    error: error instanceof Error ? error.message : 'Unknown error',
  }];
}

export async function importCSV<T>(
  file: File,
  schema: z.ZodSchema<T>,
  options?: { skipFirstRow?: boolean; delimiter?: string }
): Promise<ImportResult<T>> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      delimiter: options?.delimiter ?? ',',
      transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
      error: (error) => reject(error),
      complete: (results) => {
        const success: T[] = [];
        const errors: ImportError[] = [];

        results.data.forEach((row, index) => {
          // +2 accounts for the header row and 1-based numbering for users.
          const rowNumber = index + 2;
          const parsed = schema.safeParse(row);
          if (parsed.success) {
            success.push(parsed.data);
          } else {
            errors.push(...collectRowErrors(parsed.error, rowNumber));
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
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
