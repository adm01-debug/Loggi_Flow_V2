import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ALLOWED_ACTIONS,
  buildReportFields,
  isAllowedAction,
} from "../../supabase/functions/scheduled-reports/fields";
import { ValidationError } from "../../supabase/functions/_shared/validate";

const EDGE = join(process.cwd(), "supabase/functions/scheduled-reports/index.ts");

describe("scheduled-reports: allowlist do corpo (etapas 143-145)", () => {
  it("descarta campos fora da allowlist e recusa user_id/id/timestamps vindos do corpo", () => {
    const campos = buildReportFields(
      {
        name: "Relatório diário",
        report_type: "entregas",
        frequency: "daily",
        user_id: "usuario-invadido",
        id: "id-invadido",
        created_at: "2020-01-01T00:00:00Z",
        last_sent_at: "2020-01-01T00:00:00Z",
        next_send_at: "2020-01-01T00:00:00Z",
        papel: "admin",
      },
      { exigirObrigatorios: true },
    );

    expect(campos).toEqual({
      name: "Relatório diário",
      report_type: "entregas",
      frequency: "daily",
    });
  });

  it("update parcial só inclui o que o cliente enviou", () => {
    expect(buildReportFields({ name: "Novo nome" }, { exigirObrigatorios: false }))
      .toEqual({ name: "Novo nome" });
    expect(buildReportFields({ reportData: undefined }, { exigirObrigatorios: false }))
      .toEqual({});
    expect(buildReportFields(undefined, { exigirObrigatorios: false })).toEqual({});
  });

  it("normaliza os campos opcionais válidos e aceita null para limpar dia", () => {
    const campos = buildReportFields(
      {
        day_of_week: "3",
        day_of_month: null,
        time_of_day: "08:30",
        recipients: [" a@b.com ", "", 42, "c@d.com"],
        filters: { status: "entregue" },
        is_active: false,
      },
      { exigirObrigatorios: false },
    );

    expect(campos).toEqual({
      day_of_week: 3,
      day_of_month: null,
      time_of_day: "08:30",
      recipients: ["a@b.com", "c@d.com"],
      filters: { status: "entregue" },
      is_active: false,
    });
  });

  it("rejeita valor inválido com o campo culpado, em vez de gravar lixo", () => {
    const invalidos: Array<[Record<string, unknown>, string]> = [
      [{ frequency: "hourly" }, "frequency"],
      [{ day_of_week: 9 }, "day_of_week"],
      [{ day_of_month: 0 }, "day_of_month"],
      [{ time_of_day: "25:00" }, "time_of_day"],
      [{ recipients: "a@b.com" }, "recipients"],
      [{ filters: "status=entregue" }, "filters"],
      [{ is_active: "true" }, "is_active"],
    ];

    for (const [corpo, campo] of invalidos) {
      let erro: unknown;
      try {
        buildReportFields(corpo, { exigirObrigatorios: false });
      } catch (err) {
        erro = err;
      }
      expect(erro, JSON.stringify(corpo)).toBeInstanceOf(ValidationError);
      expect((erro as ValidationError).field).toBe(campo);
    }
  });

  it("create exige name e report_type", () => {
    expect(() => buildReportFields({ report_type: "entregas" }, { exigirObrigatorios: true }))
      .toThrow(ValidationError);
    expect(() => buildReportFields({ name: "x" }, { exigirObrigatorios: true }))
      .toThrow(ValidationError);
  });

  it("só aceita as 5 ações do contrato", () => {
    for (const acao of ALLOWED_ACTIONS) {
      expect(isAllowedAction(acao)).toBe(true);
    }
    for (const acao of ["unknown", "", "Create", undefined, null, 42, ["list"]]) {
      expect(isAllowedAction(acao)).toBe(false);
    }
  });

  it("a edge usa o payload validado e devolve 400/422, nunca 500", () => {
    const fonte = readFileSync(EDGE, "utf8");

    expect(fonte).not.toContain("...reportData");
    expect(fonte).not.toContain(".update(reportData)");
    expect(fonte).toContain(".insert([{ ...campos, user_id: userId }])");
    expect(fonte).toContain(".update(campos)");
    expect(fonte).toContain("if (!isAllowedAction(action)) {");
    expect(fonte).toContain("status: 400");
    // O 422 do ValidationError agora sai de _shared/httpError.ts (etapas 164/166).
    expect(fonte).toContain(
      'return internalErrorResponse(error, corsHeaders, "scheduled-reports");',
    );
  });
});
