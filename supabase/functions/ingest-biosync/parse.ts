import {
  optionalString,
  requireNumber,
  requireString,
} from "../_shared/validate.ts";

export interface BioSyncReading {
  driver_id: string;
  vehicle_id: string;
  heart_rate: number;
  fatigue_index: string;
}

/**
 * B-04: `heart_rate` ia direto para a comparação que decide o alerta de
 * emergência do motorista. Em JS, `"200" >= 150` é verdadeiro e `"abc" >= 150`
 * é falso — texto decidia, ou silenciava, o alerta crítico. `Number("")` é 0, e
 * a faixa fisiológica recusa esse 0, então campo vazio deixa de passar calado.
 */
export function parseBioSyncInput(
  body: Record<string, unknown>,
): BioSyncReading {
  return {
    driver_id: requireString(body, "driver_id"),
    vehicle_id: requireString(body, "vehicle_id"),
    heart_rate: requireNumber(body, "heart_rate", { min: 20, max: 300 }),
    fatigue_index: optionalString(body, "fatigue_index") ?? "LOW",
  };
}
