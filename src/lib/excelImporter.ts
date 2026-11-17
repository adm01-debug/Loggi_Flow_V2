import * as XLSX from 'xlsx';
import { z } from 'zod';
import { ImportResult } from './csvImporter';

export async function importExcel<T>(
  file: File,
  schema: z.ZodSchema<T>,
  sheetName?: string
): Promise<ImportResult<T>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = sheetName ? workbook.Sheets[sheetName] : workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        
        const success: T[] = [];
        const errors: { row: number; field: string; error: string }[] = [];
        
        jsonData.forEach((row: unknown, index: number) => {
          try {
            const validated = schema.parse(row);
            success.push(validated);
          } catch (error) {
            if (error instanceof z.ZodError) {
              error.issues.forEach((err) => {
                errors.push({ row: index + 2, field: err.path.join('.'), error: err.message });
              });
            }
          }
        });

        resolve({ success, errors, total: jsonData.length });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function exportToExcel<T extends Record<string, unknown>>(data: T[], filename: string, sheetName = 'Sheet1') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function getSheetNames(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        resolve(workbook.SheetNames);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
