import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Etapa 178: varredura final do achado B-06 nas funcoes que ainda devolviam a
// mensagem interna do erro no corpo da resposta. O status HTTP de cada uma foi
// preservado; so a mensagem passou a ser a mesma do `internalErrorResponse`.
const CASOS = [
  {
    fn: "whatsapp-notification",
    status: 500,
    corpo: 'JSON.stringify({ success: false, error: "INTERNAL_ERROR" })',
  },
  {
    fn: "bitrix24-integration",
    status: 500,
    corpo: 'JSON.stringify({ success: false, error: "INTERNAL_ERROR" })',
  },
  {
    fn: "predict-delays",
    status: 500,
    corpo: 'JSON.stringify({ success: false, message: "INTERNAL_ERROR" })',
  },
  {
    fn: "health-check",
    status: 503,
    corpo: 'JSON.stringify({ status: "unhealthy", error: "INTERNAL_ERROR" })',
  },
  {
    fn: "new-device-alert",
    status: 500,
    corpo: 'JSON.stringify({ error: "INTERNAL_ERROR" })',
  },
  {
    fn: "check-rate-limit",
    status: 500,
    corpo: 'JSON.stringify({ error: "INTERNAL_ERROR" })',
  },
  {
    fn: "normalize-freight-response",
    status: 500,
    corpo: 'JSON.stringify({ error: "INTERNAL_ERROR" })',
  },
  {
    fn: "accuracy-weekly-digest",
    status: 500,
    corpo: 'error: "INTERNAL_ERROR",',
  },
  {
    fn: "ocr-receipt-processor",
    status: 400,
    corpo: 'JSON.stringify({ error: "INTERNAL_ERROR" })',
    log: 'log.error("OCR processing failed:"',
  },
  {
    fn: "nexus-auto-healing",
    status: 400,
    corpo: 'JSON.stringify({ error: "INTERNAL_ERROR" })',
    log: 'log.error("Auto-healing request failed:"',
  },
  {
    fn: "get-weather-data",
    status: 400,
    corpo: 'JSON.stringify({ error: "INTERNAL_ERROR" })',
    log: 'log.error("Weather lookup failed:"',
  },
] as const;

function fonte(fn: string): string {
  return readFileSync(
    join(process.cwd(), "supabase/functions", fn, "index.ts"),
    "utf8",
  );
}

/** Trechos de JSON.stringify(...) de um arquivo que ainda carregam `.message`. */
function vazamentos(src: string): string[] {
  const out: string[] = [];
  const MARCA = "JSON.stringify(";
  let i = src.indexOf(MARCA);
  while (i !== -1) {
    let p = i + MARCA.length;
    let profundidade = 1;
    while (p < src.length && profundidade > 0) {
      if (src[p] === "(") profundidade += 1;
      else if (src[p] === ")") profundidade -= 1;
      p += 1;
    }
    const corpo = src.slice(i, p);
    if (corpo.includes(".message")) out.push(corpo);
    i = src.indexOf(MARCA, p);
  }
  return out;
}

describe("etapa 178: nenhuma funcao devolve a mensagem interna do erro", () => {
  it.each(CASOS)("$fn: corpo generico e status preservado", (caso) => {
    const src = fonte(caso.fn);
    const i = src.indexOf(caso.corpo);
    expect(i, `corpo generico ausente em ${caso.fn}`).toBeGreaterThan(-1);
    // o status tem que continuar o mesmo de antes da varredura
    expect(src.slice(i, i + 400)).toContain(`status: ${caso.status}`);
    expect(vazamentos(src), `vazamento restante em ${caso.fn}`).toEqual([]);
  });

  it.each(CASOS.filter((c) => "log" in c))(
    "$fn: o detalhe vai para o log",
    (caso) => {
      expect(fonte(caso.fn)).toContain(caso.log as string);
    },
  );

  it("o status unhealthy do health-check continua visivel ao monitor", () => {
    expect(fonte("health-check")).toContain('status: "unhealthy"');
  });

  it("as chaves de estado consumidas por quem chama continuam no corpo", () => {
    expect(fonte("whatsapp-notification")).toContain("success: false, error:");
    expect(fonte("bitrix24-integration")).toContain("success: false, error:");
    expect(fonte("predict-delays")).toContain("success: false, message:");
    expect(fonte("accuracy-weekly-digest")).toContain("ok: false,");
  });

  it("a validacao de entrada continua respondendo 400 com o campo (etapa 146)", () => {
    const src = fonte("ocr-receipt-processor");
    const i = src.indexOf("if (error instanceof ValidationError)");
    expect(i).toBeGreaterThan(-1);
    expect(src.slice(i, i + 200)).toContain(
      "return validationErrorResponse(error, headers);",
    );
  });
});
