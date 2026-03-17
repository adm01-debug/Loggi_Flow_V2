import { describe, it, expect } from "vitest";

// Test the condition evaluation logic directly (pure functions)
type ConditionOperator = "equals" | "not_equals" | "contains" | "greater_than" | "less_than" | "is_empty" | "is_not_empty";

interface RuleCondition {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: string | number | boolean;
  logicalOperator?: "AND" | "OR";
}

function evaluateCondition(condition: RuleCondition, data: Record<string, unknown>): boolean {
  const fieldValue = data[condition.field];
  const targetValue = condition.value;

  switch (condition.operator) {
    case "equals": return String(fieldValue) === String(targetValue);
    case "not_equals": return String(fieldValue) !== String(targetValue);
    case "contains": return String(fieldValue || "").toLowerCase().includes(String(targetValue).toLowerCase());
    case "greater_than": return Number(fieldValue) > Number(targetValue);
    case "less_than": return Number(fieldValue) < Number(targetValue);
    case "is_empty": return fieldValue === null || fieldValue === undefined || fieldValue === "";
    case "is_not_empty": return fieldValue !== null && fieldValue !== undefined && fieldValue !== "";
    default: return false;
  }
}

function evaluateConditions(conditions: RuleCondition[], data: Record<string, unknown>): boolean {
  if (conditions.length === 0) return true;
  let result = evaluateCondition(conditions[0], data);
  for (let i = 1; i < conditions.length; i++) {
    const cond = conditions[i];
    const condResult = evaluateCondition(cond, data);
    if (cond.logicalOperator === "OR") result = result || condResult;
    else result = result && condResult;
  }
  return result;
}

describe("Business Rule Engine - Condition Evaluation", () => {
  it("equals operator matches string values", () => {
    expect(evaluateCondition({ id: "1", field: "status", operator: "equals", value: "entregue" }, { status: "entregue" })).toBe(true);
    expect(evaluateCondition({ id: "1", field: "status", operator: "equals", value: "entregue" }, { status: "em_transito" })).toBe(false);
  });

  it("not_equals operator", () => {
    expect(evaluateCondition({ id: "1", field: "status", operator: "not_equals", value: "finalizada" }, { status: "em_transito" })).toBe(true);
  });

  it("contains operator is case-insensitive", () => {
    expect(evaluateCondition({ id: "1", field: "endereco", operator: "contains", value: "São Paulo" }, { endereco: "Rua X, São Paulo - SP" })).toBe(true);
    expect(evaluateCondition({ id: "1", field: "endereco", operator: "contains", value: "são paulo" }, { endereco: "Rua X, São Paulo - SP" })).toBe(true);
  });

  it("greater_than for numeric comparisons (divergencia >5%)", () => {
    expect(evaluateCondition({ id: "1", field: "divergencia_percentual", operator: "greater_than", value: 5 }, { divergencia_percentual: 7.5 })).toBe(true);
    expect(evaluateCondition({ id: "1", field: "divergencia_percentual", operator: "greater_than", value: 5 }, { divergencia_percentual: 3 })).toBe(false);
  });

  it("less_than for numeric comparisons", () => {
    expect(evaluateCondition({ id: "1", field: "valor_frete", operator: "less_than", value: 100 }, { valor_frete: 50 })).toBe(true);
  });

  it("is_empty checks for null/undefined/empty string", () => {
    expect(evaluateCondition({ id: "1", field: "nf_remessa", operator: "is_empty", value: "" }, { nf_remessa: null })).toBe(true);
    expect(evaluateCondition({ id: "1", field: "nf_remessa", operator: "is_empty", value: "" }, { nf_remessa: "" })).toBe(true);
    expect(evaluateCondition({ id: "1", field: "nf_remessa", operator: "is_empty", value: "" }, { nf_remessa: "NF-123" })).toBe(false);
  });

  it("is_not_empty checks for presence", () => {
    expect(evaluateCondition({ id: "1", field: "nf_remessa", operator: "is_not_empty", value: "" }, { nf_remessa: "NF-123" })).toBe(true);
    expect(evaluateCondition({ id: "1", field: "nf_remessa", operator: "is_not_empty", value: "" }, { nf_remessa: null })).toBe(false);
  });

  it("evaluates multiple AND conditions", () => {
    const conditions: RuleCondition[] = [
      { id: "1", field: "status", operator: "equals", value: "divergencia" },
      { id: "2", field: "divergencia_percentual", operator: "greater_than", value: 5, logicalOperator: "AND" },
    ];
    expect(evaluateConditions(conditions, { status: "divergencia", divergencia_percentual: 7 })).toBe(true);
    expect(evaluateConditions(conditions, { status: "divergencia", divergencia_percentual: 3 })).toBe(false);
  });

  it("evaluates OR conditions", () => {
    const conditions: RuleCondition[] = [
      { id: "1", field: "status", operator: "equals", value: "ocorrencia" },
      { id: "2", field: "status", operator: "equals", value: "divergencia", logicalOperator: "OR" },
    ];
    expect(evaluateConditions(conditions, { status: "divergencia" })).toBe(true);
    expect(evaluateConditions(conditions, { status: "ocorrencia" })).toBe(true);
    expect(evaluateConditions(conditions, { status: "em_transito" })).toBe(false);
  });

  it("empty conditions returns true (no filter)", () => {
    expect(evaluateConditions([], { status: "anything" })).toBe(true);
  });

  // Business rule: NF required before dispatch
  it("detects missing NF before dispatch", () => {
    const condition: RuleCondition = { id: "1", field: "nf_remessa", operator: "is_empty", value: "" };
    const entregaDespachada = { status: "despachado", nf_remessa: null };
    expect(evaluateCondition(condition, entregaDespachada)).toBe(true); // should trigger alert
  });
});
