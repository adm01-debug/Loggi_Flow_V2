import * as XLSX from "xlsx";
import { parseLocaleNumber } from "@/lib/formatters";

export interface ConciliacaoImportItem {
  conciliacao_id: string;
  linha_arquivo: number;
  referencia_externa: string;
  descricao: string;
  data_documento: string | null;
  valor: number;
  transportadora_nome: string;
  dados_originais: Record<string, unknown>;
  status: "pendente";
}

// Reads the first sheet of a spreadsheet file into row objects. Dates are kept
// as Date objects (cellDates) so they can be normalized downstream.
export function readSheetRows(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target?.result, {
          type: "binary",
          cellDates: true,
        });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        resolve(XLSX.utils.sheet_to_json(sheet));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsBinaryString(file);
  });
}

// Converts a spreadsheet date cell (Date object, string, or Excel serial) to an
// ISO date string (yyyy-MM-dd), or null when it can't be interpreted safely.
export function toISODate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  let date: Date;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === "number") {
    const parsed = XLSX.SSF?.parse_date_code(value);
    if (!parsed) return null;
    date = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
  } else {
    const s = String(value).trim();
    const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    date = br
      ? new Date(Date.UTC(Number(br[3]), Number(br[2]) - 1, Number(br[1])))
      : new Date(s);
  }
  return Number.isNaN(date.getTime()) ? null : date.toISOString().split("T")[0];
}

// Maps raw spreadsheet rows into reconciliation items, parsing localized money
// values and dates defensively. Header lookups are case-flexible aliases.
export function parseImportRows(
  rows: Record<string, unknown>[],
  conciliacaoId: string,
): ConciliacaoImportItem[] {
  return rows.map((row, idx) => {
    const referencia = String(
      row["numero"] || row["referencia"] || row["documento"] || row["id"] || "",
    );
    const descricao = String(
      row["descricao"] || row["observacao"] || row["historico"] || "",
    );
    const valorRaw =
      row["valor"] || row["valor_frete"] || row["total"] || row["amount"] || 0;
    const dataDoc = row["data"] || row["data_documento"] || row["date"] || null;
    const transportadora = String(
      row["transportadora"] || row["fornecedor"] || row["carrier"] || "",
    );

    return {
      conciliacao_id: conciliacaoId,
      linha_arquivo: idx + 2,
      referencia_externa: referencia,
      descricao,
      data_documento: toISODate(dataDoc),
      valor: parseLocaleNumber(valorRaw) ?? 0,
      transportadora_nome: transportadora,
      dados_originais: row as unknown as Record<string, never>,
      status: "pendente",
    };
  });
}
