import { describe, it, expect } from "vitest";
import { toISODate, parseImportRows } from "./conciliacaoImport";

describe("toISODate", () => {
  it("formats Date objects", () => {
    expect(toISODate(new Date(Date.UTC(2026, 4, 21)))).toBe("2026-05-21");
  });

  it("parses Brazilian dd/MM/yyyy strings", () => {
    expect(toISODate("21/05/2026")).toBe("2026-05-21");
  });

  it("parses ISO strings", () => {
    expect(toISODate("2026-05-21")).toBe("2026-05-21");
  });

  it("returns null for empty / invalid input", () => {
    expect(toISODate(null)).toBeNull();
    expect(toISODate("")).toBeNull();
    expect(toISODate("not a date")).toBeNull();
  });
});

describe("parseImportRows", () => {
  it("parses BR money values and maps fields", () => {
    const rows = [
      {
        numero: "NF-1",
        valor: "1.250,00",
        transportadora: "Acme",
        data: "21/05/2026",
      },
      { referencia: "NF-2", total: 99.9 },
    ];
    const items = parseImportRows(rows, "conc-1");

    expect(items[0]).toMatchObject({
      conciliacao_id: "conc-1",
      linha_arquivo: 2,
      referencia_externa: "NF-1",
      valor: 1250,
      transportadora_nome: "Acme",
      data_documento: "2026-05-21",
      status: "pendente",
    });
    expect(items[1]).toMatchObject({
      linha_arquivo: 3,
      referencia_externa: "NF-2",
      valor: 99.9,
      data_documento: null,
    });
  });

  it("defaults unparseable values to 0", () => {
    const items = parseImportRows([{ numero: "X", valor: "abc" }], "c");
    expect(items[0].valor).toBe(0);
  });
});
