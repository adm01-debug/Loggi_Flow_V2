import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  MAX_STORAGE_PATH_LENGTH,
  parseDeliveryId,
  parseReceiptRequest,
  parseStoragePath,
} from "../../supabase/functions/ocr-receipt-processor/parse";
import { ValidationError } from "../../supabase/functions/_shared/validate";

const EDGE = join(
  process.cwd(),
  "supabase/functions/ocr-receipt-processor/index.ts",
);
const ENTREGA = "8f14e45f-ceea-467a-9c1e-1c2b3d4e5f60";
const CAMINHO = `receipts/${ENTREGA}_1730000000000.pdf`;

function erro(call: () => unknown): ValidationError {
  try {
    call();
  } catch (e) {
    return e as ValidationError;
  }
  throw new Error("expected ValidationError");
}

describe("parseReceiptRequest", () => {
  it("aceita o caminho que o componente de upload grava", () => {
    expect(
      parseReceiptRequest({ storage_path: CAMINHO, delivery_id: ENTREGA }),
    ).toEqual({ storagePath: CAMINHO, deliveryId: ENTREGA });
  });

  it("aceita imagem com qualquer extensão do upload (HEIC, JPEG, PNG)", () => {
    for (const ext of ["heic", "jpeg", "png", "webp"]) {
      expect(
        parseStoragePath({ storage_path: `receipts/${ENTREGA}_1.${ext}` }),
      ).toBe(`receipts/${ENTREGA}_1.${ext}`);
    }
  });

  it("recusa caminho fora da pasta receipts", () => {
    for (const storage_path of [
      "../fora.pdf",
      "documents/outro.pdf",
      "/etc/passwd",
      "receipts",
      "",
      "   ",
    ]) {
      expect(erro(() => parseStoragePath({ storage_path })).field).toBe(
        "storage_path",
      );
    }
  });

  it("recusa travessia e subpasta dentro de receipts", () => {
    for (const storage_path of [
      "receipts/../secret.pdf",
      "receipts/sub/arquivo.pdf",
      `receipts/${ENTREGA}/x.pdf`,
    ]) {
      expect(erro(() => parseStoragePath({ storage_path })).field).toBe(
        "storage_path",
      );
    }
  });

  it("recusa caminho acima do teto de tamanho", () => {
    const nome = "a".repeat(MAX_STORAGE_PATH_LENGTH);
    const falha = erro(() =>
      parseStoragePath({ storage_path: `receipts/${nome}.pdf` }),
    );
    expect(falha.field).toBe("storage_path");
    expect(falha.message).toContain(String(MAX_STORAGE_PATH_LENGTH));
  });

  it("recusa delivery_id vazio, curto, com espaço ou não-texto", () => {
    for (const delivery_id of [undefined, "", "123", "abc def ghi", 42]) {
      expect(erro(() => parseDeliveryId({ delivery_id })).field).toBe(
        "delivery_id",
      );
    }
  });

  it("aceita delivery_id no formato uuid e no formato texto longo", () => {
    expect(parseDeliveryId({ delivery_id: ENTREGA })).toBe(ENTREGA);
    expect(parseDeliveryId({ delivery_id: "entrega_1234567890" })).toBe(
      "entrega_1234567890",
    );
  });

  it("recusa corpo que nem é objeto", () => {
    for (const corpo of [null, "receipts/x.pdf", [CAMINHO]]) {
      expect(erro(() => parseReceiptRequest(corpo)).field).toBe("storage_path");
    }
  });
});

describe("ocr-receipt-processor/index.ts", () => {
  const src = readFileSync(EDGE, "utf8");

  it("valida antes de ler o arquivo e usa os valores validados", () => {
    expect(src).toContain("parseReceiptRequest(p);");
    expect(src).toContain(
      "const { storagePath, deliveryId } = parseReceiptRequest(body);",
    );
    expect(src).not.toContain(".download(storage_path)");
    expect(src).not.toContain("const { storage_path, delivery_id } = body");
  });

  it("responde 422 de validação sem cair no 400 genérico", () => {
    const trecho = src.slice(
      src.indexOf("if (error instanceof ValidationError)"),
    );
    expect(trecho).toContain("validationErrorResponse(error, headers)");
    expect(trecho.indexOf("validationErrorResponse")).toBeLessThan(
      trecho.indexOf("error.message"),
    );
  });
});
