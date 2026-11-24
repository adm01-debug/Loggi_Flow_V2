import {
  optionalString,
  requireNumber,
  requireString,
  ValidationError,
} from "../_shared/validate.ts";

export interface SmartSelectionInput {
  estado_destino: string;
  peso_kg: number;
  urgencia?: string;
  tipo_carga?: string;
}

/**
 * B-04: peso e UF entram na conta do frete e na consulta das tabelas de frete —
 * validar antes de qualquer cálculo. `requireNumber` rejeita NaN e texto não
 * numérico; nunca "Number(x) || 0", porque 0 é peso válido e esconderia o erro.
 */
export function parseSmartSelectionInput(
  body: Record<string, unknown>,
): SmartSelectionInput {
  const estado_destino = requireString(body, "estado_destino", {
    minLength: 2,
    maxLength: 2,
    pattern: /^[A-Za-z]{2}$/,
  }).toUpperCase();
  const peso_kg = requirePesoKg(body);
  const urgencia = optionalString(body, "urgencia");
  const tipo_carga = optionalString(body, "tipo_carga");

  return { estado_destino, peso_kg, urgencia, tipo_carga };
}

function requirePesoKg(body: Record<string, unknown>): number {
  const raw = body["peso_kg"];
  // Number(null), Number("") e Number([]) valem 0: coage silenciosamente para
  // peso zerado, que passa no min: 0 e gera cotação errada.
  if (
    typeof raw !== "number" && (typeof raw !== "string" || raw.trim() === "")
  ) {
    throw new ValidationError(
      "peso_kg",
      "peso_kg is required and must be a number",
    );
  }
  return requireNumber(body, "peso_kg", { min: 0 });
}
