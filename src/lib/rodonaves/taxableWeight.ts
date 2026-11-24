/**
 * Peso taxável de um frete rodoviário: o maior valor entre o peso declarado e
 * o peso cubado (volume × fator de cubagem).
 *
 * O fator devolvido por `peso-cubado` é a relação kg/m³ da tabela do cliente
 * (padrão de mercado: 300 kg/m³). Dimensões são informadas em centímetros,
 * como o operador mede na conferência.
 */

export const DEFAULT_CUBAGE_FACTOR = 300;

export interface Dimensions {
  /** Comprimento em centímetros. */
  readonly lengthCm: number;
  /** Largura em centímetros. */
  readonly widthCm: number;
  /** Altura em centímetros. */
  readonly heightCm: number;
  /** Quantidade de volumes com essas dimensões. */
  readonly quantity: number;
}

export interface TaxableWeight {
  readonly declaredKg: number;
  readonly cubicKg: number;
  readonly taxableKg: number;
  /** Volume total em m³. */
  readonly volumeM3: number;
  /** true quando a cubagem supera o peso declarado. */
  readonly billedByCubage: boolean;
  /** Diferença percentual sobre o peso declarado (0 quando não há). */
  readonly surchargePercent: number;
}

function positive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/** Fator efetivo: usa o da RTE quando plausível, senão o padrão de mercado. */
export function resolveCubageFactor(factor: unknown): number {
  const parsed = Number(factor);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_CUBAGE_FACTOR;
  return parsed;
}

/** Peso cubado em kg: volume (m³) × fator (kg/m³). */
export function cubicWeightKg(
  dimensions: Dimensions,
  factor: number,
): number {
  const length = positive(dimensions.lengthCm);
  const width = positive(dimensions.widthCm);
  const height = positive(dimensions.heightCm);
  const quantity = positive(dimensions.quantity);
  if (length === 0 || width === 0 || height === 0 || quantity === 0) return 0;
  const volumeM3 = (length * width * height * quantity) / 1_000_000;
  return Math.round(volumeM3 * resolveCubageFactor(factor) * 1000) / 1000;
}

/**
 * Compara peso declarado e cubado para saber o que a transportadora cobra.
 * Arredonda para 3 casas (grama), evitando diferenças de ponto flutuante.
 */
export function resolveTaxableWeight(
  declaredKg: number,
  dimensions: Dimensions,
  factor: number,
): TaxableWeight {
  const declared = positive(declaredKg);
  const cubic = cubicWeightKg(dimensions, factor);
  const volumeM3 =
    (positive(dimensions.lengthCm) *
      positive(dimensions.widthCm) *
      positive(dimensions.heightCm) *
      positive(dimensions.quantity)) /
    1_000_000;
  const taxableKg = Math.max(declared, cubic);
  const billedByCubage = cubic > declared;
  const surchargePercent =
    billedByCubage && declared > 0
      ? Math.round(((cubic - declared) / declared) * 1000) / 10
      : 0;

  return {
    declaredKg: declared,
    cubicKg: cubic,
    taxableKg: Math.round(taxableKg * 1000) / 1000,
    volumeM3: Math.round(volumeM3 * 1000) / 1000,
    billedByCubage,
    surchargePercent,
  };
}
